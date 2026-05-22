import React, { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onGoToSignup: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin, onGoToSignup }) => {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const emailError    = submitted && !email.trim()    ? 'Email is required.'    : '';
  const passwordError = submitted && !password.trim() ? 'Password is required.' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const err = await onLogin(email.trim().toLowerCase(), password);
    if (err) { setError(err); setLoading(false); }
    // On success App.tsx transitions — no need to reset loading here
  };

  const handleChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setError('');
    };

  return (
    <div className="screen auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="home-badge">AI-Powered</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to continue your interview prep.</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              className={`job-input${emailError ? ' input-error' : ''}`}
              type="email"
              placeholder="bharath@example.com"
              value={email}
              onChange={handleChange(setEmail)}
            />
            {emailError && <span className="field-error">{emailError}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className={`job-input${passwordError ? ' input-error' : ''}`}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={handleChange(setPassword)}
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>

          <button type="submit" className="btn-primary btn-large" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Log In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button className="auth-link" onClick={onGoToSignup}>Sign up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
