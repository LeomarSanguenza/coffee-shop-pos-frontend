import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
}

interface BulkStockUpdate {
  id: number;
  action: 'increase' | 'decrease' | 'set';
  quantity: number;
  product?: Product;
}

interface BulkStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: BulkStockUpdate[]) => Promise<void>;
  products: Product[];
  loading?: boolean;
}

export const BulkStockModal: React.FC<BulkStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  loading = false
}) => {
  const [updates, setUpdates] = useState<BulkStockUpdate[]>([
    { id: 0, action: 'set', quantity: 0 }
  ]);

  const addUpdate = () => {
    setUpdates([...updates, { id: 0, action: 'set', quantity: 0 }]);
  };

  const removeUpdate = (index: number) => {
    setUpdates(updates.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof BulkStockUpdate, value: any) => {
    const newUpdates = [...updates];
    newUpdates[index] = { ...newUpdates[index], [field]: value };
    
    // If product ID changed, add product info
    if (field === 'id') {
      const product = products.find(p => p.id === value);
      newUpdates[index].product = product;
    }
    
    setUpdates(newUpdates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out invalid updates
    const validUpdates = updates.filter(update => 
      update.id > 0 && update.quantity >= 0
    );
    
    if (validUpdates.length === 0) {
      alert('Please add at least one valid update');
      return;
    }
    
    await onSubmit(validUpdates);
    setUpdates([{ id: 0, action: 'set', quantity: 0 }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-300">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CubeIcon className="h-6 w-6 text-white mr-3" />
              <h3 className="text-xl font-semibold text-white">Bulk Stock Update</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {updates.map((update, index) => (
                <div key={index} className="flex items-end space-x-4 p-6 border border-gray-200 rounded-2xl bg-gradient-to-r from-gray-50 to-slate-50 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product
                    </label>
                    <select
                      value={update.id}
                      onChange={(e) => updateField(index, 'id', parseInt(e.target.value))}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value={0}>Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (SKU: {product.sku}) - Current: {product.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-40">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Action
                    </label>
                    <select
                      value={update.action}
                      onChange={(e) => updateField(index, 'action', e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="set">Set to</option>
                      <option value="increase">Increase by</option>
                      <option value="decrease">Decrease by</option>
                    </select>
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={update.quantity}
                      onChange={(e) => updateField(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeUpdate(index)}
                    className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                    disabled={updates.length === 1}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={addUpdate}
                className="inline-flex items-center px-4 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Update
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};