'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MerchantCard from '@/components/admin/MerchantCard';
import MerchantModal from '@/components/admin/MerchantModal';
import LocationModal from '@/components/admin/LocationModal';
import { Merchant, MerchantLocation, MerchantFormData, LocationFormData } from '@/types/merchant';

const defaultLocationFormData: LocationFormData = {
  name: '',
  address: '',
  city: '', // Ab area use karenge
  county: '',
  area: '', // Naya field add karo
  customArea: '', // Naya field add karo
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

const defaultMerchantFormData: MerchantFormData = {
  name: '',
  description: '',
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  address: '',
  businessCategory: 'Café & Treats'
};

function MerchantsPageContent() {
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editingLocation, setEditingLocation] = useState<MerchantLocation | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [merchantFormData, setMerchantFormData] = useState<MerchantFormData>(defaultMerchantFormData);
  const [locationFormData, setLocationFormData] = useState<LocationFormData>(defaultLocationFormData);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [showDenialModal, setShowDenialModal] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [denyingMerchant, setDenyingMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    // Set initial tab from URL params
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'approved' || tab === 'denied') {
      setActiveTab(tab);
    }
    fetchMerchants();
  }, [searchParams]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/merchants');
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify(merchantFormData),
      });

      if (response.ok) {
        await fetchMerchants();
        setShowMerchantModal(false);
        setEditingMerchant(null);
        setMerchantFormData(defaultMerchantFormData);
      } else {
        console.error('Failed to save merchant');
      }
    } catch (error) {
      console.error('Error saving merchant:', error);
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
        setShowLocationModal(false);
        setEditingLocation(null);
        setLocationFormData(defaultLocationFormData);
      } else {
        console.error('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return;

    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMerchants();
      } else {
        console.error('Failed to delete merchant');
      }
    } catch (error) {
      console.error('Error deleting merchant:', error);
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
        console.error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setMerchantFormData({
      name: merchant.name,
      description: merchant.description || '',
      logoUrl: merchant.logoUrl || '',
      contactEmail: merchant.contactEmail,
      contactPhone: merchant.contactPhone || '',
      website: merchant.website || '',
      address: merchant.address || '',
      businessCategory: merchant.businessCategory || 'Café & Treats'
    });
    setShowMerchantModal(true);
  };

  const handleEditLocation = (merchantId: string, location: MerchantLocation) => {
    setSelectedMerchant(merchantId);
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      county: location.county || '',
      area: location.area || '', // Yeh add karo
      customArea: location.customArea || '', // Yeh add karo
      zipCode: location.zipCode,
      country: location.country,
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      photoUrl: location.photoUrl || '',
      phoneNumber: location.phoneNumber || '',
      openingHours: location.openingHours || defaultLocationFormData.openingHours,
      accessibility: location.accessibility || defaultLocationFormData.accessibility
    });
    setShowLocationModal(true);
  };

  const handleAddLocation = (merchantId: string) => {
    setSelectedMerchant(merchantId);
    setEditingLocation(null);
    setLocationFormData(defaultLocationFormData);
    setShowLocationModal(true);
  };

  const handleApproveMerchant = async (merchant: Merchant) => {
    if (!confirm(`Approve ${merchant.name}? This will activate their account and gift items.`)) return;

    try {
      const response = await fetch(`/api/admin/merchants/${merchant._id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchMerchants();
      } else {
        console.error('Failed to approve merchant');
      }
    } catch (error) {
      console.error('Error approving merchant:', error);
    }
  };

  const handleDenyMerchant = async (merchant: Merchant) => {
    setDenyingMerchant(merchant);
    setShowDenialModal(true);
  };

  const confirmDenial = async () => {
    if (!denyingMerchant) return;

    try {
      const response = await fetch(`/api/admin/merchants/${denyingMerchant._id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: denialReason }),
      });

      if (response.ok) {
        await fetchMerchants();
        setShowDenialModal(false);
        setDenyingMerchant(null);
        setDenialReason('');
      } else {
        console.error('Failed to deny merchant');
      }
    } catch (error) {
      console.error('Error denying merchant:', error);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    if (activeTab === 'all') return true;
    return merchant.status === activeTab;
  });

  const pendingCount = merchants.filter(m => m.status === 'pending').length;
  const approvedCount = merchants.filter(m => m.status === 'approved').length;
  const deniedCount = merchants.filter(m => m.status === 'denied').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchants</h1>
        <p className="text-gray-600">Manage café partners and their locations</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`hidden py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              All Merchants
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {merchants.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending Approval
              <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Approved
              <span className="ml-2 bg-green-100 text-green-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {approvedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('denied')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'denied'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Denied
              <span className="ml-2 bg-red-100 text-red-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {deniedCount}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingMerchant(null);
              setMerchantFormData(defaultMerchantFormData);
              setShowMerchantModal(true);
            }}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            + Add Merchant
          </button>
        </div>

        {activeTab === 'pending' && pendingCount > 0 && (
          <div className="text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            ⚠️ {pendingCount} merchant{pendingCount !== 1 ? 's' : ''} awaiting approval
          </div>
        )}
      </div>

      {/* Merchants Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600"></div>
          <p className="mt-2 text-gray-600">Loading merchants...</p>
        </div>
      ) : filteredMerchants.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🏪</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'pending' ? 'No pending applications' : 'No merchants found'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'pending'
              ? 'All merchant applications have been processed.'
              : 'Get started by adding your first merchant.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMerchants.map((merchant) => (
            <MerchantCard
              key={merchant._id}
              merchant={merchant}
              onEdit={() => handleEditMerchant(merchant)}
              onDelete={() => handleDeleteMerchant(merchant._id)}
              onAddLocation={() => handleAddLocation(merchant._id)}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}
              onApprove={merchant.status === 'pending' ? () => handleApproveMerchant(merchant) : undefined}
              onDeny={merchant.status === 'pending' ? () => handleDenyMerchant(merchant) : undefined}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showMerchantModal && (
        <MerchantModal
          isOpen={showMerchantModal}
          onClose={() => {
            setShowMerchantModal(false);
            setEditingMerchant(null);
            setMerchantFormData(defaultMerchantFormData);
          }}
          onSubmit={handleMerchantSubmit}
          formData={merchantFormData}
          setFormData={setMerchantFormData}
          editingMerchant={editingMerchant}
        />
      )}

      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
            setLocationFormData(defaultLocationFormData);
          }}
          onSubmit={handleLocationSubmit}
          formData={locationFormData}
          onFormDataChange={setLocationFormData}
          editingLocation={editingLocation}
        />
      )}

      {/* Denial Modal */}
      {showDenialModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Deny Merchant Application
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deny {denyingMerchant?.name}? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for denial (optional)
              </label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Provide feedback to help them improve..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDenialModal(false);
                  setDenyingMerchant(null);
                  setDenialReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDenial}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Deny Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantsPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MerchantsPageContent />
    </Suspense>
  );
}