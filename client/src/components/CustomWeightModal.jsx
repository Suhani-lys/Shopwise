import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { SlidersHorizontal, X, Sparkles, RotateCcw } from 'lucide-react';

export default function CustomWeightModal() {
  const { 
    isCustomWeightModalOpen, 
    setIsCustomWeightModalOpen, 
    userWeights, 
    applyCustomWeights 
  } = useShopwise();

  const [weights, setWeights] = useState({
    price: Math.round(userWeights.price * 100),
    rating: Math.round(userWeights.rating * 100),
    trust: Math.round(userWeights.trust * 100),
    specs: Math.round(userWeights.specs * 100)
  });

  if (!isCustomWeightModalOpen) return null;

  const handleSliderChange = (key, value) => {
    setWeights(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const applyPreset = (preset) => {
    let p = { price: 35, rating: 25, trust: 25, specs: 15 };
    if (preset === 'budget') p = { price: 60, rating: 15, trust: 15, specs: 10 };
    if (preset === 'quality') p = { price: 15, rating: 45, trust: 30, specs: 10 };
    if (preset === 'tech') p = { price: 20, rating: 20, trust: 20, specs: 40 };
    setWeights(p);
  };

  const handleSave = () => {
    const total = weights.price + weights.rating + weights.trust + weights.specs || 1;
    const normalized = {
      price: weights.price / total,
      rating: weights.rating / total,
      trust: weights.trust / total,
      specs: weights.specs / total
    };
    applyCustomWeights(normalized);
    setIsCustomWeightModalOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 140,
      background: 'rgba(12, 10, 23, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              color: 'var(--primary-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tune Smart Value Score</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Customize formula weighting according to your priorities
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCustomWeightModalOpen(false)}
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Quick Personas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'balanced', label: 'Balanced (Default)' },
              { id: 'budget', label: 'Budget First' },
              { id: 'quality', label: 'Quality Obsessed' },
              { id: 'tech', label: 'Specs Enthusiast' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.78rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Price */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <span>Price Competitiveness & Discounts</span>
              <span style={{ color: 'var(--primary-lavender)' }}>{weights.price}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={weights.price}
              onChange={(e) => handleSliderChange('price', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary-lavender)' }}
            />
          </div>

          {/* Rating */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <span>Customer Satisfaction & Star Ratings</span>
              <span style={{ color: 'var(--primary-lavender)' }}>{weights.rating}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={weights.rating}
              onChange={(e) => handleSliderChange('rating', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary-lavender)' }}
            />
          </div>

          {/* Trust */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <span>Review Trust & Fake Review Filtration</span>
              <span style={{ color: 'var(--accent-green)' }}>{weights.trust}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={weights.trust}
              onChange={(e) => handleSliderChange('trust', e.target.value)}
              style={{ width: '100%', accentColor: '#10B981' }}
            />
          </div>

          {/* Specs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <span>Hardware Specs Per Rupee</span>
              <span style={{ color: '#3B82F6' }}>{weights.specs}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={weights.specs}
              onChange={(e) => handleSliderChange('specs', e.target.value)}
              style={{ width: '100%', accentColor: '#3B82F6' }}
            />
          </div>
        </div>

        {/* Save CTA */}
        <button
          onClick={handleSave}
          className="btn-lavender"
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
        >
          <Sparkles size={16} />
          <span>Apply Custom SVS & Re-rank Products</span>
        </button>
      </div>
    </div>
  );
}
