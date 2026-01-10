'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { optimizedApi } from '@/lib/apiOptimized';

interface User {
  id: number;
  name: string;
  email: string;
  roles: Array<{
    id: number;
    name: string;
    display_name: string;
    permissions: string[];
  }>;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure user object has required arrays
        const safeUser = {
          ...parsedUser,
          roles: Array.isArray(parsedUser.roles) ? parsedUser.roles : [],
          permissions: Array.isArray(parsedUser.permissions) ? parsedUser.permissions : []
        };
        setUser(safeUser);
        
        // Verify token is still valid
        optimizedApi.get('/user').then((response) => {
          const userData = response.data.user;
          const safeUserData = {
            ...userData,
            roles: Array.isArray(userData.roles) ? userData.roles : [],
            permissions: Array.isArray(userData.permissions) ? userData.permissions : []
          };
          setUser(safeUserData);
          localStorage.setItem('user', JSON.stringify(safeUserData));
        }).catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
        });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await optimizedApi.post('/login', { email, password });
      const { user, token } = response.data;
      
      // Ensure user object has required arrays
      const safeUser = {
        ...user,
        roles: Array.isArray(user.roles) ? user.roles : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : []
      };
      
      // Ensure we're on the client side before accessing localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(safeUser));
      }
      setUser(safeUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    optimizedApi.post('/logout').catch(() => {
      // Ignore errors on logout
    });
    
    // Ensure we're on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some(r => r && r.name === role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      hasPermission,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}