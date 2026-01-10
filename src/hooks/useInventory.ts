import { useState, useCallback } from 'react';
import { optimizedApi } from '@/lib/apiOptimized';

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

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
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

interface UseInventoryReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Data fetching
  fetchStats: () => Promise<InventoryStats | null>;
  fetchProducts: (params?: any) => Promise<{ data: Product[]; meta: any } | null>;
  fetchLowStockProducts: (limit?: number) => Promise<Product[] | null>;
  fetchOutOfStockProducts: (limit?: number) => Promise<Product[] | null>;
  
  // CRUD operations
  createProduct: (data: ProductFormData) => Promise<Product | null>;
  updateProduct: (id: number, data: ProductFormData) => Promise<Product | null>;
  deleteProduct: (id: number) => Promise<boolean>;
  
  // Stock operations
  updateStock: (id: number, data: StockUpdateData) => Promise<Product | null>;
  bulkUpdateStock: (updates: Array<{ id: number } & StockUpdateData>) => Promise<any>;
  
  // Utility functions
  clearError: () => void;
}

export const useInventory = (): UseInventoryReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, defaultMessage: string) => {
    console.error(err);
    const message = err.response?.data?.message || err.message || defaultMessage;
    setError(message);
    return null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchStats = useCallback(async (): Promise<InventoryStats | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.get('/inventory/stats');
      return response.data;
    } catch (err) {
      return handleError(err, 'Failed to fetch inventory statistics');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchProducts = useCallback(async (params: any = {}): Promise<{ data: Product[]; meta: any } | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key].toString());
        }
      });

      const response = await optimizedApi.get(`/products?${queryParams}`);
      return {
        data: response.data.data,
        meta: {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        }
      };
    } catch (err) {
      return handleError(err, 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchLowStockProducts = useCallback(async (limit: number = 10): Promise<Product[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.get(`/inventory/low-stock?limit=${limit}`);
      return response.data;
    } catch (err) {
      return handleError(err, 'Failed to fetch low stock products');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchOutOfStockProducts = useCallback(async (limit: number = 10): Promise<Product[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.get(`/inventory/out-of-stock?limit=${limit}`);
      return response.data;
    } catch (err) {
      return handleError(err, 'Failed to fetch out of stock products');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createProduct = useCallback(async (data: ProductFormData): Promise<Product | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.post('/products', data);
      return response.data.product;
    } catch (err) {
      return handleError(err, 'Failed to create product');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateProduct = useCallback(async (id: number, data: ProductFormData): Promise<Product | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.put(`/products/${id}`, data);
      return response.data.product;
    } catch (err) {
      return handleError(err, 'Failed to update product');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await optimizedApi.delete(`/products/${id}`);
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateStock = useCallback(async (id: number, data: StockUpdateData): Promise<Product | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.patch(`/products/${id}/stock`, data);
      return response.data.product;
    } catch (err) {
      return handleError(err, 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const bulkUpdateStock = useCallback(async (updates: Array<{ id: number } & StockUpdateData>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await optimizedApi.patch('/products/bulk-stock', { updates });
      return response.data;
    } catch (err) {
      return handleError(err, 'Failed to bulk update stock');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    fetchStats,
    fetchProducts,
    fetchLowStockProducts,
    fetchOutOfStockProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    bulkUpdateStock,
    clearError
  };
};