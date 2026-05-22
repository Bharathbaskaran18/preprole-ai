import React from 'react';
import { User } from '../types';

interface Props {
  user: User;
  onBack: () => void;
  onLogout: () => void;
  onAnalytics: () => void;
}

function formatDate(dob: string): string {
  if (!dob) return '—';
  // Append T00:00:00 to avoid UTC-offset shifting the displayed day
  const d = new Date(`${dob}T00:00:00`);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function initials(user: User): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

const ProfileScreen: React.FC<Props> = ({ user, onBack, onLogout, onAnalytics }) => {
  return (
    <div className="screen profile-screen">
      <div className="profile-top-bar">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <button className="btn-logout" onClick={onLogout}>Log Out</button>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-lg">{initials(user)}</div>
          <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
          <p className="profile-email-sub">{user.email}</p>
        </div>

        <div className="profile-card">
          <div className="profile-field">
            <span className="profile-field-icon">👤</span>
            <div className="profile-field-body">
              <span className="profile-field-label">Full Name</span>
              <span className="profile-field-value">{user.firstName} {user.lastName}</span>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-field">
            <span className="profile-field-icon">✉️</span>
            <div className="profile-field-body">
              <span className="profile-field-label">Email Address</span>
              <span className="profile-field-value">{user.email}</span>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-field">
            <span className="profile-field-icon">📅</span>
            <div className="profile-field-body">
              <span className="profile-field-label">Date of Birth</span>
              <span className="profile-field-value">{formatDate(user.dob)}</span>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-field profile-field--link" onClick={onAnalytics}>
            <span className="profile-field-icon">📊</span>
            <div className="profile-field-body">
              <span className="profile-field-label">Performance</span>
              <span className="profile-field-value">View Analytics</span>
            </div>
            <span className="profile-field-chevron">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
