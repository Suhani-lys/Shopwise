import React, { useState, useEffect } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Star, 
  Check, 
  Sparkles,
  ChevronDown,
  Layers,
  Store,
  IndianRupee
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'All',
  'Electronics',
  'Fashion',
  'Beauty & Skincare',
  'Home & Kitchen',
  'Sports & Fitness',
  'Books & Stationery'
];

const PRICE_BRACKETS = [
  { label: 'All', min: 0, max: 200000 },
  { label: 'Under ₹25k', min: 0, max: 25000 },
  { label: '₹25k – ₹50k', min: 25000, max: 50000 },
  { label: '₹50k – ₹1L', min: 50000, max: 100000 },
  { label: 'Above ₹1L', min: 100000, max: 200000 }
];

const RATING_OPTIONS = [
  { label: 'Any Rating', value: 0 },
  { label: '4★ & above', value: 4 },
  { label: '3★ & above', value: 3 },
  { label: '2★ & above', value: 2 }
];

export default function FilterSidebar({ isMobileDrawer = false, isOpen = false, onClose = () => {} }) {
  const {
    selectedCategory,
    setSelectedCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minRating,
    setMinRating,
    selectedStore,
    setSelectedStore,
    availableStores,
    clearAllFilters,
    activeFiltersCount
  } = useShopwise();

  // Local draft state for filters
  const [draftCat, setDraftCat] = useState(selectedCategory);
  const [draftMinP, setDraftMinP] = useState(minPrice);
  const [draftMaxP, setDraftMaxP] = useState(maxPrice);
  const [draftRating, setDraftRating] = useState(minRating);
  const [draftStore, setDraftStore] = useState(selectedStore);

  // Sync draft with context whenever drawer opens or active filters change
  useEffect(() => {
    setDraftCat(selectedCategory);
    setDraftMinP(minPrice);
    setDraftMaxP(maxPrice);
    setDraftRating(minRating);
    setDraftStore(selectedStore);
  }, [selectedCategory, minPrice, maxPrice, minRating, selectedStore, isOpen]);

  // Handle ESC key for mobile drawer
  useEffect(() => {
    if (isMobileDrawer && isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileDrawer, isOpen, onClose]);

  const handleApply = () => {
    setSelectedCategory(draftCat);
    setMinPrice(draftMinP === '' ? 0 : Number(draftMinP));
    setMaxPrice(draftMaxP === '' ? 200000 : Number(draftMaxP));
    setMinRating(Number(draftRating));
    setSelectedStore(draftStore);
    if (isMobileDrawer) {
      onClose();
    }
  };

  const handleClear = () => {
    setDraftCat('All');
    setDraftMinP(0);
    setDraftMaxP(200000);
    setDraftRating(0);
    setDraftStore('All');
    clearAllFilters();
    if (isMobileDrawer) {
      onClose();
    }
  };

  const handleBracketSelect = (bracket) => {
    setDraftMinP(bracket.min);
    setDraftMaxP(bracket.max);
  };

  const filterContent = (
    <div className="filter-inner-content">
      {/* 1. Category Filter */}
      <div className="filter-group">
        <div className="filter-group-header">
          <Layers size={14} color="var(--primary-lavender)" />
          <span className="filter-group-title">Category</span>
        </div>
        <div className="filter-options-list">
          {CATEGORY_OPTIONS.map((cat) => {
            const isChecked = draftCat.toLowerCase() === cat.toLowerCase();
            return (
              <label 
                key={cat} 
                className={`filter-option-row ${isChecked ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="category_filter"
                  checked={isChecked}
                  onChange={() => setDraftCat(cat)}
                  style={{ accentColor: 'var(--primary-lavender)' }}
                />
                <span className="filter-option-label">{cat === 'All' ? 'All Categories' : cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="filter-divider" />

      {/* 2. Price Range Filter */}
      <div className="filter-group">
        <div className="filter-group-header">
          <IndianRupee size={14} color="var(--primary-lavender)" />
          <span className="filter-group-title">Price Range</span>
        </div>

        {/* Quick Brackets */}
        <div className="price-bracket-pills">
          {PRICE_BRACKETS.map((b) => {
            const isSelected = draftMinP === b.min && draftMaxP === b.max;
            return (
              <button
                key={b.label}
                type="button"
                onClick={() => handleBracketSelect(b)}
                className={`bracket-pill ${isSelected ? 'active' : ''}`}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min/Max Inputs */}
        <div className="price-inputs-row">
          <div className="price-input-wrapper">
            <span className="currency-prefix">₹</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={draftMinP === 0 ? '' : draftMinP}
              onChange={(e) => setDraftMinP(e.target.value === '' ? 0 : Number(e.target.value))}
              aria-label="Minimum price in rupees"
              className="price-field"
            />
          </div>
          <span className="price-separator">to</span>
          <div className="price-input-wrapper">
            <span className="currency-prefix">₹</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={draftMaxP === 200000 ? '' : draftMaxP}
              onChange={(e) => setDraftMaxP(e.target.value === '' ? 200000 : Number(e.target.value))}
              aria-label="Maximum price in rupees"
              className="price-field"
            />
          </div>
        </div>
      </div>

      <hr className="filter-divider" />

      {/* 3. Star Rating Filter */}
      <div className="filter-group">
        <div className="filter-group-header">
          <Star size={14} fill="#F59E0B" color="#F59E0B" />
          <span className="filter-group-title">Customer Rating</span>
        </div>
        <div className="filter-options-list">
          {RATING_OPTIONS.map((rate) => {
            const isChecked = Number(draftRating) === rate.value;
            return (
              <label 
                key={rate.value} 
                className={`filter-option-row ${isChecked ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="rating_filter"
                  checked={isChecked}
                  onChange={() => setDraftRating(rate.value)}
                  style={{ accentColor: 'var(--primary-lavender)' }}
                />
                <span className="filter-option-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {rate.value > 0 ? (
                    <>
                      <span>{rate.value}★</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>& above</span>
                    </>
                  ) : (
                    <span>Any Rating</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="filter-divider" />

      {/* 4. Store Filter (supported by real data) */}
      <div className="filter-group">
        <div className="filter-group-header">
          <Store size={14} color="var(--primary-lavender)" />
          <span className="filter-group-title">Store</span>
        </div>
        <div className="filter-options-list">
          <label className={`filter-option-row ${draftStore === 'All' ? 'active' : ''}`}>
            <input
              type="radio"
              name="store_filter"
              checked={draftStore === 'All'}
              onChange={() => setDraftStore('All')}
              style={{ accentColor: 'var(--primary-lavender)' }}
            />
            <span className="filter-option-label">All Stores</span>
          </label>
          {availableStores.map((st) => {
            const isChecked = draftStore.toLowerCase() === st.toLowerCase();
            return (
              <label 
                key={st} 
                className={`filter-option-row ${isChecked ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="store_filter"
                  checked={isChecked}
                  onChange={() => setDraftStore(st)}
                  style={{ accentColor: 'var(--primary-lavender)' }}
                />
                <span className="filter-option-label">{st}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: Apply & Clear All */}
      <div className="filter-actions-area">
        <button
          type="button"
          onClick={handleApply}
          className="btn-lavender"
          style={{ width: '100%', padding: '10px' }}
        >
          <Check size={15} />
          <span>Apply Filters</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="btn-ghost"
          style={{ width: '100%', padding: '8px' }}
        >
          <RotateCcw size={13} />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );

  // If Mobile Drawer Mode
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div 
        className="filter-drawer-overlay" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products drawer"
      >
        <div 
          className="filter-drawer-panel" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="filter-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="var(--primary-lavender)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Filter Products
              </h3>
              {activeFiltersCount > 0 && (
                <span className="badge-count">{activeFiltersCount}</span>
              )}
            </div>
            <button 
              type="button" 
              onClick={onClose}
              aria-label="Close filters drawer"
              className="btn-close-drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="filter-drawer-body">
            {filterContent}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Sidebar Mode
  return (
    <aside className="filter-sidebar-desktop clean-card" aria-label="Product filters">
      <div className="filter-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} color="var(--primary-lavender)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Filters
          </h2>
        </div>
        {activeFiltersCount > 0 && (
          <span className="badge-count" title={`${activeFiltersCount} active filters`}>
            {activeFiltersCount} active
          </span>
        )}
      </div>

      {filterContent}
    </aside>
  );
}
