import React from 'react';
import { ShopwiseProvider, useShopwise } from './context/ShopwiseContext';
import Navbar from './components/Navbar';
import CategorySection from './components/CategorySection';
import TrendingDealsSection from './components/TrendingDealsSection';
import SearchResultsPage from './components/SearchResultsPage';
import ProductDetailsPage from './components/ProductDetailsPage';
import ComparePage from './components/ComparePage';
import PriceAlertsPage from './components/PriceAlertsPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import AccountModal from './components/AccountModal';
import Footer from './components/Footer';

// Modals & Drawers (preserved for full functionality)
import ProductDetailModal from './components/ProductDetailModal';
import CompareDrawer from './components/CompareDrawer';
import CompareModal from './components/CompareModal';
import PriceAlertModal from './components/PriceAlertModal';
import ActiveAlertsDrawer from './components/ActiveAlertsDrawer';
import Toast from './components/Toast';

function AppContent() {
  const { currentView } = useShopwise();

  return (
    <div className="app-container">
      {/* 1. Search Header with Logo, Wide Search Bar & Icons */}
      <Navbar />

      <main style={{ flex: 1 }}>
        {currentView === 'login' ? (
          /* Dedicated Login Page */
          <LoginPage />
        ) : currentView === 'signup' ? (
          /* Dedicated Sign Up Page */
          <SignUpPage />
        ) : currentView === 'alerts' ? (
          /* Dedicated Price Alerts Dashboard */
          <PriceAlertsPage />
        ) : currentView === 'compare' ? (
          /* Dedicated Compare Page */
          <ComparePage />
        ) : currentView === 'product' ? (
          /* Dedicated Product Details Page */
          <ProductDetailsPage />
        ) : currentView === 'search' ? (
          /* Dedicated Search Results Page */
          <SearchResultsPage />
        ) : (
          /* Preserved Home Page */
          <>
            <CategorySection />
            <TrendingDealsSection />
          </>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <Footer />

      {/* Global Modals & Drawers (Preserved functionality) */}
      <AccountModal />
      <ProductDetailModal />
      <CompareDrawer />
      <CompareModal />
      <PriceAlertModal />
      <ActiveAlertsDrawer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ShopwiseProvider>
      <AppContent />
    </ShopwiseProvider>
  );
}
