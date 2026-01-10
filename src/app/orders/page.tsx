'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { optimizedApi } from '@/lib/apiOptimized';
import { 
  EyeIcon, 
  PencilIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  user: {
    name: string;
  };
  order_items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      name: string;
    };
    customizations?: Array<{
      id: number;
      option_name: string;
      selected_value: string;
      price_modifier: number;
    }>;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setUpdating(true);
      await optimizedApi.put(`/orders/${selectedOrder.id}`, {
        status: newStatus
      });
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus }
          : order
      ));
      
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <CogIcon className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('payment_status', paymentFilter);
      
      const response = await optimizedApi.get(`/orders?${params}`);
      const ordersData = response.data.data || [];
      // Ensure each order has order_items as an array
      const safeOrders = ordersData.map((order: any) => ({
        ...order,
        order_items: Array.isArray(order.order_items) ? order.order_items : []
      }));
      setOrders(safeOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]); // Ensure orders is always an array
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ProtectedRoute permission="orders.view">
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Enhanced Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 mb-8">
            <div className="px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                      <CogIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Order Management
                    </h1>
                  </div>
                  <p className="text-gray-600 ml-14">
                    View and manage customer orders with status tracking
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-8 space-y-6">
            {/* Enhanced Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Filter Orders</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="">All Payment Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter('');
                        setPaymentFilter('');
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CogIcon className="h-5 w-5 text-gray-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {orders.length} orders
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cashier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            <div className="text-gray-500 font-medium">Loading orders...</div>
                          </div>
                        </td>
                      </tr>
                    ) : orders && orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                              <CogIcon className="h-10 w-10 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                              <p className="text-gray-500">Try adjusting your filters or check back later</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders && orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                                <CogIcon className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                  {order.order_number}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.order_items?.length || 0} items
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {order.customer_name || 'Walk-in Customer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              ${(order.total_amount || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status || 'pending')}
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status || 'pending')}`}>
                                {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                              {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                            </span>
                            {order.payment_method && (
                              <div className="text-xs text-gray-500 mt-1">
                                {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{order.user?.name || 'Unknown'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openStatusModal(order)}
                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                                title="Update Status"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Status Update Modal */}
          {showStatusModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Update Order Status</h3>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Order Number</div>
                    <div className="font-semibold text-gray-900">{selectedOrder.order_number}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Customer</div>
                    <div className="font-medium text-gray-900">
                      {selectedOrder.customer_name || 'Walk-in Customer'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Current Status</div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedOrder.status)}
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      New Status
                    </label>
                    <div className="space-y-2">
                      {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                        <label key={status} className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            value={status}
                            checked={newStatus === status}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <div className="ml-3 flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <span className="text-sm font-medium text-gray-900">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || newStatus === selectedOrder.status}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Status</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}