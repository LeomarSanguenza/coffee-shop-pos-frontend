'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { optimizedApi } from '@/lib/apiOptimized';
import { PencilIcon, TrashIcon, PlusIcon, FolderIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  description: string;
  image: string | null;
  is_active: boolean;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await optimizedApi.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await optimizedApi.put(`/categories/${editingCategory.id}`, formData);
      } else {
        await optimizedApi.post('/categories', formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', is_active: true });
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (category: Category) => {
    if (category.products_count > 0) {
      alert('Cannot delete category with existing products');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await optimizedApi.delete(`/categories/${category.id}`);
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute permission="categories.view">
      <Layout>
        <div>
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="mt-2 text-sm text-gray-700">
                Organize your products into categories for better inventory management
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="h-4 w-4 inline mr-2" />
                Add Category
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>

          {/* Categories Grid */}
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading categories...</div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    New Category
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories && filteredCategories.map((category) => (
                  <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FolderIcon className="h-8 w-8 text-indigo-600" />
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-500">{category.products_count} products</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-900"
                            disabled={category.products_count > 0}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {category.description && (
                        <p className="mt-3 text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created {new Date(category.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingCategory(null);
                          setFormData({ name: '', description: '', is_active: true });
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        {editingCategory ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}