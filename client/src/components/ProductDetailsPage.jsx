import React, { useState, useEffect, useMemo } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  ChevronRight, 
  Star, 
  ExternalLink, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Store as StoreIcon, 
  ArrowLeft,
  Calendar,
  RotateCcw,
  Check,
  ShoppingBag,
  Package,
  Scale
} from 'lucide-react';

export default function ProductDetailsPage() {
  const { 
    selectedProductId, 
    allProducts, 
    selectedTab, 
    setSelectedTab, 
    navigateToHome, 
    navigateToSearch,
    setIsAlertModalOpen,
    setAlertProductTarget,
    triggerPriceAlert,
    compareList,
    toggleCompare
  } = useShopwise();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedTab || 'prices');
  const [historyRange, setHistoryRange] = useState('6M'); // '1M', '3M', '6M'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Sync activeTab with context selectedTab
  useEffect(() => {
    if (selectedTab) {
      setActiveTab(selectedTab);
    }
  }, [selectedTab]);

  // Update tab in URL without reload
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSelectedTab(tabKey);
    const url = new URL(window.location.href);
    if (tabKey !== 'prices') {
      url.searchParams.set('tab', tabKey);
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Fetch or find product
  useEffect(() => {
    if (!selectedProductId) {
      setError('No product selected.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setImageError(false);

    // Initial lookup from local catalog
    const local = allProducts.find(p => p.id === selectedProductId);
    if (local) {
      setProduct(local);
    }

    // Fetch enriched product from backend API
    fetch(`http://localhost:5000/api/products/${selectedProductId}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Product not found');
      })
      .then(data => {
        if (isMounted && data.success && data.data) {
          setProduct(data.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (local) {
            setLoading(false);
          } else {
            setError('Product details could not be found.');
            setLoading(false);
          }
        }
      });

    return () => { isMounted = false; };
  }, [selectedProductId, allProducts]);

  // Format currency in Indian Rupees
  const formatPrice = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Open Price Alert Modal (with auth check)
  const handleOpenAlert = () => {
    if (product) {
      triggerPriceAlert(product);
    }
  };

  // Sorted offers by Total Payable Price (lowest first)
  const sortedOffers = useMemo(() => {
    if (!product || !Array.isArray(product.offers)) return [];
    return [...product.offers].sort((a, b) => {
      const totalA = Number(a.price || 0) + (a.deliveryCharge !== undefined && a.deliveryCharge !== null ? Number(a.deliveryCharge) : 0);
      const totalB = Number(b.price || 0) + (b.deliveryCharge !== undefined && b.deliveryCharge !== null ? Number(b.deliveryCharge) : 0);
      return totalA - totalB;
    });
  }, [product]);

  const bestOffer = sortedOffers[0] || null;

  // Filter Historical Price points based on selected range
  const filteredHistory = useMemo(() => {
    if (!product || !Array.isArray(product.priceHistory) || product.priceHistory.length === 0) {
      return [];
    }
    const raw = [...product.priceHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (raw.length <= 2) return raw;

    const latestDate = new Date(raw[raw.length - 1].date);
    let cutoffDays = 180; // 6M
    if (historyRange === '1M') cutoffDays = 30;
    else if (historyRange === '3M') cutoffDays = 90;

    const cutoffTime = latestDate.getTime() - cutoffDays * 24 * 60 * 60 * 1000;
    const subset = raw.filter(pt => new Date(pt.date).getTime() >= cutoffTime);

    // Ensure at least 2 points to draw a meaningful trend line
    if (subset.length < 2) {
      return raw.slice(-Math.min(3, raw.length));
    }
    return subset;
  }, [product, historyRange]);

  // Calculate history stats
  const historyStats = useMemo(() => {
    if (filteredHistory.length === 0) return null;
    const prices = filteredHistory.map(p => Number(p.price) || 0);
    const lowest = Math.min(...prices);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const avg = Math.round(sum / prices.length);
    const current = prices[prices.length - 1];
    const isGenuine = current < avg;
    const diffPercent = avg > 0 ? Math.round(((current - avg) / avg) * 100) : 0;

    return {
      current,
      avg,
      lowest,
      isGenuine,
      diffPercent
    };
  }, [filteredHistory]);

  // Loading State
  if (loading && !product) {
    return (
      <div className="product-details-page">
        <div className="content-wrapper">
          <div className="skeleton-card skeleton-pulse" style={{ height: '36px', width: '320px', marginBottom: '24px' }} />
          <div className="product-overview-grid" style={{ marginBottom: '32px' }}>
            <div className="clean-card skeleton-pulse" style={{ height: '380px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton-line skeleton-pulse" style={{ width: '90%', height: '28px' }} />
              <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: '20px' }} />
              <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: '36px' }} />
              <div className="skeleton-line skeleton-pulse" style={{ width: '100%', height: '80px' }} />
              <div className="skeleton-line skeleton-pulse" style={{ width: '70%', height: '44px', marginTop: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="product-details-page">
        <div className="content-wrapper">
          <div className="search-state-card clean-card">
            <div className="state-icon-circle error">
              <AlertTriangle size={30} />
            </div>
            <h2 className="state-card-title">Product Not Found</h2>
            <p className="state-card-description">
              {error || "We couldn't locate the requested product in the ShopWise catalog."}
            </p>
            <button
              type="button"
              onClick={navigateToSearch}
              className="btn-lavender"
            >
              <ArrowLeft size={15} />
              <span>Return to Search Results</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lowestPrice = product.lowestPrice || bestOffer?.price || 0;
  const basePrice = product.basePrice || 0;
  const bestStore = product.lowestStore || bestOffer?.store || 'Best Store';
  const isGenuineDiscount = product.priceAnalysis?.isGenuineDiscount || (basePrice > lowestPrice && lowestPrice <= basePrice * 0.9);
  const discountPercent = basePrice > lowestPrice ? Math.round(((basePrice - lowestPrice) / basePrice) * 100) : 0;

  // SVG Chart Dimensions & Coordinates
  const svgWidth = 640;
  const svgHeight = 220;
  const padX = 45;
  const padY = 30;
  const graphW = svgWidth - padX * 2;
  const graphH = svgHeight - padY * 2;

  const histPrices = filteredHistory.map(p => p.price);
  const chartMinPrice = Math.min(...histPrices);
  const chartMaxPrice = Math.max(...histPrices);
  const chartRange = (chartMaxPrice - chartMinPrice) || 1;

  const chartPoints = filteredHistory.map((pt, idx) => {
    const x = padX + (idx / (filteredHistory.length - 1 || 1)) * graphW;
    const y = svgHeight - padY - ((pt.price - chartMinPrice) / chartRange) * graphH;
    return { ...pt, x, y };
  });

  const pathD = chartPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = chartPoints.length > 0 
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight - padY} L ${chartPoints[0].x} ${svgHeight - padY} Z`
    : '';

  return (
    <div className="product-details-page">
      <div className="content-wrapper">
        {/* Breadcrumb: Home > Search Results > Product Name */}
        <nav aria-label="Breadcrumb" className="product-breadcrumb">
          <button 
            type="button" 
            onClick={navigateToHome}
            className="breadcrumb-link"
          >
            Home
          </button>
          <ChevronRight size={13} className="breadcrumb-separator" />
          <button 
            type="button" 
            onClick={navigateToSearch}
            className="breadcrumb-link"
          >
            Search Results
          </button>
          <ChevronRight size={13} className="breadcrumb-separator" />
          <span className="breadcrumb-current-product" aria-current="page">
            {product.name}
          </span>
        </nav>

        {/* Section 2: Product Overview Section (Two Columns on Desktop) */}
        <section className="product-overview-section clean-card" aria-label="Product overview">
          <div className="product-overview-grid">
            {/* LEFT SIDE: Large Product Image & Fallback */}
            <div className="product-overview-media">
              <div className="product-image-container">
                <img
                  src={imageError ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' : product.image}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="product-main-image"
                />
              </div>
            </div>

            {/* RIGHT SIDE: Product Information & Best Offer */}
            <div className="product-overview-info">
              {/* Brand and Category Badges */}
              <div className="product-badges-row">
                {product.brand && (
                  <span className="badge-brand">{product.brand}</span>
                )}
                {product.category && (
                  <span className="badge-category">{product.category}</span>
                )}
                {isGenuineDiscount && (
                  <span className="deal-badge best-price">Best Price</span>
                )}
              </div>

              {/* Product Name */}
              <h1 className="product-detail-title">
                {product.name}
              </h1>

              {/* Star Rating and Review Count */}
              <div className="product-rating-row">
                <div className="rating-pill">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span className="rating-score">{product.rating || '4.0'}</span>
                </div>
                <span className="review-count-text">
                  ({Number(product.reviewCount || 0).toLocaleString()} customer reviews)
                </span>
              </div>

              {/* Current Best Available Price Box */}
              <div className="product-price-panel">
                <div className="price-top-line">
                  <span className="price-current">{formatPrice(lowestPrice)}</span>
                  {basePrice > lowestPrice && (
                    <span className="price-original">{formatPrice(basePrice)}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="deal-badge price-drop">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div className="price-meta-line">
                  <span>Best deal available on <strong>{bestStore}</strong></span>
                  {bestOffer?.deliveryTime && (
                    <span className="delivery-speed">&bull; {bestOffer.deliveryTime}</span>
                  )}
                </div>
              </div>

              {/* Product Description */}
              {product.description && (
                <p className="product-short-description">
                  {product.description}
                </p>
              )}

              {/* Action Buttons: View Best Offer & Set Price Alert */}
              <div className="product-actions-group">
                {bestOffer?.url ? (
                  <a
                    href={bestOffer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-lavender btn-large"
                    aria-label={`View best offer on ${bestStore}`}
                  >
                    <span>View Best Offer</span>
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabChange('prices')}
                    className="btn-lavender btn-large"
                  >
                    <span>Compare Stores</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenAlert}
                  className="btn-secondary btn-large"
                  aria-label="Set a price drop alert for this product"
                >
                  <Bell size={16} />
                  <span>Set Price Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompare(product)}
                  className="btn-secondary btn-large"
                  style={{
                    color: compareList.some(p => p.id === product?.id) ? 'var(--primary-lavender)' : 'inherit',
                    backgroundColor: compareList.some(p => p.id === product?.id) ? 'var(--primary-light)' : 'transparent',
                    borderColor: compareList.some(p => p.id === product?.id) ? 'var(--primary-lavender)' : 'var(--border-color)'
                  }}
                  aria-label={compareList.some(p => p.id === product?.id) ? "Remove from comparison" : "Add to comparison"}
                >
                  <Scale size={16} />
                  <span>{compareList.some(p => p.id === product?.id) ? "In Comparison" : "Compare"}</span>
                </button>
              </div>

              {/* Section 4: Smart Value Score (Compact Subtle Card) */}
              {product.smartValueScore?.score && (
                <div className="svs-mini-card">
                  <div className="svs-mini-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} color="var(--primary-lavender)" />
                      <span className="svs-mini-label">Smart Value Score</span>
                    </div>
                    <span className="svs-mini-score">{product.smartValueScore.score}/100</span>
                  </div>
                  <p className="svs-mini-explanation">
                    {product.smartValueScore.tier ? `Ranked: ${product.smartValueScore.tier}. ` : ''}
                    {product.smartValueScore.explanation || 'Optimal balance of market pricing, verified ratings, and trust.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Three Product Tabs Navigation */}
        <div className="product-tabs-container">
          <div className="product-tab-bar" role="tablist" aria-label="Product details sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'prices'}
              aria-controls="tab-panel-prices"
              id="tab-prices"
              onClick={() => handleTabChange('prices')}
              className={`product-tab-btn ${activeTab === 'prices' ? 'active' : ''}`}
            >
              <span>Prices</span>
              <span className="tab-badge">{sortedOffers.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="tab-panel-history"
              id="tab-history"
              onClick={() => handleTabChange('history')}
              className={`product-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            >
              <span>History</span>
              {historyStats?.isGenuine && (
                <span className="tab-pill-badge">Genuine Deal</span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="tab-panel-reviews"
              id="tab-reviews"
              onClick={() => handleTabChange('reviews')}
              className={`product-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            >
              <span>Reviews</span>
              {product.reviewTrustScore?.score && (
                <span className="tab-trust-pill">{product.reviewTrustScore.score}% Trust</span>
              )}
            </button>
          </div>

          {/* TAB A — Prices Panel */}
          {activeTab === 'prices' && (
            <div 
              id="tab-panel-prices" 
              role="tabpanel" 
              aria-labelledby="tab-prices"
              className="tab-content-panel clean-card"
            >
              <div className="tab-header-box">
                <h2 className="tab-panel-title">Compare Prices</h2>
                <p className="tab-panel-subtitle">Find the best total price across available stores.</p>
              </div>

              {sortedOffers.length === 0 ? (
                <div className="tab-empty-state">
                  <Package size={32} color="var(--primary-lavender)" />
                  <h3>No store offers currently available</h3>
                  <p>Check back later or set a price alert to be notified when stock returns.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Comparison Table */}
                  <div className="store-offers-table-wrapper">
                    <table className="store-offers-table" aria-label="Price comparison across stores">
                      <thead>
                        <tr>
                          <th>Store</th>
                          <th>Product Price</th>
                          <th>Delivery</th>
                          <th>Total Price</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedOffers.map((offer, idx) => {
                          const deliveryKnown = offer.deliveryCharge !== undefined && offer.deliveryCharge !== null;
                          const deliveryCost = deliveryKnown ? Number(offer.deliveryCharge) : 0;
                          const totalPrice = Number(offer.price || 0) + deliveryCost;
                          const isLowest = idx === 0;

                          return (
                            <tr key={`${offer.store}-${idx}`} className={isLowest ? 'row-lowest-total' : ''}>
                              {/* Store Column */}
                              <td>
                                <div className="store-cell">
                                  <div className="store-name-row">
                                    <span className="store-name-text">{offer.store}</span>
                                    {isLowest && (
                                      <span className="badge-lowest-total">Lowest Total</span>
                                    )}
                                  </div>
                                  {offer.seller && (
                                    <span className="store-seller-text">Seller: {offer.seller}</span>
                                  )}
                                  {offer.bankOffer && (
                                    <span className="store-bank-offer-text">{offer.bankOffer}</span>
                                  )}
                                </div>
                              </td>

                              {/* Product Price Column */}
                              <td>
                                <div className="price-cell">
                                  <span className="item-price-val">{formatPrice(offer.price)}</span>
                                  {offer.mrp && offer.mrp > offer.price && (
                                    <span className="item-mrp-val">{formatPrice(offer.mrp)}</span>
                                  )}
                                </div>
                              </td>

                              {/* Delivery Column */}
                              <td>
                                <div className="delivery-cell">
                                  {!deliveryKnown ? (
                                    <span className="delivery-unknown">Not available</span>
                                  ) : deliveryCost === 0 ? (
                                    <span className="delivery-free">Free Delivery</span>
                                  ) : (
                                    <span className="delivery-cost">{formatPrice(deliveryCost)}</span>
                                  )}
                                  {offer.deliveryTime && (
                                    <span className="delivery-time-sub">{offer.deliveryTime}</span>
                                  )}
                                </div>
                              </td>

                              {/* Total Price Column */}
                              <td>
                                <div className="total-price-cell">
                                  <span className={`total-price-val ${isLowest ? 'highlight' : ''}`}>
                                    {formatPrice(totalPrice)}
                                  </span>
                                </div>
                              </td>

                              {/* Action Column */}
                              <td style={{ textAlign: 'right' }}>
                                <a
                                  href={offer.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={isLowest ? 'btn-lavender btn-sm' : 'btn-secondary btn-sm'}
                                  aria-label={`View offer on ${offer.store} for ${formatPrice(totalPrice)}`}
                                >
                                  <span>View Offer</span>
                                  <ExternalLink size={13} />
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Store Offer Cards (Transform on mobile screens) */}
                  <div className="mobile-store-cards-list">
                    {sortedOffers.map((offer, idx) => {
                      const deliveryKnown = offer.deliveryCharge !== undefined && offer.deliveryCharge !== null;
                      const deliveryCost = deliveryKnown ? Number(offer.deliveryCharge) : 0;
                      const totalPrice = Number(offer.price || 0) + deliveryCost;
                      const isLowest = idx === 0;

                      return (
                        <div 
                          key={`mob-${offer.store}-${idx}`} 
                          className={`mobile-store-card clean-card ${isLowest ? 'card-lowest' : ''}`}
                        >
                          <div className="mob-card-header">
                            <span className="store-name-text">{offer.store}</span>
                            {isLowest && (
                              <span className="badge-lowest-total">Lowest Total</span>
                            )}
                          </div>

                          <div className="mob-card-breakdown">
                            <div className="breakdown-row">
                              <span>Product Price:</span>
                              <strong>{formatPrice(offer.price)}</strong>
                            </div>
                            <div className="breakdown-row">
                              <span>Delivery:</span>
                              <span>
                                {!deliveryKnown ? 'Not available' : deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}
                              </span>
                            </div>
                            <div className="breakdown-row total-row">
                              <span>Total Payable:</span>
                              <strong className="total-highlight">{formatPrice(totalPrice)}</strong>
                            </div>
                          </div>

                          <a
                            href={offer.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-lavender btn-block"
                            style={{ marginTop: '12px' }}
                          >
                            <span>View Offer on {offer.store}</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB B — History Panel */}
          {activeTab === 'history' && (
            <div 
              id="tab-panel-history" 
              role="tabpanel" 
              aria-labelledby="tab-history"
              className="tab-content-panel clean-card"
            >
              <div className="tab-header-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="tab-panel-title">Price History</h2>
                  <p className="tab-panel-subtitle">Track price changes and discover the right time to buy.</p>
                </div>

                {/* Range Filter Buttons */}
                <div className="history-range-pills" role="radiogroup" aria-label="Historical time range">
                  {['1M', '3M', '6M'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      role="radio"
                      aria-checked={historyRange === range}
                      onClick={() => setHistoryRange(range)}
                      className={`range-pill ${historyRange === range ? 'active' : ''}`}
                    >
                      {range === '1M' ? '1 Month' : range === '3M' ? '3 Months' : '6 Months'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length < 2 ? (
                <div className="tab-empty-state">
                  <Calendar size={32} color="var(--primary-lavender)" />
                  <h3>Not enough price history yet</h3>
                  <p>Price trends will appear as more price records become available.</p>
                </div>
              ) : (
                <>
                  {/* Interactive SVG Line Chart */}
                  <div className="history-chart-wrapper">
                    <svg 
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                      className="history-chart-svg"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8870E8" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8870E8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                      {/* Line Stroke */}
                      {pathD && (
                        <path 
                          d={pathD} 
                          fill="none" 
                          stroke="#8870E8" 
                          strokeWidth="2.8" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      )}

                      {/* Interactive Circles & Points */}
                      {chartPoints.map((pt, idx) => (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredPoint === idx ? 6 : 4}
                            fill="#FFFFFF"
                            stroke="#8870E8"
                            strokeWidth={hoveredPoint === idx ? 3 : 2}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            tabIndex={0}
                            aria-label={`Date: ${pt.date}, Price: ₹${pt.price}`}
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Active Point Tooltip */}
                    {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                      <div 
                        className="chart-tooltip-bubble"
                        style={{
                          left: `${(chartPoints[hoveredPoint].x / svgWidth) * 100}%`,
                          top: `${(chartPoints[hoveredPoint].y / svgHeight) * 100}%`
                        }}
                      >
                        <span className="tooltip-date">{chartPoints[hoveredPoint].date}</span>
                        <strong className="tooltip-price">{formatPrice(chartPoints[hoveredPoint].price)}</strong>
                        {chartPoints[hoveredPoint].event && (
                          <span className="tooltip-event">{chartPoints[hoveredPoint].event}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Cards Below Chart */}
                  {historyStats && (
                    <div className="history-summary-cards-row">
                      {/* Current Price */}
                      <div className="summary-stat-card clean-card">
                        <span className="stat-label">Current Price</span>
                        <span className="stat-value">{formatPrice(historyStats.current)}</span>
                        {historyStats.isGenuine && (
                          <span className="deal-badge price-drop" style={{ marginTop: '4px' }}>
                            Genuine Deal ({Math.abs(historyStats.diffPercent)}% below avg)
                          </span>
                        )}
                      </div>

                      {/* Historical Average */}
                      <div className="summary-stat-card clean-card">
                        <span className="stat-label">Historical Average ({historyRange === '1M' ? '1 Mo' : historyRange === '3M' ? '3 Mos' : '6 Mos'})</span>
                        <span className="stat-value">{formatPrice(historyStats.avg)}</span>
                        <span className="stat-subtext">Based on recorded offers</span>
                      </div>

                      {/* Lowest Recorded Price */}
                      <div className="summary-stat-card clean-card">
                        <span className="stat-label">Lowest Recorded Price</span>
                        <span className="stat-value" style={{ color: 'var(--accent-green)' }}>
                          {formatPrice(historyStats.lowest)}
                        </span>
                        <span className="stat-subtext">Best tracked window</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB C — Reviews Panel */}
          {activeTab === 'reviews' && (
            <div 
              id="tab-panel-reviews" 
              role="tabpanel" 
              aria-labelledby="tab-reviews"
              className="tab-content-panel clean-card"
            >
              <div className="tab-header-box">
                <h2 className="tab-panel-title">Customer Reviews</h2>
                <p className="tab-panel-subtitle">Verified feedback and AI-analyzed review trust metrics.</p>
              </div>

              {/* Top Rating & Trust Score Summary */}
              <div className="reviews-overview-row">
                {/* Overall Rating Box */}
                <div className="review-metric-box clean-card">
                  <span className="metric-box-label">Overall Rating</span>
                  <div className="overall-score-big">
                    <span>{product.rating || '4.0'}</span>
                    <span className="out-of">/ 5.0</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', margin: '4px 0' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={16} 
                        fill={s <= Math.round(product.rating || 4) ? '#F59E0B' : 'none'} 
                        color="#F59E0B" 
                      />
                    ))}
                  </div>
                  <span className="metric-subtext">
                    Based on {Number(product.reviewCount || 0).toLocaleString()} customer ratings
                  </span>
                </div>

                {/* Review Trust Score Box */}
                <div className="review-metric-box clean-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span className="metric-box-label">Review Trust Score</span>
                    <ShieldCheck size={18} color="var(--primary-lavender)" />
                  </div>
                  <div className="overall-score-big" style={{ color: 'var(--primary-lavender)' }}>
                    <span>{product.reviewTrustScore?.score || 88}</span>
                    <span className="out-of">/ 100</span>
                  </div>
                  <span className="trust-grade-pill">
                    {product.reviewTrustScore?.score >= 85 ? 'High Trust' : product.reviewTrustScore?.score >= 65 ? 'Medium Trust' : 'Moderate Trust'}
                  </span>
                  <p className="metric-subtext" style={{ marginTop: '6px', lineHeight: 1.4 }}>
                    {product.reviewTrustScore?.confidenceVerdict || `${product.reviewTrustScore?.verifiedPurchasePercentage || 90}% verified buyer ratio with low repetition.`}
                  </p>
                </div>
              </div>

              {/* AI Review Summary (Pros & Cons) */}
              {product.aiReviewSummary && (
                <div className="ai-pros-cons-grid">
                  {/* Pros */}
                  <div className="pros-card clean-card">
                    <div className="pros-cons-header pros">
                      <CheckCircle2 size={16} color="var(--accent-green)" />
                      <h3>Key Highlights (Pros)</h3>
                    </div>
                    <ul className="pros-cons-list">
                      {(product.aiReviewSummary.positivePoints || [
                        'Strong build quality and premium materials',
                        'Reliable all-day performance and efficiency',
                        'Exceptional camera quality and color accuracy'
                      ]).slice(0, 3).map((item, idx) => (
                        <li key={idx} className="pro-item">
                          <Check size={14} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="cons-card clean-card">
                    <div className="pros-cons-header cons">
                      <AlertTriangle size={16} color="var(--accent-amber)" />
                      <h3>Considerations (Cons)</h3>
                    </div>
                    <ul className="pros-cons-list">
                      {(product.aiReviewSummary.negativePoints || [
                        'Charging accessory sold separately in retail packaging',
                        'Standard display refresh rate on base configuration',
                        'High repair and official accessory costs'
                      ]).slice(0, 3).map((item, idx) => (
                        <li key={idx} className="con-item">
                          <Info size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer on Trust Signals */}
              <div className="trust-disclaimer-card">
                <Info size={15} color="var(--primary-lavender)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p>
                  <strong>ShopWise Trust Engine Note:</strong> Verified trust scores and review signals analyze linguistic patterns, buyer verification status, and review frequency. These metrics are statistical indicators to help customers evaluate feedback and do not constitute legal proof of fraud.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
