import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import ProductCard from './ProductCard';
import { PackageSearch, ArrowRight, RotateCcw } from 'lucide-react';

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

  const handleViewAll = (e) => {
    e.preventDefault();
    navigateToSearch({ category: 'All', query: '' });
  };

  const isFiltered = (selectedCategory && selectedCategory !== 'All') || Boolean(searchQuery);

  return (
    <section id="trending-deals" style={{ padding: '20px 0 48px 0' }}>
      <div className="content-wrapper">
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em'
            }}>
              {selectedCategory && selectedCategory !== 'All' 
                ? `Trending Deals in ${selectedCategory}` 
                : 'Trending Deals'}
            </h2>
            {searchQuery && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
        ) : products.length === 0 ? (
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
          /* Responsive Product Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '16px'
          }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
