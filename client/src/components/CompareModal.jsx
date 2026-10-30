import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  X, 
  Scale, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export default function CompareModal() {
  const { 
    isCompareModalOpen, 
    setIsCompareModalOpen, 
    compareList, 
    toggleCompare,
    setActiveModalProduct 
  } = useShopwise();

  if (!isCompareModalOpen || compareList.length === 0) return null;

  const formatPrice = (val) => '₹' + Number(val).toLocaleString('en-IN');

  // Unified list of spec keys across compared items
  const allSpecKeys = Array.from(new Set(
    compareList.flatMap(p => Object.keys(p.specs || {}))
  ));

  // AI Comparative Analysis Verdict
  const p1 = compareList[0];
  const p2 = compareList[1];
  let verdictText = '';
  if (p1 && p2) {
    const cheaperSvsText = cheaper.smartValueScore?.score ? `retaining a strong ${cheaper.smartValueScore.score}/100 Smart Value Score` : 'providing competitive entry pricing';
    verdictText = `ShopWise Comparison Summary: For budget-conscious shoppers looking for maximum price advantage, ${cheaper.name} is the economical choice, saving ₹${diff.toLocaleString()} while ${cheaperSvsText}. On the other hand, ${premium.name} is better suited for users who value ${premium.brand}'s signature ecosystem, display fidelity, and specific hardware nuances.`;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      background: 'rgba(12, 10, 23, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              color: 'var(--primary-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scale size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Side-by-Side Product Comparison</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Directly comparing pricing, genuine discount authenticity, specs & customer trust.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(false)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {/* AI Verdict Box */}
          {verdictText && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.12) 0%, rgba(167, 139, 250, 0.06) 100%)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <Sparkles size={22} color="var(--primary-lavender)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-lavender)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ShopWise Comparative AI Recommendation
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.55, marginTop: '4px' }}>
                  {verdictText}
                </div>
              </div>
            </div>
          )}

          {/* Side by Side Grid Columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${compareList.length}, minmax(260px, 1fr))`,
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '20px'
          }}>
            {compareList.map((p) => {
              const bestOffer = [...(p.offers || [])].sort((a, b) => a.price - b.price)[0];
              return (
                <div key={p.id} style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {/* Remove Button */}
                  <button
                    onClick={() => toggleCompare(p)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Remove from comparison"
                  >
                    <X size={16} />
                  </button>

                  {/* Thumbnail */}
                  <div style={{
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px'
                  }}>
                    <img src={p.image} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>

                  {/* Brand & Name */}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-lavender)', textTransform: 'uppercase' }}>
                    {p.brand}
                  </span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', minHeight: '2.6em' }}>
                    {p.name}
                  </h4>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      background: '#FEF3C7',
                      color: '#D97706',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      <Star size={12} fill="#D97706" color="#D97706" /> {p.rating}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>({Number(p.reviewCount).toLocaleString()} reviews)</span>
                  </div>

                  {/* Price Comparison Card inside comparison column */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Best on {bestOffer?.store || p.lowestStore}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      {formatPrice(p.lowestPrice)}
                    </div>
                    {p.basePrice && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        MRP {formatPrice(p.basePrice)}
                      </div>
                    )}
                  </div>

                  {/* Scores Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-lavender)' }}>
                        {p.smartValueScore?.score ? p.smartValueScore.score : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary-lavender)' }}>SMART VALUE</div>
                    </div>

                    <div style={{ background: 'var(--accent-green-bg)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                        {p.reviewTrustScore?.isScoreAvailable ? `${p.reviewTrustScore.score}%` : 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-green)' }}>TRUST SCORE</div>
                    </div>
                  </div>

                  {/* Buy / View Offer Button */}
                  {bestOffer && (
                    <a
                      href={bestOffer.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-lavender"
                      style={{ padding: '8px 12px', fontSize: '0.825rem', marginBottom: '10px' }}
                    >
                      <span>View Offer on {bestOffer.store}</span>
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setIsCompareModalOpen(false);
                      setActiveModalProduct(p);
                    }}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                  >
                    Full Deep Dive
                  </button>
                </div>
              );
            })}
          </div>

          {/* Specifications Table Comparison */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>
              Specification Breakdown
            </h4>

            <div style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              {allSpecKeys.map((key, idx) => (
                <div key={key} style={{
                  display: 'grid',
                  gridTemplateColumns: `180px repeat(${compareList.length}, 1fr)`,
                  padding: '12px 18px',
                  background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  {compareList.map(p => (
                    <span key={p.id} style={{ color: 'var(--text-primary)', fontWeight: 500, paddingRight: '12px' }}>
                      {p.specs?.[key] || '—'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
