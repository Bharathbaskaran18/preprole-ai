import React from 'react';
import { Difficulty, LevelProgress } from '../types';

interface Props {
  difficulty: Difficulty;
  jobRole: string;
  levelProgress: LevelProgress;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const TOTAL_LEVELS = 5;
const PASS_SCORE = 7;

const levelTitles = [
  'Fundamentals',
  'Core Concepts',
  'Advanced Topics',
  'Expert Knowledge',
  'Professional Mastery',
];

function isLevelUnlocked(difficulty: Difficulty, level: number, progress: LevelProgress): boolean {
  if (level === 1) return true;
  const prevScore = progress[difficulty]?.[level - 1] ?? -1;
  return prevScore >= PASS_SCORE;
}

function getBestScore(difficulty: Difficulty, level: number, progress: LevelProgress): number | null {
  const score = progress[difficulty]?.[level];
  return score !== undefined ? score : null;
}

function renderStars(score: number): string {
  const filled = Math.round((score / 10) * 5);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

const LevelScreen: React.FC<Props> = ({ difficulty, jobRole, levelProgress, onSelectLevel, onBack }) => {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="screen-title-group">
          <h2 className="screen-title">Select Level</h2>
          <p className="screen-subtitle">
            <span className={`badge badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
            <span className="muted-text"> · {jobRole}</span>
          </p>
        </div>
      </div>

      <div className="level-info-bar">
        <span className="level-info-text">🔓 Need <strong>{PASS_SCORE}/10</strong> to unlock the next level</span>
      </div>

      <div className="level-grid">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((level) => {
          const unlocked = isLevelUnlocked(difficulty, level, levelProgress);
          const bestScore = getBestScore(difficulty, level, levelProgress);
          const passed = bestScore !== null && bestScore >= PASS_SCORE;
          const title = levelTitles[level - 1];

          return (
            <button
              key={level}
              className={`level-card ${unlocked ? 'level-card--unlocked' : 'level-card--locked'} ${passed ? 'level-card--passed' : ''}`}
              onClick={() => unlocked && onSelectLevel(level)}
              disabled={!unlocked}
            >
              <div className="level-card-header">
                <span className="level-number">Level {level}</span>
                {!unlocked && <span className="lock-icon">🔒</span>}
                {passed && <span className="check-icon">✓</span>}
              </div>

              <h3 className="level-title">{title}</h3>

              {bestScore !== null ? (
                <div className="level-score">
                  <span className="level-score-stars">{renderStars(bestScore)}</span>
                  <span className="level-score-text">{bestScore}/10</span>
                </div>
              ) : (
                <div className="level-score level-score--empty">
                  <span className="level-score-stars">☆☆☆☆☆</span>
                  <span className="level-score-text">Not attempted</span>
                </div>
              )}

              {unlocked && (
                <div className="level-cta">
                  {bestScore !== null ? 'Retry' : 'Start'} <span>→</span>
                </div>
              )}

              {!unlocked && (
                <div className="level-locked-msg">
                  Complete Level {level - 1} with {PASS_SCORE}+ to unlock
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelScreen;
