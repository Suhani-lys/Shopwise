import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';

export default function Footer() {
  const { setSelectedCategory, setSearchQuery } = useShopwise();

  const handleCategoryNav = (cat) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{
      marginTop: 'auto',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--border-color)',
      padding: '36px 0 24px 0'
    }}>
      <div className="content-wrapper">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {/* Brand */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--primary-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                Shop<span style={{ color: 'var(--primary-lavender)' }}>Wise</span>
              </span>
            </div>
            <p style={{
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0
            }}>
              Smart product comparison and price tracking platform helping you make informed purchasing decisions.
            </p>
          </div>

          {/* Quick Categories Navigation */}
          <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
            <div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px'
              }}>
                Categories
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem' }}>
                {['Mobiles', 'Laptops', 'Audio', 'Electronics', 'Home Appliances', 'Accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryNav(cat)}
                    style={{
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-lavender)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px'
              }}>
                Stores Tracked
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <span>Amazon India</span>
                <span>Flipkart</span>
                <span>Myntra</span>
                <span>Croma</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div>© {new Date().getFullYear()} ShopWise. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Clean, Transparent Price Comparison</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
