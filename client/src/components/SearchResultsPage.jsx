import React, { useState } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import FilterSidebar from './FilterSidebar';
import ProductCard from './ProductCard';
import { 
  ArrowLeft, 
  SlidersHorizontal, 
  ArrowUpDown, 
  PackageSearch, 
  AlertTriangle, 
  RotateCcw, 
  Search,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Lowest Price', value: 'priceAsc' },
  { label: 'Highest Price', value: 'priceDesc' },
  { label: 'Highest Rated', value: 'ratingDesc' },
  { label: 'Best Value', value: 'smartValue' }
];

export default function SearchResultsPage() {
  const { 
    products, 
    loading, 
    apiError,
    refreshCatalog,
    searchQuery, 
    setSearchQuery,
    selectedCategory, 
    clearAllFilters,
    activeFiltersCount,
    sortBy, 
    setSortBy,
    navigateToHome
  } = useShopwise();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Focus the search input in the header
  const handleEditSearch = () => {
    const input = document.getElementById('main-search-input');
    if (input) {
      input.focus();
      input.select();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const actualCount = products.length;

  return (
    <div className="search-results-page">
      <div className="content-wrapper">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="search-breadcrumb">
          <button 
            type="button" 
            onClick={navigateToHome}
            className="breadcrumb-back-btn"
            aria-label="Back to home page"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">Search Results</span>
          {selectedCategory && selectedCategory !== 'All' && (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-current-cat">{selectedCategory}</span>
            </>
          )}
        </nav>

        {/* Section 3: Results Heading */}
        <div className="search-results-header">
          <div className="search-results-heading-text">
            <h1 className="search-results-title">Search Results</h1>
            <p className="search-results-subtitle">Compare prices and find the best deal.</p>
          </div>

          <div className="search-results-meta">
            {searchQuery ? (
              <p className="search-query-badge">
                Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo; &bull;{' '}
                <span className="results-count-number">{actualCount}</span> {actualCount === 1 ? 'product' : 'products'} found
              </p>
            ) : (
              <p className="search-query-badge">
                <span className="results-count-number">{actualCount}</span> {actualCount === 1 ? 'product' : 'products'} found
                {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Main Content Layout: Filters on Left, Product Results on Right */}
        <div className="search-results-layout">
          {/* Desktop Filter Panel on Left */}
          <FilterSidebar />

          {/* Right: Results Section */}
          <div className="search-results-main">
            {/* Sorting & Filter Trigger Bar above Product Grid */}
            <div className="search-controls-bar clean-card">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="btn-mobile-filter"
                aria-label="Open filter options"
              >
                <SlidersHorizontal size={15} color="var(--primary-lavender)" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="badge-count">{activeFiltersCount}</span>
                )}
              </button>

              {/* Active Filter Pills Summary */}
              <div className="active-filters-summary">
                {activeFiltersCount > 0 ? (
                  <button 
                    type="button" 
                    onClick={clearAllFilters}
                    className="clear-summary-btn"
                    title="Reset all active filters"
                  >
                    <span>{activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}</span>
                    <RotateCcw size={12} />
                  </button>
                ) : (
                  <span className="showing-count-text">
                    Showing <strong>{actualCount}</strong> {actualCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Section 5: Sorting Dropdown */}
              <div className="sort-selector-wrapper">
                <ArrowUpDown size={14} color="var(--primary-lavender)" />
                <label htmlFor="search-sort-select" className="sort-label">Sort by:</label>
                <select
                  id="search-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown"
                  aria-label="Sort products by"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 8: UI States (Loading, Error, Empty, and Results Grid) */}
            {loading ? (
              /* Loading Skeleton State */
              <div className="search-products-grid" aria-busy="true" aria-label="Loading search results">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="clean-card skeleton-card">
                    <div className="skeleton-media skeleton-pulse" />
                    <div className="skeleton-body">
                      <div className="skeleton-line skeleton-pulse" style={{ width: '85%' }} />
                      <div className="skeleton-line skeleton-pulse" style={{ width: '55%' }} />
                      <div className="skeleton-line skeleton-pulse" style={{ width: '70%', marginTop: 'auto' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : apiError ? (
              /* Search API Error State */
              <div className="search-state-card clean-card" role="alert">
                <div className="state-icon-circle error">
                  <AlertTriangle size={28} />
                </div>
                <h2 className="state-card-title">Search API Error</h2>
                <p className="state-card-description">
                  {apiError || 'Failed to connect to the product search service. Please check your connection and retry.'}
                </p>
                <button
                  type="button"
                  onClick={refreshCatalog}
                  className="btn-lavender"
                >
                  <RotateCcw size={14} />
                  <span>Retry Search</span>
                </button>
              </div>
            ) : products.length === 0 ? (
              /* Empty Search State */
              <div className="search-state-card clean-card" role="status">
                <div className="state-icon-circle">
                  <PackageSearch size={30} />
                </div>
                <h2 className="state-card-title">No products found</h2>
                <p className="state-card-description">
                  Try another search or adjust your filters.
                </p>
                <div className="state-card-actions">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="btn-lavender"
                  >
                    <RotateCcw size={14} />
                    <span>Clear All Filters</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSearch}
                    className="btn-secondary"
                  >
                    <Search size={14} />
                    <span>Edit Search Query</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Section 6: Responsive Product Grid */
              <div className="search-products-grid" aria-label="Search results products">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Accessible Filter Drawer */}
        <FilterSidebar
          isMobileDrawer={true}
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
      </div>
    </div>
  );
}
