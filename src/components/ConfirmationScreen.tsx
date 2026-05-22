import React, { useState, useRef, useEffect } from 'react';

interface Props {
  email:        string;
  onConfirm:    (code: string) => Promise<string | null>;
  onResend:     () => Promise<void>;
  onGoToLogin:  () => void;
}

const ConfirmationScreen: React.FC<Props> = ({ email, onConfirm, onResend, onGoToLogin }) => {
  const [code,          setCode]          = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent,    setResendSent]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    setLoading(true);
    setError('');
    const err = await onConfirm(code);
    if (err) { setError(err); setLoading(false); }
    // On success, App.tsx handles navigation — no need to setLoading(false)
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSent(false);
    setError('');
    try {
      await onResend();
      setResendSent(true);
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="confirm-icon-wrap">
            <span className="confirm-icon">✉️</span>
          </div>
          <h1 className="auth-title">Check Your Email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to<br />
            <strong className="confirm-email">{email}</strong>
          </p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}
        {resendSent && (
          <div className="form-success-banner">A new code has been sent to your email.</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label">Verification Code</label>
            <input
              ref={inputRef}
              className={`job-input confirm-code-input${error ? ' input-error' : ''}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={handleChange}
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-large"
            style={{ marginTop: 8 }}
            disabled={loading || code.length !== 6}
          >
            {loading ? <span className="btn-spinner" /> : 'Verify & Continue'}
          </button>
        </form>

        <div className="confirm-footer">
          <p className="auth-switch">
            Didn't receive it?{' '}
            <button
              className="auth-link"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          </p>
          <p className="auth-switch" style={{ marginTop: 6 }}>
            Wrong email?{' '}
            <button className="auth-link" onClick={onGoToLogin}>Back to login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;
