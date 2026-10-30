import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fallbackProducts } from '../data/fallbackProducts';

const ShopwiseContext = createContext();

import { API_BASE_URL } from '../config/api';

// Helper matching functions for robust e-commerce filtering
const matchesCategory = (productCat, chosenCat) => {
  if (!chosenCat || chosenCat === 'All') return true;
  const pCat = (productCat || '').toLowerCase();
  const cCat = (chosenCat || '').toLowerCase();

  if (cCat === 'electronics') {
    return ['electronics', 'mobiles', 'laptops', 'headphones', 'smart watches'].includes(pCat);
  }
  if (cCat === 'fashion') {
    return ['fashion', 'apparel', 'clothing', 'shoes'].includes(pCat);
  }
  if (cCat === 'home & kitchen' || cCat === 'home') {
    return ['home', 'kitchen', 'home & kitchen', 'appliances', 'home appliances'].includes(pCat);
  }
  if (cCat === 'sports & fitness') {
    return ['sports & fitness', 'fitness', 'sports', 'smart watches'].includes(pCat);
  }
  if (cCat === 'beauty & skincare') {
    return ['beauty & skincare', 'beauty', 'skincare', 'cosmetics'].includes(pCat);
  }
  if (cCat === 'books & stationery') {
    return ['books & stationery', 'books', 'stationery'].includes(pCat);
  }
  return pCat === cCat;
};

const matchesStore = (product, chosenStore) => {
  if (!chosenStore || chosenStore === 'All') return true;
  const target = chosenStore.toLowerCase();
  if (product.lowestStore && product.lowestStore.toLowerCase() === target) return true;
  if (Array.isArray(product.offers)) {
    return product.offers.some(o => o.store && o.store.toLowerCase() === target);
  }
  return false;
};

const matchesPrice = (product, minP, maxP) => {
  const price = Number(product.lowestPrice) || 0;
  if (minP && price < Number(minP)) return false;
  if (maxP && price > Number(maxP)) return false;
  return true;
};

const matchesRating = (product, minR) => {
  if (!minR || minR <= 0) return true;
  return (product.rating || 0) >= Number(minR);
};

const matchesSearch = (product, query) => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  return name.includes(q) || brand.includes(q) || category.includes(q) || desc.includes(q);
};

const sortProducts = (list, sortType, query) => {
  const sorted = [...list];
  switch (sortType) {
    case 'priceAsc':
      return sorted.sort((a, b) => a.lowestPrice - b.lowestPrice);
    case 'priceDesc':
      return sorted.sort((a, b) => b.lowestPrice - a.lowestPrice);
    case 'ratingDesc':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'relevance':
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        return sorted.sort((a, b) => {
          const aName = (a.name || '').toLowerCase().includes(q) ? 2 : 0;
          const bName = (b.name || '').toLowerCase().includes(q) ? 2 : 0;
          const aBrand = (a.brand || '').toLowerCase().includes(q) ? 1 : 0;
          const bBrand = (b.brand || '').toLowerCase().includes(q) ? 1 : 0;
          return (bName + bBrand) - (aName + aBrand);
        });
      }
      return sorted;
    case 'smartValue':
    case 'bestValue':
    default:
      return sorted.sort((a, b) => (b.smartValueScore?.score || 0) - (a.smartValueScore?.score || 0));
  }
};

