'use client';

import { useEffect, useState, useCallback } from 'react';
import { optimizedApi } from '@/lib/apiOptimized';
import {
  ClockIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: number;
    quantity: number;
    product: {
      name: string;
    };
    customizations?: Array<{
      option_name: string;
      selected_value: string;
    }>;
  }>;
}

export default function OrderDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await optimizedApi.get('/orders?status=pending,processing');
      const ordersData = response.data.data || [];
      setOrders(ordersData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Order Received',
          subtitle: 'Preparing your order...',
          icon: ClockIcon,
          gradient: 'from-amber-400 to-orange-500',
          bgGradient: 'from-amber-50 to-orange-50',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200',
        };
      case 'processing':
        return {
          title: 'Now Preparing',
          subtitle: 'Your order is being made',
          icon: CogIcon,
          gradient: 'from-blue-400 to-indigo-500',
          bgGradient: 'from-blue-50 to-indigo-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
        };
      default:
        return {
          title: 'Ready',
          subtitle: 'Please collect your order',
          icon: CheckCircleIcon,
          gradient: 'from-green-400 to-emerald-500',
          bgGradient: 'from-green-50 to-emerald-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        };
    }
  };

  const formatTime = (dateString: string) => {
    const orderTime = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    return `${diffMinutes} mins ago`;
  };

  const pendingOrders = getOrdersByStatus('pending');
  const processingOrders = getOrdersByStatus('processing');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white ${isFullscreen ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
            <SpeakerWaveIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Order Status Display
            </h1>
            <p className="text-gray-300 text-lg">
              Live order tracking • Updated every 10 seconds
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-300">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-6 w-6 text-white" />
            ) : (
              <ArrowsPointingOutIcon className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-xl text-gray-300">Loading orders...</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Orders */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Order Received</h2>
                <p className="text-gray-300">Preparing your order...</p>
              </div>
              <div className="ml-auto bg-amber-500/20 px-3 py-1 rounded-full">
                <span className="text-amber-300 font-semibold">{pendingOrders.length}</span>
              </div>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">
                          #{order.order_number}
                        </div>
                        <div className="text-amber-300 font-medium">
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-300">
                          {formatTime(order.created_at)}
                        </div>
                        <div className="text-lg font-semibold text-white">
                          ${(order.total_amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {item.quantity}x {item.product?.name}
                            </div>
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="text-xs text-gray-300 mt-1">
                                {item.customizations.map((custom, custIndex) => (
                                  <span key={custIndex} className="mr-2">
                                    {custom.option_name}: {custom.selected_value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processing Orders */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg">
                <CogIcon className="h-6 w-6 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Now Preparing</h2>
                <p className="text-gray-300">Your order is being made</p>
              </div>
              <div className="ml-auto bg-blue-500/20 px-3 py-1 rounded-full">
                <span className="text-blue-300 font-semibold">{processingOrders.length}</span>
              </div>
            </div>

            {processingOrders.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10">
                <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders in preparation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {processingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 animate-pulse"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">
                          #{order.order_number}
                        </div>
                        <div className="text-blue-300 font-medium">
                          {order.customer_name || 'Walk-in Customer'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-300">
                          {formatTime(order.created_at)}
                        </div>
                        <div className="text-lg font-semibold text-white">
                          ${(order.total_amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {item.quantity}x {item.product?.name}
                            </div>
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="text-xs text-gray-300 mt-1">
                                {item.customizations.map((custom, custIndex) => (
                                  <span key={custIndex} className="mr-2">
                                    {custom.option_name}: {custom.selected_value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300">Live updates every 10 seconds</span>
        </div>
      </div>
    </div>
  );
}