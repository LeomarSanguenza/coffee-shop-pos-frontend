import { lazy } from 'react';

// Lazy load heavy components
export const LazyInventoryPage = lazy(() => import('@/app/inventory/page'));
export const LazyProductsPage = lazy(() => import('@/app/products/page'));
export const LazyOrdersPage = lazy(() => import('@/app/orders/page'));
export const LazyPOSPage = lazy(() => import('@/app/pos/page'));

// Loading component
export const ComponentLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);