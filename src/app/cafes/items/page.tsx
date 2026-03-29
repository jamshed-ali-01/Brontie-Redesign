'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getCategoryIdByBusiness } from '@/lib/category-client';

import { getCategoryNameById } from '@/lib/category-client';

interface GiftItem {
  _id: string;
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

interface FormData {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
}

export default function CafeItemsPage() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);
  const [merchantBusinessCategory, setMerchantBusinessCategory] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    price: 0.50,
    description: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const fetchMerchantInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/cafes/profile');
      if (response.ok) {
        const data = await response.json();
        setMerchantBusinessCategory(data.businessCategory || 'Café & Treats');
      }
    } catch (error) {
      console.error('Failed to fetch merchant info:', error);
      setMerchantBusinessCategory('Café & Treats'); // Default fallback
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/cafes/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        if (response.status === 401) {
          router.push('/cafes/login');
          return;
        }
        setError('Failed to load items');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMerchantInfo();
    fetchItems();
  }, [fetchMerchantInfo, fetchItems]);

  const handleImageUpload = async (file: File) => {
    if (!file) return '';

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      setError('Image upload failed');
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleImageUpload(file);
      if (url) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingItem ? `/api/cafes/items/${editingItem._id}` : '/api/cafes/items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingItem) {
          setItems(prev => prev.map(item =>
            item._id === editingItem._id ? data.giftItem : item
          ));
        } else {
          setItems(prev => [data.giftItem, ...prev]);
        }

        resetForm();
        setShowAddForm(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save item');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: GiftItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
    setShowAddForm(true);

    // Scroll to top when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/cafes/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item._id !== itemId));
      } else {
        setError('Failed to delete item');
      }
    } catch {
      setError('Network error');
    }
  };
  const resetForm = () => {
    const autoCategoryId = getCategoryIdByBusiness(merchantBusinessCategory);
    setFormData({
      name: '',
      categoryId: autoCategoryId,
      price: 0.50,
      description: '',
      imageUrl: ''
    });
  };


  const cancelEdit = () => {
    setEditingItem(null);
    resetForm();
    setShowAddForm(false);
  };


  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case '68483ef21d38b4b7195d45cd': return 'bg-amber-100 text-amber-800'; // Cafés & Treats
      case '68483ef21d38b4b7195d45ce': return 'bg-blue-100 text-blue-800'; // Tickets & Passes
      case '68492e4c7c523741d619abeb': return 'bg-green-100 text-green-800'; // Dining & Meals
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (categoryId: string) => {
    return getCategoryNameById(categoryId);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">☕ Manage Gift Items</h1>
              <p className="mt-2 text-gray-600">Add, edit, and manage your café&apos;s gift items</p>

              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="  bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>You can list up to 15 items on Brontie.</strong> Feel free to combine items, such as &quot;Coffee&quot; (Americano/Latte/Cappuccino) or &quot;Pastries&quot; (Croissant/Muffin/Scone).
                  </p>


                </div>
                <button
                  onClick={() => {
                    if (items.length >= 15) {
                      setError('You can only have up to 15 items. Please remove some items before adding new ones.');
                      return;
                    }
                    const autoCategoryId = getCategoryIdByBusiness(merchantBusinessCategory);

                    setFormData({
                      name: '',
                      categoryId: autoCategoryId,
                      price: 0.5,
                      description: '',
                      imageUrl: ''
                    });
                    setShowAddForm(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Item
                </button>
              </div>

            </div>
            <div className="flex flex-col items-end gap-">


            </div>

          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-black"
                    placeholder="e.g., Cappuccino, Croissant"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.50"
                    step="0.10"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-black"
                    placeholder="0.50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum €0.50, increments of €0.10</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer text-black bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <PhotoIcon className="h-5 w-5" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-black"
                  placeholder="Brief description of the item..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Gift Items ({items.length})
            </h3>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first gift item.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (items.length >= 15) {
                      setError('You can only have up to 15 items. Please remove some items before adding new ones.');
                      return;
                    }
                    setShowAddForm(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Item
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-10 w-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                              <PhotoIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.categoryId)}`}>
                          {item.categoryId ? getCategoryName(item.categoryId) : 'Other'}

                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-teal-600 hover:text-teal-900 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/cafes/dashboard')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}