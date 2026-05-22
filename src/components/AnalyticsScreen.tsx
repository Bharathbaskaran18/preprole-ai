import React, { useEffect, useState } from 'react';
import { Difficulty, SessionScore } from '../types';
import { getScores } from '../api/client';

interface DifficultyStats {
  bestScore:    number;
  levelReached: number;
  quizzesTaken: number;
}

interface LevelEntry {
  level:      number;
  score:      number;
  difficulty: Difficulty;
}

interface AnalyticsData {
  totalQuizzesTaken: number;
  averageScore:      number;
  byDifficulty:      Record<Difficulty, DifficultyStats>;
  scoresByLevel:     LevelEntry[];
  recommendations:   string[];
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Professional'];
const DIFF_ORDER: Record<Difficulty, number> = { Beginner: 0, Intermediate: 1, Professional: 2 };
const PASS_SCORE = 7;

interface HistoryLevel { level: number; score: number; passed: boolean; }
interface HistoryGroup {
  jobRole:    string;
  difficulty: Difficulty;
  levels:     HistoryLevel[];
  average:    number;
  best:       number;
}

function buildHistory(sessions: SessionScore[]): HistoryGroup[] {
  // Best score per (jobRole, difficulty, level)
  const map: Record<string, Record<number, number>> = {};
  const keyMeta: Record<string, { jobRole: string; difficulty: Difficulty }> = {};

  for (const s of sessions) {
    const key = `${s.jobRole}::${s.difficulty}`;
    if (!map[key]) { map[key] = {}; keyMeta[key] = { jobRole: s.jobRole, difficulty: s.difficulty }; }
    if (s.score > (map[key][s.level] ?? -1)) map[key][s.level] = s.score;
  }

  return Object.keys(map)
    .sort((a, b) => {
      const da = DIFF_ORDER[keyMeta[a].difficulty];
      const db = DIFF_ORDER[keyMeta[b].difficulty];
      if (da !== db) return da - db;
      return keyMeta[a].jobRole.localeCompare(keyMeta[b].jobRole);
    })
    .map((key) => {
      const { jobRole, difficulty } = keyMeta[key];
      const levels: HistoryLevel[] = Object.keys(map[key])
        .map(Number)
        .sort((a, b) => a - b)
        .map((lvl) => ({ level: lvl, score: map[key][lvl], passed: map[key][lvl] >= PASS_SCORE }));
      const scores = levels.map((l) => l.score);
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      const best    = Math.max(...scores);
      return { jobRole, difficulty, levels, average, best };
    });
}

const DIFF_META: Record<Difficulty, { color: string; label: string }> = {
  Beginner:     { color: '#22c55e', label: 'Beginner'     },
  Intermediate: { color: '#4f8ef7', label: 'Intermediate' },
  Professional: { color: '#a855f7', label: 'Professional' },
};

function deriveAnalytics(sessions: SessionScore[]): AnalyticsData {
  const byDifficulty: Record<Difficulty, DifficultyStats> = {
    Beginner:     { bestScore: 0, levelReached: 0, quizzesTaken: 0 },
    Intermediate: { bestScore: 0, levelReached: 0, quizzesTaken: 0 },
    Professional: { bestScore: 0, levelReached: 0, quizzesTaken: 0 },
  };

  let totalScore = 0;

  for (const s of sessions) {
    const d = byDifficulty[s.difficulty];
    d.quizzesTaken += 1;
    totalScore     += s.score;
    if (s.score > d.bestScore)    d.bestScore    = s.score;
    if (s.level > d.levelReached) d.levelReached = s.level;
  }

  const scoresByLevel: LevelEntry[] = [...sessions]
    .sort((a, b) => {
      const order: Record<Difficulty, number> = { Beginner: 0, Intermediate: 1, Professional: 2 };
      return order[a.difficulty] - order[b.difficulty] || a.level - b.level;
    })
    .map((s) => ({ level: s.level, score: s.score, difficulty: s.difficulty }));

  const totalQuizzesTaken = sessions.length;
  const averageScore = totalQuizzesTaken > 0 ? totalScore / totalQuizzesTaken : 0;

  // Best score per (difficulty, level) for targeted recommendations
  const bestPerLevel: Record<string, { score: number; difficulty: Difficulty; level: number }> = {};
  for (const s of sessions) {
    const key = `${s.difficulty}:${s.level}`;
    if (!bestPerLevel[key] || s.score > bestPerLevel[key].score) {
      bestPerLevel[key] = { score: s.score, difficulty: s.difficulty, level: s.level };
    }
  }

  const recommendations: string[] = [];

  if (totalQuizzesTaken === 0) {
    recommendations.push('Start with Beginner Level 1 to build your foundation.');
    recommendations.push('Complete all 5 levels in each difficulty before moving up.');
    recommendations.push('Aim for 7/10 or higher on every level to solidify your skills.');
  } else {
    // 1. Retry suggestions for failed levels (score < 7)
    const failed = Object.values(bestPerLevel)
      .filter((e) => e.score < 7)
      .sort((a, b) => {
        const order: Record<Difficulty, number> = { Beginner: 0, Intermediate: 1, Professional: 2 };
        return order[a.difficulty] - order[b.difficulty] || a.level - b.level;
      });
    for (const f of failed.slice(0, 2)) {
      recommendations.push(`Retry ${f.difficulty} Level ${f.level} — you scored ${f.score}/10.`);
    }

    // 2. Next level to try (highest reached + 1 for each active difficulty)
    for (const diff of DIFFICULTIES) {
      const d = byDifficulty[diff];
      if (d.quizzesTaken > 0 && d.levelReached < 5) {
        const next = d.levelReached + 1;
        if (!bestPerLevel[`${diff}:${next}`]) {
          recommendations.push(`Try ${diff} Level ${next} — you haven't attempted it yet.`);
        }
      }
    }

    // 3. Difficulty graduation — all 5 levels passed at >= 7
    const DIFF_ORDER: Difficulty[] = ['Beginner', 'Intermediate', 'Professional'];
    for (let i = 0; i < DIFF_ORDER.length - 1; i++) {
      const curr = DIFF_ORDER[i];
      const next = DIFF_ORDER[i + 1];
      const currEntries = Object.values(bestPerLevel).filter((e) => e.difficulty === curr);
      if (currEntries.length === 5 && currEntries.every((e) => e.score >= 7) && byDifficulty[next].quizzesTaken === 0) {
        recommendations.push(`All ${curr} levels passed! Advance to ${next}.`);
      }
    }

    // Pad to at least 3
    if (recommendations.length < 3) {
      const pads = [
        'Practice consistently — even one level a day builds strong recall.',
        'Try different job roles to broaden your interview readiness.',
        'Aim for Professional difficulty for the most challenging preparation.',
        'Review explanations after each question to reinforce weak areas.',
      ];
      for (const p of pads) {
        if (recommendations.length >= 3) break;
        if (!recommendations.includes(p)) recommendations.push(p);
      }
    }
  }

  return { totalQuizzesTaken, averageScore, byDifficulty, scoresByLevel, recommendations };
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

const BAR_W      = 24;
const BAR_GAP    = 8;
const CHART_H    = 100;
const PAD_LEFT   = 8;
const PAD_BOTTOM = 22;

function ScoreBarChart({ entries }: { entries: LevelEntry[] }) {
  const totalW = PAD_LEFT + entries.length * (BAR_W + BAR_GAP) - BAR_GAP + PAD_LEFT;
  const passY  = CHART_H - (7 / 10) * CHART_H;

  return (
    <svg
      className="analytics-chart-svg"
      viewBox={`0 0 ${totalW} ${CHART_H + PAD_BOTTOM}`}
      preserveAspectRatio="xMinYMid meet"
      style={{ maxHeight: 140 }}
    >
      {/* Pass threshold */}
      <line
        x1={0} y1={passY} x2={totalW} y2={passY}
        stroke="rgba(245,158,11,0.5)" strokeWidth="1" strokeDasharray="4 3"
      />
      <text x={totalW - 2} y={passY - 3} textAnchor="end" fontSize="8" fill="rgba(245,158,11,0.8)">7</text>

      {entries.map((entry, i) => {
        const x    = PAD_LEFT + i * (BAR_W + BAR_GAP);
        const barH = Math.max(2, (entry.score / 10) * CHART_H);
        const y    = CHART_H - barH;
        const meta = DIFF_META[entry.difficulty];
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx="3" fill={meta.color} opacity="0.8" />
            <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fontSize="9" fontWeight="700" fill={meta.color}>
              {entry.score}
            </text>
            <text x={x + BAR_W / 2} y={CHART_H + 14} textAnchor="middle" fontSize="8" fill="rgba(0,0,0,0.45)">
              {entry.difficulty.slice(0, 1)}{entry.level}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId:        string;
  sessionScores: SessionScore[]; // in-session fallback if fetch fails
  onBack:        () => void;
}

const AnalyticsScreen: React.FC<Props> = ({ userId, sessionScores, onBack }) => {
  const [scores,  setScores]  = useState<SessionScore[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScores(userId)
      .then((records) => {
        setScores(
          records.map((r) => ({
            difficulty: r.difficulty as Difficulty,
            level:      Number(r.level),
            score:      Number(r.score),
            jobRole:    r.jobRole ?? '',
          }))
        );
      })
      .catch(() => {
        // Fall back to in-session scores so the page still works without a network call
        setScores(sessionScores);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const displayScores        = scores ?? sessionScores;
  const data                 = deriveAnalytics(displayScores);
  const history              = buildHistory(displayScores);
  const difficultiesAttempted = DIFFICULTIES.filter((d) => data.byDifficulty[d].quizzesTaken > 0).length;
  const hasData              = data.totalQuizzesTaken > 0;

  return (
    <div className="screen analytics-screen">
      <div className="analytics-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div>
          <h1 className="screen-title">Your Analytics</h1>
          <p className="screen-subtitle">Performance overview across all difficulties</p>
        </div>
      </div>

      {loading && (
        <div className="analytics-loading">
          <span className="btn-spinner btn-spinner--dark" />
          <span>Loading your scores…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary strip */}
          <div className="home-stats analytics-summary">
            <div className="stat-item">
              <span className="stat-number">{data.totalQuizzesTaken}</span>
              <span className="stat-label">Quizzes Taken</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{hasData ? data.averageScore.toFixed(1) : '—'}</span>
              <span className="stat-label">Avg Score</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{difficultiesAttempted}/3</span>
              <span className="stat-label">Difficulties</span>
            </div>
          </div>

          {!hasData && (
            <div className="analytics-empty">
              No quizzes taken yet. Start practicing!
            </div>
          )}

          {/* Per-difficulty cards */}
          <div className="analytics-section-label">By Difficulty</div>
          <div className="analytics-diff-grid">
            {DIFFICULTIES.map((diff) => {
              const stats = data.byDifficulty[diff];
              const meta  = DIFF_META[diff];
              return (
                <div key={diff} className="analytics-diff-card" style={{ borderTopColor: meta.color }}>
                  <div className="analytics-diff-name" style={{ color: meta.color }}>{meta.label}</div>
                  <div className="analytics-diff-score" style={{ color: meta.color }}>
                    {stats.quizzesTaken > 0 ? stats.bestScore : '—'}
                    <span className="analytics-diff-denom">/10</span>
                  </div>
                  <div className="analytics-diff-meta-label">Best Score</div>
                  <div className="analytics-diff-row">
                    <div className="analytics-diff-stat">
                      <span className="analytics-diff-stat-value">{stats.levelReached || '—'}</span>
                      <span className="analytics-diff-stat-label">Level Reached</span>
                    </div>
                    <div className="analytics-diff-stat">
                      <span className="analytics-diff-stat-value">{stats.quizzesTaken}</span>
                      <span className="analytics-diff-stat-label">Quizzes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar chart — only when there's data */}
          {hasData && (
            <>
              <div className="analytics-section-label">Scores by Level</div>
              <div className="analytics-card analytics-chart-card">
                <ScoreBarChart entries={data.scoresByLevel} />
                <div className="analytics-chart-legend">
                  {DIFFICULTIES.map((d) => (
                    <div key={d} className="analytics-legend-item">
                      <span className="analytics-legend-dot" style={{ background: DIFF_META[d].color }} />
                      <span>{DIFF_META[d].label}</span>
                    </div>
                  ))}
                  <div className="analytics-legend-item">
                    <span className="analytics-legend-dash" />
                    <span>Pass threshold (7)</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quiz History */}
          {history.length > 0 && (
            <>
              <div className="analytics-section-label">Quiz History</div>
              <div className="analytics-card">
                <div className="history-list">
                  {history.map((group, gi) => {
                    const meta = DIFF_META[group.difficulty];
                    return (
                      <div key={gi} className={`history-group${gi > 0 ? ' history-group--border' : ''}`}>
                        <div className="history-group-header">
                          <span className="history-role">{group.jobRole}</span>
                          <span className="history-badge" style={{ color: meta.color, borderColor: meta.color }}>
                            {group.difficulty}
                          </span>
                        </div>
                        <div className="history-levels">
                          {group.levels.map((l) => (
                            <span key={l.level} className="history-level-pill">
                              <span className="history-level-label">L{l.level}</span>
                              <span className={`history-level-score${l.passed ? ' history-level-score--pass' : ' history-level-score--fail'}`}>
                                {l.score}/10
                              </span>
                              <span>{l.passed ? '✅' : '❌'}</span>
                            </span>
                          ))}
                        </div>
                        <div className="history-meta">
                          <span>{group.levels.length}/5 levels</span>
                          <span className="history-meta-sep">·</span>
                          <span>Avg <strong>{group.average.toFixed(1)}</strong>/10</span>
                          <span className="history-meta-sep">·</span>
                          <span>Best <strong>{group.best}</strong>/10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Recommendations */}
          <div className="analytics-section-label">Recommendations</div>
          <div className="analytics-card">
            <div className="reco-list">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="reco-item">
                  <div className="reco-number">{i + 1}</div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsScreen;
