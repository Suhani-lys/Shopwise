import React, { useState, useEffect } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import ProductCard from './ProductCard';
import { PackageSearch, ArrowRight, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export default function TrendingDealsSection() {
  const { 
    products, 
    loading, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery,
    navigateToSearch 
  } = useShopwise();

  // Configurable homepage display limit (starts at 12 products)
  const [displayLimit, setDisplayLimit] = useState(12);

  // Reset display limit when category or search changes
  useEffect(() => {
    setDisplayLimit(12);
  }, [selectedCategory, searchQuery]);

  const handleViewAll = (e) => {
    e.preventDefault();
    navigateToSearch({ category: 'All', query: '' });
  };

  const isFiltered = (selectedCategory && selectedCategory !== 'All') || Boolean(searchQuery);
  const totalCount = products.length;
  const visibleProducts = products.slice(0, displayLimit);

  return (
    <section id="trending-deals" style={{ padding: '20px 0 48px 0' }}>
      <div className="content-wrapper">
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.015em',
                margin: 0
              }}>
                {selectedCategory && selectedCategory !== 'All' 
                  ? `Trending Deals in ${selectedCategory}` 
                  : 'Trending Deals'}
              </h2>
              {totalCount > 0 && !loading && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-lavender)',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  Showing {visibleProducts.length} of {totalCount} Deals
                </span>
              )}
            </div>
            {searchQuery && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Showing search results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </p>
            )}
          </div>

          <button
            onClick={handleViewAll}
            className="btn-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary-lavender)',
              cursor: 'pointer'
            }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Loading State: Skeletons matching ProductCard */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '16px'
          }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="clean-card"
                style={{
                  height: '280px',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{
                  height: '140px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }} />
                <div style={{ height: '14px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', width: '80%' }} />
                <div style={{ height: '14px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', width: '50%' }} />
                <div style={{ height: '20px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '4px', marginTop: 'auto', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : totalCount === 0 ? (
          /* Polished Empty State */
          <div className="clean-card" style={{
            textAlign: 'center',
            padding: '48px 20px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <PackageSearch size={26} />
            </div>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              No products found
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              maxWidth: '380px',
              margin: '0 auto 18px auto',
              lineHeight: 1.5
            }}>
              {searchQuery
                ? `We couldn't find any items matching "${searchQuery}". Check the spelling or try a different keyword.`
                : 'There are currently no products available under this category.'}
            </p>
            {isFiltered && (
              <button
                onClick={handleViewAll}
                className="btn-lavender"
                style={{ fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <RotateCcw size={14} />
                <span>Reset Filters & View All</span>
              </button>
            )}
          </div>
        ) : (
          /* Responsive Product Grid with configurable display limit */
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '16px'
            }}>
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Configurable Load More / Pagination Controls */}
            {totalCount > 12 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '32px',
                flexWrap: 'wrap'
              }}>
                {displayLimit < totalCount ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDisplayLimit(prev => Math.min(prev + 12, totalCount))}
                      className="btn-lavender"
                      style={{
                        padding: '10px 22px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ChevronDown size={16} />
                      <span>Load More Deals ({totalCount - displayLimit} remaining)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayLimit(totalCount)}
                      className="btn-secondary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>Show All ({totalCount})</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayLimit(12);
                      const el = document.getElementById('trending-deals');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ChevronUp size={15} />
                    <span>Show Fewer Deals</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
