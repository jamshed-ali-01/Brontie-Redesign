'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';
import { Merchant } from '@/types/merchant';

interface Category {
  _id: string;
  name: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface GiftItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  categoryName: string;
  merchantId: string;
  merchantName: string;
  locationIds: string[];
  locationNames: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemDisplayOrder?: number
}

export default function GiftItemsPage() {
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantLocations, setMerchantLocations] = useState<MerchantLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGiftItem, setEditingGiftItem] = useState<GiftItem | null>(null);
  const [filterMerchant, setFilterMerchant] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    merchantId: '',
    locationIds: [] as string[],
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.merchantId) {
      fetchMerchantLocations(formData.merchantId);
    }
  }, [formData.merchantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [giftItemsRes, categoriesRes, merchantsRes] = await Promise.all([
        fetch('/api/admin/gift-items'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/merchants')
      ]);

      if (giftItemsRes.ok) {
        const giftItemsData = await giftItemsRes.json();
        setGiftItems(giftItemsData.giftItems || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (merchantsRes.ok) {
        const merchantsData = await merchantsRes.json();
        setMerchants(merchantsData.data || merchantsData.merchants || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantLocations = async (merchantId: string) => {
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/locations`);
      if (response.ok) {
        const data = await response.json();
        setMerchantLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching merchant locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGiftItem 
        ? `/api/admin/gift-items/${editingGiftItem._id}`
        : '/api/admin/gift-items';
      
      const method = editingGiftItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      });

      if (response.ok) {
        await fetchData();
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save gift item');
      }
    } catch (error) {
      console.error('Error saving gift item:', error);
      alert('Failed to save gift item');
    }
  };

  const handleDelete = async (giftItemId: string) => {
    if (!confirm('Are you sure you want to delete this gift item?')) return;

    try {
      const response = await fetch(`/api/admin/gift-items/${giftItemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete gift item');
      }
    } catch (error) {
      console.error('Error deleting gift item:', error);
      alert('Failed to delete gift item');
    }
  };

  const handleEdit = (giftItem: GiftItem) => {
    setEditingGiftItem(giftItem);
    setFormData({
      name: giftItem.name,
      description: giftItem.description,
      price: giftItem.price.toString(),
      imageUrl: giftItem.imageUrl,
      categoryId: giftItem.categoryId,
      merchantId: giftItem.merchantId,
      locationIds: giftItem.locationIds || [],
      isActive: giftItem.isActive
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGiftItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: '',
      merchantId: '',
      locationIds: [],
      isActive: true
    });
    setMerchantLocations([]);
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      locationIds: prev.locationIds.includes(locationId)
        ? prev.locationIds.filter(id => id !== locationId)
        : [...prev.locationIds, locationId]
    }));
  };

  const filteredGiftItems = giftItems.filter(item => {
    if (filterMerchant && item.merchantId !== filterMerchant) return false;
    if (filterCategory && item.categoryId !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gift Items</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Add Gift Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Merchant</label>
            <select
              value={filterMerchant}
              onChange={(e) => setFilterMerchant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            >
              <option value="">All Merchants</option>
              {merchants.map(merchant => (
                <option key={merchant._id} value={merchant._id}>{merchant.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterMerchant('');
                setFilterCategory('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Gift Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGiftItems.map((giftItem) => (
          <div key={giftItem._id} className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden">
            {giftItem.imageUrl && (
              <Image
                src={giftItem.imageUrl}
                alt={giftItem.name}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{giftItem.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  giftItem.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {giftItem.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{giftItem.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">€{giftItem.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-amber-600">{giftItem.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Merchant:</span>
                  <span className="text-amber-600">{giftItem.merchantName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Locations:</span>
                  <div className="mt-1">
                    {giftItem.locationNames.length > 0 ? (
                      giftItem.locationNames.map((location, index) => (
                        <span key={index} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {location}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">No locations</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Created: {new Date(giftItem.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(giftItem)}
                    className="text-amber-600 hover:text-amber-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(giftItem._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGiftItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {giftItems.length === 0 ? 'No gift items found' : 'No gift items match the current filters'}
          </div>
          {giftItems.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Create First Gift Item
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingGiftItem ? 'Edit Gift Item' : 'Add Gift Item'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Merchant</label>
                  <select
                    value={formData.merchantId}
                    onChange={(e) => setFormData({ ...formData, merchantId: e.target.value, locationIds: [] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  >
                    <option value="">Select Merchant</option>
                    {merchants.filter(merchant => merchant.status === 'approved' && merchant.isActive).map(merchant => (
                      <option key={merchant._id} value={merchant._id}>{merchant.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <FileUpload
                    currentUrl={formData.imageUrl}
                    onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                    label="Product Image"
                    className="mb-4"
                  />
                </div>
                {formData.merchantId && merchantLocations.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Locations</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {merchantLocations.map(location => (
                        <label key={location._id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.locationIds.includes(location._id)}
                            onChange={() => handleLocationToggle(location._id)}
                            className="mr-2"
                          />
                          <span className="text-sm">{location.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  {editingGiftItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
