'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lobster } from 'next/font/google';
import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
import SettingsTabs from '@/components/cafes/settings/SettingsTabs';
import CafeDetailsTab from '@/components/cafes/settings/CafeDetailsTab';
import LocationTab from '@/components/cafes/settings/LocationTab';
import PosSystemTab from '@/components/cafes/settings/PosSystemTab';
import CafeLocationModal from '@/components/cafes/CafeLocationModal';
import { MerchantLocation, CafeLocationFormData } from '@/types/merchant';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'location' | 'pos'>('profile');
  const [merchantData, setMerchantData] = useState<any>(null);
  const [locations, setLocations] = useState<MerchantLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Location Modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MerchantLocation | null>(null);
  const [locationFormData, setLocationFormData] = useState<CafeLocationFormData>(defaultLocationFormData);

  useEffect(() => {
    Promise.all([fetchMerchantData(), fetchLocations()]).finally(() => setLoading(false));
  }, []);

  const fetchMerchantData = async () => {
    try {
      const response = await fetch('/api/cafes/profile');
      if (response.ok) {
        const data = await response.json();
        setMerchantData(data);
      }
    } catch {
      console.error('Failed to load profile data');
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/cafes/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch {
      console.error('Failed to load locations');
    }
  };

  const handleProfileSave = async (data: any) => {
    const updated = { ...merchantData, ...data };
    try {
      const response = await fetch('/api/cafes/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (response.ok) {
        setMerchantData(updated);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch {
      alert('Network error while saving profile');
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMerchantData((prev: any) => prev ? { ...prev, logoUrl: data.url } : null);
        alert('Logo updated successfully!');
      } else {
        alert('Failed to upload logo');
      }
    } catch {
      alert('Logo upload failed');
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setLocationFormData(defaultLocationFormData);
    setShowLocationModal(true);
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

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const response = await fetch(`/api/cafes/locations/${locationId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchLocations();
      } else {
        alert('Failed to delete location');
      }
    } catch {
      alert('Network error connecting to API');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLocation ? `/api/cafes/locations/${editingLocation._id}` : '/api/cafes/locations';
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationFormData),
      });

      if (response.ok) {
        await fetchLocations();
        setShowLocationModal(false);
      } else {
        alert('Failed to save location');
      }
    } catch {
      alert('Failed to save location data');
    }
  };

  const handleConnectSquare = () => {
    router.push('/cafes/sync');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <CafeDashboardLayout cafeName={merchantData?.name || 'Cafe Name'} ownerName={merchantData?.payoutDetails?.accountHolderName || 'User'}>
      <div className="flex flex-col">
        <h1 className={`text-4xl text-[#6ca3a4] mb-8 ${lobster.className}`}>Settings</h1>
        
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4">
          {activeTab === 'profile' && (
            <CafeDetailsTab 
               merchantData={merchantData} 
               onSaveProfile={handleProfileSave} 
               onUploadLogo={handleLogoUpload} 
            />
          )}

          {activeTab === 'location' && (
            <LocationTab 
               locations={locations} 
               onAddLocation={handleAddLocation}
               onEditLocation={handleEditLocation}
               onDeleteLocation={handleDeleteLocation}
            />
          )}

          {activeTab === 'pos' && (
            <PosSystemTab 
               isSquareConfigured={merchantData?.squareCredentials?.isConfigured || false}
               onConnectSquare={handleConnectSquare}
            />
          )}
        </div>
      </div>

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
    </CafeDashboardLayout>
  );
}
