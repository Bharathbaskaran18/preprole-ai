import React, { useState } from 'react';

interface Props {
  onSignup: (
    firstName: string,
    lastName:  string,
    dob:       string,
    email:     string,
    password:  string,
  ) => Promise<string | null>;
  onGoToLogin: () => void;
}

interface Fields {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Errors {
  firstName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getMaxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD, 18 years ago today
}

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.firstName.trim())  e.firstName = 'First name is required.';
  if (!f.lastName.trim())   e.lastName  = 'Last name is required.';
  if (!f.dob) {
    e.dob = 'Date of birth is required.';
  } else if (f.dob > getMaxDob()) {
    e.dob = 'You must be at least 18 years old to sign up.';
  }
  if (!f.email.trim())               e.email = 'Email is required.';
  else if (!EMAIL_RE.test(f.email))  e.email = 'Enter a valid email address.';
  if (!f.password)                   e.password = 'Password is required.';
  else if (f.password.length < 8)    e.password = 'Password must be at least 8 characters.';
  if (!f.confirmPassword)            e.confirmPassword = 'Please confirm your password.';
  else if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match.';
  return e;
}

const SignupScreen: React.FC<Props> = ({ onSignup, onGoToLogin }) => {
  const [fields, setFields] = useState<Fields>({
    firstName: '', lastName: '', dob: '', email: '', password: '', confirmPassword: '',
  });
  const [errors,    setErrors]    = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...fields, [key]: e.target.value };
    setFields(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const error = await onSignup(
      fields.firstName.trim(),
      fields.lastName.trim(),
      fields.dob,
      fields.email.trim().toLowerCase(),
      fields.password,
    );
    if (error) { setErrors({ general: error }); setLoading(false); }
    // On success App.tsx transitions the screen — no need to reset loading here
  };

  return (
    <div className="screen auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="home-badge">AI-Powered</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Start your interview prep journey today.</p>
        </div>

        {errors.general && (
          <div className="form-error-banner">{errors.general}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">First Name</label>
              <input
                className={`job-input${errors.firstName ? ' input-error' : ''}`}
                type="text"
                placeholder="First Name"
                value={fields.firstName}
                onChange={set('firstName')}
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Last Name</label>
              <input
                className={`job-input${errors.lastName ? ' input-error' : ''}`}
                type="text"
                placeholder="Last Name"
                value={fields.lastName}
                onChange={set('lastName')}
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Date of Birth</label>
            <input
              className={`job-input date-input${errors.dob ? ' input-error' : ''}`}
              type="date"
              max={getMaxDob()}
              value={fields.dob}
              onChange={set('dob')}
            />
            {errors.dob && <span className="field-error">{errors.dob}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              className={`job-input${errors.email ? ' input-error' : ''}`}
              type="email"
              placeholder="bharath@example.com"
              value={fields.email}
              onChange={set('email')}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className={`job-input${errors.password ? ' input-error' : ''}`}
              type="password"
              placeholder="Min. 8 characters"
              value={fields.password}
              onChange={set('password')}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input
              className={`job-input${errors.confirmPassword ? ' input-error' : ''}`}
              type="password"
              placeholder="Re-enter password"
              value={fields.confirmPassword}
              onChange={set('confirmPassword')}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn-primary btn-large" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link" onClick={onGoToLogin}>Log in</button>
        </p>
      </div>
    </div>
  );
};

export default SignupScreen;
