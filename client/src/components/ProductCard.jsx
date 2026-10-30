import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { Star, Heart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { setActiveModalProduct, compareList, toggleCompare, navigateToProduct } = useShopwise();
  const [imageError, setImageError] = useState(false);

  const isSaved = compareList.some(p => p.id === product.id);

  // Format currency in Indian numbering system
  const formatPrice = (val) => {
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Determine exactly ONE evidence-backed badge
  let badgeText = null;
  let badgeClass = 'deal-badge best-price';

  if (product.priceAnalysis?.isGenuineDiscount) {
    badgeText = product.priceAnalysis.allTimeLow && product.lowestPrice <= product.priceAnalysis.allTimeLow 
      ? 'All-Time Low' 
      : 'Genuine Deal';
    badgeClass = 'deal-badge price-drop';
  } else if (product.smartValueScore?.score >= 90) {
    badgeText = 'Top Value';
    badgeClass = 'deal-badge best-value';
  } else if (product.basePrice > product.lowestPrice && ((product.basePrice - product.lowestPrice) / product.basePrice) >= 0.15) {
    const disc = Math.round(((product.basePrice - product.lowestPrice) / product.basePrice) * 100);
    badgeText = `${disc}% OFF`;
    badgeClass = 'deal-badge best-price';
  }

  const bestStore = product.lowestStore || product.offers?.[0]?.store || 'Best Deal';

  return (
    <div
      onClick={() => navigateToProduct(product.id)}
      className="clean-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        position: 'relative'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToProduct(product.id);
        }
      }}
    >
      {/* Top Media Container */}
      <div style={{
        position: 'relative',
        height: '150px',
        backgroundColor: 'var(--bg-card-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}>
        {/* Exactly ONE relevant badge */}
        <span
          className={badgeClass}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 2
          }}
        >
          {badgeText}
        </span>

        {/* Wishlist / Save toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(product);
          }}
          title={isSaved ? "Saved" : "Save item"}
          aria-label={isSaved ? "Remove from saved items" : "Save item"}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSaved ? 'var(--primary-lavender)' : 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 2,
            transition: 'color var(--transition-fast), transform var(--transition-fast)'
          }}
        >
          <Heart size={14} fill={isSaved ? "var(--primary-lavender)" : "none"} />
        </button>

        {/* Product Image */}
        <img
          src={imageError ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' : product.image}
          alt={product.name}
          onError={() => setImageError(true)}
          loading="lazy"
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Card Body */}
      <div style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1
      }}>
        <div>
          {/* Product Name (Clean 2-line clamp) */}
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '2.8em'
          }}>
            {product.name}
          </h3>

          {/* Star Rating */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.8rem',
            marginBottom: '10px'
          }}>
            {product.rating ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                {Number(product.rating).toFixed(1)}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Unrated
              </span>
            )}
            {product.reviewCount ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                ({Number(product.reviewCount).toLocaleString()})
              </span>
            ) : null}
          </div>
        </div>

        {/* Pricing Area & View Details Action */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '10px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                {formatPrice(product.lowestPrice)}
              </span>
              {product.basePrice && product.basePrice > product.lowestPrice && (
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textDecoration: 'line-through'
                }}>
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>on <strong>{bestStore}</strong></span>
              {Array.isArray(product.offers) && product.offers.length > 1 && (
                <span style={{
                  color: 'var(--primary-lavender)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  backgroundColor: 'var(--primary-light)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  +{product.offers.length - 1} stores
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToProduct(product.id);
            }}
            className="btn-view-details"
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--primary-lavender)',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
            aria-label={`View details for ${product.name}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
