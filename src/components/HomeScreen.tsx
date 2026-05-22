import React, { useRef, useState } from 'react';
import { User } from '../types';

interface Props {
  user:      User;
  onStart:   (jobRole: string) => Promise<string | null>;
  onProfile: () => void;
}

function initials(user: User): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

const HomeScreen: React.FC<Props> = ({ user, onStart, onProfile }) => {
  const [jobRole,  setJobRole]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    const trimmed = jobRole.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    const err = await onStart(trimmed);
    if (err) {
      setError(err);
      setLoading(false);
      inputRef.current?.focus();
    }
    // On success App.tsx navigates — no need to reset loading
  };

  return (
    <div className="screen home-screen">
      <div className="home-hero">
        <nav className="home-nav">
          <button className="profile-icon-btn profile-icon-btn--hero" onClick={onProfile} title="View Profile">
            {initials(user)}
          </button>
        </nav>
        <div className="home-hero-content">
          <div className="home-badge home-badge--hero">✦ AI-Powered Interview Coach</div>
          <h1 className="home-title home-title--hero">
            Land Your Dream<br /><span className="home-title-highlight">Tech Role</span>
          </h1>
          <p className="home-hero-sub">
            Adaptive MCQ practice across 3 difficulty levels, tailored to your target role.
          </p>
        </div>
      </div>

      <div className="home-content">
        <div className="home-badge">Get Started</div>
        <h2 className="home-section-title">What role are you preparing for?</h2>

        <div className="input-group">
          <label className="input-label">Role / position</label>
          <input
            ref={inputRef}
            type="text"
            className={`job-input${error ? ' input-error' : ''}`}
            placeholder="e.g. Cloud Engineer, Data Analyst, DevOps Engineer"
            value={jobRole}
            onChange={(e) => { setJobRole(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            disabled={loading}
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <button
          className="btn-primary btn-large"
          onClick={handleStart}
          disabled={!jobRole.trim() || loading}
        >
          {loading ? <span className="btn-spinner" /> : <>Start Practicing <span className="btn-arrow">→</span></>}
        </button>

        <div className="home-stats">
          <div className="stat-item">
            <span className="stat-number">150+</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">3</span>
            <span className="stat-label">Difficulties</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">15</span>
            <span className="stat-label">Levels</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
