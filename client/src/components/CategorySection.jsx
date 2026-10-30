import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';

const CATEGORIES = [
  {
    name: 'Electronics',
    image: '/images/categories/electronics.jpg'
  },
  {
    name: 'Fashion',
    image: '/images/categories/fashion.jpg'
  },
  {
    name: 'Beauty & Skincare',
    image: '/images/categories/beauty.jpg'
  },
  {
    name: 'Home & Kitchen',
    image: '/images/categories/kitchen.jpg'
  },
  {
    name: 'Sports & Fitness',
    image: '/images/categories/fitness.jpg'
  },
  {
    name: 'Books & Stationery',
    image: '/images/categories/stationery.jpg'
  }
];

export default function CategorySection() {
  const { selectedCategory, navigateToSearch } = useShopwise();

  const handleCategoryClick = (catName) => {
    navigateToSearch({ category: catName });
  };

  return (
    <section id="categories-section" style={{ padding: '24px 0 20px 0' }}>
      <div className="content-wrapper">
        {/* Compact Main Heading */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>
            Shop Smarter, Choose Better
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Compare prices, discover genuine deals, and shop with confidence.
          </p>
        </div>

        {/* Six Categories in 1 Horizontal Row on Desktop, <=3 on Mobile */}
        <div className="category-grid">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className={`category-card ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
                aria-label={`Filter by ${cat.name}`}
              >
                <div className="category-card-img-wrap">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="category-card-img"
                    loading="lazy"
                  />
                </div>
                <span className="category-card-name">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
