import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  ArrowUpDown, 
  SlidersHorizontal, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function FilterBar() {
  const { 
    products, 
    sortBy, 
    setSortBy, 
    setIsCustomWeightModalOpen, 
    setSearchQuery, 
    setSelectedCategory,
    userWeights
  } = useShopwise();

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('smartValue');
  };

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto 20px auto',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Result Count and Formula Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {products.length} Products Found
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>•</span>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--primary-soft)',
          border: '1px solid var(--border-subtle)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: 'var(--primary-lavender)',
          fontWeight: 600
        }}>
          <Sparkles size={13} />
          <span>SVS Formula Active ({Math.round(userWeights.price * 100)}% Price, {Math.round(userWeights.trust * 100)}% Trust)</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Sort Selector */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <ArrowUpDown size={15} color="var(--primary-lavender)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer'
            }}
          >
            <option value="smartValue">Smart Value Score (Best Balance)</option>
            <option value="priceAsc">Price: Lowest First</option>
            <option value="priceDesc">Price: Highest First</option>
            <option value="ratingDesc">Highest Customer Rating</option>
            <option value="discountDesc">Biggest Price Drop (%)</option>
            <option value="trustDesc">Review Trust Score (Safest Reviews)</option>
          </select>
        </div>

        {/* Tune SVS Formula */}
        <button
          onClick={() => setIsCustomWeightModalOpen(true)}
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.825rem' }}
          title="Adjust AI weights for price, trust, rating, and specs"
        >
          <SlidersHorizontal size={14} />
          <span>Customize Formula</span>
        </button>

        {/* Reset Filters */}
        <button
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition-fast)'
          }}
          title="Reset search and filters"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
