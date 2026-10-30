import React, { useState, useEffect, useRef } from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  Search, 
  Bell, 
  Heart, 
  X, 
  Loader2, 
  User, 
  LogOut, 
  ChevronDown,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    navigateToSearch,
    navigateToHome,
    loading,
    alerts, 
    setIsAlertsDrawerOpen,
    compareList,
    navigateToCompare,
    navigateToAlerts,
    currentUser,
    logout,
    setIsAccountModalOpen,
    navigateToLogin,
    navigateToSignUp,
    unreadNotificationsCount
  } = useShopwise();

  const [term, setTerm] = useState(searchQuery || '');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Keep internal input in sync if context searchQuery is cleared externally
  useEffect(() => {
    setTerm(searchQuery || '');
  }, [searchQuery]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigateToSearch({ query: term.trim() });
  };

  const handleClear = () => {
    setTerm('');
    setSearchQuery('');
  };

  const handleLogoClick = () => {
    setTerm('');
    navigateToHome();
  };

  // Avatar initials
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Short user name for header
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Left: Clean Brand Logo */}
        <button
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            flexShrink: 0
          }}
          aria-label="ShopWise Home"
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-lavender)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Shop<span style={{ color: 'var(--primary-lavender)' }}>Wise</span>
          </span>
        </button>

        {/* Center: Wide Search Bar */}
        <form 
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            maxWidth: '560px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-lavender)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <input
            id="main-search-input"
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products, brands and more..."
            aria-label="Search products, brands and more"
            style={{
              flex: 1,
              padding: '9px 14px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />

          {term && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              style={{
                color: 'var(--text-secondary)',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            aria-label="Perform search"
            style={{
              backgroundColor: 'var(--primary-lavender)',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-lavender)'; }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>

        {/* Right Section: Compare, Alerts & Authentication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Compare Products Icon Button */}
          <button
            onClick={() => navigateToCompare()}
            title={compareList.length > 0 ? `Compare Products (${compareList.length})` : "Compare Products"}
            aria-label="Compare products"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: compareList.length > 0 ? 'var(--primary-lavender)' : 'var(--text-secondary)',
              backgroundColor: compareList.length > 0 ? 'var(--primary-light)' : 'transparent',
              border: '1px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; }}
            onMouseOut={(e) => { 
              e.currentTarget.style.backgroundColor = compareList.length > 0 ? 'var(--primary-light)' : 'transparent'; 
            }}
          >
            <Heart size={18} />
            {compareList.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-lavender)',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {compareList.length}
              </span>
            )}
          </button>

          {/* Price Drop Alerts & Notifications Icon Button */}
          <button
            onClick={() => navigateToAlerts()}
            title={
              unreadNotificationsCount > 0 
                ? `${unreadNotificationsCount} unread price drop notification${unreadNotificationsCount > 1 ? 's' : ''}`
                : (alerts.length > 0 ? `Price Alerts (${alerts.length})` : "Price Alerts")
            }
            aria-label="Price drop alerts dashboard"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: (unreadNotificationsCount > 0 || alerts.length > 0) ? 'var(--primary-lavender)' : 'var(--text-secondary)',
              backgroundColor: (unreadNotificationsCount > 0 || alerts.length > 0) ? 'var(--primary-light)' : 'transparent',
              border: '1px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; }}
            onMouseOut={(e) => { 
              e.currentTarget.style.backgroundColor = (unreadNotificationsCount > 0 || alerts.length > 0) ? 'var(--primary-light)' : 'transparent'; 
            }}
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 ? (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-lavender)',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #FFFFFF'
              }}>
                {unreadNotificationsCount}
              </span>
            ) : alerts.length > 0 ? (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {alerts.length}
              </span>
            ) : null}
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '22px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

          {/* Authentication UI: Profile Menu (Logged In) OR Login & Sign Up (Logged Out) */}
          {currentUser ? (
            <div className="nav-profile-container" ref={profileMenuRef}>
              {/* Profile Avatar Button */}
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="nav-avatar-btn"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-label={`User account menu for ${currentUser.name}`}
              >
                <div className="nav-avatar-circle">
                  {initials}
                </div>
                <span className="nav-avatar-name">{firstName}</span>
                <ChevronDown size={14} color="var(--text-secondary)" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="profile-dropdown-menu" role="menu">
                  {/* Header info */}
                  <div className="profile-dropdown-header">
                    <div className="profile-header-name">{currentUser.name}</div>
                    <div className="profile-header-email">{currentUser.email}</div>
                  </div>

                  {/* My Account */}
                  <button
                    type="button"
                    id="menu-my-account"
                    className="profile-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsAccountModalOpen(true);
                    }}
                  >
                    <User size={16} color="var(--primary-lavender)" />
                    <span>My Account</span>
                  </button>

                  {/* My Price Alerts */}
                  <button
                    type="button"
                    id="menu-my-alerts"
                    className="profile-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigateToAlerts();
                    }}
                  >
                    <Bell size={16} color="var(--accent-green)" />
                    <span>My Price Alerts</span>
                    {alerts.length > 0 && (
                      <span className="profile-dropdown-badge">{alerts.length}</span>
                    )}
                  </button>

                  <div className="profile-dropdown-divider" />

                  {/* Logout */}
                  <button
                    type="button"
                    id="menu-logout"
                    className="profile-dropdown-item item-danger"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out: Login and Sign Up buttons */
            <div className="nav-auth-buttons">
              <button
                type="button"
                id="header-login-btn"
                onClick={() => navigateToLogin()}
                className="nav-login-btn"
                aria-label="Login to your account"
              >
                Login
              </button>

              <button
                type="button"
                id="header-signup-btn"
                onClick={() => navigateToSignUp()}
                className="nav-signup-btn"
                aria-label="Create a new account"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
