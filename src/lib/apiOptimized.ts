import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API batching utility
class ApiBatcher {
  private batchQueue: Array<{
    url: string;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  public batchGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ url, resolve, reject });
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, 50); // Batch requests within 50ms
    });
  }

  private async executeBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    try {
      // Execute all requests in parallel
      const promises = batch.map(({ url }) => api.get(url));
      const responses = await Promise.allSettled(promises);

      responses.forEach((result, index) => {
        const { resolve, reject } = batch[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}

export const apiBatcher = new ApiBatcher();

// Cache for frequently accessed data
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  public get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  public set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

// Retry utility
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or auth errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Optimized API methods
export const optimizedApi = {
  // Cached GET request with retry
  async getCached(url: string, ttl?: number): Promise<any> {
    const cached = apiCache.get(url);
    if (cached) return cached;

    const response = await withRetry(() => api.get(url));
    apiCache.set(url, response, ttl);
    return response;
  },

  // Batched GET request
  async getBatched(url: string): Promise<any> {
    return apiBatcher.batchGet(url);
  },

  // Regular methods with retry
  async get(url: string, config?: any): Promise<any> {
    return withRetry(() => api.get(url, config));
  },
  
  async post(url: string, data?: any, config?: any): Promise<any> {
    return withRetry(() => api.post(url, data, config));
  },
  
  async put(url: string, data?: any, config?: any): Promise<any> {
    return withRetry(() => api.put(url, data, config));
  },
  
  async patch(url: string, data?: any, config?: any): Promise<any> {
    return withRetry(() => api.patch(url, data, config));
  },
  
  async delete(url: string, config?: any): Promise<any> {
    return withRetry(() => api.delete(url, config));
  },
};

export default optimizedApi;