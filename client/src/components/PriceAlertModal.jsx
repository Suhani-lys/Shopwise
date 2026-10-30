import React, { useState, useEffect } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { Bell, X, CheckCircle, Sparkles, TrendingDown, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PriceAlertModal() {
  const { 
    isAlertModalOpen, 
    setIsAlertModalOpen, 
    alertProductTarget, 
    createAlert,
    currentUser,
    navigateToLogin,
    navigateToSignUp,
    currentView
  } = useShopwise();

  const [targetPrice, setTargetPrice] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  if (!isAlertModalOpen || !alertProductTarget) return null;
  const product = alertProductTarget;

  const currentPrice = product.lowestPrice;
  const suggestedTarget = Math.round(currentPrice * 0.95); // 5% drop

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPrice) return;

    if (!currentUser) {
      // Prompt user to log in or sign up
      setIsAlertModalOpen(false);
      navigateToLogin({
        action: 'createAlert',
        product,
        returnView: currentView
      });
      return;
    }

    setSubmitting(true);
    const result = await createAlert(product.id, targetPrice, currentUser.email, selectedStore, product);
    setSubmitting(false);

    if (result && result.success) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#C084FC', '#10B981', '#F59E0B']
        });
      } catch {
        // Confetti fallback
      }
      setIsAlertModalOpen(false);
      setTargetPrice('');
    }
  };

  const handlePromptLogin = () => {
    setIsAlertModalOpen(false);
    navigateToLogin({
      action: 'createAlert',
      product,
      returnView: currentView
    });
  };

  const handlePromptSignUp = () => {
    setIsAlertModalOpen(false);
    navigateToSignUp({
      action: 'createAlert',
      product,
      returnView: currentView
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 120,
      background: 'rgba(12, 10, 23, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={() => setIsAlertModalOpen(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Icon and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            color: 'var(--primary-lavender)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={22} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create Price Drop Alert</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              24/7 autonomous monitoring across all stores
            </p>
          </div>
        </div>

        {/* Product Snippet */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'var(--bg-card-subtle)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          border: '1px solid var(--border-subtle)'
        }}>
          <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>
              Current Lowest: ₹{currentPrice.toLocaleString('en-IN')} on {product.lowestStore}
            </div>
          </div>
        </div>

        {/* If Logged Out: Authentication Prompt Banner */}
        {!currentUser ? (
          <div style={{
            backgroundColor: 'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(136, 112, 232, 0.25)',
            padding: '16px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <ShieldCheck size={18} color="var(--primary-lavender)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Sign in to activate this price alert
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                  Sign in or create an account to save alerts to your profile and track price drops across Amazon & Flipkart.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handlePromptLogin}
                className="btn-lavender"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                <span>Log In</span>
              </button>
              <button
                type="button"
                onClick={handlePromptSignUp}
                className="btn-secondary"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        ) : (
          /* User Profile Confirmation */
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-page)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Tracking under: <strong>{currentUser.email}</strong></span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Active Account</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {product.offers && product.offers.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Target Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="All Stores">All Stores (Lowest Price across all retailers)</option>
                {product.offers.map(o => (
                  <option key={o.store} value={o.store}>{o.store} (Current: ₹{o.price.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Target Price (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                required
                placeholder={`e.g. ${suggestedTarget}`}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setTargetPrice(suggestedTarget.toString())}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary-lavender)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Set 5% Drop (₹{suggestedTarget.toLocaleString('en-IN')})
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-lavender"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
          >
            <Sparkles size={16} />
            <span>
              {submitting 
                ? 'Activating Tracker...' 
                : !currentUser 
                ? 'Sign in to Activate Alert' 
                : 'Activate Price Alert'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
