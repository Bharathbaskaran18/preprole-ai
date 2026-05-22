import React, { useState, useEffect } from 'react';
import { Difficulty, Question, AnswerRecord } from '../types';
import { generateQuestions } from '../api/client';

interface Props {
  difficulty: Difficulty;
  level:      number;
  jobRole:    string;
  onComplete: (score: number, answers: AnswerRecord[]) => void;
  onBack:     () => void;
}

type QuestionStatus = 'idle' | 'correct' | 'wrong1' | 'wrong2';
type LoadState      = 'loading' | 'error' | 'ready';

const QuestionScreen: React.FC<Props> = ({ difficulty, level, jobRole, onComplete, onBack }) => {
  // ── Question loading ──────────────────────────────────────────
  const [loadState,  setLoadState]  = useState<LoadState>('loading');
  const [loadError,  setLoadError]  = useState('');
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    setLoadError('');
    generateQuestions({
      jobRole,
      difficulty,
      level,
      timestamp: Date.now(),
      seed: Math.random().toString(36).slice(2),
    })
      .then((qs) => {
        if (cancelled) return;
        if (!qs.length) throw new Error('No questions returned from server.');
        setQuestions(qs);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setLoadState('error');
      });
    return () => { cancelled = true; };
  }, [jobRole, difficulty, level, retryCount]);

  // ── Quiz state ────────────────────────────────────────────────
  const [qIndex,             setQIndex]             = useState(0);
  const [selected,           setSelected]           = useState<number | null>(null);
  const [status,             setStatus]             = useState<QuestionStatus>('idle');
  const [score,              setScore]              = useState(0);
  const [answers,            setAnswers]            = useState<AnswerRecord[]>([]);
  const [finished,           setFinished]           = useState(false);
  const [completionReported, setCompletionReported] = useState(false);

  // Reset quiz state when questions are freshly loaded
  useEffect(() => {
    if (loadState === 'ready') {
      setQIndex(0);
      setSelected(null);
      setStatus('idle');
      setScore(0);
      setAnswers([]);
      setFinished(false);
      setCompletionReported(false);
    }
  }, [loadState]);

  // ── Loading screen ────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="screen question-screen">
        <div className="question-header">
          <button className="btn-back" onClick={onBack}>← Exit</button>
          <div className="question-meta">
            <span className={`badge badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
            <span className="question-meta-text">Level {level}</span>
          </div>
        </div>
        <div className="qs-loading">
          <div className="qs-spinner" />
          <p className="qs-loading-title">Generating Questions</p>
          <p className="qs-loading-sub">AI is crafting personalised questions for your role…</p>
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className="screen question-screen">
        <div className="question-header">
          <button className="btn-back" onClick={onBack}>← Exit</button>
        </div>
        <div className="qs-error">
          <div className="qs-error-icon">⚠️</div>
          <h3 className="qs-error-title">Failed to Load Questions</h3>
          <p className="qs-error-msg">{loadError}</p>
          <button className="btn-primary" onClick={() => setRetryCount((c) => c + 1)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz logic ────────────────────────────────────────────────
  const question       = questions[qIndex];
  const isLastQuestion = qIndex === questions.length - 1;

  const handleOptionClick = (idx: number) => {
    if (status === 'correct' || status === 'wrong2') return;

    setSelected(idx);

    if (idx === question.correctIndex) {
      const newScore = score + 1;
      setScore(newScore);
      setStatus('correct');

      if (isLastQuestion && !completionReported) {
        setCompletionReported(true);
        const answer: AnswerRecord = { questionId: question.id, selectedIndex: idx, isCorrect: true };
        const finalAnswers = [...answers, answer];
        setTimeout(() => {
          setFinished(true);
          onComplete(newScore, finalAnswers);
        }, 800);
      }
    } else {
      setStatus(status === 'idle' ? 'wrong1' : 'wrong2');
    }
  };

  const handleNext = () => {
    const answer: AnswerRecord = {
      questionId:    question.id,
      selectedIndex: selected ?? -1,
      isCorrect:     status === 'correct',
    };
    const updatedAnswers = [...answers, answer];

    if (isLastQuestion) {
      if (!completionReported) {
        setCompletionReported(true);
        setFinished(true);
        onComplete(score, updatedAnswers);
      } else {
        setFinished(true);
      }
      return;
    }

    setAnswers(updatedAnswers);
    setQIndex((q) => q + 1);
    setSelected(null);
    setStatus('idle');
  };

  const getOptionClass = (idx: number): string => {
    const base = 'option-btn';
    if (status === 'idle' || (status === 'wrong1' && selected !== idx)) {
      return selected === idx ? `${base} option-selected` : base;
    }
    if (status === 'wrong1') return selected === idx ? `${base} option-wrong` : base;
    if (status === 'correct') {
      return idx === question.correctIndex ? `${base} option-correct` : `${base} option-disabled`;
    }
    if (status === 'wrong2') {
      if (idx === question.correctIndex) return `${base} option-correct`;
      if (idx === selected)              return `${base} option-wrong`;
      return `${base} option-disabled`;
    }
    return base;
  };

  const progressPct = ((qIndex + (status !== 'idle' ? 1 : 0)) / questions.length) * 100;

  // ── Results screen ────────────────────────────────────────────
  if (finished) {
    const passed = score >= 7;
    return (
      <div className="screen results-screen">
        <div className="results-content">
          <div className={`results-icon ${passed ? 'results-icon--pass' : 'results-icon--fail'}`}>
            {passed ? '🏆' : '📚'}
          </div>
          <h2 className="results-title">{passed ? 'Level Complete!' : 'Keep Practicing!'}</h2>
          <p className="results-subtitle">
            {passed
              ? 'You passed! The next level is now unlocked.'
              : `You need ${7 - score} more correct answer${7 - score !== 1 ? 's' : ''} to pass.`}
          </p>

          <div className="results-score-ring">
            <svg viewBox="0 0 120 120" className="score-ring-svg">
              <circle cx="60" cy="60" r="50" className="ring-bg" />
              <circle
                cx="60" cy="60" r="50"
                className={`ring-fill ${passed ? 'ring-fill--pass' : 'ring-fill--fail'}`}
                style={{ strokeDasharray: `${(score / 10) * 314} 314` }}
              />
            </svg>
            <div className="score-ring-text">
              <span className="score-ring-number">{score}</span>
              <span className="score-ring-denom"> / 10</span>
            </div>
          </div>

          <div className="results-meta">
            <div className="results-meta-item">
              <span className="results-meta-label">Difficulty</span>
              <span className={`badge badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
            </div>
            <div className="results-meta-item">
              <span className="results-meta-label">Level</span>
              <span className="results-meta-value">{level}</span>
            </div>
            <div className="results-meta-item">
              <span className="results-meta-label">Status</span>
              <span className={`results-status ${passed ? 'results-status--pass' : 'results-status--fail'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>

          <button className="btn-primary btn-large" onClick={onBack}>
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  // ── Question screen ───────────────────────────────────────────
  return (
    <div className="screen question-screen">
      <div className="question-header">
        <button className="btn-back" onClick={onBack}>← Exit</button>
        <div className="question-meta">
          <span className={`badge badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
          <span className="question-meta-text">Level {level}</span>
          <span className="question-meta-text">Q {qIndex + 1}/{questions.length}</span>
          <span className="score-badge">Score: {score}</span>
        </div>
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="progress-label">{Math.round(progressPct)}%</span>
      </div>

      <div className="question-card">
        <div className="question-number">Question {qIndex + 1}</div>
        <p className="question-text">{question.text}</p>

        <div className="options-list">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              className={getOptionClass(idx)}
              onClick={() => handleOptionClick(idx)}
              disabled={status === 'correct' || status === 'wrong2'}
            >
              <span className="option-label">{String.fromCharCode(65 + idx)}</span>
              <span className="option-text">{opt}</span>
              {status !== 'idle' && status !== 'wrong1' && idx === question.correctIndex && (
                <span className="option-indicator">✓</span>
              )}
              {(status === 'wrong1' || status === 'wrong2') && idx === selected && idx !== question.correctIndex && (
                <span className="option-indicator">✗</span>
              )}
            </button>
          ))}
        </div>

        {status === 'wrong1' && (
          <div className="feedback feedback--warning">
            <span className="feedback-icon">⚠️</span>
            <div>
              <strong>Incorrect!</strong> You have one more attempt. Choose carefully.
            </div>
          </div>
        )}

        {status === 'correct' && (
          <div className="feedback feedback--success">
            <span className="feedback-icon">✅</span>
            <div><strong>Correct!</strong> Great job.</div>
          </div>
        )}

        {status === 'wrong2' && (
          <div className="feedback feedback--error">
            <span className="feedback-icon">❌</span>
            <div>
              <strong>Incorrect.</strong> The correct answer was option{' '}
              <strong>{String.fromCharCode(65 + question.correctIndex)}</strong>.
              <p className="feedback-explanation">{question.explanation}</p>
            </div>
          </div>
        )}

        {(status === 'correct' || status === 'wrong2') && (
          <button className="btn-primary btn-next" onClick={handleNext}>
            {isLastQuestion ? 'See Results' : 'Next Question'} →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionScreen;
