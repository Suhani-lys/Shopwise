import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  Sparkles, 
  Search, 
  ShieldCheck, 
  TrendingDown, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Store
} from 'lucide-react';

export default function HeroBanner() {
  const { setSearchQuery, setIsArchitectureModalOpen } = useShopwise();

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
  };

  return (
    <section style={{
      maxWidth: '1360px',
      margin: '24px auto 32px auto',
      padding: '0 24px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 36px 28px 36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Decorative Lavender Glow Ambient Circles */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 92, 252, 0.20) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.18) 0%, transparent 70%)',
          filter: 'blur(25px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '32px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Left Column: Heading and Value Proposition */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="badge-lavender" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                <Sparkles size={14} /> Compare • Discover • Decide with Confidence
              </span>
            </div>

            <h1 style={{
              fontSize: '2.5rem',
              lineHeight: 1.15,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '14px',
              color: 'var(--text-primary)'
            }}>
              A Smart Shopping Platform for <br />
              <span style={{
                background: 'linear-gradient(135deg, #7C5CFC 0%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Informed & Trustworthy Decisions
              </span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: '620px',
              marginBottom: '22px'
            }}>
              ShopWise aggregates live pricing from <strong>Amazon, Flipkart, Myntra, and Croma</strong>. 
              Eliminate fake reviews with our <strong>AI Trust Scoring Engine</strong> and detect deceptive discounts with 6-month historical price validation.
            </p>

            {/* Quick Filter Tag Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Popular Comparisons:
              </span>
              {['iPhone 14 vs Galaxy S23', 'Sony WH-1000XM5', 'MacBook Air M2', 'Jordan 1 Low'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickSearch(tag)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-lavender)';
                    e.currentTarget.style.color = 'var(--primary-lavender)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Key Feature Metric Pillars (From Poster) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px'
          }}>
            {/* Metric 1 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <Store size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                4+ Stores
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Amazon, Flipkart, Myntra & Croma live aggregation
              </div>
            </div>

            {/* Metric 2 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--accent-green-bg)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                94% Trust
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                AI Fake Review & bot pattern filtration
              </div>
            </div>

            {/* Metric 3 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--accent-amber-bg)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <TrendingDown size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Avg 18% Off
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Verified genuine discounts vs 6-month historical baseline
              </div>
            </div>

            {/* Metric 4 */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <Cpu size={18} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Smart SVS
              </div>
              <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Proprietary Value Score formula & ranking algorithm
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
