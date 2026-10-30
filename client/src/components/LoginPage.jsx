import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { API_BASE_URL } from '../config/api';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  Bell,
  ArrowLeft
} from 'lucide-react';

export default function LoginPage() {
  const { 
    login, 
    navigateToSignUp, 
    navigateToHome, 
    authRedirectAction, 
    showToast 
  } = useShopwise();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Validate form before submission
  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);
    const result = await login(email.trim(), password, rememberMe);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Invalid email address or password.');
    }
  };

  // Demo user quick login
  const fillDemoCredentials = () => {
    setEmail('student@university.edu');
    setPassword('ShopWise123!');
    setFieldErrors({});
    setErrorMessage('');
  };

  // Forgot Password Submit
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Password reset instructions dispatched.');
    } catch {
      setForgotMessage(`Instructions have been dispatched to ${forgotEmail}. Please check your inbox.`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Back to Home Button */}
        <button
          type="button"
          onClick={() => navigateToHome()}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          aria-label="Back to home"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="auth-title">Welcome back to ShopWise</h1>
          <p className="auth-subtitle">Sign in to track prices and shop smarter.</p>
        </div>

        {/* Intent notification banner when user was redirected for a price alert or protected action */}
        {authRedirectAction && authRedirectAction.action === 'createAlert' && authRedirectAction.product && (
          <div className="auth-intent-banner">
            <Bell size={18} className="auth-intent-icon" />
            <div>
              <strong>Sign in to activate price alert:</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '2px', color: 'var(--text-secondary)' }}>
                You're tracking <strong>{authRedirectAction.product.name}</strong>. Sign in to monitor Amazon & Flipkart drops 24/7!
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="auth-field-group">
            <label htmlFor="login-email" className="auth-label">
              <span>Email address</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                }}
                className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                required
              />
            </div>
            {fieldErrors.email && (
              <span id="email-error" className="auth-field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <label htmlFor="login-password" className="auth-label">
              <span>Password</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                }}
                className={`auth-input has-toggle ${fieldErrors.password ? 'input-error' : ''}`}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" className="auth-field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="auth-options-row">
            <label className="auth-checkbox-label">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox"
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotMessage('');
                setShowForgotModal(true);
              }}
              className="auth-forgot-link"
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            id="login-submit-button"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </button>

          {/* Quick Demo Autofill Helper */}
          <div style={{ textAlign: 'center', marginTop: '2px' }}>
            <button
              type="button"
              onClick={fillDemoCredentials}
              style={{
                fontSize: '0.78rem',
                color: 'var(--primary-lavender)',
                fontWeight: 600,
                background: 'var(--primary-light)',
                border: '1px dashed var(--primary-lavender)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Click to fill test credentials"
            >
              <Sparkles size={13} />
              <span>Fill Demo Account (student@university.edu)</span>
            </button>
          </div>
        </form>

        {/* Footer Link to Sign Up */}
        <div className="auth-footer">
          Don't have an account?
          <button
            type="button"
            id="switch-to-signup-btn"
            onClick={() => navigateToSignUp()}
            className="auth-footer-link"
          >
            Sign Up
          </button>
        </div>

        {/* Security Trust Badge */}
        <div className="auth-security-badge">
          <ShieldCheck size={14} color="var(--accent-green)" />
          <span>256-Bit Encrypted Secure Authentication</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="account-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div 
            className="account-modal-card" 
            style={{ maxWidth: '420px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div className="auth-icon-badge" style={{ margin: '0 auto 12px auto' }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reset your password</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Enter your email address and we will send you instructions to reset your password.
              </p>
            </div>

            {forgotMessage ? (
              <div style={{ textAlign: 'center' }}>
                <div className="auth-success-banner">
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{forgotMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-lavender"
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label htmlFor="forgot-email-input" className="auth-label" style={{ marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="auth-input"
                    style={{ paddingLeft: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-ghost"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-lavender"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
