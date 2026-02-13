'use client';

import { useState, useEffect } from 'react';
import SystemAdminLayout from '@/components/SystemAdminLayout';
import { api } from '@/lib/api';
import {
  BuildingOfficeIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SystemStats {
  total_branches: number;
  active_branches: number;
  inactive_branches: number;
  total_users: number;
  total_orders: number;
  total_revenue: number;
  orders_today: number;
  revenue_today: number;
}

interface BranchSummary {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  users_count: number;
  orders_count: number;
  revenue_today: number;
  last_order_at: string | null;
}

export default function SystemAdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch branches
      const branchesResponse = await api.get('/branches');
      const branchesData = branchesResponse.data.data || branchesResponse.data || [];
      setBranches(branchesData);

      // Fetch stats for each branch and calculate totals
      const statsPromises = branchesData.map(async (branch: any) => {
        try {
          const statsResponse = await api.get(`/branches/${branch.id}/stats`);
          return { ...branch, ...statsResponse.data };
        } catch (error) {
          console.error(`Failed to fetch stats for branch ${branch.id}:`, error);
          return branch;
        }
      });

      const branchesWithStats = await Promise.all(statsPromises);
      setBranches(branchesWithStats);

      // Calculate system-wide stats
      const systemStats: SystemStats = {
        total_branches: branchesData.length,
        active_branches: branchesData.filter((b: any) => b.is_active).length,
        inactive_branches: branchesData.filter((b: any) => !b.is_active).length,
        total_users: branchesWithStats.reduce((sum, b) => sum + (b.users_count || 0), 0),
        total_orders: branchesWithStats.reduce((sum, b) => sum + (b.orders_count || 0), 0),
        total_revenue: branchesWithStats.reduce((sum, b) => sum + (b.revenue_this_month || 0), 0),
        orders_today: branchesWithStats.reduce((sum, b) => sum + (b.orders_today || 0), 0),
        revenue_today: branchesWithStats.reduce((sum, b) => sum + (b.revenue_today || 0), 0),
      };

      setStats(systemStats);
    } catch (error: any) {
      console.error('Failed to fetch system data:', error);
      setError('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SystemAdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </SystemAdminLayout>
    );
  }

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="mt-2 text-gray-600">
            Manage your multi-tenant coffee shop POS system
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchSystemData}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Branches
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_branches}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{stats.active_branches} active</span>
                  {stats.inactive_branches > 0 && (
                    <span className="text-gray-500 ml-2">{stats.inactive_branches} inactive</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_users}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  Across all branches
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Orders Today
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.orders_today}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  {stats.total_orders} total orders
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Revenue Today
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${parseFloat(stats.revenue_today || 0).toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  ${parseFloat(stats.total_revenue || 0).toFixed(2)} this month
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/system-admin/branches"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Create New Branch
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Set up a new coffee shop location with complete configuration
                  </p>
                </div>
              </a>

              <a
                href="/system-admin/users"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <UsersIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Manage Users
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create and manage user accounts across all branches
                  </p>
                </div>
              </a>

              <a
                href="/system-admin/reports"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <ChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    System Reports
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View comprehensive reports across all branches
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Branch Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Branch Overview
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Today
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {branch.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {branch.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            branch.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.users_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.orders_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(branch.revenue_today || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.last_order_at
                          ? new Date(branch.last_order_at).toLocaleDateString()
                          : 'No orders'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SystemAdminLayout>
  );
}