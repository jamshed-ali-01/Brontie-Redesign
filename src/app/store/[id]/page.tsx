'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MessageTemplates from '@/components/MessageTemplates';

interface Store {
  _id: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  businessCategory: string;
  address: string;
  createdAt: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  createdAt: string;
}

interface StoreData {
  store: Store;
  giftItems: GiftItem[];
}

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    senderName: '',
    recipientName: '',
    message: ''
  });
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null);
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`/api/stores/${storeId}`);
        if (!response.ok) {
          throw new Error('Store not found');
        }
        const result = await response.json();
        if (result.success) {
          setData(result);
        } else {
          throw new Error('Failed to load store data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading store');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case '68483ef21d38b4b7195d45cd': return 'Cafés & Treats';
      case '68483ef21d38b4b7195d45ce': return 'Tickets & Passes';
      case '68492e4c7c523741d619abeb': return 'Dining & Meals';
      default: return 'Other';
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

  const handlePurchase = async (item: GiftItem) => {
    setSelectedItem(item);
    setFormData({ senderName: '', recipientName: '', message: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsCreatingVoucher(true);
    setError('');

    try {
      // Get viral loop referral token from localStorage or cookie
      let refToken = '';
      if (typeof window !== 'undefined') {
        // Try localStorage first
        refToken = localStorage.getItem('brontie_recipient_id') || '';
        
        // If not in localStorage, try cookie
        if (!refToken) {
          const cookies = document.cookie.split(';');
          const refCookie = cookies.find(c => c.trim().startsWith('brontie_recipient_id='));
          if (refCookie) {
            refToken = refCookie.split('=')[1];
          }
        }
      }

      // Attach QR short id if present for attribution
      let qrShortId = '';
      try {
        if (typeof window !== 'undefined') {
          qrShortId = localStorage.getItem('brontie_qr_short_id') || '';
        }
      } catch {}

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          giftItemId: selectedItem._id,
          senderName: formData.senderName,
          recipientName: formData.recipientName,
          message: formData.message,
          ref: refToken, // Include viral loop referral token
          qrShortId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const result = await response.json();
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-slate-700">Loading store...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex flex-col justify-center items-center text-center py-12">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
          <span className="text-orange-500 text-2xl">🏪</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-700 mb-4" style={{fontFamily: 'Alegreya SC, serif'}}>Store Not Found</h1>
        <p className="text-slate-600 mb-6">{error || 'The requested store could not be found.'}</p>
        <Link href="/" className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500">
          Return to Home
        </Link>
      </div>
    );
  }

  const { store, giftItems } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
      <div className="flex justify-center">
        <Image
          src="/brontie-logo.webp"
          alt="Brontie Logo"
          width={400}
          height={160}
          className="object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              {store.logoUrl ? (
                <Image
                  src={store.logoUrl}
                  alt={`${store.name} logo`}
                  width={96}
                  height={96}
                  className="rounded-2xl object-cover border-2 border-gray-200 shadow-sm"
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
                <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily: 'Alegreya SC, serif'}}>{store.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(store.businessCategory)}`}>
                  {store.businessCategory}
                </span>
              </div>
              
              {store.description && (
                <p className="text-gray-600 text-lg mb-4">{store.description}</p>
              )}

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{store.address}</span>
                </div>
                
                {store.contactPhone && (
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">{store.contactPhone}</span>
                  </div>
                )}
                
                {store.website && (
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <a 
                      href={store.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-800 underline"
                    >
                      {store.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How to Send a Brontie Gift Section */}
        <div className="bg-[#73a7ae] rounded-2xl p-6 shadow-lg border border-teal-100 mb-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Alegreya SC, serif', color: '#fbbf24'}}>
            How to Send a Brontie Gift
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1️⃣
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Pick a Treat</h3>
              <p className="text-md" style={{color: 'white'}}>Choose a coffee, pastry, or other item from {store.name}.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2️⃣
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Send It Instantly</h3>
              <p className="text-md" style={{color: 'white'}}>Get a shareable gift link to send via WhatsApp, text, or email.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3️⃣
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">They Enjoy It</h3>
              <p className="text-md" style={{color: 'white'}}>Your friend redeems it in-store by showing the QR code.</p>
            </div>
          </div>
          
          <div className="text-center mt-6 pt-4 border-t border-teal-200">
            <p className="text-lg font-medium" style={{color: '#fbbf24'}}>
              💛 A little surprise goes a long way!!
            </p>
          </div>
        </div>

        {/* Gift Items Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Alegreya SC, serif'}}>Available Gifts</h2>
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {giftItems.length} items
              </span>
            </div>
          </div>

          {giftItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-8xl mb-6">🎁</div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No gift items available</h3>
              <p className="text-gray-600 mb-8 text-lg">This store doesn&apos;t have any gift items yet</p>
              <Link
                href="/"
                className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors font-medium text-lg"
              >
                Browse Other Stores
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {giftItems.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  {/* Item Image */}
                  <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-200">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={300}
                        height={300}
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
                    
                    <p className="text-2xl font-bold text-orange-600">€{item.price.toFixed(2)}</p>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">{item.description}</p>
                    )}

                    <button
                      onClick={() => handlePurchase(item)}
                      className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Purchase Gift
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-orange-100 via-yellow-100 to-green-100 mt-12 rounded-2xl">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-6" style={{fontFamily: 'Alegreya SC, serif'}}>
              Ready to brighten someone&rsquo;s day?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Every small gesture creates ripples of joy. Start with a simple gift and watch how it transforms an ordinary moment into something memorable.
            </p>
            <Link 
              href="/"
              className="inline-block bg-orange-600 !text-white font-bold px-8 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500"
            >
              Explore More Gifts
            </Link>
          </div>
        </section>
      </div>

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Alegreya SC, serif'}}>
                Purchase Gift
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedItem.name}</h4>
              <p className="text-2xl font-bold text-orange-600">€{selectedItem.price.toFixed(2)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                />
              </div>

              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Enter recipient's name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Send a note (optional)
                </label>
                <MessageTemplates 
                  onTemplateSelect={(template) => setFormData(prev => ({ ...prev, message: template }))}
                  currentMessage={formData.message}
                />
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black resize-none"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formData.message.length}/200 characters
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isCreatingVoucher}
                className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingVoucher ? 'Processing...' : `Purchase Gift - €${selectedItem.price.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
