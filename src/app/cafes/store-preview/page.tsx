'use client';

import { useState, useEffect } from 'react';
import { getBusinessCategoryName } from '@/lib/category-mapping';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  EyeIcon,
  ShoppingBagIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface MerchantData {
  _id: string;
  name: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  businessCategory: string;
  isActive: boolean;
  status: string;
}

interface GiftItem {
  _id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export default function StorePreviewPage() {
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // Fetch merchant data
      const merchantResponse = await fetch('/api/cafes/profile');
      if (!merchantResponse.ok) {
        throw new Error('Failed to fetch merchant data');
      }
      const merchantData = await merchantResponse.json();
      setMerchantData(merchantData);

      // Fetch gift items
      const itemsResponse = await fetch('/api/cafes/items');
      if (!itemsResponse.ok) {
        throw new Error('Failed to fetch gift items');
      }
      const itemsData = await itemsResponse.json();
      setGiftItems(itemsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = async (categoryId: string) => {
    try {
      return await getBusinessCategoryName(categoryId);
    } catch (error) {
      console.error('Error getting category name:', error);
      return 'Other';
    }
  };

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case '68483ef21d38b4b7195d45cd': return 'bg-amber-100 text-amber-800';
      case '68483ef21d38b4b7195d45ce': return 'bg-blue-100 text-blue-800';
      case '68492e4c7c523741d619abeb': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your store preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Store</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStoreData}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!merchantData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your store information</p>
          <Link
            href="/cafes/dashboard"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Back to Dashboard
          </Link>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/cafes/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Store Preview</span>
              </div>
              {merchantData.status === 'approved' && (
                <Link
                  href={`/store/${merchantData._id}`}
                  target="_blank"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <span className='text-white'>View Public Store</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {merchantData.logoUrl ? (
                <img
                  src={merchantData.logoUrl}
                  alt={`${merchantData.name} logo`}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-3xl">☕</span>
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{merchantData.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(merchantData.businessCategory)}`}>
                  {merchantData.businessCategory}
                </span>
              </div>
              
              {merchantData.description && (
                <p className="text-gray-600 text-lg mb-4">{merchantData.description}</p>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-sm">{merchantData.address}</span>
                </div>
                
                {merchantData.contactPhone && (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm">{merchantData.contactPhone}</span>
                  </div>
                )}
                
                {merchantData.website && (
                  <div className="flex items-center text-gray-600">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <a 
                      href={merchantData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-800 underline"
                    >
                      {merchantData.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                merchantData.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : merchantData.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  merchantData.status === 'approved' 
                    ? 'bg-green-400' 
                    : merchantData.status === 'pending'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}></div>
                {merchantData.status === 'approved' ? 'Live' : merchantData.status === 'pending' ? 'Pending Approval' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Gift Items Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <ShoppingBagIcon className="h-6 w-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Gift Items</h2>
              <span className="bg-teal-100 text-teal-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {giftItems.length} items
              </span>
            </div>
          </div>

          {giftItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-8xl mb-6">🎁</div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No gift items yet</h3>
              <p className="text-gray-600 mb-8 text-lg">Add some gift items to showcase your offerings</p>
              <Link
                href="/cafes/items"
                className="bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg"
              >
                <span className='text-white'>Add Your First Item</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftItems.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  {/* Item Image */}
                  <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-200">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">🎁</span>
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.categoryId)}`}>
                        {getCategoryName(item.categoryId)}
                      </span>
                    </div>
                    
                    <p className="text-2xl font-bold text-teal-600">€{item.price.toFixed(2)}</p>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-blue-600 text-xl mr-3">👁️</div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">Store Preview</h3>
              <p className="text-blue-800 text-sm mb-4">
                This is how your store appears to customers on the Brontie platform. 
                {merchantData.status === 'pending' && ' Your store will be visible to customers once approved by our team.'}
                {merchantData.status === 'approved' && ' Your store is live and visible to customers!'}
                {merchantData.status === 'denied' && ' Your store is currently not visible to customers.'}
              </p>
              {merchantData.status === 'approved' && (
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/store/${merchantData._id}`}
                    target="_blank"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    View Public Store
                  </Link>
                  <span className="text-blue-600 text-sm">Share this link with your customers!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
