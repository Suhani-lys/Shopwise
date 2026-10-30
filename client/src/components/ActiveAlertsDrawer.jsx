import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { Bell, X, Trash2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function ActiveAlertsDrawer() {
  const { 
    isAlertsDrawerOpen, 
    setIsAlertsDrawerOpen, 
    alerts, 
    deleteAlert,
    setActiveModalProduct,
    products,
    currentUser,
    navigateToLogin
  } = useShopwise();

  if (!isAlertsDrawerOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 130,
      background: 'rgba(12, 10, 23, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--primary-lavender)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Price Alerts</h3>
          </div>

          <button
            onClick={() => setIsAlertsDrawerOpen(false)}
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No Active Alerts</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px', marginBottom: !currentUser ? '16px' : '0' }}>
                {!currentUser 
                  ? 'Sign in to access your personalized price alerts and monitor deals 24/7.' 
                  : 'Click the bell icon on any product to track target price drops!'}
              </div>
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAlertsDrawerOpen(false);
                    navigateToLogin({ action: 'viewAlerts', returnView: 'alerts' });
                  }}
                  className="btn-lavender"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
              )}
            </div>
          ) : (
            alerts.map((alert) => {
              const isTriggered = alert.status === 'Triggered';
              const matchedProduct = products.find(p => p.id === alert.productId);
              return (
                <div key={alert.id} style={{
                  background: 'var(--bg-card-subtle)',
                  border: isTriggered ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative'
                }}>
                  {/* Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={isTriggered ? "badge-green" : "badge-amber"}>
                      {isTriggered ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{alert.status}</span>
                    </span>

                    <button
                      onClick={() => deleteAlert(alert.id)}
                      style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Delete Alert"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {alert.productImage && (
                      <img src={alert.productImage} alt={alert.productName} style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alert.productName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Target: <strong style={{ color: 'var(--primary-lavender)' }}>₹{Number(alert.targetPrice).toLocaleString('en-IN')}</strong> • Current: ₹{Number(alert.currentLowestPrice).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Triggered Notification Banner */}
                  {isTriggered && (
                    <div style={{
                      background: 'var(--accent-green-bg)',
                      color: 'var(--accent-green)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '6px 10px',
                      borderRadius: '6px'
                    }}>
                      Price drop achieved! Ready to purchase.
                    </div>
                  )}

                  {matchedProduct && (
                    <button
                      onClick={() => {
                        setIsAlertsDrawerOpen(false);
                        setActiveModalProduct(matchedProduct);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--primary-lavender)',
                        marginTop: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Inspect Store Offers</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
