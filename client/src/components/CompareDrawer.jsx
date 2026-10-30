import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { Scale, X, ArrowRight } from 'lucide-react';

export default function CompareDrawer() {
  const { compareList, toggleCompare, clearComparison, navigateToCompare } = useShopwise();

  if (compareList.length === 0) return null;

  return (
    <aside style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 80,
      background: 'var(--bg-card-glass)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-xl)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
      maxWidth: '90vw'
    }} aria-label="Product comparison drawer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--primary-lavender)',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Scale size={16} />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Compare Products ({compareList.length}/4)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Side-by-side specs, store offers & AI verdict
          </div>
        </div>
      </div>

      {/* Product Thumbnails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {compareList.map((p) => (
          <div key={p.id} style={{
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <img src={p.image} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            <button
              onClick={() => toggleCompare(p)}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                cursor: 'pointer'
              }}
              title="Remove"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigateToCompare()}
          className="btn-lavender"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <span>Compare Now</span>
          <ArrowRight size={14} />
        </button>

        <button
          onClick={clearComparison}
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
    </aside>
  );
}
