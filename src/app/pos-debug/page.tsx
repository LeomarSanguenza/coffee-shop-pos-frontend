'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { PlusIcon, MinusIcon, TrashIcon, CogIcon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface ProductOption {
  id: number;
  name: string;
  type: string;
  options: string[] | null;
  default_value: string | null;
  price_modifier: number;
  is_required: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  product_options?: ProductOption[];
}

interface Category {
  id: number;
  name: string;
}

interface CartItemCustomization {
  product_option_id: number;
  option_name: string;
  selected_value: string;
  price_modifier: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  customizations: CartItemCustomization[];
  finalPrice: number;
}

export default function POSDebugPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customizations, setCustomizations] = useState<{[key: number]: string}>({});
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Memoize expensive calculations
  const cartTotal = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  }, [cart]);

  // Filter products client-side based on selected category and search
  const filteredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    
    let filtered = allProducts;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category?.id === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(search) ||
        product.category?.name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [allProducts, selectedCategory, searchTerm]);

  // Optimize API calls with useCallback
  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/categories-debug?is_active=1');
      const categoriesData = response.data.data || response.data || [];
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
      setError('Failed to load categories: ' + (error.response?.data?.message || error.message));
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/pos/products-debug');
      const productsData = response.data || [];
      setAllProducts(productsData);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setAllProducts([]);
      setError('Failed to load products: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openCustomization = useCallback((product: Product) => {
    if (product.product_options && product.product_options.length > 0) {
      setSelectedProduct(product);
      
      // Set default values
      const defaultCustomizations: {[key: number]: string} = {};
      product.product_options.forEach(option => {
        if (option.default_value) {
          defaultCustomizations[option.id] = option.default_value;
        }
      });
      setCustomizations(defaultCustomizations);
      setShowCustomization(true);
    } else {
      // No customizations, add directly to cart
      addToCartDirect(product);
    }
  }, []);

  const addToCartDirect = useCallback((product: Product) => {
    const cartItem: CartItem = {
      product,
      quantity: 1,
      customizations: [],
      finalPrice: product.price
    };

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.customizations) === JSON.stringify(cartItem.customizations)
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, cartItem];
      }
    });
  }, []);

  const addToCartWithCustomizations = useCallback(() => {
    if (!selectedProduct) return;

    const itemCustomizations: CartItemCustomization[] = [];
    let basePrice = selectedProduct.price;
    let customizationPrice = 0;

    selectedProduct.product_options?.forEach(option => {
      const selectedValue = customizations[option.id] || option.default_value || '';
      
      if (selectedValue) {
        if (option.name === 'Size') {
          const sizeMultipliers: {[key: string]: number} = {
            'Small': 0.85,
            'Medium': 1.0,
            'Large': 1.25,
            'Extra Large': 1.5
          };
          const multiplier = sizeMultipliers[selectedValue] || 1.0;
          basePrice = selectedProduct.price * multiplier;
        } else {
          if (selectedValue !== 'None' && selectedValue !== '' && option.price_modifier > 0) {
            customizationPrice += option.price_modifier;
          }
        }

        itemCustomizations.push({
          product_option_id: option.id,
          option_name: option.name,
          selected_value: selectedValue,
          price_modifier: option.price_modifier
        });
      }
    });

    const finalPrice = basePrice + customizationPrice;

    const cartItem: CartItem = {
      product: selectedProduct,
      quantity: 1,
      customizations: itemCustomizations,
      finalPrice
    };

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => 
        item.product.id === selectedProduct.id && 
        JSON.stringify(item.customizations) === JSON.stringify(itemCustomizations)
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, cartItem];
      }
    });

    setShowCustomization(false);
    setSelectedProduct(null);
    setCustomizations({});
  }, [selectedProduct, customizations]);

  const updateQuantity = useCallback((itemIndex: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemIndex);
      return;
    }
    setCart(prevCart => {
      const newCart = [...prevCart];
      newCart[itemIndex].quantity = quantity;
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((itemIndex: number) => {
    setCart(prevCart => prevCart.filter((_, index) => index !== itemIndex));
  }, []);

  const processOrder = useCallback(async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    try {
      const orderData = {
        customer_name: customerName || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          customizations: item.customizations.map(c => ({
            product_option_id: c.product_option_id,
            selected_value: c.selected_value
          }))
        })),
        payment_method: paymentMethod,
        payment_status: 'paid',
        status: 'completed',
      };

      const response = await api.post('/orders', orderData);
      
      // Clear cart and customer name
      setCart([]);
      setCustomerName('');
      
      alert('Order processed successfully!');
    } catch (error: any) {
      alert('Failed to process order: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  }, [cart, customerName, paymentMethod]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute permission="pos.access">
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <ShoppingCartIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Point of Sale (Debug Mode)
              </h1>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchProducts();
                      fetchCategories();
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Category Filter */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading products...</div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredProducts.length} of {allProducts.length} products
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => openCustomization(product)}
                        className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left relative"
                      >
                        {product.product_options && product.product_options.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <CogIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                        )}
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category?.name}</p>
                        <p className="text-lg font-bold text-indigo-600 mt-2">
                          ${product.price.toFixed(2)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      {allProducts.length === 0 ? 'No products available' : 'No products match your search'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-white/90 backdrop-blur-sm shadow-2xl flex flex-col border-l border-gray-200/50">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
          </div>

          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter customer name"
            />
          </div>

          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital_wallet">Digital Wallet</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">${item.finalPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 text-red-400 hover:text-red-600 ml-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {item.customizations.length > 0 && (
                      <div className="text-xs text-gray-600 space-y-1">
                        {item.customizations.map((customization, custIndex) => (
                          <div key={custIndex} className="flex justify-between">
                            <span>{customization.option_name}:</span>
                            <span>{customization.selected_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={processOrder}
                disabled={processing}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Process Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}