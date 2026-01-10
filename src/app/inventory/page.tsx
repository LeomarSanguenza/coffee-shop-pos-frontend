'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { optimizedApi } from '@/lib/apiOptimized';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  price: number;
  cost?: number;
  description?: string;
  is_active: boolean;
  category_id: number;
  category: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}
interface CategoryStats {
  category: string;
  productCount: number;
  totalValue: number;
  lowStockCount: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  category_id: number;
  is_active: boolean;
}

interface StockUpdateData {
  action: 'increase' | 'decrease' | 'set';
  quantity: number;
}

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'products'>('dashboard');
  
  // Product management states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);
  
  // Form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    category_id: 0,
    is_active: true
  });
  
  const [stockUpdateData, setStockUpdateData] = useState<StockUpdateData>({
    action: 'set',
    quantity: 0
  });
  useEffect(() => {
    fetchInventoryData();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentView === 'products') {
      fetchProducts();
    }
  }, [currentView, currentPage, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [statsResponse, lowStockResponse, outOfStockResponse] = await Promise.all([
        optimizedApi.get('/inventory/stats'),
        optimizedApi.get('/inventory/low-stock?limit=10'),
        optimizedApi.get('/inventory/out-of-stock?limit=10')
      ]);

      // Ensure we have valid data with fallbacks
      setStats({
        totalProducts: statsResponse.data?.total_products || 0,
        totalValue: statsResponse.data?.total_value || 0,
        lowStockCount: statsResponse.data?.low_stock_count || 0,
        outOfStockCount: statsResponse.data?.out_of_stock_count || 0,
        categoriesCount: statsResponse.data?.categories_count || 0
      });
      
      setLowStockProducts(lowStockResponse.data || []);
      setOutOfStockProducts(outOfStockResponse.data || []);

      const productsResponse = await optimizedApi.get('/products?per_page=1000');
      const products = productsResponse.data?.data || [];
      
      const categoryStatsMap = new Map();
      products.forEach((product: Product) => {
        const categoryName = product?.category?.name || 'Unknown';
        if (!categoryStatsMap.has(categoryName)) {
          categoryStatsMap.set(categoryName, {
            category: categoryName,
            productCount: 0,
            totalValue: 0,
            lowStockCount: 0
          });
        }
        const stats = categoryStatsMap.get(categoryName);
        stats.productCount++;
        stats.totalValue += (product?.stock_quantity || 0) * (product?.price || 0);
        if ((product?.stock_quantity || 0) <= (product?.min_stock_level || 0)) {
          stats.lowStockCount++;
        }
      });

      setCategoryStats(Array.from(categoryStatsMap.values()));
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      // Set default values on error
      setStats({
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        categoriesCount: 0
      });
      setLowStockProducts([]);
      setOutOfStockProducts([]);
      setCategoryStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await optimizedApi.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (stockFilter === 'low') params.append('low_stock', 'true');
      
      const response = await optimizedApi.get(`/products?${params}`);
      let productsData = response.data?.data || [];

      if (stockFilter === 'out') {
        productsData = productsData.filter((p: Product) => (p?.stock_quantity || 0) === 0);
      }

      productsData.sort((a: Product, b: Product) => {
        let aValue, bValue;
        switch (sortBy) {
          case 'name':
            aValue = (a?.name || '').toLowerCase();
            bValue = (b?.name || '').toLowerCase();
            break;
          case 'stock':
            aValue = a?.stock_quantity || 0;
            bValue = b?.stock_quantity || 0;
            break;
          case 'price':
            aValue = a?.price || 0;
            bValue = b?.price || 0;
            break;
          case 'updated':
            aValue = new Date(a?.updated_at || 0).getTime();
            bValue = new Date(b?.updated_at || 0).getTime();
            break;
          default:
            aValue = (a?.name || '').toLowerCase();
            bValue = (b?.name || '').toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setProducts(productsData);
      setTotalPages(response.data?.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await optimizedApi.post('/products', formData);
      setShowProductModal(false);
      resetForm();
      fetchProducts();
      fetchInventoryData();
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      await optimizedApi.put(`/products/${selectedProduct.id}`, formData);
      setShowProductModal(false);
      resetForm();
      fetchProducts();
      fetchInventoryData();
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await optimizedApi.delete(`/products/${selectedProduct.id}`);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchInventoryData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      await optimizedApi.patch(`/products/${selectedProduct.id}/stock`, stockUpdateData);
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockUpdateData({ action: 'set', quantity: 0 });
      fetchProducts();
      fetchInventoryData();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price,
      cost: product.cost || 0,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      category_id: product.category_id,
      is_active: product.is_active
    });
    setIsEditing(true);
    setShowProductModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditing(false);
    setShowProductModal(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockUpdateData({ action: 'set', quantity: product.stock_quantity });
    setShowStockModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: 0,
      cost: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      category_id: 0,
      is_active: true
    });
    setSelectedProduct(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return 'out';
    if (product.stock_quantity <= product.min_stock_level) return 'low';
    return 'good';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-100 border-red-200';
      case 'low': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Out of Stock';
      case 'low': return 'Low Stock';
      default: return 'In Stock';
    }
  };
  if (loading && currentView === 'dashboard') {
    return (
      <ProtectedRoute permission="products.view">
        <Layout>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading inventory data...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permission="products.view">
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Enhanced Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 mb-8">
            <div className="px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      {currentView === 'dashboard' ? (
                        <ChartBarIcon className="h-6 w-6 text-white" />
                      ) : (
                        <CubeIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {currentView === 'dashboard' ? 'Inventory Dashboard' : 'Product Management'}
                    </h1>
                  </div>
                  <p className="text-gray-600 ml-14">
                    {currentView === 'dashboard' 
                      ? 'Real-time overview of your inventory status and key metrics'
                      : 'Comprehensive product and inventory management system'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentView(currentView === 'dashboard' ? 'products' : 'dashboard')}
                    className="group inline-flex items-center px-6 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                  >
                    {currentView === 'dashboard' ? (
                      <>
                        <CubeIcon className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" />
                        Manage Products
                      </>
                    ) : (
                      <>
                        <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" />
                        Dashboard
                      </>
                    )}
                  </button>
                  {currentView === 'products' && (
                    <button
                      onClick={openCreateModal}
                      className="group inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:scale-105"
                    >
                      <PlusIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                      Add Product
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {currentView === 'dashboard' ? (
            <div className="px-6 pb-8 space-y-8">
              {/* Enhanced Key Metrics */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                          <CubeIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Total Products</dt>
                          <dd className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {(stats?.totalProducts || 0).toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                          <ChartBarIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Total Value</dt>
                          <dd className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            ${(stats?.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 opacity-50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg">
                          <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Low Stock</dt>
                          <dd className="text-2xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                            {stats?.lowStockCount || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 opacity-50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl shadow-lg">
                          <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Out of Stock</dt>
                          <dd className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                            {stats?.outOfStockCount || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-50"></div>
                  <div className="relative p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                          <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-600 truncate">Categories</dt>
                          <dd className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {stats?.categoriesCount || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Enhanced Alert Cards */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Low Stock Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-white mr-3" />
                      <h3 className="text-lg font-semibold text-white">Low Stock Alert</h3>
                      {(stats?.lowStockCount || 0) > 0 && (
                        <span className="ml-auto bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                          {stats?.lowStockCount || 0} items
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {lowStockProducts && lowStockProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CubeIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-gray-500 font-medium">All products are well stocked!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lowStockProducts && lowStockProducts.map((product) => (
                          <div key={product.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-all duration-200">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">SKU:</span> {product.sku} • 
                                <span className="font-medium ml-1">{product.category.name}</span>
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-amber-800">
                                    {product.stock_quantity} / {product.min_stock_level}
                                  </p>
                                  <p className="text-xs text-gray-500">Current / Min</p>
                                </div>
                                <div className="w-2 h-8 bg-gradient-to-t from-amber-200 to-amber-400 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Out of Stock Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                    <div className="flex items-center">
                      <ArrowTrendingDownIcon className="h-6 w-6 text-white mr-3" />
                      <h3 className="text-lg font-semibold text-white">Out of Stock</h3>
                      {(stats?.outOfStockCount || 0) > 0 && (
                        <span className="ml-auto bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                          {stats?.outOfStockCount || 0} items
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {outOfStockProducts && outOfStockProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CubeIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-gray-500 font-medium">No products out of stock!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {outOfStockProducts && outOfStockProducts.map((product) => (
                          <div key={product.id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100 hover:border-red-200 transition-all duration-200">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">SKU:</span> {product.sku} • 
                                <span className="font-medium ml-1">{product.category.name}</span>
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-800">0 units</p>
                                  <p className="text-xs text-red-600 font-medium">Restock needed</p>
                                </div>
                                <div className="w-2 h-8 bg-gradient-to-t from-red-200 to-red-400 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Enhanced Category Statistics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-6 w-6 text-white mr-3" />
                    <h3 className="text-lg font-semibold text-white">Inventory by Category</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Products
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total Value
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Low Stock Items
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {categoryStats && categoryStats.map((category, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mr-3"></div>
                                <span className="text-sm font-semibold text-gray-900">{category.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700 font-medium">{category.productCount}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700 font-medium">
                                ${(category?.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {category.lowStockCount > 0 ? (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                  {category.lowStockCount}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                  <CubeIcon className="h-3 w-3 mr-1" />
                                  0
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-8 space-y-6">
              {/* Enhanced Filters and Search */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Search & Filter Products</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
                    {/* Enhanced Search */}
                    <div className="lg:col-span-2 relative group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search by name or SKU..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>

                    {/* Enhanced Category Filter */}
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value))}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 hover:border-gray-300"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Enhanced Stock Filter */}
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                      <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 hover:border-gray-300"
                      >
                        <option value="all">All Stock Levels</option>
                        <option value="low">Low Stock Only</option>
                        <option value="out">Out of Stock Only</option>
                      </select>
                    </div>

                    {/* Enhanced Sort By */}
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'stock' | 'price' | 'updated')}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 hover:border-gray-300"
                      >
                        <option value="name">Product Name</option>
                        <option value="stock">Stock Level</option>
                        <option value="price">Price</option>
                        <option value="updated">Last Updated</option>
                      </select>
                    </div>

                    {/* Enhanced Sort Order */}
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        {sortOrder === 'asc' ? (
                          <>
                            <ArrowUpIcon className="h-4 w-4 mr-2" />
                            Ascending
                          </>
                        ) : (
                          <>
                            <ArrowDownIcon className="h-4 w-4 mr-2" />
                            Descending
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Enhanced Products Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CubeIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      {products.length} products
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <div className="text-gray-500 font-medium">Loading products...</div>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CubeIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add First Product
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Product Details
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                SKU
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Stock Level
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {products.map((product) => {
                              const stockStatus = getStockStatus(product);
                              return (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                                        <CubeIcon className="h-6 w-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                          {product?.name || 'Unknown Product'}
                                        </div>
                                        {product?.description && (
                                          <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                                            {product.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                      {product?.sku || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                      {product?.category?.name || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${(product?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {product?.stock_quantity || 0}
                                      </span>
                                      <span className="text-xs text-gray-500">/</span>
                                      <span className="text-xs text-gray-500">
                                        {product?.min_stock_level || 0} min
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStockStatusColor(stockStatus)}`}>
                                      {stockStatus === 'out' && <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />}
                                      {stockStatus === 'low' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                                      {stockStatus === 'good' && <CubeIcon className="h-3 w-3 mr-1" />}
                                      {getStockStatusText(stockStatus)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => openStockModal(product)}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                        title="Update Stock"
                                      >
                                        <Cog6ToothIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openEditModal(product)}
                                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                        title="Edit Product"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => openDeleteModal(product)}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Delete Product"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Enhanced Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              Page {currentPage} of {totalPages}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({products.length} products)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Enhanced Product Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      {isEditing ? 'Edit Product' : 'Create New Product'}
                    </h3>
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={isEditing ? handleUpdateProduct : handleCreateProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                        <input
                          type="text"
                          required
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono"
                          placeholder="SKU-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value={0}>Select Category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                          placeholder="Product description (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cost ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Min Stock Level</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.min_stock_level}
                          onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 block text-sm font-medium text-gray-900">Product is active</label>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowProductModal(false)}
                        className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                      >
                        {isEditing ? 'Update Product' : 'Create Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* Enhanced Stock Update Modal */}
          {showStockModal && selectedProduct && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Update Stock</h3>
                    <button
                      onClick={() => setShowStockModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                        <CubeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Current Stock</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock_quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Min Level</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedProduct.min_stock_level}</p>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleUpdateStock} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Action</label>
                      <select
                        value={stockUpdateData.action}
                        onChange={(e) => setStockUpdateData({ ...stockUpdateData, action: e.target.value as 'increase' | 'decrease' | 'set' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="set">Set stock to</option>
                        <option value="increase">Increase stock by</option>
                        <option value="decrease">Decrease stock by</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={stockUpdateData.quantity}
                        onChange={(e) => setStockUpdateData({ ...stockUpdateData, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowStockModal(false)}
                        className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                      >
                        Update Stock
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {/* Enhanced Delete Confirmation Modal */}
          {showDeleteModal && selectedProduct && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-300">
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Delete Product</h3>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center mr-4">
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ This action cannot be undone. The product will be permanently removed from your inventory.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-200"
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}