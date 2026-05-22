import { Difficulty, Question, AnswerRecord } from '../types';

const BASE = 'https://amxsjsu662.execute-api.us-east-1.amazonaws.com';

// ── /generate-questions ──────────────────────────────────────────────────────

export interface GenerateQuestionsRequest {
  jobRole:    string;
  difficulty: Difficulty;
  level:      number;
  timestamp:  number; // epoch ms — makes every request unique, prevents caching
  seed:       string; // random string — hints to Claude to vary question selection
}

// Matches prefixes like "A) ", "B. ", "C) " at the start of an option string.
const OPTION_PREFIX_RE = /^([A-D])[).]\s*/i;

function stripOptionPrefix(opt: string): string {
  return opt.replace(OPTION_PREFIX_RE, '').trim();
}

/**
 * Given the raw question object and the raw options array, find the 0-based
 * index of the correct answer.
 *
 * The API sends: { correct: "B", options: ["A) foo", "B) bar", ...] }
 *
 * Strategy:
 *   1. Extract the correct letter from the first matching field.
 *   2. Scan rawOptions for an entry whose prefix letter matches (e.g. "B) …").
 *   3. Fall back to charCode arithmetic (B → 1) if no prefixed option found.
 *   4. Also handle numeric values (0-based or 1-based).
 */
function resolveCorrectIndex(raw: Record<string, unknown>, rawOptions: string[]): number {
  // "correct" is the confirmed field name; all others are fallbacks.
  const correctVal =
    raw.correct        ??
    raw.correctIndex   ??
    raw.correctAnswer  ??
    raw.correct_index  ??
    raw.correct_answer ??
    raw.answerIndex    ??
    raw.answer_index   ??
    raw.answer         ??
    raw.correctOption;

  if (correctVal == null) return 0;

  if (typeof correctVal === 'string') {
    const letter = correctVal.trim().toUpperCase().charAt(0);

    if (letter >= 'A' && letter <= 'D') {
      // Find the option whose prefix letter matches, e.g. "B) …" → index 1
      const idx = rawOptions.findIndex((opt) => {
        const match = opt.trim().match(OPTION_PREFIX_RE);
        return match !== null && match[1].toUpperCase() === letter;
      });
      if (idx !== -1) return idx;

      // No prefixed options — use alphabetic position: A→0, B→1, C→2, D→3
      return letter.charCodeAt(0) - 65;
    }

    // Numeric string e.g. "2"
    const n = parseInt(correctVal.trim(), 10);
    if (!isNaN(n)) return n > 3 ? n - 1 : n; // >=4 must be 1-based
  }

  if (typeof correctVal === 'number' && !isNaN(correctVal)) {
    return correctVal > 3 ? correctVal - 1 : correctVal;
  }

  return 0;
}

function normalizeQuestion(raw: Record<string, unknown>, index: number): Question {
  const rawOptions: string[] = (raw.options as string[]) ?? (raw.choices as string[]) ?? [];
  return {
    id:           (raw.id as number)   ?? index + 1,
    text:         (raw.text as string) ?? (raw.question as string) ?? '',
    // Strip "A) " / "B. " prefixes — the component already renders the A/B/C/D label itself.
    options:      rawOptions.map(stripOptionPrefix),
    correctIndex: resolveCorrectIndex(raw, rawOptions),
    explanation:  (raw.explanation as string) ?? (raw.explanation_text as string) ?? '',
  };
}

export async function generateQuestions(req: GenerateQuestionsRequest): Promise<Question[]> {
  const res = await fetch(`${BASE}/generate-questions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    cache:   'no-store',
    body:    JSON.stringify(req),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`Failed to generate questions (${res.status})${detail ? ': ' + detail : ''}`);
  }
  const data = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray(data.questions) ? data.questions : [];

  // Log the first raw question in dev so you can see the actual field names from the API.
  if (process.env.NODE_ENV !== 'production' && raw.length > 0) {
    console.log('[API] raw question[0]:', raw[0]);
  }

  return raw.map(normalizeQuestion);
}

// ── Job role validation (piggybacks on /generate-questions with validateOnly flag) ──

export async function validateJobRole(jobRole: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/generate-questions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      cache:   'no-store',
      body:    JSON.stringify({ jobRole, validateOnly: true }),
    });
    if (res.ok) return null; // valid
    try {
      const data = await res.json();
      return (data.error as string) ?? "Invalid input. Please enter a specific job title such as 'Cloud Engineer', 'Data Analyst', or 'Software Developer'.";
    } catch {
      return "Invalid input. Please enter a specific job title such as 'Cloud Engineer', 'Data Analyst', or 'Software Developer'.";
    }
  } catch {
    // Network failure — don't block the user; Lambda will catch bad input on question generation
    return null;
  }
}

// ── /save-score ──────────────────────────────────────────────────────────────

export interface SaveScoreRequest {
  userId:     string;
  sessionId:  string;
  jobRole:    string;
  difficulty: Difficulty;
  level:      number;
  score:      number;
  answers:    AnswerRecord[];
}

export async function saveScore(req: SaveScoreRequest): Promise<void> {
  const res = await fetch(`${BASE}/save-score`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`save-score failed (${res.status})`);
}

// ── /get-scores ──────────────────────────────────────────────────────────────

export interface ScoreRecord {
  sessionId:  string;
  jobRole:    string;
  difficulty: string; // cast to Difficulty when consuming
  level:      number;
  score:      number;
}

export async function getScores(userId: string): Promise<ScoreRecord[]> {
  const res = await fetch(`${BASE}/get-scores`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`get-scores failed (${res.status})`);
  const data = await res.json();
  const raw: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>).scores)
      ? (data as { scores: unknown[] }).scores
      : [];
  return raw as ScoreRecord[];
}

// ── /send-report ─────────────────────────────────────────────────────────────

export interface SendReportRequest {
  userId:     string;
  userEmail:  string;
  userName:   string;
  jobRole:    string;
  difficulty: Difficulty;
}

export async function sendReport(req: SendReportRequest): Promise<void> {
  const res = await fetch(`${BASE}/send-report`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`send-report failed (${res.status})`);
}
