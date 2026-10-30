import React from 'react';
import { useShopwise } from '../context/ShopwiseContext';
import { 
  LayoutGrid, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Watch, 
  Tv, 
  Shirt 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Products', icon: LayoutGrid },
  { id: 'Mobiles', label: 'Mobiles', icon: Smartphone },
  { id: 'Laptops', label: 'Laptops', icon: Laptop },
  { id: 'Headphones', label: 'Headphones', icon: Headphones },
  { id: 'Smart Watches', label: 'Smart Watches', icon: Watch },
  { id: 'Home', label: 'Home & Audio', icon: Tv },
  { id: 'Fashion', label: 'Fashion', icon: Shirt }
];

export default function CategoryChips() {
  const { selectedCategory, setSelectedCategory } = useShopwise();

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto 20px auto',
      padding: '0 24px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      scrollbarWidth: 'none'
    }}>
      <div style={{ display: 'inline-flex', gap: '10px' }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: isSelected ? '1px solid var(--primary-lavender)' : '1px solid var(--border-subtle)',
                background: isSelected 
                  ? 'linear-gradient(135deg, var(--primary-lavender) 0%, var(--primary-deep) 100%)' 
                  : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: isSelected ? 'var(--primary-glow)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={16} color={isSelected ? '#FFFFFF' : 'var(--primary-lavender)'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
