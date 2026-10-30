import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle, 
  Check, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  Bell
} from 'lucide-react';

export default function SignUpPage() {
  const { 
    register, 
    navigateToLogin, 
    navigateToHome, 
    authRedirectAction, 
    showToast 
  } = useShopwise();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Validation
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Real-time password criteria
  const hasMinLength = password.length >= 6;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);
    const result = await register(name.trim(), email.trim(), password, confirmPassword);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Back Button */}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className="auth-title">Create your ShopWise account</h1>
          <p className="auth-subtitle">Join thousands of smart shoppers tracking prices across stores.</p>
        </div>

        {/* Intent notification banner when user was redirected for a price alert or protected action */}
        {authRedirectAction && authRedirectAction.action === 'createAlert' && authRedirectAction.product && (
          <div className="auth-intent-banner">
            <Bell size={18} className="auth-intent-icon" />
            <div>
              <strong>Create an account to activate price alert:</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '2px', color: 'var(--text-secondary)' }}>
                You're tracking <strong>{authRedirectAction.product.name}</strong>. Create an account to monitor Amazon & Flipkart drops!
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span>{errorMessage}</span>
              {errorMessage.includes('already exists') && (
                <div style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => navigateToLogin()}
                    style={{
                      color: 'var(--primary-lavender)',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    Click here to Login instead
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="auth-field-group">
            <label htmlFor="signup-name" className="auth-label">
              <span>Full Name</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={16} />
              </span>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null }));
                }}
                className={`auth-input ${fieldErrors.name ? 'input-error' : ''}`}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                required
              />
            </div>
            {fieldErrors.name && (
              <span id="name-error" className="auth-field-error">
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="auth-field-group">
            <label htmlFor="signup-email" className="auth-label">
              <span>Email Address</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="signup-email"
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
                aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                required
              />
            </div>
            {fieldErrors.email && (
              <span id="signup-email-error" className="auth-field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label htmlFor="signup-password" className="auth-label">
              <span>Password</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                }}
                className={`auth-input has-toggle ${fieldErrors.password ? 'input-error' : ''}`}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
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
              <span id="signup-password-error" className="auth-field-error">
                {fieldErrors.password}
              </span>
            )}
            {password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.75rem', color: hasMinLength ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                <Check size={12} color={hasMinLength ? 'var(--accent-green)' : 'currentColor'} />
                <span>At least 6 characters long</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field-group">
            <label htmlFor="signup-confirm-password" className="auth-label">
              <span>Confirm Password</span>
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                className={`auth-input has-toggle ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'signup-confirm-error' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="auth-toggle-btn"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span id="signup-confirm-error" className="auth-field-error">
                {fieldErrors.confirmPassword}
              </span>
            )}
            {confirmPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.75rem', color: passwordsMatch ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                <Check size={12} color={passwordsMatch ? 'var(--accent-green)' : 'var(--accent-rose)'} />
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
              </div>
            )}
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            id="signup-submit-button"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="auth-footer">
          Already have an account?
          <button
            type="button"
            id="switch-to-login-btn"
            onClick={() => navigateToLogin()}
            className="auth-footer-link"
          >
            Login
          </button>
        </div>

        {/* Security Trust Badge */}
        <div className="auth-security-badge">
          <ShieldCheck size={14} color="var(--accent-green)" />
          <span>Your data is strictly encrypted and never shared</span>
        </div>
      </div>
    </div>
  );
}
