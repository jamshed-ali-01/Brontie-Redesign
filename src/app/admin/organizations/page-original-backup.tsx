'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

interface Merchant {
  _id: string;
  name: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  locations: MerchantLocation[];
  createdAt: string;
  updatedAt: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editingLocation, setEditingLocation] = useState<MerchantLocation | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: ''
  });

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/merchants');
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.data || data.merchants || []);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMerchant 
        ? `/api/admin/merchants/${editingMerchant._id}`
        : '/api/admin/merchants';
      
      const method = editingMerchant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchMerchants();
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save merchant');
      }
    } catch (error) {
      console.error('Error saving merchant:', error);
      alert('Failed to save merchant');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocation 
        ? `/api/admin/merchants/${selectedMerchant}/locations/${editingLocation._id}`
        : `/api/admin/merchants/${selectedMerchant}/locations`;
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationFormData),
      });

      if (response.ok) {
        await fetchMerchants();
        handleCloseLocationModal();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${editingLocation ? 'update' : 'add'} location`);
      }
    } catch (error) {
      console.error(`Error ${editingLocation ? 'updating' : 'adding'} location:`, error);
      alert(`Failed to ${editingLocation ? 'update' : 'add'} location`);
    }
  };

  const handleDelete = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;

    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMerchants();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete merchant');
      }
    } catch (error) {
      console.error('Error deleting merchant:', error);
      alert('Failed to delete merchant');
    }
  };

  const handleDeleteLocation = async (merchantId: string, locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMerchants();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  const handleEdit = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    // Fetch the latest merchant data to ensure we have current values
    fetchCurrentMerchant(merchant._id, merchant);
    setShowModal(true);
  };

  // Add new function to fetch current merchant data
  const fetchCurrentMerchant = async (merchantId: string, fallbackMerchant: Merchant) => {
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        const currentMerchant = data.merchant;
        setEditingMerchant(currentMerchant);
        setFormData({
          name: currentMerchant.name,
          description: currentMerchant.description,
          logoUrl: currentMerchant.logoUrl,
          contactEmail: currentMerchant.contactEmail,
          contactPhone: currentMerchant.contactPhone,
          website: currentMerchant.website
        });
      }
    } catch (error) {
      console.error('Error fetching current merchant:', error);
      // Fallback to using the merchant data from the list
      setFormData({
        name: fallbackMerchant.name,
        description: fallbackMerchant.description,
        logoUrl: fallbackMerchant.logoUrl,
        contactEmail: fallbackMerchant.contactEmail,
        contactPhone: fallbackMerchant.contactPhone,
        website: fallbackMerchant.website
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMerchant(null);
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      contactEmail: '',
      contactPhone: '',
      website: ''
    });
  };

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
    setSelectedMerchant('');
    setLocationFormData({
      name: '',
      address: '',
      city: '',
      country: ''
    });
  };

  const handleAddLocation = (merchantId: string) => {
    setSelectedMerchant(merchantId);
    setEditingLocation(null);
    setLocationFormData({
      name: '',
      address: '',
      city: '',
      country: ''
    });
    setShowLocationModal(true);
  };

  const handleEditLocation = (merchantId: string, location: MerchantLocation) => {
    setSelectedMerchant(merchantId);
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country
    });
    setShowLocationModal(true);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Merchants</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Add Merchant
        </button>
      </div>

      {/* Merchants List */}
      <div className="space-y-6">
        {merchants.map((merchant) => (
          <div key={merchant._id} className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {merchant.logoUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={merchant.logoUrl}
                        alt={merchant.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{merchant.name}</h3>
                    <p className="text-gray-600 mb-3">{merchant.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      {merchant.contactEmail && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {merchant.contactEmail}
                        </div>
                      )}
                      {merchant.contactPhone && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {merchant.contactPhone}
                        </div>
                      )}
                      {merchant.website && (
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-800 truncate">
                            {merchant.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(merchant)}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(merchant._id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Locations */}
              <div className="border-t border-amber-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Locations ({merchant.locations?.length || 0})
                  </h4>
                  <button
                    onClick={() => handleAddLocation(merchant._id)}
                    className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    + Add Location
                  </button>
                </div>
                {merchant.locations && merchant.locations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {merchant.locations.map((location) => (
                      <div key={location._id} className="bg-amber-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{location.name}</div>
                            <div className="text-sm text-gray-600">{location.address}</div>
                            <div className="text-sm text-gray-600">{location.city}, {location.country}</div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditLocation(merchant._id, location)}
                              className="text-amber-600 hover:text-amber-800 text-xs"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(merchant._id, location._id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No locations added yet</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {merchants.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No merchants found</div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Create First Merchant
          </button>
        </div>
      )}

      {/* Merchant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingMerchant ? 'Edit Merchant' : 'Add Merchant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <FileUpload
                  currentUrl={formData.logoUrl}
                  onUpload={(url) => setFormData({ ...formData, logoUrl: url })}
                  label="Logo"
                  className="mb-4"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
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
                  {editingMerchant ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </h2>
            <form onSubmit={handleLocationSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                <input
                  type="text"
                  value={locationFormData.name}
                  onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={locationFormData.address}
                  onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={locationFormData.city}
                  onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={locationFormData.country}
                  onChange={(e) => setLocationFormData({ ...locationFormData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseLocationModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  {editingLocation ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
