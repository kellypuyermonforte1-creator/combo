import { useState, useEffect } from 'react';
import ProductPage from './components/ProductPage.tsx';
import CheckoutPage from './components/CheckoutPage.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { trackEvent } from './services/api.ts';

type ViewType = 'product' | 'checkout' | 'admin';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'product';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('admin') || hash.includes('admin')) return 'admin';
    if (path.includes('checkout') || hash.includes('checkout')) return 'checkout';
    return 'product';
  });

  // Sync with browser back/forward buttons and hash navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('admin') || hash.includes('admin')) {
        setCurrentView('admin');
      } else if (path.includes('checkout') || hash.includes('checkout')) {
        setCurrentView('checkout');
      } else {
        setCurrentView('product');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Track PageView whenever view changes
  useEffect(() => {
    trackEvent('PageView', currentView === 'checkout' ? '/checkout' : currentView === 'admin' ? '/admin' : '/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
    const search = window.location.search;
    if (view === 'checkout') {
      window.history.pushState({}, '', `/checkout${search}`);
    } else if (view === 'admin') {
      window.history.pushState({}, '', `/admin${search}`);
    } else {
      window.history.pushState({}, '', `/${search}`);
    }
  };

  if (currentView === 'admin') {
    return <AdminDashboard onClose={() => navigateTo('product')} />;
  }

  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        onBackToProduct={() => navigateTo('product')}
        onOpenAdmin={() => navigateTo('admin')}
      />
    );
  }

  return (
    <ProductPage
      onNavigateToCheckout={() => navigateTo('checkout')}
      onOpenAdmin={() => navigateTo('admin')}
    />
  );
}
