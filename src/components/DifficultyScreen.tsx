import React from 'react';
import { Difficulty } from '../types';

interface Props {
  jobRole: string;
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

interface DifficultyMeta {
  level: Difficulty;
  icon: string;
  description: string;
  topics: string[];
  color: string;
}

const difficulties: DifficultyMeta[] = [
  {
    level: 'Beginner',
    icon: '🌱',
    description: 'Core concepts and fundamentals. Great for building a solid foundation in the role.',
    topics: ['Core Concepts', 'Fundamentals', 'Basic Skills', 'Introduction', 'Key Principles'],
    color: 'green',
  },
  {
    level: 'Intermediate',
    icon: '⚡',
    description: 'Apply your knowledge to real-world problems and industry-standard practices.',
    topics: ['Advanced Concepts', 'Problem Solving', 'Industry Practices', 'Technical Skills', 'Tools & Technologies'],
    color: 'blue',
  },
  {
    level: 'Professional',
    icon: '🚀',
    description: 'Expert-level questions on architecture, strategy, and leadership for senior roles.',
    topics: ['Expert Knowledge', 'Architecture & Design', 'Leadership', 'Strategy', 'Advanced Problem Solving'],
    color: 'purple',
  },
];

const DifficultyScreen: React.FC<Props> = ({ jobRole, onSelect, onBack }) => {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="screen-title-group">
          <h2 className="screen-title">Choose Difficulty</h2>
          <p className="screen-subtitle">Preparing for: <span className="accent-text">{jobRole}</span></p>
        </div>
      </div>

      <div className="difficulty-grid">
        {difficulties.map((d) => (
          <button
            key={d.level}
            className={`difficulty-card difficulty-card--${d.color}`}
            onClick={() => onSelect(d.level)}
          >
            <div className="difficulty-icon">{d.icon}</div>
            <h3 className="difficulty-name">{d.level}</h3>
            <p className="difficulty-desc">{d.description}</p>
            <div className="difficulty-topics">
              {d.topics.map((t) => (
                <span key={t} className="topic-tag">{t}</span>
              ))}
            </div>
            <div className="difficulty-cta">
              Select <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultyScreen;
