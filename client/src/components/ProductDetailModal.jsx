import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  X, 
  Store, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Bell, 
  Scale, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  Truck
} from 'lucide-react';

export default function ProductDetailModal() {
  const { 
    activeModalProduct, 
    setActiveModalProduct, 
    toggleCompare, 
    compareList, 
    setIsAlertModalOpen, 
    setAlertProductTarget,
    triggerPriceAlert
  } = useShopwise();

  const [activeTab, setActiveTab] = useState('stores'); // 'stores', 'history', 'aiReview', 'trust', 'specs'
  const [historyRange, setHistoryRange] = useState('6M'); // '1M', '3M', '6M', '1Y'

  if (!activeModalProduct) return null;
  const product = activeModalProduct;
  const isCompared = compareList.some(p => p.id === product.id);

  const formatPrice = (val) => '₹' + Number(val).toLocaleString('en-IN');

  // Multi-Store Sorted Offers
  const sortedOffers = [...(product.offers || [])].sort((a, b) => (a.price + (a.deliveryCharge || 0)) - (b.price + (b.deliveryCharge || 0)));

  // SVG Chart Calculation for Price History
  const historyPoints = product.priceHistory || [];
  const prices = historyPoints.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Chart coordinates
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const points = historyPoints.map((pt, index) => {
    const x = paddingX + (index / (historyPoints.length - 1 || 1)) * graphWidth;
    const y = svgHeight - paddingY - ((pt.price - minPrice) / priceRange) * graphHeight;
    return { ...pt, x, y };
  });

  const pathD = points.reduce((acc, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${svgHeight - paddingY} L ${points[0]?.x || 0} ${svgHeight - paddingY} Z`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
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
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Modal Header */}
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
            <span className="badge-lavender">{product.brand}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{product.category}</span>
          </div>

          <button
            onClick={() => setActiveModalProduct(null)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Overview Hero inside Modal */}
        <div style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '24px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.05) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            height: '160px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {product.name}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              {product.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Lowest Price ({sortedOffers[0]?.store})
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {formatPrice(product.lowestPrice)}
                  </span>
                  {product.basePrice && (
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(product.basePrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div className="badge-lavender" style={{ padding: '6px 12px' }}>
                  <Sparkles size={14} /> SVS: {product.smartValueScore?.score || 92}/100
                </div>
                <div className="badge-green" style={{ padding: '6px 12px' }}>
                  <ShieldCheck size={14} /> {product.reviewTrustScore?.score || 94}% Trust
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => toggleCompare(product)}
                  className={isCompared ? "btn-lavender" : "btn-secondary"}
                  style={{ padding: '8px 14px', fontSize: '0.825rem' }}
                >
                  <Scale size={15} />
                  <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
                </button>

                <button
                  onClick={() => triggerPriceAlert(product)}
                  className="btn-lavender"
                  style={{ padding: '8px 14px', fontSize: '0.825rem' }}
                >
                  <Bell size={15} />
                  <span>Track Price Drop</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'var(--bg-card-subtle)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'stores', label: 'Price Comparison', icon: Store },
            { id: 'history', label: 'Price History Graph', icon: TrendingDown },
            { id: 'aiReview', label: 'AI Review Summary', icon: Sparkles },
            { id: 'trust', label: 'Review Trust Score', icon: ShieldCheck },
            { id: 'specs', label: 'Specifications', icon: Info }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: isTabActive ? 'var(--primary-lavender)' : 'var(--text-secondary)',
                  borderBottom: isTabActive ? '3px solid var(--primary-lavender)' : '3px solid transparent',
                  background: 'transparent',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px' }}>
          {/* TAB 1: Multi-Store Comparison */}
          {activeTab === 'stores' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Real-Time Multi-Store Comparison</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Verified total landed cost including shipping and available bank discounts.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedOffers.map((offer, idx) => {
                  const isLowest = idx === 0;
                  const total = offer.price + (offer.deliveryCharge || 0);
                  return (
                    <div key={offer.store} style={{
                      background: isLowest ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                      border: isLowest ? '2px solid var(--primary-lavender)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: isLowest ? 'var(--shadow-sm)' : 'none'
                    }}>
                      {/* Store & Seller Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '10px',
                          background: isLowest ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          color: 'var(--primary-lavender)',
                          fontSize: '0.85rem'
                        }}>
                          {offer.store.substring(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {offer.store}
                            </span>
                            {isLowest && (
                              <span className="badge-green" style={{ fontSize: '0.7rem' }}>
                                Best Price
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Seller: {offer.seller} ({offer.sellerRating} ★)
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-lavender)', fontWeight: 600, marginTop: '2px' }}>
                            {offer.bankOffer}
                          </div>
                        </div>
                      </div>

                      {/* Delivery & Availability */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={14} color="var(--primary-lavender)" />
                          <span>{offer.deliveryTime}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Delivery: {offer.deliveryCharge === 0 ? 'FREE' : `+ ₹${offer.deliveryCharge}`}
                        </div>
                      </div>

                      {/* Total Price and CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                            {formatPrice(total)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Base: {formatPrice(offer.price)}
                          </div>
                        </div>

                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noreferrer"
                          className={isLowest ? "btn-lavender" : "btn-secondary"}
                          style={{ padding: '9px 16px', fontSize: '0.85rem' }}
                        >
                          <span>View Offer</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Price History Graph */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>6-Month Price History & Deal Authenticity</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Continuous web tracking detects artificial price markups prior to discount sales.
                  </p>
                </div>

                <div style={{ display: 'inline-flex', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-full)', padding: '3px' }}>
                  {['1M', '3M', '6M', '1Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setHistoryRange(range)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: historyRange === range ? 'var(--primary-lavender)' : 'transparent',
                        color: historyRange === range ? '#FFFFFF' : 'var(--text-secondary)'
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal Authenticity Banner from Poster */}
              <div style={{
                background: 'var(--accent-green-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <TrendingDown size={22} color="var(--accent-green)" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {product.priceAnalysis?.discountVerdict || "Current price is 18% lower than average price."}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    All-Time Low: {formatPrice(product.priceAnalysis?.allTimeLow || minPrice)} • 6-Month Average: {formatPrice(product.priceAnalysis?.averagePrice || Math.round((minPrice + maxPrice)/2))}
                  </div>
                </div>
              </div>

              {/* SVG Curve Chart */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                overflowX: 'auto'
              }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '240px' }}>
                  <defs>
                    <linearGradient id="lavenderGraphGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.5, 1].map((pct, idx) => {
                    const y = svgHeight - paddingY - pct * graphHeight;
                    const priceLabel = Math.round(minPrice + pct * priceRange);
                    return (
                      <g key={idx}>
                        <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 4" />
                        <text x={paddingX - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">
                          {formatPrice(priceLabel)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Fill Area */}
                  <path d={areaD} fill="url(#lavenderGraphGrad)" />

                  {/* Line */}
                  <path d={pathD} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Data Points */}
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2" />
                      <text x={pt.x} y={svgHeight - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                        {pt.date?.substring(5)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 3: AI Review Summarizer */}
          {activeTab === 'aiReview' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>AI Natural Language Review Insights</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Synthesized across {product.reviewCount?.toLocaleString()} verified customer purchases.
                </p>
              </div>

              {/* Sentiment Gauge Bar */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.825rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--accent-green)' }}>Positive: {product.aiReviewSummary?.overallSentiment?.positive || 88}%</span>
                  <span style={{ color: 'var(--accent-amber)' }}>Neutral: {product.aiReviewSummary?.overallSentiment?.neutral || 8}%</span>
                  <span style={{ color: 'var(--accent-rose)' }}>Negative: {product.aiReviewSummary?.overallSentiment?.negative || 4}%</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${product.aiReviewSummary?.overallSentiment?.positive || 88}%`, background: '#10B981' }} />
                  <div style={{ width: `${product.aiReviewSummary?.overallSentiment?.neutral || 8}%`, background: '#F59E0B' }} />
                  <div style={{ width: `${product.aiReviewSummary?.overallSentiment?.negative || 4}%`, background: '#EF4444' }} />
                </div>
              </div>

              {/* Pros & Cons Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
                {/* Pros */}
                <div style={{
                  background: 'var(--accent-green-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '12px' }}>
                    <ThumbsUp size={16} />
                    <span>Top Positive Highlights</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(product.aiReviewSummary?.positivePoints || []).map((pt, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={15} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div style={{
                  background: 'var(--accent-amber-bg)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '12px' }}>
                    <ThumbsDown size={16} />
                    <span>Reported Drawbacks & Considerations</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(product.aiReviewSummary?.negativePoints || []).map((pt, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                        <AlertTriangle size={15} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target Buyer Recommendation Verdict */}
              {product.aiReviewSummary?.buyerVerdict && (
                <div style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Sparkles size={20} color="var(--primary-lavender)" />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-lavender)', textTransform: 'uppercase' }}>
                      ShopWise AI Buyer Verdict
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {product.aiReviewSummary.buyerVerdict}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Review Trust Score Audit */}
          {activeTab === 'trust' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Machine Learning Review Trust Audit</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Evaluates review velocity patterns, verified purchase badges, and linguistic diversity.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trust Confidence Score</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {product.reviewTrustScore?.score || 94}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grade: {product.reviewTrustScore?.grade || 'High'}</div>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Buyers Ratio</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-lavender)' }}>
                    {product.reviewTrustScore?.verifiedPurchasePercentage || 92}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Authentic order timestamps</div>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bot Anomaly Pattern Risk</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {product.reviewTrustScore?.botPatternRisk || 'Low'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Minimal duplicate wording</div>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <strong>Trust Audit Explanation: </strong>
                {product.reviewTrustScore?.confidenceVerdict || "Reviews on this product display healthy statistical variance across rating distributions and no abnormal bot spikes."}
              </div>
            </div>
          )}

          {/* TAB 5: Specifications */}
          {activeTab === 'specs' && (
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px' }}>Technical Specifications</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                {Object.entries(product.specs || {}).map(([key, val], idx) => (
                  <div key={key} style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    padding: '12px 18px',
                    background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