export const ShopwiseProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState(fallbackProducts);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [providers, setProviders] = useState([]);

  // Search, Category, Sorting, and Filter states
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('search') || '';
    }
    return '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('category') || 'All';
    }
    return 'All';
  });
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'priceAsc', 'priceDesc', 'ratingDesc', 'smartValue'
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [selectedStore, setSelectedStore] = useState('All');

  // Product Details Page state
  const [selectedProductId, setSelectedProductId] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('id') || p.get('product') || null;
    }
    return null;
  });

  const [selectedTab, setSelectedTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || 'prices';
    }
    return 'prices';
  });

  // View state: 'home', 'search', 'product', 'compare', 'alerts', 'login', or 'signup'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('view') === 'login') {
        return 'login';
      }
      if (p.get('view') === 'signup' || p.get('view') === 'register') {
        return 'signup';
      }
      if (p.get('view') === 'alerts' || p.get('view') === 'alert') {
        return 'alerts';
      }
      if (p.get('view') === 'compare') {
        return 'compare';
      }
      if (p.get('id') || p.get('product') || p.get('view') === 'product') {
        return 'product';
      }
      if (p.get('search') || (p.get('category') && p.get('category') !== 'All') || p.get('view') === 'search') {
        return 'search';
      }
    }
    return 'home';
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shopwise_user') || sessionStorage.getItem('shopwise_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved user:', e);
      }
    }
    return null;
  });

  const [authToken, setAuthToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shopwise_token') || sessionStorage.getItem('shopwise_token') || null;
    }
    return null;
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authRedirectAction, setAuthRedirectAction] = useState(null);

  // Compare List (up to 4 products) initialized from URL or localStorage
  const [compareList, setCompareList] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        const urlIds = p.get('ids');
        if (urlIds) {
          const ids = urlIds.split(',').map(s => s.trim()).filter(Boolean);
          const matched = fallbackProducts.filter(item => ids.includes(item.id));
          if (matched.length > 0) return matched.slice(0, 4);
        }
        const saved = localStorage.getItem('shopwise_compare_ids');
        if (saved) {
          const ids = JSON.parse(saved);
          if (Array.isArray(ids)) {
            const matched = fallbackProducts.filter(item => ids.includes(item.id));
            if (matched.length > 0) return matched.slice(0, 4);
          }
        }
      } catch (e) {
        console.warn('Failed to initialize compareList from storage:', e);
      }
    }
    return [];
  });

  // Modals state
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertProductTarget, setAlertProductTarget] = useState(null);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isCustomWeightModalOpen, setIsCustomWeightModalOpen] = useState(false);

  // Alerts & Notifications
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Priority formula sliders (Smart Value Score)
  const [userWeights, setUserWeights] = useState({
    price: 0.35,
    rating: 0.25,
    trust: 0.25,
    specs: 0.15
  });

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('shopwise_theme') === 'dark';
  });

  // Toast Notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Update HTML Theme attribute
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('shopwise_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('shopwise_theme', 'light');
    }
  }, [isDarkMode]);

  // Fetch API Health & DB Status
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(true);
        setDbStatus(data.database);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Verify token validity on initial load
  useEffect(() => {
    const verifySession = async () => {
      if (!authToken) return;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            if (localStorage.getItem('shopwise_token')) {
              localStorage.setItem('shopwise_user', JSON.stringify(data.user));
            } else {
              sessionStorage.setItem('shopwise_user', JSON.stringify(data.user));
            }
          }
        } else if (res.status === 401) {
          console.warn('[ShopWise] Session invalid or expired.');
          localStorage.removeItem('shopwise_token');
          localStorage.removeItem('shopwise_user');
          sessionStorage.removeItem('shopwise_token');
          sessionStorage.removeItem('shopwise_user');
          setAuthToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Network issue checking session:', err);
      }
    };
    verifySession();
  }, [authToken]);

  // Fetch Alerts from Backend
  const fetchAlerts = useCallback(async () => {
    if (!authToken && !currentUser) {
      setAlerts([]);
      return;
    }
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const url = currentUser ? `${API_BASE_URL}/alerts?userEmail=${encodeURIComponent(currentUser.email)}` : `${API_BASE_URL}/alerts`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAlerts(data.data);
        }
      } else {
        setAlertsError('Failed to load alerts from server');
      }
    } catch (err) {
      console.warn('API error fetching alerts:', err);
      setAlertsError('Cannot reach alerts backend server');
    } finally {
      setAlertsLoading(false);
    }
  }, [authToken, currentUser]);

  // Fetch In-App Notifications
  const fetchNotifications = useCallback(async () => {
    if (!authToken && !currentUser) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const url = currentUser?.email ? `${API_BASE_URL}/notifications?userEmail=${encodeURIComponent(currentUser.email)}` : `${API_BASE_URL}/notifications`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('API error fetching notifications:', err);
    }
  }, [authToken, currentUser]);

  // Fetch Products with Real Multi-Criteria Dynamic Search
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const qParams = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) qParams.set('search', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'All') qParams.set('category', selectedCategory);
      if (sortBy) qParams.set('sort', sortBy);
      if (minPrice > 0) qParams.set('minPrice', minPrice);
      if (maxPrice < 200000) qParams.set('maxPrice', maxPrice);
      if (minRating > 0) qParams.set('minRating', minRating);
      if (selectedStore && selectedStore !== 'All') qParams.set('store', selectedStore);

      const queryString = qParams.toString();
      const endpoint = queryString ? `${API_BASE_URL}/products?${queryString}` : `${API_BASE_URL}/products`;

      const res = await fetch(endpoint);
      let rawCatalog = fallbackProducts;
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          rawCatalog = data.data;
          setBackendOnline(true);
          if (data.meta) {
            setSearchMeta(data.meta);
            if (data.meta.providerStatuses) {
              setProviders(data.meta.providerStatuses);
            }
          }
        }
      }
      setAllProducts(rawCatalog);
      setProducts(rawCatalog);
      setLoading(false);
    } catch (err) {
      console.warn('API connection issue, utilizing fallback catalog:', err);
      setAllProducts(fallbackProducts);
      let filtered = fallbackProducts.filter(p => {
        return (
          matchesSearch(p, searchQuery) &&
          matchesCategory(p.category, selectedCategory) &&
          matchesPrice(p, minPrice, maxPrice) &&
          matchesRating(p, minRating) &&
          matchesStore(p, selectedStore)
        );
      });
      filtered = sortProducts(filtered, sortBy, searchQuery);
      setProducts(filtered);
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy, minRating, minPrice, maxPrice, selectedStore]);

  useEffect(() => {
    checkHealth();
    fetchProducts();
    fetchAlerts();
    fetchNotifications();
  }, [checkHealth, fetchProducts, fetchAlerts, fetchNotifications]);

  // Save compareList IDs to localStorage whenever compareList changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const ids = compareList.map(p => p.id);
        localStorage.setItem('shopwise_compare_ids', JSON.stringify(ids));
      } catch (e) {
        console.warn('Failed to save compareList to localStorage:', e);
      }
    }
  }, [compareList]);

  // Keep compareList in sync with fresh data from allProducts
  useEffect(() => {
    if (allProducts && allProducts.length > 0 && compareList.length > 0) {
      setCompareList(prev => {
        return prev.map(oldProd => {
          const updated = allProducts.find(p => p.id === oldProd.id);
          return updated || oldProd;
        });
      });
    }
  }, [allProducts]);

  // Route Synchronization
  const navigateToSearch = useCallback(({ query, category } = {}) => {
    setSelectedProductId(null);
    if (query !== undefined) setSearchQuery(query);
    if (category !== undefined) setSelectedCategory(category);
    setCurrentView('search');

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'search');
    url.searchParams.delete('id');
    url.searchParams.delete('tab');
    url.searchParams.delete('ids');
    if (query !== undefined) {
      if (query.trim()) url.searchParams.set('search', query.trim());
      else url.searchParams.delete('search');
    }
    if (category !== undefined) {
      if (category && category !== 'All') url.searchParams.set('category', category);
      else url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToHome = useCallback(() => {
    setSelectedProductId(null);
    setSearchQuery('');
    setSelectedCategory('All');
    setMinPrice(0);
    setMaxPrice(200000);
    setMinRating(0);
    setSelectedStore('All');
    setSortBy('relevance');
    setCurrentView('home');

    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToProduct = useCallback((productId, tab = 'prices') => {
    setSelectedProductId(productId);
    setSelectedTab(tab);
    setCurrentView('product');

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'product');
    url.searchParams.set('id', productId);
    url.searchParams.delete('ids');
    if (tab && tab !== 'prices') {
      url.searchParams.set('tab', tab);
    } else {
      url.searchParams.delete('tab');
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToCompare = useCallback((productIds) => {
    setSelectedProductId(null);
    setCurrentView('compare');

    let updatedList = compareList;
    if (Array.isArray(productIds) && productIds.length > 0) {
      const found = allProducts.filter(p => productIds.includes(p.id));
      if (found.length > 0) {
        updatedList = found.slice(0, 4);
        setCompareList(updatedList);
      }
    }

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'compare');
    if (updatedList.length > 0) {
      url.searchParams.set('ids', updatedList.map(p => p.id).join(','));
    } else {
      url.searchParams.delete('ids');
    }
    url.searchParams.delete('id');
    url.searchParams.delete('tab');
    url.searchParams.delete('search');
    url.searchParams.delete('category');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [compareList, allProducts]);

  const navigateToAlerts = useCallback(() => {
    setSelectedProductId(null);
    setCurrentView('alerts');

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'alerts');
    url.searchParams.delete('id');
    url.searchParams.delete('tab');
    url.searchParams.delete('search');
    url.searchParams.delete('category');
    url.searchParams.delete('ids');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToLogin = useCallback((pendingAction = null) => {
    setSelectedProductId(null);
    if (pendingAction) {
      setAuthRedirectAction(pendingAction);
    }
    setCurrentView('login');

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'login');
    url.searchParams.delete('id');
    url.searchParams.delete('tab');
    url.searchParams.delete('ids');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToSignUp = useCallback((pendingAction = null) => {
    setSelectedProductId(null);
    if (pendingAction) {
      setAuthRedirectAction(pendingAction);
    }
    setCurrentView('signup');

    const url = new URL(window.location.href);
    url.searchParams.set('view', 'signup');
    url.searchParams.delete('id');
    url.searchParams.delete('tab');
    url.searchParams.delete('ids');
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for browser Back/Forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search') || '';
      const cat = params.get('category') || 'All';
      const prodId = params.get('id') || params.get('product') || null;
      const tab = params.get('tab') || 'prices';
      const viewParam = params.get('view');
      const urlIds = params.get('ids');

      let view = 'home';
      if (viewParam === 'login') {
        view = 'login';
      } else if (viewParam === 'signup' || viewParam === 'register') {
        view = 'signup';
      } else if (viewParam === 'alerts' || viewParam === 'alert') {
        view = 'alerts';
      } else if (viewParam === 'compare') {
        view = 'compare';
      } else if (prodId || viewParam === 'product') {
        view = 'product';
      } else if (q || (cat && cat !== 'All') || viewParam === 'search') {
        view = 'search';
      }

      if (urlIds) {
        const idList = urlIds.split(',').map(s => s.trim()).filter(Boolean);
        const matched = allProducts.filter(p => idList.includes(p.id));
        if (matched.length > 0) {
          setCompareList(matched.slice(0, 4));
        }
      }
      
      setSearchQuery(q);
      setSelectedCategory(cat);
      setSelectedProductId(prodId);
      setSelectedTab(tab);
      setCurrentView(view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [allProducts]);

  // Reset/Clear All Filters
  const clearAllFilters = useCallback(() => {
    setSelectedCategory('All');
    setMinPrice(0);
    setMaxPrice(200000);
    setMinRating(0);
    setSelectedStore('All');
    setSortBy('relevance');
  }, []);

  // Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory && selectedCategory !== 'All') count++;
    if (minPrice > 0) count++;
    if (maxPrice < 200000) count++;
    if (minRating > 0) count++;
    if (selectedStore && selectedStore !== 'All') count++;
    return count;
  }, [selectedCategory, minPrice, maxPrice, minRating, selectedStore]);

  // Available Stores extracted dynamically from real dataset
  const availableStores = useMemo(() => {
    const storeSet = new Set();
    allProducts.forEach(p => {
      if (p.lowestStore) storeSet.add(p.lowestStore);
      if (Array.isArray(p.offers)) {
        p.offers.forEach(o => { if (o.store) storeSet.add(o.store); });
      }
    });
    return Array.from(storeSet).sort();
  }, [allProducts]);

  // Comparison Management
  const addToCompare = useCallback((product) => {
    if (!product || !product.id) return false;
    if (compareList.some(p => p.id === product.id)) {
      showToast(`${product.name} is already in comparison`, 'info');
      return false;
    }
    if (compareList.length >= 4) {
      showToast('You can compare a maximum of 4 products at once', 'warning');
      return false;
    }
    const nextList = [...compareList, product];
    setCompareList(nextList);
    showToast(`Added ${product.name} to comparison!`, 'success');

    if (currentView === 'compare') {
      const url = new URL(window.location.href);
      url.searchParams.set('ids', nextList.map(p => p.id).join(','));
      window.history.replaceState({}, '', url.toString());
    }
    return true;
  }, [compareList, currentView, showToast]);

  const removeFromCompare = useCallback((productId) => {
    const target = compareList.find(p => p.id === productId);
    const nextList = compareList.filter(p => p.id !== productId);
    setCompareList(nextList);
    if (target) {
      showToast(`Removed ${target.name} from comparison`, 'info');
    }

    if (currentView === 'compare') {
      const url = new URL(window.location.href);
      if (nextList.length > 0) {
        url.searchParams.set('ids', nextList.map(p => p.id).join(','));
      } else {
        url.searchParams.delete('ids');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [compareList, currentView, showToast]);

  const clearComparison = useCallback(() => {
    setCompareList([]);
    showToast('Comparison cleared', 'info');
    if (currentView === 'compare') {
      const url = new URL(window.location.href);
      url.searchParams.delete('ids');
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentView, showToast]);

  const toggleCompare = useCallback((product) => {
    if (compareList.some(p => p.id === product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  }, [compareList, addToCompare, removeFromCompare]);

  // Authentication Actions
  const login = useCallback(async (email, password, rememberMe = true) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (rememberMe) {
          localStorage.setItem('shopwise_token', data.token);
          localStorage.setItem('shopwise_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('shopwise_token', data.token);
          sessionStorage.setItem('shopwise_user', JSON.stringify(data.user));
          localStorage.removeItem('shopwise_token');
          localStorage.removeItem('shopwise_user');
        }
        setAuthToken(data.token);
        setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');

        // Check if there was a pending action before login
        if (authRedirectAction) {
          const pending = { ...authRedirectAction };
          setAuthRedirectAction(null);
          if (pending.action === 'createAlert' && pending.product) {
            setAlertProductTarget(pending.product);
            setIsAlertModalOpen(true);
            if (pending.returnView === 'product') {
              navigateToProduct(pending.product.id);
            } else if (pending.returnView === 'search') {
              navigateToSearch();
            } else if (pending.returnView === 'compare') {
              navigateToCompare();
            } else {
              navigateToHome();
            }
            return { success: true, user: data.user };
          } else if (pending.action === 'viewAlerts') {
            navigateToAlerts();
            return { success: true, user: data.user };
          } else if (pending.returnView) {
            setCurrentView(pending.returnView);
            return { success: true, user: data.user };
          }
        }

        navigateToHome();
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch {
      return { success: false, message: 'Unable to connect to authentication server. Please verify backend is running.' };
    }
  }, [authRedirectAction, showToast, navigateToProduct, navigateToSearch, navigateToCompare, navigateToHome, navigateToAlerts]);

  const register = useCallback(async (name, email, password, confirmPassword) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('shopwise_token', data.token);
        localStorage.setItem('shopwise_user', JSON.stringify(data.user));
        setAuthToken(data.token);
        setCurrentUser(data.user);
        showToast(`Welcome to ShopWise, ${data.user.name}!`, 'success');

        if (authRedirectAction) {
          const pending = { ...authRedirectAction };
          setAuthRedirectAction(null);
          if (pending.action === 'createAlert' && pending.product) {
            setAlertProductTarget(pending.product);
            setIsAlertModalOpen(true);
            if (pending.returnView === 'product') {
              navigateToProduct(pending.product.id);
            } else {
              navigateToHome();
            }
            return { success: true, user: data.user };
          } else if (pending.action === 'viewAlerts') {
            navigateToAlerts();
            return { success: true, user: data.user };
          }
        }

        navigateToHome();
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch {
      return { success: false, message: 'Unable to connect to registration server. Please check your network connection.' };
    }
  }, [authRedirectAction, showToast, navigateToProduct, navigateToHome, navigateToAlerts]);

  const logout = useCallback(() => {
    try {
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' }).catch(() => {});
    } catch {}
    localStorage.removeItem('shopwise_token');
    localStorage.removeItem('shopwise_user');
    sessionStorage.removeItem('shopwise_token');
    sessionStorage.removeItem('shopwise_user');
    setAuthToken(null);
    setCurrentUser(null);
    setAlerts([]);
    showToast('You have been logged out successfully.', 'info');
    if (currentView === 'alerts' || currentView === 'login' || currentView === 'signup') {
      navigateToHome();
    }
  }, [currentView, showToast, navigateToHome]);

  // Protected action trigger helper
  const triggerPriceAlert = useCallback((product) => {
    if (!product) return;
    if (!currentUser) {
      setAuthRedirectAction({ action: 'createAlert', product, returnView: currentView });
      showToast(`Please sign in to set price alerts for ${product.name}`, 'info');
      navigateToLogin();
      return;
    }
    setAlertProductTarget(product);
    setIsAlertModalOpen(true);
  }, [currentUser, currentView, showToast, navigateToLogin]);

  // Create Price Alert
  const createAlert = useCallback(async (productId, targetPrice, userEmail, selectedStore = 'All Stores', extraData = {}) => {
    const effectiveEmail = currentUser?.email || userEmail;
    if (!currentUser && !effectiveEmail) {
      const targetProd = allProducts.find(p => p.id === productId) || extraData;
      setAuthRedirectAction({ action: 'createAlert', product: targetProd, returnView: currentView });
      showToast('Please log in or sign up to activate price alerts.', 'info');
      navigateToLogin();
      return { success: false, requireAuth: true };
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const payload = {
        productId,
        targetPrice,
        selectedStore: selectedStore || 'All Stores',
        userEmail: effectiveEmail,
        productName: extraData.name || extraData.productName,
        productImage: extraData.image || extraData.productImage,
        productUrl: extraData.url || extraData.productUrl,
        currentLowestPrice: extraData.lowestPrice || extraData.currentLowestPrice
      };

      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(prev => [data.data, ...prev]);
        showToast(data.message, 'success');
        fetchNotifications();
        return { success: true, data: data.data, message: data.message };
      } else {
        showToast(data.message || 'Failed to create price alert', 'error');
        return { success: false, message: data.message || 'Server error' };
      }
    } catch {
      const targetProd = allProducts.find(p => p.id === productId) || extraData;
      if (targetProd) {
        const isTriggered = (targetProd.lowestPrice || targetProd.currentLowestPrice || 0) <= parseFloat(targetPrice);
        const fallbackAlert = {
          id: `alert-${Date.now()}`,
          productId: targetProd.id || productId,
          productName: targetProd.name || targetProd.productName || 'Tracked Product',
          productImage: targetProd.image || targetProd.productImage || '',
          productUrl: targetProd.url || '',
          selectedStore: selectedStore || 'All Stores',
          currentLowestPrice: targetProd.lowestPrice || targetProd.currentLowestPrice || parseFloat(targetPrice),
          targetPrice: parseFloat(targetPrice),
          userEmail: effectiveEmail,
          userId: currentUser?.id || null,
          status: isTriggered ? 'Triggered' : 'Active',
          monitoringStatus: isTriggered ? 'triggered' : 'active',
          triggeredAt: isTriggered ? new Date().toISOString() : null,
          createdAt: new Date().toISOString()
        };
        setAlerts(prev => [fallbackAlert, ...prev]);
        showToast(`Price Alert activated for ₹${parseFloat(targetPrice).toLocaleString()}!`, 'success');
        return { success: true, data: fallbackAlert };
      }
      return { success: false, message: 'Could not connect to alerts server' };
    }
  }, [allProducts, currentUser, authToken, currentView, showToast, navigateToLogin, fetchNotifications]);

  // Update Price Alert
  const updateAlert = useCallback(async (id, targetPrice, userEmail, selectedStore) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          targetPrice, 
          selectedStore,
          userEmail: currentUser?.email || userEmail 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(prev => prev.map(a => a.id === id ? data.data : a));
        showToast(data.message, 'success');
        return { success: true, data: data.data };
      } else {
        showToast(data.message || 'Failed to update alert', 'error');
        return { success: false, message: data.message };
      }
    } catch {
      const parsed = parseFloat(targetPrice);
      setAlerts(prev => prev.map(a => {
        if (a.id === id) {
          const isTriggered = (a.currentLowestPrice || 0) <= parsed;
          return {
            ...a,
            targetPrice: parsed,
            selectedStore: selectedStore || a.selectedStore,
            status: isTriggered ? 'Triggered' : 'Active',
            triggeredAt: isTriggered ? (a.triggeredAt || new Date().toISOString()) : null
          };
        }
        return a;
      }));
      showToast(`Target price updated to ₹${parseFloat(targetPrice).toLocaleString()}!`, 'success');
      return { success: true };
    }
  }, [authToken, currentUser, showToast]);

  // Delete Price Alert
  const deleteAlert = useCallback(async (id) => {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        showToast('Price alert deleted successfully', 'info');
        return { success: true };
      }
    } catch {
      // Offline fallback
    }
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast('Price alert deleted', 'info');
    return { success: true };
  }, [authToken, showToast]);

  // Pause Alert
  const pauseAlert = useCallback(async (id) => {
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_BASE_URL}/alerts/${id}/pause`, { method: 'PATCH', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Paused', monitoringStatus: 'paused' } : a));
        showToast(data.message || 'Alert monitoring paused', 'info');
        return { success: true };
      }
    } catch {
      // offline fallback
    }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Paused', monitoringStatus: 'paused' } : a));
    showToast('Alert paused', 'info');
    return { success: true };
  }, [authToken, showToast]);

  // Resume Alert
  const resumeAlert = useCallback(async (id) => {
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_BASE_URL}/alerts/${id}/resume`, { method: 'PATCH', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Active', monitoringStatus: 'active' } : a));
        showToast(data.message || 'Alert resumed and actively monitoring', 'success');
        return { success: true };
      }
    } catch {
      // offline fallback
    }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Active', monitoringStatus: 'active' } : a));
    showToast('Alert resumed and active', 'success');
    return { success: true };
  }, [authToken, showToast]);

  // Manual Check Now
  const checkAlertsNow = useCallback(async () => {
    try {
      showToast('Running live multi-store price check...', 'info');
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_BASE_URL}/alerts/check-now`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchAlerts();
        await fetchNotifications();
        const stats = data.result?.stats;
        showToast(stats ? `Check complete: ${stats.checkedAlerts} monitored, ${stats.triggeredAlerts} triggered!` : 'Live check cycle completed!', 'success');
        return { success: true, stats };
      }
    } catch (err) {
      showToast('Price check request failed', 'error');
    }
  }, [authToken, fetchAlerts, fetchNotifications, showToast]);

  // Mark Notification Read
  const markNotificationRead = useCallback(async (id) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userEmail: currentUser?.email })
      });
    } catch {
      // offline
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
  }, [authToken, currentUser]);

  // Mark All Notifications Read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userEmail: currentUser?.email })
      });
    } catch {
      // offline
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadNotificationsCount(0);
    showToast('All notifications marked as read', 'info');
  }, [authToken, currentUser, showToast]);

  // Dismiss Notification
  const dismissNotification = useCallback(async (id) => {
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE', headers });
    } catch {
      // offline
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification dismissed', 'info');
  }, [authToken, showToast]);

  // Custom SVS formula calculation
  const applyCustomWeights = async (newWeights) => {
    setUserWeights(newWeights);
    try {
      const res = await fetch(`${API_BASE_URL}/products/smart-rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: newWeights, category: selectedCategory })
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data);
        showToast('Smart Value Scores customized to your formula!', 'success');
        return;
      }
    } catch {
      const updated = products.map(p => {
        let weightedSum = 0;
        let activeWeight = 0;

        // Price
        if (p.lowestPrice && p.basePrice && p.basePrice >= p.lowestPrice) {
          const discountPct = ((p.basePrice - p.lowestPrice) / p.basePrice) * 100;
          const priceScore = Math.min(100, Math.max(30, Math.round(50 + discountPct * 1.1)));
          weightedSum += priceScore * newWeights.price;
          activeWeight += newWeights.price;
        }

        // Rating
        if (typeof p.rating === 'number' && p.rating > 0) {
          const ratingScore = Math.min(100, Math.round((p.rating / 5) * 100));
          weightedSum += ratingScore * newWeights.rating;
          activeWeight += newWeights.rating;
        }

        // Trust
        if (p.reviewTrustScore?.isScoreAvailable && typeof p.reviewTrustScore.score === 'number') {
          weightedSum += p.reviewTrustScore.score * newWeights.trust;
          activeWeight += newWeights.trust;
        }

        // Specs
        if (p.smartValueScore?.breakdown?.hardwareSpecsPerRupee) {
          weightedSum += p.smartValueScore.breakdown.hardwareSpecsPerRupee * newWeights.specs;
          activeWeight += newWeights.specs;
        }

        const newScore = activeWeight > 0 ? Math.round(weightedSum / activeWeight) : null;
        return {
          ...p,
          smartValueScore: {
            ...p.smartValueScore,
            score: newScore,
            explanation: newScore !== null 
              ? `Recalculated ${newScore}/100 using customized weights across verified components.` 
              : 'Smart Value Score unavailable due to missing data.'
          }
        };
      });
      updated.sort((a, b) => (b.smartValueScore?.score || 0) - (a.smartValueScore?.score || 0));
      setProducts(updated);
      showToast('Smart Value Scores updated!', 'success');
    }
  };

  return (
    <ShopwiseContext.Provider value={{
      allProducts,
      products,
      loading,
      backendOnline,
      dbStatus,
      apiError,
      searchMeta,
      providers,
      setApiError,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      minRating,
      setMinRating,
      minPrice,
      setMinPrice,
      maxPrice,
      setMaxPrice,
      selectedStore,
      setSelectedStore,
      availableStores,
      clearAllFilters,
      activeFiltersCount,
      currentView,
      setCurrentView,
      selectedProductId,
      setSelectedProductId,
      selectedTab,
      setSelectedTab,
      currentUser,
      authToken,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
      isAccountModalOpen,
      setIsAccountModalOpen,
      authRedirectAction,
      setAuthRedirectAction,
      navigateToLogin,
      navigateToSignUp,
      triggerPriceAlert,
      navigateToSearch,
      navigateToHome,
      navigateToProduct,
      navigateToCompare,
      navigateToAlerts,
      compareList,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearComparison,
      activeModalProduct,
      setActiveModalProduct,
      isCompareModalOpen,
      setIsCompareModalOpen,
      isAlertModalOpen,
      setIsAlertModalOpen,
      alertProductTarget,
      setAlertProductTarget,
      isAlertsDrawerOpen,
      setIsAlertsDrawerOpen,
      isArchitectureModalOpen,
      setIsArchitectureModalOpen,
      isCustomWeightModalOpen,
      setIsCustomWeightModalOpen,
      alerts,
      alertsLoading,
      alertsError,
      fetchAlerts,
      createAlert,
      updateAlert,
      deleteAlert,
      pauseAlert,
      resumeAlert,
      checkAlertsNow,
      notifications,
      unreadNotificationsCount,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      userWeights,
      applyCustomWeights,
      isDarkMode,
      setIsDarkMode,
      toast,
      showToast,
      refreshCatalog: fetchProducts
    }}>
      {children}
    </ShopwiseContext.Provider>
  );
};

export const useShopwise = () => {
  const context = useContext(ShopwiseContext);
  if (!context) throw new Error('useShopwise must be used within ShopwiseProvider');
  return context;
};
