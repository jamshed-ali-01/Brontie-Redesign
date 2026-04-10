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
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/shared/ConfirmModal';

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
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

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
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Network error while saving profile');
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
        toast.success('Logo updated successfully!');
      } else {
        toast.error('Failed to upload logo');
      }
    } catch {
      toast.error('Logo upload failed');
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

  const handleDeleteLocation = (locationId: string) => {
    setLocationToDelete(locationId);
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;
    try {
      const response = await fetch(`/api/cafes/locations/${locationToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchLocations();
        toast.success('Location deleted');
      } else {
        toast.error('Failed to delete location');
      }
    } catch {
      toast.error('Network error connecting to API');
    } finally {
      setLocationToDelete(null);
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
        toast.success(`Location ${editingLocation ? 'updated' : 'added'} successfully!`);
      } else {
        toast.error('Failed to save location');
      }
    } catch {
      toast.error('Failed to save location data');
    }
  };

  const handleLocationCoverUpload = async (locationId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Now update the location
        const updateResponse = await fetch(`/api/cafes/locations/${locationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: data.url }),
        });
        if (updateResponse.ok) {
          await fetchLocations();
          toast.success('Cover image updated successfully!');
        } else {
          toast.error('Failed to save cover image to location');
        }
      } else {
        toast.error('Failed to upload cover image');
      }
    } catch {
      toast.error('Cover image upload failed');
    }
  };

  const handleConnectSquare = () => {
    router.push('/cafes/sync');
  };

  if (loading) {
    return (
      <CafeDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#f4c24d] rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-[#6ca3a4] rounded-full border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-[16px] font-bold text-gray-800 tracking-wide">Loading profile...</h3>
          <p className="mt-2 text-[12px] text-gray-500 font-medium">Please wait a moment.</p>
        </div>
      </CafeDashboardLayout>
    );
  }

  return (
    <CafeDashboardLayout>
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
               merchantLogoUrl={merchantData?.logoUrl}
               onAddLocation={handleAddLocation}
               onEditLocation={handleEditLocation}
               onDeleteLocation={handleDeleteLocation}
               onUploadCoverPhoto={handleLocationCoverUpload}
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

      <ConfirmModal
        isOpen={!!locationToDelete}
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeleteLocation}
        onCancel={() => setLocationToDelete(null)}
        isDestructive={true}
      />
    </CafeDashboardLayout>
  );
}
