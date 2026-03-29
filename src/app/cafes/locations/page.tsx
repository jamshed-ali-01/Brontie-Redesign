'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CafeLocationModal from '@/components/cafes/CafeLocationModal';
import { MerchantLocation, CafeLocationFormData } from '@/types/merchant';

const defaultLocationFormData: CafeLocationFormData = {
  name: '',
  address: '',
  city: '',
  county: '',
  area: '',
  customArea: '',
  zipCode: '',
  country: 'Ireland',
  phoneNumber: '',
  openingHours: {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '09:00', close: '17:00', closed: true }
  },
  accessibility: {
    wheelchairAccessible: false,
    childFriendly: false,
    petFriendly: false,
    parkingAvailable: false,
    wifiAvailable: false,
    outdoorSeating: false,
    deliveryAvailable: false,
    takeawayAvailable: false,
    reservationsRequired: false,
    smokingAllowed: false
  }
};

export default function CafeLocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<MerchantLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MerchantLocation | null>(null);
  const [locationFormData, setLocationFormData] = useState<CafeLocationFormData>(defaultLocationFormData);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cafes/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      } else {
        setError('Failed to load locations');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocation 
        ? `/api/cafes/locations/${editingLocation._id}`
        : '/api/cafes/locations';
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationFormData),
      });

      if (response.ok) {
        await fetchLocations();
        setShowLocationModal(false);
        setEditingLocation(null);
        setLocationFormData(defaultLocationFormData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const response = await fetch(`/api/cafes/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLocations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleEditLocation = (location: MerchantLocation) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      address: location.address,
      city: location.city || '',
      county: location.county || '',
      area: location.area || '',
      customArea: location.customArea || '',
      zipCode: location.zipCode,
      country: location.country || 'Ireland',
      phoneNumber: location.phoneNumber || '',
      openingHours: location.openingHours || defaultLocationFormData.openingHours,
      accessibility: location.accessibility || defaultLocationFormData.accessibility
    });
    setShowLocationModal(true);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setLocationFormData(defaultLocationFormData);
    setShowLocationModal(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/cafe-logout', {
        method: 'POST',
      });
      router.push('/cafes/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/cafes/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📍 Café Locations</h1>
              <p className="text-gray-600">Manage your café locations</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/cafes/dashboard"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <span className="text-white">Dashboard</span>
              </Link>
              <Link
                href="/cafes/items"
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <span className="text-white">Manage Items</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="text-white">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-600 text-xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 text-sm hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Locations ({locations.length})
            </h2>
            <p className="text-sm text-gray-600">
              Add or manage locations where customers can redeem vouchers
            </p>
          </div>
          <button
            onClick={handleAddLocation}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
           
              + Add Location
          </button>
        </div>

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-gray-400 text-3xl">📍</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Locations Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first location to let customers know where they can redeem vouchers.
            </p>
            <button
              onClick={handleAddLocation}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Location
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div key={location._id} className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center mb-2">
                          <span className="text-teal-500 mr-2">🏪</span>
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                      {location.name}
                    </h3>
                        </div>

                    
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">{location.address}</p>
                        <p className="text-sm text-gray-600">
                          {location.area}, {location.county} {location.zipCode}
                        </p>
                      </div>
                    </div>
                    
                    {location.phoneNumber && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-sm text-gray-600">{location.phoneNumber}</p>
                      </div>
                    )}
                    
                    {/* Opening Hours Summary */}
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-900">Opening Hours</p>
                        <p className="text-xs text-gray-600">
                          {location.openingHours?.monday?.closed ? 'Closed Monday' : 
                           `Mon-Fri: ${location.openingHours?.monday?.open} - ${location.openingHours?.monday?.close}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Accessibility Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {location.accessibility?.wheelchairAccessible && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          ♿ Wheelchair
                        </span>
                      )}
                      {location.accessibility?.parkingAvailable && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          🅿️ Parking
                        </span>
                      )}
                      {location.accessibility?.wifiAvailable && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                          📶 WiFi
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="flex-1 gap-2 flex items-center justify-center bg-teal-100 hover:bg-teal-200 text-teal-600 p-2 rounded-lg transition-colors"
                    >
                      <span>

                      ✏️
                      </span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location._id!)}
                      className="flex-1 gap-2 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                    >
                      <span> 🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <CafeLocationModal
          isOpen={showLocationModal}
          editingLocation={editingLocation}
          formData={locationFormData}
          onFormDataChange={setLocationFormData}
          onSubmit={handleLocationSubmit}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
            setLocationFormData(defaultLocationFormData);
          }}
        />
      )}
    </div>
  );
}