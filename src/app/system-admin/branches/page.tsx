'use client';

import { useState, useEffect } from 'react';
import SystemAdminLayout from '@/components/SystemAdminLayout';
import { api } from '@/lib/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface Branch {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  business_hours?: any;
  timezone: string;
  currency: string;
  tax_rate: number;
  settings?: any;
  is_active: boolean;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

interface BranchStats {
  users_count: number;
  categories_count: number;
  products_count: number;
  orders_count: number;
  orders_today: number;
  revenue_today: number;
  revenue_this_month: number;
}

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchStats, setBranchStats] = useState<{ [key: number]: BranchStats }>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBranch, setDetailsBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    phone: '',
    email: '',
    manager_name: '',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    tax_rate: 0.1,
    is_active: true,
    business_hours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '09:00', close: '19:00', closed: false },
    },
    settings: {
      receipt_footer: 'Thank you for your visit!',
      allow_discounts: true,
      require_customer_name: false,
      auto_print_receipt: true,
      low_stock_alert: true,
      inventory_tracking: true,
    },
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branches');
      const branchesData = response.data.data || response.data;
      setBranches(branchesData);
      
      // Fetch stats for each branch
      const statsPromises = branchesData.map(async (branch: Branch) => {
        try {
          const statsResponse = await api.get(`/branches/${branch.id}/stats`);
          return { branchId: branch.id, stats: statsResponse.data };
        } catch (error) {
          console.error(`Failed to fetch stats for branch ${branch.id}:`, error);
          return { branchId: branch.id, stats: null };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap: { [key: number]: BranchStats } = {};
      statsResults.forEach(({ branchId, stats }) => {
        if (stats) {
          statsMap[branchId] = stats;
        }
      });
      setBranchStats(statsMap);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedBranch) {
        await api.put(`/branches/${selectedBranch.id}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      
      setShowCreateModal(false);
      setSelectedBranch(null);
      resetForm();
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to save branch:', error);
      setError(error.response?.data?.message || 'Failed to save branch');
    }
  };

  const handleActivate = async (branch: Branch) => {
    try {
      await api.post(`/branches/${branch.id}/activate`);
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to activate branch:', error);
      setError(error.response?.data?.message || 'Failed to activate branch');
    }
  };

  const handleDeactivate = async (branch: Branch) => {
    try {
      await api.post(`/branches/${branch.id}/deactivate`);
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to deactivate branch:', error);
      setError(error.response?.data?.message || 'Failed to deactivate branch');
    }
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      description: branch.description || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      postal_code: branch.postal_code || '',
      country: branch.country || 'USA',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_name: branch.manager_name || '',
      timezone: branch.timezone,
      currency: branch.currency,
      tax_rate: branch.tax_rate,
      is_active: branch.is_active,
      business_hours: branch.business_hours || {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '21:00', closed: false },
        sunday: { open: '09:00', close: '19:00', closed: false },
      },
      settings: branch.settings || {
        receipt_footer: 'Thank you for your visit!',
        allow_discounts: true,
        require_customer_name: false,
        auto_print_receipt: true,
        low_stock_alert: true,
        inventory_tracking: true,
      },
    });
    setShowCreateModal(true);
  };

  const handleViewDetails = (branch: Branch) => {
    setDetailsBranch(branch);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA',
      phone: '',
      email: '',
      manager_name: '',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      tax_rate: 0.1,
      is_active: true,
      business_hours: {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '21:00', closed: false },
        sunday: { open: '09:00', close: '19:00', closed: false },
      },
      settings: {
        receipt_footer: 'Thank you for your visit!',
        allow_discounts: true,
        require_customer_name: false,
        auto_print_receipt: true,
        low_stock_alert: true,
        inventory_tracking: true,
      },
    });
  };

  const handleCreateNew = () => {
    setSelectedBranch(null);
    resetForm();
    setShowCreateModal(true);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
            <p className="mt-2 text-gray-600">
              Create and manage coffee shop branches across your network
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Branch
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{branch.name}</h3>
                    <p className="text-sm text-gray-500">Code: {branch.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {branch.description && (
                  <p className="text-gray-600 mb-3 text-sm">{branch.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {branch.address && (
                    <p className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                      {branch.city}, {branch.state}
                    </p>
                  )}
                  {branch.manager_name && (
                    <p className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      {branch.manager_name}
                    </p>
                  )}
                  <p className="flex items-center">
                    <span className="text-xs">🌍</span>
                    <span className="ml-2">{branch.timezone}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-xs">💰</span>
                    <span className="ml-2">{branch.currency} (Tax: {(branch.tax_rate * 100).toFixed(2)}%)</span>
                  </p>
                </div>

                {branchStats[branch.id] && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <UsersIcon className="h-3 w-3 mr-1 text-gray-400" />
                        {branchStats[branch.id].users_count} users
                      </div>
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-3 w-3 mr-1 text-gray-400" />
                        {branchStats[branch.id].products_count} products
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs mr-1">📦</span>
                        {branchStats[branch.id].orders_count} orders
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs mr-1">📈</span>
                        {branchStats[branch.id].orders_today} today
                      </div>
                      <div className="col-span-2 flex items-center">
                        <CurrencyDollarIcon className="h-3 w-3 mr-1 text-gray-400" />
                        ${branchStats[branch.id].revenue_today?.toFixed(2) || '0.00'} today
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(branch)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(branch)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  {branch.is_active ? (
                    <button
                      onClick={() => handleDeactivate(branch)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(branch)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {selectedBranch ? 'Edit Branch' : 'Create New Branch'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manager Name
                        </label>
                        <input
                          type="text"
                          value={formData.manager_name}
                          onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Location Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="USA">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="Australia">Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Configuration */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active Branch
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setSelectedBranch(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {selectedBranch ? 'Update Branch' : 'Create Branch'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && detailsBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">{detailsBranch.name}</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Branch Information</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Code</dt>
                        <dd className="text-sm text-gray-900">{detailsBranch.code}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              detailsBranch.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {detailsBranch.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </dd>
                      </div>
                      {detailsBranch.manager_name && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Manager</dt>
                          <dd className="text-sm text-gray-900">{detailsBranch.manager_name}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                        <dd className="text-sm text-gray-900">{detailsBranch.timezone}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Currency</dt>
                        <dd className="text-sm text-gray-900">{detailsBranch.currency}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Tax Rate</dt>
                        <dd className="text-sm text-gray-900">{(detailsBranch.tax_rate * 100).toFixed(2)}%</dd>
                      </div>
                    </dl>
                  </div>

                  {(detailsBranch.address || detailsBranch.phone || detailsBranch.email) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                      <dl className="space-y-3">
                        {detailsBranch.address && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="text-sm text-gray-900">
                              {detailsBranch.address}
                              {detailsBranch.city && `, ${detailsBranch.city}`}
                              {detailsBranch.state && `, ${detailsBranch.state}`}
                              {detailsBranch.postal_code && ` ${detailsBranch.postal_code}`}
                            </dd>
                          </div>
                        )}
                        {detailsBranch.phone && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="text-sm text-gray-900">{detailsBranch.phone}</dd>
                          </div>
                        )}
                        {detailsBranch.email && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-900">{detailsBranch.email}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {branchStats[detailsBranch.id] && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Statistics</h3>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Users</dt>
                          <dd className="text-sm text-gray-900">{branchStats[detailsBranch.id].users_count}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Products</dt>
                          <dd className="text-sm text-gray-900">{branchStats[detailsBranch.id].products_count}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Total Orders</dt>
                          <dd className="text-sm text-gray-900">{branchStats[detailsBranch.id].orders_count}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Orders Today</dt>
                          <dd className="text-sm text-gray-900">{branchStats[detailsBranch.id].orders_today}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Revenue Today</dt>
                          <dd className="text-sm text-gray-900">${branchStats[detailsBranch.id].revenue_today?.toFixed(2) || '0.00'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Revenue This Month</dt>
                          <dd className="text-sm text-gray-900">${branchStats[detailsBranch.id].revenue_this_month?.toFixed(2) || '0.00'}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SystemAdminLayout>
  );
}