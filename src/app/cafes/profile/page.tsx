'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MerchantData {
  _id: string;
  name: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  payoutDetails: {
    accountHolderName: string;
    iban: string;
    bic: string;
  };
  stripeConnectSettings?: {
    accountId?: string;
    isConnected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };
}

interface GiftItem {
  _id: string;
  name: string;
  category: 'Coffee' | 'Food' | 'Treats' | 'Other';
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export default function CafeProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'items' | 'payout'>('profile');
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);


  useEffect(() => {
    fetchMerchantData();
    fetchGiftItems();
  }, []);

  const fetchMerchantData = async () => {
    try {
      const response = await fetch('/api/cafes/profile');
      if (response.ok) {
        const data = await response.json();
        setMerchantData(data);
      } else {
        setError('Failed to load profile data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGiftItems = async () => {
    try {
      const response = await fetch('/api/cafes/items');
      if (response.ok) {
        const data = await response.json();
        setGiftItems(data);
      }
    } catch {
      console.error('Failed to load gift items');
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMerchantData(prev => prev ? {...prev, logoUrl: data.url} : null);
        setSuccess('Logo updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to upload logo');
      }
    } catch {
      setError('Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(merchantData),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemSave = async (item: GiftItem) => {
    try {
      const response = await fetch(`/api/cafes/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        setSuccess('Item updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchGiftItems(); // Refresh the list
      } else {
        setError('Failed to update item');
      }
          } catch {
        setError('Network error');
      }
    };

  const handlePayoutSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/payout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(merchantData.payoutDetails),
      });

      if (response.ok) {
        setSuccess('Payout details updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update payout details');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnectSetup = async () => {
    if (!merchantData) return;

    setStripeConnectLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe-connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId: merchantData._id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to setup Stripe Connect');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const handleStripeConnectDashboard = async () => {
    if (!merchantData?.stripeConnectSettings?.accountId) return;

    setStripeConnectLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe-connect/account-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.dashboardUrl) {
          window.open(data.dashboardUrl, '_blank');
        } else {
          setError('Dashboard URL not available');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to get dashboard URL');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setStripeConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!merchantData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/cafes/dashboard"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            <span className="text-white">Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">☕ Café Profile</h1>
              <p className="text-gray-600 mt-2">Manage your café details and settings</p>
            </div>
            <Link
              href="/cafes/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <span className="text-white">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Café Details
                </button>
                <button
                  onClick={() => setActiveTab('items')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'items'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gift Items
                </button>
                <button
                  onClick={() => setActiveTab('payout')}
                  className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'payout'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payout Details
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Café Details</h2>
            <form onSubmit={handleProfileSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-3">
                    Café Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={merchantData.name}
                    onChange={(e) => setMerchantData({...merchantData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="Enter your café name"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-3">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    required
                    value={merchantData.contactEmail}
                    onChange={(e) => setMerchantData({...merchantData, contactEmail: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-3">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={merchantData.contactPhone || ''}
                    onChange={(e) => setMerchantData({...merchantData, contactPhone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="+353 1 234 5678"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-3">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={merchantData.website || ''}
                    onChange={(e) => setMerchantData({...merchantData, website: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="https://yourcafe.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-3">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    required
                    rows={3}
                    value={merchantData.address}
                    onChange={(e) => setMerchantData({...merchantData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="Enter your full address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    value={merchantData.description || ''}
                    onChange={(e) => setMerchantData({...merchantData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="Tell customers about your café, atmosphere, and specialties"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Tell customers about your café</span>
                    <span>{merchantData.description?.length || 0}/500 characters</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Café Logo
                  </label>
                  <div className="flex items-start space-x-6">
                    {/* Current Logo Display */}
                    <div className="flex-shrink-0">
                      {merchantData.logoUrl ? (
                        <img
                          src={merchantData.logoUrl}
                          alt="Café Logo"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">☕</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Section */}
                    <div className="flex-1">
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleLogoUpload(file);
                            }
                          }}
                          className="hidden"
                          id="logo-upload"
                          disabled={uploadingLogo}
                        />
                        <label
                          htmlFor="logo-upload"
                          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                            uploadingLogo
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                          }`}
                        >
                          {uploadingLogo ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {merchantData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                            </>
                          )}
                        </label>
                        <p className="text-xs text-gray-500">
                          Recommended: Square image, at least 200x200px. Max file size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Security & Login</h3>
                  <div className="bg-gray-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Google Login</p>
                        <p className="text-sm text-gray-500">Enable one-tap access to your dashboard</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/api/auth/google/login'}
                      className="whitespace-nowrap bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                    >
                      Connect Google Account
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Gift Items</h2>
              <Link
                href="/cafes/items"
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                <span className="text-white">Manage Items</span>
              </Link>
            </div>
            
            {giftItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-8xl mb-6">☕</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">No gift items yet</h3>
                <p className="text-gray-600 mb-8 text-lg">Start by adding some gift items to your café</p>
                <Link
                  href="/cafes/items"
                  className="bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg"
                >
                  <span className='text-white'>Add Your First Item</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {giftItems.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all duration-200 bg-gray-50/50">
                    <div className="flex items-start space-x-6">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow-sm">
                            <div className="text-gray-400 text-3xl">☕</div>
                          </div>
                        )}
                        
                        {/* Image Upload Button */}
                        <div className="mt-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    const updatedItems = giftItems.map(i => 
                                      i._id === item._id ? {...i, imageUrl: data.url} : i
                                    );
                                    setGiftItems(updatedItems);
                                  } else {
                                    setError('Failed to upload image');
                                  }
                                } catch {
                                  setError('Image upload failed');
                                }
                              }
                            }}
                            className="hidden"
                            id={`image-upload-${item._id}`}
                          />
                          <label
                            htmlFor={`image-upload-${item._id}`}
                            className="cursor-pointer text-black bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm transition-colors text-center block border border-gray-200 shadow-sm font-medium"
                          >
                            Change Image
                          </label>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => {
                                const updatedItems = giftItems.map(i => 
                                  i._id === item._id ? {...i, name: e.target.value} : i
                                );
                                setGiftItems(updatedItems);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black text-sm transition-colors"
                              placeholder="Item name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                              required
                              value={item.category}
                              onChange={(e) => {
                                const updatedItems = giftItems.map(i => 
                                  i._id === item._id ? {...i, category: e.target.value as 'Coffee' | 'Food' | 'Treats' | 'Other'} : i
                                );
                                setGiftItems(updatedItems);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black text-sm transition-colors"
                            >
                              <option value="Coffee">Coffee</option>
                              <option value="Food">Food</option>
                              <option value="Treats">Treats</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (€) *</label>
                            <input
                              type="number"
                              step="0.10"
                              min="0.50"
                              required
                              value={item.price}
                              onChange={(e) => {
                                const updatedItems = giftItems.map(i => 
                                  i._id === item._id ? {...i, price: parseFloat(e.target.value)} : i
                                );
                                setGiftItems(updatedItems);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black text-sm transition-colors"
                              placeholder="0.50"
                            />
                            <p className="text-xs text-gray-500 mt-2">Min €0.50, step €0.10</p>
                          </div>

                          <div className="flex items-end space-x-4">
                            <button
                              onClick={() => handleItemSave(item)}
                              className="bg-teal-600 text-white px-6 py-3 rounded-lg text-sm hover:bg-teal-700 transition-colors font-medium"
                            >
                              Save Changes
                            </button>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={(e) => {
                                  const updatedItems = giftItems.map(i => 
                                    i._id === item._id ? {...i, isActive: e.target.checked} : i
                                  );
                                  setGiftItems(updatedItems);
                                }}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-5 h-5"
                              />
                              <span className="ml-3 text-sm font-medium text-gray-700">Active</span>
                            </label>
                          </div>
                        </div>

                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={item.description || ''}
                            onChange={(e) => {
                              const updatedItems = giftItems.map(i => 
                                i._id === item._id ? {...i, description: e.target.value} : i
                              );
                              setGiftItems(updatedItems);
                            }}
                            rows={3}
                            maxLength={200}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black text-sm transition-colors"
                            placeholder="Brief description of the item..."
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <span>Tell customers about this item</span>
                            <span>{item.description?.length || 0}/200 characters</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payout' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Payout Details</h2>
            
            {/* Stripe Connect Status */}
            {merchantData.stripeConnectSettings && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="text-purple-600 text-2xl mr-4">💳</div>
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-2 text-lg">Stripe Connect</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${merchantData.stripeConnectSettings.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-purple-800 text-sm">
                              Status: {merchantData.stripeConnectSettings.isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                          {merchantData.stripeConnectSettings.isConnected && (
                            <>
                              <div className="flex items-center space-x-2">
                                <span className={`w-3 h-3 rounded-full ${merchantData.stripeConnectSettings.onboardingCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span className="text-purple-800 text-sm">
                                  Onboarding: {merchantData.stripeConnectSettings.onboardingCompleted ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`w-3 h-3 rounded-full ${merchantData.stripeConnectSettings.chargesEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-purple-800 text-sm">
                                  Payments: {merchantData.stripeConnectSettings.chargesEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`w-3 h-3 rounded-full ${merchantData.stripeConnectSettings.payoutsEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-purple-800 text-sm">
                                  Payouts: {merchantData.stripeConnectSettings.payoutsEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {!merchantData.stripeConnectSettings.isConnected ? (
                        <button
                          onClick={handleStripeConnectSetup}
                          disabled={stripeConnectLoading}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {stripeConnectLoading ? 'Setting up...' : 'Setup Stripe Connect'}
                        </button>
                      ) : (
                        <button
                          onClick={handleStripeConnectDashboard}
                          disabled={stripeConnectLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {stripeConnectLoading ? 'Opening...' : 'Open Dashboard'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Change Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start">
                <div className="text-yellow-600 text-2xl mr-4">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2 text-lg">Bank Detail Changes</h3>
                  <p className="text-yellow-800">
                    Allow up to 10 working days for bank changes to take effect.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayoutSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-3">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    id="accountHolderName"
                    required
                    value={merchantData.payoutDetails.accountHolderName}
                    onChange={(e) => setMerchantData({
                      ...merchantData,
                      payoutDetails: {
                        ...merchantData.payoutDetails,
                        accountHolderName: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black transition-colors"
                    placeholder="Enter account holder name"
                  />
                </div>

                <div>
                  <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-3">
                    IBAN *
                  </label>
                  <input
                    type="text"
                    id="iban"
                    required
                    value={merchantData.payoutDetails.iban}
                    onChange={(e) => setMerchantData({
                      ...merchantData,
                      payoutDetails: {
                        ...merchantData.payoutDetails,
                        iban: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black font-mono transition-colors"
                    placeholder="IE64IRCE92053212345678"
                  />
                </div>

                <div>
                  <label htmlFor="bic" className="block text-sm font-medium text-gray-700 mb-3">
                    BIC (Optional)
                  </label>
                  <input
                    type="text"
                    id="bic"
                    value={merchantData.payoutDetails.bic || ''}
                    onChange={(e) => setMerchantData({
                      ...merchantData,
                      payoutDetails: {
                        ...merchantData.payoutDetails,
                        bic: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black font-mono transition-colors"
                    placeholder="IRCEIE2D"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? 'Saving...' : 'Save Payout Details'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
