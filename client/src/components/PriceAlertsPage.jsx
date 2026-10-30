import React, { useState, useMemo } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  Bell, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  X, 
  ExternalLink, 
  TrendingDown, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Info,
  Check,
  ShoppingBag
} from 'lucide-react';

export default function PriceAlertsPage() {
  const { 
    alerts, 
    alertsLoading, 
    alertsError, 
    fetchAlerts, 
    createAlert, 
    updateAlert, 
    deleteAlert, 
    allProducts, 
    navigateToProduct, 
    navigateToSearch, 
    navigateToHome,
    showToast,
    currentUser,
    navigateToLogin,
    navigateToSignUp
  } = useShopwise();

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [deletingAlert, setDeletingAlert] = useState(null);

  // Create Form State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (currentUser?.email) {
      setEmailInput(currentUser.email);
    }
  }, [currentUser]);

  // Edit Form State
  const [editTargetInput, setEditTargetInput] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  // Delete Progress State
  const [isDeletingSubmitting, setIsDeletingSubmitting] = useState(false);

  // Format currency
  const formatINR = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return 'Unavailable';
    return '₹' + Number(val).toLocaleString('en-IN');
  };

  // Section 3: Savings Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter(a => a.status === 'Active').length;
    const reached = alerts.filter(a => a.status === 'Triggered').length;

    // Price Drops: alerts where current price has dropped below target price or is triggered
    const priceDrops = alerts.filter(a => {
      if (a.status === 'Triggered') return true;
      if (a.currentLowestPrice && a.targetPrice && a.currentLowestPrice <= a.targetPrice) return true;
      return false;
    }).length;

    return { total, active, priceDrops, reached };
  }, [alerts]);

  // Separate Active and Triggered Alerts
  const activeAlerts = useMemo(() => {
    return alerts.filter(a => a.status === 'Active');
  }, [alerts]);

  const triggeredAlerts = useMemo(() => {
    return alerts.filter(a => a.status === 'Triggered');
  }, [alerts]);

  // Filter catalog products for modal selector
  const searchedProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 8);
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const brandMatch = (p.brand || '').toLowerCase().includes(q);
      const catMatch = (p.category || '').toLowerCase().includes(q);
      return nameMatch || brandMatch || catMatch;
    }).slice(0, 10);
  }, [allProducts, productSearch]);

  // Reset Create Form
  const resetCreateForm = () => {
    setSelectedProduct(null);
    setProductSearch('');
    setTargetPriceInput('');
    setEmailInput(currentUser?.email || '');
    setFormError('');
    setIsSubmitting(false);
  };

  // Open Create Modal
  const handleOpenCreateModal = (preselected = null) => {
    if (!currentUser) {
      navigateToLogin({ action: 'viewAlerts', returnView: 'alerts' });
      return;
    }
    resetCreateForm();
    if (preselected) {
      setSelectedProduct(preselected);
      const current = preselected.lowestPrice || 0;
      setTargetPriceInput(current > 0 ? Math.round(current * 0.95).toString() : '');
    }
    setIsCreateModalOpen(true);
  };

  // Handle Product Select in Modal
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch('');
    const current = product.lowestPrice || 0;
    if (current > 0) {
      setTargetPriceInput(Math.round(current * 0.95).toString());
    }
    setFormError('');
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedProduct) {
      setFormError('Please select a product to monitor.');
      return;
    }

    const priceNum = parseFloat(targetPriceInput);
    if (!targetPriceInput || isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid target price greater than ₹0.');
      return;
    }

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setFormError('Please enter a valid notification email.');
      return;
    }

    setIsSubmitting(true);
    const result = await createAlert(selectedProduct.id, priceNum, emailInput.trim());
    setIsSubmitting(false);

    if (result && result.success) {
      setIsCreateModalOpen(false);
      resetCreateForm();
    } else {
      setFormError(result?.message || 'Failed to create price alert on server.');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (alert) => {
    setEditingAlert(alert);
    setEditTargetInput(alert.targetPrice ? alert.targetPrice.toString() : '');
    setEditFormError('');
    setIsEditingSubmitting(false);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    const priceNum = parseFloat(editTargetInput);
    if (!editTargetInput || isNaN(priceNum) || priceNum <= 0) {
      setEditFormError('Please enter a valid target price greater than ₹0.');
      return;
    }

    setIsEditingSubmitting(true);
    const result = await updateAlert(editingAlert.id, priceNum, editingAlert.userEmail);
    setIsEditingSubmitting(false);

    if (result && result.success) {
      setEditingAlert(null);
    } else {
      setEditFormError(result?.message || 'Failed to update alert on server.');
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (alert) => {
    setDeletingAlert(alert);
    setIsDeletingSubmitting(false);
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingAlert) return;
    setIsDeletingSubmitting(true);
    await deleteAlert(deletingAlert.id);
    setIsDeletingSubmitting(false);
    setDeletingAlert(null);
  };

  return (
    <div className="alerts-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="alerts-breadcrumbs" aria-label="Breadcrumb">
        <button onClick={navigateToHome} className="breadcrumb-link">Home</button>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-current">Price Alerts</span>
      </nav>

      {/* 2. Page Header */}
      <header className="alerts-header">
        <div className="alerts-header-info">
          <div className="alerts-title-row">
            <h1 className="alerts-main-title">Price Alerts</h1>
            <span className="alerts-counter-badge" id="alerts-count-badge">
              {alerts.length} Tracked
            </span>
          </div>
          <p className="alerts-subtitle">
            Set your target price and we'll help you track the deal.
          </p>
        </div>

        <div className="alerts-header-actions">
          <button
            type="button"
            id="refresh-alerts-btn"
            onClick={fetchAlerts}
            className="btn-secondary alerts-refresh-btn"
            title="Refresh alerts from server"
            disabled={alertsLoading}
          >
            <RefreshCw size={15} className={alertsLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            id="open-create-alert-modal-btn"
            onClick={() => handleOpenCreateModal()}
            className="btn-lavender alerts-create-btn"
          >
            <Plus size={16} />
            <span>Create Price Alert</span>
          </button>
        </div>
      </header>

      {/* Backend Monitoring Notice */}
      <div className="alerts-transparency-banner">
        <Info size={16} color="var(--primary-lavender)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className="transparency-banner-text">
          <strong>Autonomous Price Drop Tracker:</strong> ShopWise tracks genuine price points across Flipkart, Amazon, and retail partners. Target thresholds are logged and verified.
        </div>
      </div>

      {/* Error State Banner */}
      {alertsError && (
        <div className="alerts-error-banner" role="alert">
          <AlertCircle size={18} color="var(--accent-rose)" />
          <span>{alertsError}</span>
          <button type="button" onClick={fetchAlerts} className="btn-secondary error-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* If Logged Out: Authentication Callout Card */}
      {!currentUser ? (
        <section className="clean-card" style={{
          textAlign: 'center',
          padding: '48px 24px',
          margin: '24px 0',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-lavender)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Bell size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>
            Sign In to Track Prices & Manage Alerts
          </h2>
          <p style={{ maxWidth: '480px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Log in or create a free ShopWise account to track live price drops on Amazon, Flipkart, and Croma. Your alerts will be saved securely across all your devices.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => navigateToLogin({ action: 'viewAlerts', returnView: 'alerts' })}
              className="btn-lavender"
              style={{ padding: '10px 22px', fontSize: '0.92rem' }}
            >
              <span>Login to Your Account</span>
            </button>
            <button
              onClick={() => navigateToSignUp({ action: 'viewAlerts', returnView: 'alerts' })}
              className="btn-secondary"
              style={{ padding: '10px 22px', fontSize: '0.92rem' }}
            >
              <span>Create Free Account</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* 3. Savings Summary: 3 Compact Cards */}
          <section className="alerts-summary-grid" aria-label="Alerts summary statistics">
        {/* Active Alerts */}
        <div className="alert-stat-card clean-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Alerts</span>
            <div className="stat-icon-circle lavender">
              <Bell size={16} />
            </div>
          </div>
          <div className="stat-card-value" id="stat-active-alerts">
            {summaryMetrics.active}
          </div>
          <div className="stat-card-subtext">Currently monitored items</div>
        </div>

        {/* Price Drops */}
        <div className="alert-stat-card clean-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Price Drops</span>
            <div className="stat-icon-circle green">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="stat-card-value text-green" id="stat-price-drops">
            {summaryMetrics.priceDrops}
          </div>
          <div className="stat-card-subtext">Items at or below target</div>
        </div>

        {/* Alerts Reached */}
        <div className="alert-stat-card clean-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Alerts Reached</span>
            <div className="stat-icon-circle amber">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-card-value" id="stat-alerts-reached">
            {summaryMetrics.reached}
          </div>
          <div className="stat-card-subtext">Deals verified & ready</div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {alertsLoading && alerts.length === 0 && (
        <div className="alerts-loading-skeleton">
          <div className="skeleton-card skeleton-pulse" />
          <div className="skeleton-card skeleton-pulse" />
        </div>
      )}

      {/* 8. Helpful Empty State: 0 Alerts */}
      {!alertsLoading && alerts.length === 0 && (
        <section className="alerts-empty-state clean-card" aria-label="No price alerts">
          <div className="alerts-empty-icon-circle">
            <Bell size={36} color="var(--primary-lavender)" />
          </div>
          <h2 className="alerts-empty-heading">No price alerts yet</h2>
          <p className="alerts-empty-text">
            Track a product and we'll help you spot the right time to buy.
          </p>
          <div className="alerts-empty-actions">
            <button
              type="button"
              id="empty-find-products-btn"
              onClick={navigateToSearch}
              className="btn-lavender"
            >
              <Search size={16} />
              <span>Find Products</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="btn-secondary"
            >
              <Plus size={16} />
              <span>Create Alert</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. Active Alerts ("Your Tracked Products") */}
      {activeAlerts.length > 0 && (
        <section className="alerts-section" aria-label="Your Tracked Products">
          <div className="alerts-section-header">
            <div>
              <h2 className="alerts-section-title">Your Tracked Products</h2>
              <p className="alerts-section-subtitle">
                Active alerts with live price monitoring and drop distance calculations.
              </p>
            </div>
            <span className="section-badge-pill">{activeAlerts.length} Active</span>
          </div>

          <div className="alerts-cards-grid">
            {activeAlerts.map((alert) => {
              const currentPrice = Number(alert.currentLowestPrice) || 0;
              const targetPrice = Number(alert.targetPrice) || 0;
              const diff = currentPrice - targetPrice;
              const diffPercent = currentPrice > 0 ? ((diff / currentPrice) * 100).toFixed(1) : 0;
              
              // Mathematically sound progress indicator:
              // How close target is relative to current price (percentage)
              const proximityPercent = currentPrice > 0 
                ? Math.min(100, Math.max(10, Math.round((targetPrice / currentPrice) * 100))) 
                : 100;

              // Format human-readable date
              const createdDate = alert.createdAt 
                ? new Date(alert.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently';

              return (
                <article key={alert.id} className="alert-item-card clean-card" id={`alert-card-${alert.id}`}>
                  {/* Card Header: Status & Actions */}
                  <div className="alert-card-header">
                    <span className="alert-status-pill active" title="Monitoring real-time store prices">
                      <Clock size={12} />
                      <span>Active</span>
                    </span>

                    <div className="alert-card-action-btns">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(alert)}
                        className="alert-icon-btn edit-btn"
                        title="Edit target price"
                        aria-label={`Edit target price for ${alert.productName}`}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(alert)}
                        className="alert-icon-btn delete-btn"
                        title="Delete alert"
                        aria-label={`Delete price alert for ${alert.productName}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Product Details Row */}
                  <div className="alert-card-product-row">
                    <div 
                      className="alert-product-image-box"
                      onClick={() => navigateToProduct(alert.productId)}
                      role="button"
                      tabIndex={0}
                      title="View product details"
                    >
                      {alert.productImage ? (
                        <img 
                          src={alert.productImage} 
                          alt={alert.productName} 
                          className="alert-product-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.classList.add('image-fallback');
                          }}
                        />
                      ) : (
                        <ShoppingBag size={24} color="var(--primary-lavender)" />
                      )}
                    </div>

                    <div className="alert-product-info">
                      <h3 
                        className="alert-product-name clickable"
                        onClick={() => navigateToProduct(alert.productId)}
                        title={alert.productName}
                      >
                        {alert.productName}
                      </h3>
                      <div className="alert-notification-meta">
                        <span>Notify: {alert.userEmail || 'In-app account'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Comparison Row */}
                  <div className="alert-prices-grid">
                    <div className="alert-price-block">
                      <span className="price-block-label">Current Lowest</span>
                      <span className="price-block-value current">
                        {formatINR(currentPrice)}
                      </span>
                    </div>

                    <div className="alert-price-divider" />

                    <div className="alert-price-block">
                      <span className="price-block-label">Your Target</span>
                      <span className="price-block-value target">
                        {formatINR(targetPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Price Drop Difference Calculation */}
                  <div className="alert-difference-box">
                    {diff > 0 ? (
                      <div className="diff-info-row">
                        <span className="diff-label">Price must fall by:</span>
                        <span className="diff-amount">
                          {formatINR(diff)} ({diffPercent}%)
                        </span>
                      </div>
                    ) : (
                      <div className="diff-info-row reached">
                        <span className="diff-label">Target met! Ready to purchase:</span>
                        <span className="diff-amount text-green">
                          {formatINR(Math.abs(diff))} below target
                        </span>
                      </div>
                    )}

                    {/* Proximity Progress Bar */}
                    <div className="alert-progress-wrapper" title={`Target is ${proximityPercent}% of current lowest price`}>
                      <div className="alert-progress-track">
                        <div 
                          className="alert-progress-fill" 
                          style={{ width: `${proximityPercent}%` }} 
                        />
                      </div>
                      <span className="alert-progress-text">
                        {proximityPercent}% proximity to target
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Metadata & Inspect Button */}
                  <div className="alert-card-footer">
                    <span className="alert-time-text">Created: {createdDate}</span>
                    <button
                      type="button"
                      onClick={() => navigateToProduct(alert.productId)}
                      className="btn-secondary alert-view-deal-btn"
                    >
                      <span>View Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Alert Status and History: "Recently Triggered" */}
      {triggeredAlerts.length > 0 && (
        <section className="alerts-section" aria-label="Recently Triggered Alerts">
          <div className="alerts-section-header">
            <div>
              <h2 className="alerts-section-title">Recently Triggered Deals</h2>
              <p className="alerts-section-subtitle">
                Deals where the store price reached or passed your target.
              </p>
            </div>
            <span className="section-badge-pill green">{triggeredAlerts.length} Met</span>
          </div>

          <div className="alerts-cards-grid">
            {triggeredAlerts.map((alert) => {
              const currentPrice = Number(alert.currentLowestPrice) || 0;
              const targetPrice = Number(alert.targetPrice) || 0;
              const savings = targetPrice >= currentPrice ? (targetPrice - currentPrice) : 0;
              
              const triggeredDate = alert.triggeredAt 
                ? new Date(alert.triggeredAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : (alert.createdAt ? new Date(alert.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');

              return (
                <article key={alert.id} className="alert-item-card clean-card triggered-border" id={`triggered-card-${alert.id}`}>
                  {/* Status & Delete */}
                  <div className="alert-card-header">
                    <span className="alert-status-pill triggered">
                      <CheckCircle2 size={13} />
                      <span>Target Reached</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(alert)}
                      className="alert-icon-btn delete-btn"
                      title="Dismiss alert"
                      aria-label={`Dismiss alert for ${alert.productName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="alert-card-product-row">
                    <div 
                      className="alert-product-image-box"
                      onClick={() => navigateToProduct(alert.productId)}
                      role="button"
                      tabIndex={0}
                      title="View product details"
                    >
                      {alert.productImage ? (
                        <img 
                          src={alert.productImage} 
                          alt={alert.productName} 
                          className="alert-product-img"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={24} color="var(--accent-green)" />
                      )}
                    </div>

                    <div className="alert-product-info">
                      <h3 
                        className="alert-product-name clickable"
                        onClick={() => navigateToProduct(alert.productId)}
                        title={alert.productName}
                      >
                        {alert.productName}
                      </h3>
                      <div className="alert-notification-meta">
                        <span className="text-green font-semibold">
                          Target met: {formatINR(targetPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Triggered Success Callout */}
                  <div className="triggered-success-callout">
                    <div className="triggered-savings-row">
                      <span className="triggered-price-label">Price When Triggered:</span>
                      <strong className="triggered-price-val">{formatINR(currentPrice)}</strong>
                    </div>
                    {savings > 0 && (
                      <div className="savings-achieved-text">
                        Extra savings of {formatINR(savings)} below your target!
                      </div>
                    )}
                    <div className="triggered-timestamp-text">
                      Triggered on: {triggeredDate}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="alert-card-footer">
                    <button
                      type="button"
                      onClick={() => navigateToProduct(alert.productId, 'prices')}
                      className="btn-lavender alert-inspect-deal-btn"
                    >
                      <span>Inspect Store Offers</span>
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
        </>
      )}

      {/* 4. Create Price Alert Modal */}
      {isCreateModalOpen && (
        <div 
          className="alerts-modal-backdrop"
          onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-alert-title"
        >
          <div 
            className="alerts-modal-dialog clean-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="alerts-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-title-icon-circle">
                  <Bell size={18} color="var(--primary-lavender)" />
                </div>
                <div>
                  <h3 id="create-alert-title" className="alerts-modal-title">
                    Create Price Alert
                  </h3>
                  <p className="alerts-modal-subtitle">
                    Select a product and specify your target purchase price.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
                className="alerts-modal-close-btn"
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="alerts-modal-form">
              {/* Product Selection */}
              <div className="form-group">
                <label className="form-label">
                  1. Select Product <span className="required">*</span>
                </label>

                {selectedProduct ? (
                  /* Selected Product Card */
                  <div className="selected-product-preview-card">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="preview-card-img" 
                    />
                    <div className="preview-card-details">
                      <span className="preview-card-brand">{selectedProduct.brand}</span>
                      <h4 className="preview-card-name">{selectedProduct.name}</h4>
                      <div className="preview-card-price-row">
                        <span className="preview-price-label">Current Lowest:</span>
                        <strong className="preview-price-val">
                          {formatINR(selectedProduct.lowestPrice)}
                        </strong>
                        {selectedProduct.lowestStore && (
                          <span className="preview-store-tag">on {selectedProduct.lowestStore}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="btn-secondary preview-change-btn"
                      disabled={isSubmitting}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Search Selector */
                  <div className="product-search-selector-box">
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-box-icon" />
                      <input
                        type="text"
                        placeholder="Search product by title, brand, or category..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="modal-search-field"
                        autoFocus
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch('')}
                          className="search-clear-btn"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="search-dropdown-list">
                      {searchedProducts.map(prod => (
                        <div
                          key={prod.id}
                          className="dropdown-product-item"
                          onClick={() => handleSelectProduct(prod)}
                          role="button"
                          tabIndex={0}
                        >
                          <img src={prod.image} alt={prod.name} className="dropdown-item-thumb" />
                          <div className="dropdown-item-info">
                            <div className="dropdown-item-title">{prod.name}</div>
                            <div className="dropdown-item-meta">
                              <span>{prod.brand}</span> • <span>{formatINR(prod.lowestPrice)}</span>
                            </div>
                          </div>
                          <span className="dropdown-select-pill">Select</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Price */}
              <div className="form-group">
                <label className="form-label" htmlFor="create-target-price">
                  2. Your Target Price (₹) <span className="required">*</span>
                </label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="create-target-price"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="Enter target price e.g. 48000"
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    className="currency-input-field"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Quick Drop Percentage Shortcuts */}
                {selectedProduct?.lowestPrice && (
                  <div className="quick-drop-shortcuts">
                    <span className="shortcuts-label">Quick Suggestions:</span>
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(selectedProduct.lowestPrice * 0.95).toString())}
                      className="shortcut-chip"
                      disabled={isSubmitting}
                    >
                      5% Drop ({formatINR(Math.round(selectedProduct.lowestPrice * 0.95))})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPriceInput(Math.round(selectedProduct.lowestPrice * 0.90).toString())}
                      className="shortcut-chip"
                      disabled={isSubmitting}
                    >
                      10% Drop ({formatINR(Math.round(selectedProduct.lowestPrice * 0.90))})
                    </button>
                  </div>
                )}

                {/* Immediate Trigger Warning / Info */}
                {selectedProduct && targetPriceInput && !isNaN(Number(targetPriceInput)) && (
                  Number(targetPriceInput) >= (selectedProduct.lowestPrice || 0) ? (
                    <div className="target-trigger-notice warning">
                      <AlertCircle size={14} />
                      <span>
                        Your target ({formatINR(targetPriceInput)}) meets or exceeds the current lowest price ({formatINR(selectedProduct.lowestPrice)}). This alert will trigger immediately!
                      </span>
                    </div>
                  ) : (
                    <div className="target-trigger-notice info">
                      <TrendingDown size={14} />
                      <span>
                        Target requires a price drop of {formatINR(selectedProduct.lowestPrice - Number(targetPriceInput))} ({(((selectedProduct.lowestPrice - Number(targetPriceInput)) / selectedProduct.lowestPrice) * 100).toFixed(1)}%).
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Notification Preferences */}
              <div className="form-group">
                <label className="form-label" htmlFor="create-alert-email">
                  3. Notification Email <span className="required">*</span>
                </label>
                <input
                  id="create-alert-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="modal-input-field"
                  required
                  disabled={isSubmitting}
                />
                <span className="form-helper-text">
                  In-app notifications and logging are live. Email alerts are dispatched once verified deals trigger.
                </span>
              </div>

              {/* Error feedback */}
              {formError && (
                <div className="form-error-banner" role="alert">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="alerts-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary modal-cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-alert-btn"
                  className="btn-lavender modal-submit-btn"
                  disabled={isSubmitting || !selectedProduct}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Creating Alert...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Create Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Target Price Modal */}
      {editingAlert && (
        <div 
          className="alerts-modal-backdrop"
          onClick={() => !isEditingSubmitting && setEditingAlert(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-alert-title"
        >
          <div 
            className="alerts-modal-dialog clean-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="alerts-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-title-icon-circle">
                  <Pencil size={16} color="var(--primary-lavender)" />
                </div>
                <div>
                  <h3 id="edit-alert-title" className="alerts-modal-title">
                    Update Target Price
                  </h3>
                  <p className="alerts-modal-subtitle">
                    Adjust your desired price threshold for this product.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isEditingSubmitting && setEditingAlert(null)}
                className="alerts-modal-close-btn"
                aria-label="Close edit modal"
                disabled={isEditingSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="alerts-modal-form">
              {/* Product Preview */}
              <div className="edit-product-snippet">
                <img src={editingAlert.productImage} alt={editingAlert.productName} className="snippet-img" />
                <div className="snippet-info">
                  <div className="snippet-title">{editingAlert.productName}</div>
                  <div className="snippet-current">
                    Current Lowest: <strong>{formatINR(editingAlert.currentLowestPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Target Price Input */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-target-price">
                  New Target Price (₹) <span className="required">*</span>
                </label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="edit-target-price"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="Enter new target price"
                    value={editTargetInput}
                    onChange={(e) => setEditTargetInput(e.target.value)}
                    className="currency-input-field"
                    required
                    disabled={isEditingSubmitting}
                    autoFocus
                  />
                </div>

                {/* Validation Note */}
                {editTargetInput && !isNaN(Number(editTargetInput)) && (
                  Number(editTargetInput) >= (editingAlert.currentLowestPrice || 0) ? (
                    <div className="target-trigger-notice warning">
                      <AlertCircle size={14} />
                      <span>
                        Target ({formatINR(editTargetInput)}) is at or above current price ({formatINR(editingAlert.currentLowestPrice)}). Alert will trigger!
                      </span>
                    </div>
                  ) : (
                    <div className="target-trigger-notice info">
                      <TrendingDown size={14} />
                      <span>
                        Requires price to fall by {formatINR(editingAlert.currentLowestPrice - Number(editTargetInput))}.
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Error */}
              {editFormError && (
                <div className="form-error-banner" role="alert">
                  <AlertCircle size={15} />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="alerts-modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingAlert(null)}
                  className="btn-secondary modal-cancel-btn"
                  disabled={isEditingSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-edit-alert-btn"
                  className="btn-lavender modal-submit-btn"
                  disabled={isEditingSubmitting}
                >
                  {isEditingSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Target</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {deletingAlert && (
        <div 
          className="alerts-modal-backdrop"
          onClick={() => !isDeletingSubmitting && setDeletingAlert(null)}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-alert-title"
        >
          <div 
            className="alerts-modal-dialog clean-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="delete-dialog-body">
              <div className="delete-icon-circle">
                <Trash2 size={24} color="var(--accent-rose)" />
              </div>
              <h3 id="delete-alert-title" className="delete-dialog-title">
                Delete Price Alert?
              </h3>
              <p className="delete-dialog-text">
                Are you sure you want to stop tracking price drops for <strong>"{deletingAlert.productName}"</strong>? This will remove the deal monitor from your dashboard.
              </p>

              <div className="delete-dialog-actions">
                <button
                  type="button"
                  onClick={() => setDeletingAlert(null)}
                  className="btn-secondary delete-cancel-btn"
                  disabled={isDeletingSubmitting}
                >
                  Keep Alert
                </button>
                <button
                  type="button"
                  id="confirm-delete-alert-btn"
                  onClick={handleDeleteConfirm}
                  className="btn-danger delete-confirm-btn"
                  disabled={isDeletingSubmitting}
                >
                  {isDeletingSubmitting ? 'Deleting...' : 'Delete Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
