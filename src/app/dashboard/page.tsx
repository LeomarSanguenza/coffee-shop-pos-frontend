'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { optimizedApi } from '@/lib/apiOptimized';
import {
  ShoppingCartIcon,
  CubeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await optimizedApi.get('/orders/statistics/summary');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (hasPermission('reports.view')) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  const statCards = [
    {
      name: 'Total Orders Today',
      value: (stats?.total_orders && typeof stats.total_orders === 'number') ? stats.total_orders : 0,
      icon: ShoppingCartIcon,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Revenue Today',
      value: `$${((stats?.total_revenue && typeof stats.total_revenue === 'number') ? stats.total_revenue : 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50',
      iconBg: 'bg-gradient-to-r from-emerald-500 to-green-600',
      change: '+8.2%',
      changeType: 'positive',
    },
    {
      name: 'Pending Orders',
      value: (stats?.pending_orders && typeof stats.pending_orders === 'number') ? stats.pending_orders : 0,
      icon: ClockIcon,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-gradient-to-r from-amber-500 to-orange-600',
      change: '-2.1%',
      changeType: 'negative',
    },
    {
      name: 'Completed Orders',
      value: (stats?.completed_orders && typeof stats.completed_orders === 'number') ? stats.completed_orders : 0,
      icon: CheckCircleIcon,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      iconBg: 'bg-gradient-to-r from-purple-500 to-violet-600',
      change: '+15.3%',
      changeType: 'positive',
    },
  ];

  const quickActions = [
    {
      name: 'Start New Sale',
      description: 'Process customer orders and payments',
      href: '/pos',
      icon: ShoppingCartIcon,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      permission: 'pos.access',
    },
    {
      name: 'Manage Inventory',
      description: 'Track and update product stock levels',
      href: '/inventory',
      icon: CubeIcon,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      permission: 'products.view',
    },
    {
      name: 'View Orders',
      description: 'Track and manage customer orders',
      href: '/orders',
      icon: ShoppingCartIcon,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      permission: 'orders.view',
    },
    {
      name: 'Manage Products',
      description: 'Add, edit, and organize your menu',
      href: '/products',
      icon: SparklesIcon,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      permission: 'products.view',
    },
    {
      name: 'View Reports',
      description: 'Analyze sales and performance data',
      href: '/reports',
      icon: ChartBarIcon,
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-50 to-blue-50',
      permission: 'reports.view',
    },
    {
      name: 'Manage Users',
      description: 'Control user access and permissions',
      href: '/users',
      icon: UsersIcon,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-50 to-purple-50',
      permission: 'users.view',
    },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Enhanced Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 mb-8">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                  </div>
                  <div className="text-gray-600 ml-14">
                    Welcome back, <span className="font-semibold text-indigo-600">{user?.name}</span>! Here's your business overview.
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Today</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-8 space-y-8">
            {/* Enhanced Stats Grid */}
            {hasPermission('reports.view') && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                  <div
                    key={stat.name}
                    className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <stat.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stat.changeType === 'positive' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stat.change}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-600">
                              {stat.name}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {loading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                              ) : (
                                stat.value
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ArrowTrendingUpIcon className={`h-4 w-4 ${
                            stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quickActions.map((action, index) => {
                    if (!hasPermission(action.permission)) return null;
                    
                    return (
                      <a
                        key={action.name}
                        href={action.href}
                        className={`group relative bg-gradient-to-br ${action.bgGradient} p-6 rounded-xl border border-white/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className={`${action.gradient} bg-gradient-to-r p-3 rounded-xl shadow-lg mb-4 w-fit group-hover:scale-110 transition-transform duration-300`}>
                              <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                              {action.name}
                            </h3>
                            <div className="text-sm text-gray-600 mb-4">
                              {action.description}
                            </div>
                          </div>
                          <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced User Account Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Your Account</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Full Name</div>
                    <div className="text-lg font-semibold text-gray-900">{user?.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Email Address</div>
                    <div className="text-lg font-semibold text-gray-900">{user?.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Access Level</div>
                    <div className="flex flex-wrap gap-2">
                      {user?.roles?.map((role, index) => (
                        <span
                          key={index}
                          className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200"
                        >
                          {role.display_name}
                        </span>
                      )) || (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}