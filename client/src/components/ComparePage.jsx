import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { API_BASE_URL } from '../config/api';
import { 
  Scale, 
  Plus, 
  Trash2, 
  X, 
  ExternalLink, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Search, 
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  Info,
  Award,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Sports & Fitness',
  'Books & Stationery'
];

export default function ComparePage() {
  const { 
    compareList, 
    allProducts, 
    addToCompare, 
    removeFromCompare, 
    clearComparison, 
    navigateToProduct, 
    navigateToSearch,
    navigateToHome,
    showToast
  } = useShopwise();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('All');
  const [aiVerdict, setAiVerdict] = useState('');
  const [isVerdictLoading, setIsVerdictLoading] = useState(false);

  // Currency Formatter
  const formatINR = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return 'Unavailable';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Fetch or calculate AI comparison analysis when 2+ items selected
  useEffect(() => {
    if (compareList.length < 2) {
      setAiVerdict('');
      return;
    }

    let isMounted = true;
    const fetchVerdict = async () => {
      setIsVerdictLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: compareList.map(p => p.id) })
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.data?.aiVerdict) {
            setAiVerdict(data.data.aiVerdict);
            setIsVerdictLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend compare endpoint unavailable, using local calculation:', err);
      }

      // Local fallback calculated verdict
      if (isMounted) {
        const sortedByPrice = [...compareList].sort((a, b) => (a.lowestPrice || 0) - (b.lowestPrice || 0));
        const cheapest = sortedByPrice[0];
        const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
        const diff = (mostExpensive.lowestPrice || 0) - (cheapest.lowestPrice || 0);

        const expensiveTrust = mostExpensive.reviewTrustScore?.isScoreAvailable ? `${mostExpensive.reviewTrustScore.score}% Review Trust Score` : 'established brand ecosystem';
        const verdict = diff > 0 
          ? `ShopWise Comparison Summary: For value-oriented shoppers, ${cheapest.name} offers the lowest entry price of ${formatINR(cheapest.lowestPrice)}, saving ${formatINR(diff)} compared to ${mostExpensive.name}. For buyers seeking higher specifications or brand ecosystem benefits, ${mostExpensive.name} delivers ${mostExpensive.rating ? `a verified ${mostExpensive.rating}★ rating and ` : ''}${expensiveTrust}.`
          : `ShopWise Comparison Summary: The compared products are similarly priced. Review Trust Score and Smart Value Score indicate ${cheapest.name} maintains a well-balanced profile for customer satisfaction.`;
        setAiVerdict(verdict);
        setIsVerdictLoading(false);
      }
    };

    fetchVerdict();
    return () => { isMounted = false; };
  }, [compareList]);

  // Compute Best Offer & Verified Total Payable for each product
  const productPriceMetrics = useMemo(() => {
    return compareList.map(product => {
      const offers = Array.isArray(product.offers) ? product.offers : [];
      if (offers.length === 0) {
        return {
          product,
          lowestStorePrice: product.lowestPrice || null,
          deliveryCharge: null,
          totalPayable: null,
          bestStore: product.lowestStore || 'Verified Store',
          offerUrl: null,
          isTotalVerified: false
        };
      }

      // Evaluate each offer for verified total payable = price + deliveryCharge
      const parsedOffers = offers.map(o => {
        const price = typeof o.price === 'number' ? o.price : Number(o.price);
        const hasDelivery = o.deliveryCharge !== undefined && o.deliveryCharge !== null && !isNaN(Number(o.deliveryCharge));
        const delivery = hasDelivery ? Number(o.deliveryCharge) : null;
        const total = hasDelivery ? price + delivery : null;
        return {
          ...o,
          parsedPrice: price,
          parsedDelivery: delivery,
          parsedTotal: total
        };
      });

      // Find offer with lowest total cost, or fallback to lowest price
      const validTotals = parsedOffers.filter(o => o.parsedTotal !== null);
      if (validTotals.length > 0) {
        validTotals.sort((a, b) => a.parsedTotal - b.parsedTotal);
        const best = validTotals[0];
        return {
          product,
          lowestStorePrice: best.parsedPrice,
          deliveryCharge: best.parsedDelivery,
          totalPayable: best.parsedTotal,
          bestStore: best.store || product.lowestStore || 'Verified Store',
          offerUrl: best.url || null,
          isTotalVerified: true
        };
      }

      // If no delivery charges available
      parsedOffers.sort((a, b) => a.parsedPrice - b.parsedPrice);
      const best = parsedOffers[0];
      return {
        product,
        lowestStorePrice: best.parsedPrice,
        deliveryCharge: null,
        totalPayable: null,
        bestStore: best.store || product.lowestStore || 'Verified Store',
        offerUrl: best.url || null,
        isTotalVerified: false
      };
    });
  }, [compareList]);

  // Identify lowest verified total across all products
  const lowestVerifiedTotal = useMemo(() => {
    const totals = productPriceMetrics
      .filter(m => m.isTotalVerified && m.totalPayable !== null)
      .map(m => m.totalPayable);
    if (totals.length === 0) return null;
    return Math.min(...totals);
  }, [productPriceMetrics]);

  // Unified list of specification keys present in the compared products
  const availableSpecKeys = useMemo(() => {
    const keySet = new Set();
    compareList.forEach(p => {
      if (p.specs && typeof p.specs === 'object') {
        Object.keys(p.specs).forEach(k => keySet.add(k));
      }
    });
    return Array.from(keySet);
  }, [compareList]);

  // Smart Value Score ranking
  const svsRankings = useMemo(() => {
    const sorted = [...compareList].sort((a, b) => {
      const scoreA = a.smartValueScore?.score || 0;
      const scoreB = b.smartValueScore?.score || 0;
      return scoreB - scoreA;
    });

    const rankMap = {};
    sorted.forEach((p, idx) => {
      rankMap[p.id] = idx + 1;
    });
    return rankMap;
  }, [compareList]);

  // Data-backed reason for Smart Value Score
  const getSvsReason = useCallback((product, rank) => {
    if (!product.smartValueScore?.score) return 'Smart Value Score unavailable for this item.';
    
    // Check if concise explanation exists on product
    if (product.smartValueScore?.explanation && product.smartValueScore.explanation.length < 90) {
      return product.smartValueScore.explanation;
    }

    const isLowestPrice = compareList.every(p => (product.lowestPrice || 0) <= (p.lowestPrice || Infinity));
    const isHighestRating = compareList.every(p => (product.rating || 0) >= (p.rating || 0));
    const isHighestTrust = compareList.every(p => (product.reviewTrustScore?.score || 0) >= (p.reviewTrustScore?.score || 0));

    if (rank === 1 && isLowestPrice && (product.rating || 0) >= 4.0) {
      return 'Lower price with strong customer ratings.';
    }
    if (isHighestTrust && (product.rating || 0) >= 4.0) {
      return 'Higher review trust at a competitive price.';
    }
    if (rank === 1) {
      return 'Best overall balance of price and rating.';
    }
    if (isLowestPrice) {
      return 'Lowest purchase price among compared items.';
    }
    if (isHighestRating) {
      return 'Highest rating from verified customer reviews.';
    }
    return 'Balanced pricing with dependable hardware specifications.';
  }, [compareList]);

  // Filter catalog products for the Add Product modal
  const modalCatalogProducts = useMemo(() => {
    return allProducts.filter(p => {
      // Search filter
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBrand) return false;
      }
      // Category filter
      if (modalCategory !== 'All') {
        const cat = (p.category || '').toLowerCase();
        const target = modalCategory.toLowerCase();
        if (target === 'electronics') {
          if (!['electronics', 'mobiles', 'laptops', 'headphones', 'smart watches'].includes(cat)) return false;
        } else if (target === 'fashion') {
          if (!['fashion', 'apparel', 'clothing', 'shoes'].includes(cat)) return false;
        } else if (target === 'home & kitchen') {
          if (!['home', 'kitchen', 'home & kitchen', 'appliances'].includes(cat)) return false;
        } else if (target === 'sports & fitness') {
          if (!['sports & fitness', 'sports', 'fitness', 'smart watches'].includes(cat)) return false;
        } else if (target === 'beauty & skincare') {
          if (!['beauty & skincare', 'beauty', 'skincare', 'cosmetics'].includes(cat)) return false;
        } else if (target === 'books & stationery') {
          if (!['books & stationery', 'books', 'stationery'].includes(cat)) return false;
        } else if (cat !== target) {
          return false;
        }
      }
      return true;
    });
  }, [allProducts, modalSearch, modalCategory]);

  // Handle adding product from modal
  const handleAddProduct = (product) => {
    if (compareList.length >= 4) {
      showToast('You can compare a maximum of 4 products at once.', 'warning');
      return;
    }
    const added = addToCompare(product);
    if (added && compareList.length === 3) {
      setIsAddModalOpen(false);
    }
  };

  // Best Price item for Final Recommendation
  const bestPriceItem = useMemo(() => {
    if (compareList.length < 2) return null;
    const verifiedMetrics = productPriceMetrics.filter(m => m.totalPayable !== null);
    if (verifiedMetrics.length === 0) {
      // Fallback to lowestStorePrice
      const sorted = [...productPriceMetrics].sort((a, b) => (a.lowestStorePrice || Infinity) - (b.lowestStorePrice || Infinity));
      return sorted[0];
    }
    verifiedMetrics.sort((a, b) => a.totalPayable - b.totalPayable);
    return verifiedMetrics[0];
  }, [compareList, productPriceMetrics]);

  // Calculate savings for best price option
  const bestPriceSavings = useMemo(() => {
    if (!bestPriceItem || compareList.length < 2) return null;
    const otherPrices = productPriceMetrics
      .filter(m => m.product.id !== bestPriceItem.product.id)
      .map(m => m.totalPayable || m.lowestStorePrice)
      .filter(Boolean);
    if (otherPrices.length === 0) return null;
    const nextLowest = Math.min(...otherPrices);
    const itemPrice = bestPriceItem.totalPayable || bestPriceItem.lowestStorePrice;
    if (nextLowest > itemPrice) {
      return nextLowest - itemPrice;
    }
    return 0;
  }, [bestPriceItem, compareList, productPriceMetrics]);

  // Highest Rated item for Final Recommendation
  const highestRatedItem = useMemo(() => {
    if (compareList.length < 2) return null;
    const sorted = [...compareList].sort((a, b) => {
      const diff = (b.rating || 0) - (a.rating || 0);
      if (diff !== 0) return diff;
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
    return sorted[0];
  }, [compareList]);

  // Best Smart Value item for Final Recommendation
  const bestSmartValueItem = useMemo(() => {
    if (compareList.length < 2) return null;
    const withSvs = compareList.filter(p => p.smartValueScore?.score);
    if (withSvs.length === 0) return null;
    withSvs.sort((a, b) => (b.smartValueScore.score || 0) - (a.smartValueScore.score || 0));
    return withSvs[0];
  }, [compareList]);

  return (
    <div className="compare-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="compare-breadcrumbs" aria-label="Breadcrumb">
        <button onClick={navigateToHome} className="breadcrumb-link">Home</button>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">Compare</span>
      </nav>

      {/* 2. Page Header */}
      <header className="compare-header">
        <div className="compare-header-info">
          <div className="compare-title-row">
            <h1 className="compare-main-title">Compare Products</h1>
            {compareList.length > 0 && (
              <span className="compare-counter-badge" id="compare-product-count">
                {compareList.length} of 4 Products
              </span>
            )}
          </div>
          <p className="compare-subtitle">
            Compare prices, ratings, and value to find the right choice.
          </p>
        </div>

        <div className="compare-header-actions">
          <button
            type="button"
            id="open-add-product-modal-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-lavender compare-add-btn"
            disabled={compareList.length >= 4}
            title={compareList.length >= 4 ? "Maximum 4 products compared" : "Add product to comparison"}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>

          {compareList.length > 0 && (
            <button
              type="button"
              id="clear-all-comparison-btn"
              onClick={clearComparison}
              className="btn-secondary compare-clear-btn"
              title="Remove all products from comparison"
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </header>

      {/* Empty State: 0 Products Selected */}
      {compareList.length === 0 && (
        <section className="compare-empty-state clean-card" aria-label="Empty comparison list">
          <div className="compare-empty-icon-circle">
            <Scale size={36} color="var(--primary-lavender)" />
          </div>
          <h2 className="compare-empty-heading">No Products Selected</h2>
          <p className="compare-empty-text">
            Select 2 to 4 products from the ShopWise catalog to compare real-time prices across stores, technical specifications, and verified ratings side by side.
          </p>
          <div className="compare-empty-actions">
            <button
              type="button"
              id="empty-state-add-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-lavender"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
            <button
              type="button"
              id="empty-state-browse-btn"
              onClick={navigateToSearch}
              className="btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Explore Products</span>
            </button>
          </div>
        </section>
      )}

      {/* Partial State: 1 Product Selected Notice */}
      {compareList.length === 1 && (
        <aside className="compare-single-item-banner" role="status">
          <Info size={18} color="var(--primary-lavender)" style={{ flexShrink: 0 }} />
          <span>
            You have selected 1 product. Add at least one more product to unlock side-by-side pricing, store delivery comparison, and AI value analysis.
          </span>
        </aside>
      )}

      {/* Main Comparison Matrix Content (1 to 4 products) */}
      {compareList.length > 0 && (
        <div className="compare-matrix-wrapper">
          {/* 3. Selected Product Cards */}
          <section className="compare-cards-section" aria-label="Selected products summary">
            <div 
              className="compare-cards-grid" 
              style={{ 
                '--compare-cols': compareList.length === 1 ? 2 : compareList.length 
              }}
            >
              {compareList.map((product) => {
                const svsScore = product.smartValueScore?.score;
                const trustScore = product.reviewTrustScore?.score;
                const hasDiscount = product.basePrice && product.lowestPrice && product.basePrice > product.lowestPrice;
                const discountPct = hasDiscount ? Math.round(((product.basePrice - product.lowestPrice) / product.basePrice) * 100) : 0;

                return (
                  <article 
                    key={product.id} 
                    className="compare-product-card clean-card"
                    id={`compare-card-${product.id}`}
                  >
                    {/* Remove Action Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCompare(product.id)}
                      className="compare-card-remove-btn"
                      aria-label={`Remove ${product.name} from comparison`}
                      title="Remove product"
                    >
                      <X size={15} />
                    </button>

                    {/* Product Image */}
                    <div className="compare-card-image-box">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="compare-card-img"
                        loading="lazy"
                      />
                    </div>

                    {/* Brand & Category */}
                    <div className="compare-card-meta">
                      <span className="compare-card-brand">{product.brand || product.category}</span>
                      {product.specs?.model && (
                        <span className="compare-card-model">{product.specs.model}</span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h2 className="compare-card-title" title={product.name}>
                      {product.name}
                    </h2>

                    {/* Rating & Review Count */}
                    <div className="compare-card-rating-row">
                      <div className="compare-rating-pill">
                        <Star size={13} fill="#D97706" color="#D97706" />
                        <span>{product.rating ? Number(product.rating).toFixed(1) : '—'}</span>
                      </div>
                      <span className="compare-reviews-count">
                        {product.reviewCount ? `(${Number(product.reviewCount).toLocaleString()} reviews)` : '(No reviews)'}
                      </span>
                    </div>

                    {/* Best Price */}
                    <div className="compare-card-price-box">
                      <div className="compare-card-current-price">
                        {formatINR(product.lowestPrice)}
                      </div>
                      {hasDiscount && (
                        <div className="compare-card-mrp-row">
                          <span className="compare-card-mrp">{formatINR(product.basePrice)}</span>
                          <span className="compare-card-discount-tag">{discountPct}% OFF</span>
                        </div>
                      )}
                    </div>

                    {/* Trust Score & Smart Value Score Indicators */}
                    <div className="compare-card-badges-row">
                      {trustScore ? (
                        <span className="compare-badge trust-badge" title="Verified buyer review integrity">
                          <ShieldCheck size={13} />
                          <span>{trustScore}% Trust</span>
                        </span>
                      ) : (
                        <span className="compare-badge unavailable-badge">Trust: N/A</span>
                      )}

                      {svsScore ? (
                        <span className="compare-badge svs-badge" title="Comprehensive Smart Value Score">
                          <Sparkles size={13} />
                          <span>{svsScore}/100 SVS</span>
                        </span>
                      ) : (
                        <span className="compare-badge unavailable-badge">SVS: N/A</span>
                      )}
                    </div>

                    {/* Action: View Details */}
                    <div className="compare-card-actions">
                      <button
                        type="button"
                        onClick={() => navigateToProduct(product.id)}
                        className="btn-lavender compare-view-details-btn"
                        id={`view-details-${product.id}`}
                      >
                        <span>View Details</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* Slot placeholder if fewer than 4 products and exactly 1 product */}
              {compareList.length === 1 && (
                <div 
                  className="compare-add-slot-card"
                  onClick={() => setIsAddModalOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setIsAddModalOpen(true)}
                  aria-label="Add second product to compare"
                >
                  <div className="compare-add-slot-icon">
                    <Plus size={28} />
                  </div>
                  <span className="compare-add-slot-title">Add Product to Compare</span>
                  <span className="compare-add-slot-desc">Select an item from the catalog</span>
                </div>
              )}
            </div>
          </section>

          {/* 4. Price Comparison Section (Only when >= 2 items) */}
          {compareList.length >= 2 && (
            <section className="compare-section clean-card" aria-label="Price comparison details">
              <div className="compare-section-header">
                <div>
                  <h2 className="compare-section-title">Price Comparison</h2>
                  <p className="compare-section-subtitle">
                    Calculated verified total payable prices across partner stores (Product Price + Delivery Charge).
                  </p>
                </div>
              </div>

              <div 
                className="compare-price-grid"
                style={{ '--compare-cols': compareList.length }}
              >
                {productPriceMetrics.map(({ product, lowestStorePrice, deliveryCharge, totalPayable, bestStore, offerUrl, isTotalVerified }) => {
                  const isLowestTotal = lowestVerifiedTotal !== null && totalPayable === lowestVerifiedTotal;

                  return (
                    <div 
                      key={`price-${product.id}`}
                      className={`compare-price-card ${isLowestTotal ? 'lowest-total-highlight' : ''}`}
                    >
                      {/* Lowest Total Badge */}
                      {isLowestTotal && (
                        <div className="lowest-total-badge" id={`lowest-total-tag-${product.id}`}>
                          <Award size={13} />
                          <span>Lowest Total</span>
                        </div>
                      )}

                      <div className="compare-price-store-header">
                        <span className="compare-price-store-label">Lowest on</span>
                        <span className="compare-price-store-name">{bestStore}</span>
                      </div>

                      <div className="compare-price-breakdown-list">
                        {/* Store Product Price */}
                        <div className="compare-price-line">
                          <span className="line-label">Store Price</span>
                          <span className="line-val">
                            {lowestStorePrice !== null ? formatINR(lowestStorePrice) : 'Unavailable'}
                          </span>
                        </div>

                        {/* Delivery Charge */}
                        <div className="compare-price-line">
                          <span className="line-label">Delivery Charge</span>
                          <span className={`line-val ${deliveryCharge === 0 ? 'text-green' : ''}`}>
                            {deliveryCharge !== null 
                              ? (deliveryCharge === 0 ? 'Free Delivery' : formatINR(deliveryCharge))
                              : 'Unavailable'}
                          </span>
                        </div>

                        {/* Total Payable */}
                        <div className="compare-price-total-row">
                          <div className="total-label-box">
                            <span className="total-label">Total Payable</span>
                            <span className="total-formula">(Price + Delivery)</span>
                          </div>
                          <div className="total-val">
                            {totalPayable !== null ? formatINR(totalPayable) : 'Unavailable'}
                          </div>
                        </div>
                      </div>

                      {/* View Offer Action */}
                      <div className="compare-price-action-box">
                        {offerUrl ? (
                          <a
                            href={offerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-lavender compare-offer-link-btn"
                            id={`view-offer-${product.id}`}
                            aria-label={`View offer on ${bestStore} for ${product.name}`}
                          >
                            <span>View Offer on {bestStore}</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigateToProduct(product.id, 'prices')}
                            className="btn-secondary compare-offer-link-btn"
                          >
                            <span>Check All Stores</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Product Feature Comparison Table (Only when >= 2 items) */}
          {compareList.length >= 2 && (
            <section className="compare-section clean-card" aria-label="Feature and specification table">
              <div className="compare-section-header">
                <div>
                  <h2 className="compare-section-title">Feature & Specification Comparison</h2>
                  <p className="compare-section-subtitle">
                    Attribute-by-attribute comparison from verified store catalog records.
                  </p>
                </div>
              </div>

              <div className="compare-table-responsive-container">
                <table className="compare-spec-table" role="table">
                  <thead>
                    <tr>
                      <th className="spec-attr-col-header" scope="col">Attribute</th>
                      {compareList.map(p => (
                        <th key={`head-${p.id}`} className="spec-product-col-header" scope="col">
                          <div className="table-header-product-title">{p.name}</div>
                          <div className="table-header-product-price">{formatINR(p.lowestPrice)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Category */}
                    <tr>
                      <td className="spec-attr-name">Category</td>
                      {compareList.map(p => (
                        <td key={`cat-${p.id}`} className="spec-attr-val">
                          {p.category || '—'}
                        </td>
                      ))}
                    </tr>

                    {/* Brand */}
                    <tr>
                      <td className="spec-attr-name">Brand</td>
                      {compareList.map(p => (
                        <td key={`brand-${p.id}`} className="spec-attr-val">
                          <strong>{p.brand || '—'}</strong>
                        </td>
                      ))}
                    </tr>

                    {/* Star Rating */}
                    <tr>
                      <td className="spec-attr-name">Star Rating</td>
                      {compareList.map(p => (
                        <td key={`rating-${p.id}`} className="spec-attr-val">
                          <span className="spec-rating-badge">
                            <Star size={13} fill="#D97706" color="#D97706" />
                            <span>{p.rating ? Number(p.rating).toFixed(1) : '—'}</span>
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Review Count */}
                    <tr>
                      <td className="spec-attr-name">Review Count</td>
                      {compareList.map(p => (
                        <td key={`rev-${p.id}`} className="spec-attr-val">
                          {p.reviewCount ? Number(p.reviewCount).toLocaleString() : '—'}
                        </td>
                      ))}
                    </tr>

                    {/* Best Price */}
                    <tr>
                      <td className="spec-attr-name">Best Available Price</td>
                      {compareList.map(p => (
                        <td key={`bprice-${p.id}`} className="spec-attr-val text-bold">
                          {formatINR(p.lowestPrice)}
                        </td>
                      ))}
                    </tr>

                    {/* Review Trust Score */}
                    <tr>
                      <td className="spec-attr-name">Review Trust Score</td>
                      {compareList.map(p => (
                        <td key={`trust-${p.id}`} className="spec-attr-val">
                          {p.reviewTrustScore?.score ? (
                            <span className="text-green text-bold">
                              {p.reviewTrustScore.score}% Verified
                            </span>
                          ) : (
                            <span className="text-muted">Unavailable</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Smart Value Score */}
                    <tr>
                      <td className="spec-attr-name">Smart Value Score</td>
                      {compareList.map(p => (
                        <td key={`svs-row-${p.id}`} className="spec-attr-val">
                          {p.smartValueScore?.score ? (
                            <span className="text-lavender text-bold">
                              {p.smartValueScore.score}/100
                            </span>
                          ) : (
                            <span className="text-muted">Unavailable</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Historical Average Price */}
                    <tr>
                      <td className="spec-attr-name">Historical Average Price</td>
                      {compareList.map(p => (
                        <td key={`hist-avg-${p.id}`} className="spec-attr-val">
                          {p.priceAnalysis?.averagePrice 
                            ? formatINR(p.priceAnalysis.averagePrice) 
                            : 'Unavailable'}
                        </td>
                      ))}
                    </tr>

                    {/* Lowest Recorded Price */}
                    <tr>
                      <td className="spec-attr-name">Lowest Recorded Price</td>
                      {compareList.map(p => (
                        <td key={`all-time-${p.id}`} className="spec-attr-val">
                          {p.priceAnalysis?.allTimeLow 
                            ? formatINR(p.priceAnalysis.allTimeLow) 
                            : 'Unavailable'}
                        </td>
                      ))}
                    </tr>

                    {/* Dynamic Specifications from Product specs object */}
                    {availableSpecKeys.map(key => {
                      const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());

                      // Check if there is any difference across products
                      const values = compareList.map(p => p.specs?.[key] || '—');
                      const hasDifference = new Set(values).size > 1;

                      return (
                        <tr key={`spec-${key}`} className={hasDifference ? 'row-differentiated' : ''}>
                          <td className="spec-attr-name">
                            <span>{formattedKey}</span>
                            {hasDifference && <span className="diff-indicator" title="Values differ across products">•</span>}
                          </td>
                          {compareList.map(p => (
                            <td key={`spec-val-${p.id}-${key}`} className="spec-attr-val">
                              {p.specs?.[key] ? String(p.specs[key]) : '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 6. Smart Value Score Detailed Section (Only when >= 2 items) */}
          {compareList.length >= 2 && (
            <section className="compare-section clean-card" aria-label="Smart Value Score insights">
              <div className="compare-section-header">
                <div>
                  <h2 className="compare-section-title">Smart Value Score Analysis</h2>
                  <p className="compare-section-subtitle">
                    Objective composite metric weighing verified store price against customer ratings and review authenticity.
                  </p>
                </div>
              </div>

              <div 
                className="compare-svs-grid"
                style={{ '--compare-cols': compareList.length }}
              >
                {compareList.map(product => {
                  const score = product.smartValueScore?.score;
                  const rank = svsRankings[product.id] || 1;
                  const reason = getSvsReason(product, rank);

                  return (
                    <div key={`svs-card-${product.id}`} className="compare-svs-card">
                      <div className="svs-card-top">
                        <div className="svs-rank-badge">
                          Rank #{rank}
                        </div>
                        <div className="svs-score-display">
                          {score !== undefined ? (
                            <>
                              <span className="svs-score-num">{score}</span>
                              <span className="svs-score-denom">/100</span>
                            </>
                          ) : (
                            <span className="svs-score-na">Unavailable</span>
                          )}
                        </div>
                      </div>

                      <div className="svs-product-name">{product.name}</div>
                      
                      <p className="svs-reason-text">
                        "{reason}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 7. Final Recommendation ("Our Comparison Summary") */}
          {compareList.length >= 2 && (
            <section className="compare-section clean-card summary-card" aria-label="Our Comparison Summary">
              <div className="compare-section-header">
                <div>
                  <h2 className="compare-section-title">Our Comparison Summary</h2>
                  <p className="compare-section-subtitle">
                    Objective summary highlighting the standout choice for each key decision criteria.
                  </p>
                </div>
              </div>

              {/* 3 Structured Highlight Cards */}
              <div className="compare-summary-cards-grid">
                {/* 1. Best Price */}
                {bestPriceItem && (
                  <div className="summary-highlight-card">
                    <div className="summary-highlight-badge price-badge">
                      <TrendingDown size={14} />
                      <span>Best Price</span>
                    </div>
                    <h3 className="summary-card-product-title">{bestPriceItem.product.name}</h3>
                    <div className="summary-metric-val">
                      {bestPriceItem.totalPayable 
                        ? formatINR(bestPriceItem.totalPayable) 
                        : formatINR(bestPriceItem.lowestStorePrice)}
                    </div>
                    <p className="summary-card-desc">
                      Available on {bestPriceItem.bestStore}.
                      {bestPriceSavings > 0 
                        ? ` Saves ${formatINR(bestPriceSavings)} compared to the next lowest option.`
                        : ' Lowest verified price across all compared options.'}
                    </p>
                  </div>
                )}

                {/* 2. Highest-Rated Option */}
                {highestRatedItem && (
                  <div className="summary-highlight-card">
                    <div className="summary-highlight-badge rating-badge">
                      <Star size={14} fill="#D97706" color="#D97706" />
                      <span>Highest Rated</span>
                    </div>
                    <h3 className="summary-card-product-title">{highestRatedItem.name}</h3>
                    <div className="summary-metric-val">
                      {highestRatedItem.rating}★ Rating
                    </div>
                    <p className="summary-card-desc">
                      Verified by {Number(highestRatedItem.reviewCount).toLocaleString()} customers with strong overall satisfaction.
                    </p>
                  </div>
                )}

                {/* 3. Best Smart Value */}
                {bestSmartValueItem && (
                  <div className="summary-highlight-card">
                    <div className="summary-highlight-badge svs-badge-high">
                      <Sparkles size={14} />
                      <span>Best Smart Value</span>
                    </div>
                    <h3 className="summary-card-product-title">{bestSmartValueItem.name}</h3>
                    <div className="summary-metric-val">
                      {bestSmartValueItem.smartValueScore.score}/100 SVS
                    </div>
                    <p className="summary-card-desc">
                      {getSvsReason(bestSmartValueItem, 1)}
                    </p>
                  </div>
                )}
              </div>

              {/* AI Comparative Verdict Box */}
              {aiVerdict && (
                <div className="compare-verdict-callout">
                  <div className="verdict-callout-header">
                    <CheckCircle2 size={18} color="var(--primary-lavender)" />
                    <span className="verdict-callout-title">ShopWise Decision Guide</span>
                  </div>
                  <p className="verdict-callout-body">
                    {aiVerdict}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div 
          className="compare-modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-product-dialog-title"
        >
          <div 
            className="compare-modal-dialog clean-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="compare-modal-header">
              <div>
                <h3 id="add-product-dialog-title" className="compare-modal-title">
                  Add Product to Compare
                </h3>
                <p className="compare-modal-subtitle">
                  Search or select an item from our database ({compareList.length}/4 selected)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="compare-modal-close-btn"
                aria-label="Close add product modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="compare-modal-search-wrapper">
              <Search size={16} className="modal-search-icon" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search products by title or brand..."
                className="compare-modal-search-input"
                autoFocus
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="modal-search-clear"
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modal Category Filter Chips */}
            <div className="compare-modal-categories" role="tablist" aria-label="Filter by category">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setModalCategory(cat)}
                  className={`modal-category-chip ${modalCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product List */}
            <div className="compare-modal-product-list">
              {modalCatalogProducts.length === 0 ? (
                <div className="modal-no-results">
                  <AlertCircle size={28} color="var(--text-muted)" />
                  <p>No products match your current search.</p>
                  <button
                    type="button"
                    onClick={() => { setModalSearch(''); setModalCategory('All'); }}
                    className="btn-secondary"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                modalCatalogProducts.map(prod => {
                  const isAlreadyAdded = compareList.some(p => p.id === prod.id);
                  const isMaxReached = compareList.length >= 4;

                  return (
                    <div key={prod.id} className="modal-product-item">
                      <div className="modal-product-thumb">
                        <img src={prod.image} alt={prod.name} loading="lazy" />
                      </div>
                      <div className="modal-product-details">
                        <span className="modal-product-brand">{prod.brand}</span>
                        <h4 className="modal-product-name">{prod.name}</h4>
                        <div className="modal-product-meta-row">
                          <span className="modal-product-price">{formatINR(prod.lowestPrice)}</span>
                          <span className="modal-product-rating">
                            <Star size={12} fill="#D97706" color="#D97706" />
                            {prod.rating}
                          </span>
                        </div>
                      </div>
                      <div className="modal-product-action">
                        {isAlreadyAdded ? (
                          <button
                            type="button"
                            disabled
                            className="btn-secondary modal-add-btn added"
                          >
                            <Check size={14} />
                            <span>Added</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddProduct(prod)}
                            disabled={isMaxReached}
                            className="btn-lavender modal-add-btn"
                          >
                            <Plus size={14} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="compare-modal-footer">
              <span className="modal-footer-info">
                Comparing {compareList.length} of 4 maximum products
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn-lavender"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
