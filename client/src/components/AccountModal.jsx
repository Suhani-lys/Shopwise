import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Bell, 
  Heart, 
  LogOut, 
  X, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function AccountModal() {
  const { 
    currentUser, 
    isAccountModalOpen, 
    setIsAccountModalOpen, 
    alerts, 
    compareList, 
    logout, 
    navigateToAlerts, 
    navigateToCompare 
  } = useShopwise();

  if (!isAccountModalOpen || !currentUser) return null;

  // Initials for avatar
  const initials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const memberDate = currentUser.createdAt 
    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recent Member';

  const userAlertsCount = alerts.length;

  return (
    <div className="account-modal-overlay" onClick={() => setIsAccountModalOpen(false)}>
      <div 
        className="account-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="My Account"
      >
        {/* Header with Background Gradient */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(136, 112, 232, 0.12) 0%, rgba(136, 112, 232, 0.04) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-lavender), #A78BFA)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(136, 112, 232, 0.3)'
            }}>
              {initials}
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
                {currentUser.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <Mail size={13} />
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAccountModalOpen(false)}
            style={{
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Active Alerts Metric */}
            <div 
              onClick={() => {
                setIsAccountModalOpen(false);
                navigateToAlerts();
              }}
              className="clean-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  MY PRICE ALERTS
                </span>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={15} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {userAlertsCount}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--primary-lavender)', fontWeight: 600, marginTop: '4px' }}>
                <span>Manage alerts</span>
                <ArrowRight size={12} />
              </div>
            </div>

            {/* Saved Comparison Products */}
            <div 
              onClick={() => {
                setIsAccountModalOpen(false);
                navigateToCompare();
              }}
              className="clean-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  SAVED COMPARISONS
                </span>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(235, 247, 242, 1)',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Heart size={15} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {compareList.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                <span>Open compare</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div style={{
            backgroundColor: 'var(--bg-page)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                <span>Member Since</span>
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{memberDate}</span>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="var(--accent-green)" />
                <span>Account Status</span>
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-green)',
                backgroundColor: 'var(--accent-green-bg)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Active & Verified
              </span>
            </div>
          </div>

          {/* Quick Actions / Logout */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => {
                setIsAccountModalOpen(false);
                logout();
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                backgroundColor: 'var(--accent-rose-bg)',
                color: 'var(--accent-rose)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="btn-lavender"
              style={{ flex: 1, padding: '11px', fontSize: '0.88rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
