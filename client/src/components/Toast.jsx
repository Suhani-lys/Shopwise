import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useShopwise();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      right: '24px',
      zIndex: 200,
      background: 'var(--bg-card-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: isSuccess ? '1px solid var(--accent-green)' : (isWarning ? '1px solid var(--accent-amber)' : '1px solid var(--primary-lavender)'),
      borderRadius: 'var(--radius-md)',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      fontWeight: 600,
      maxWidth: '380px',
      animation: 'slideIn 0.25s ease-out'
    }}>
      {isSuccess && <CheckCircle2 size={18} color="var(--accent-green)" style={{ flexShrink: 0 }} />}
      {isWarning && <AlertCircle size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />}
      {!isSuccess && !isWarning && <Info size={18} color="var(--primary-lavender)" style={{ flexShrink: 0 }} />}
      <span>{toast.message}</span>
    </div>
  );
}
