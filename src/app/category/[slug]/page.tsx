'use client';

import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

interface Merchant {
  _id: string;
  name: string;
  logoUrl?: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  merchantId: Merchant;
  locationIds: MerchantLocation[];
}

interface CategoryData {
  category: Category;
  giftItems: GiftItem[];
  merchants: Merchant[];
}

// Helper function to properly decode UTF-8 strings
const decodeUTF8 = (str: string): string => {
  try {
    // Try to decode if it's a URI encoded string
    return decodeURIComponent(str);
  } catch {
    // If decoding fails, return the original string
    return str;
  }
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const posthog = usePostHog();
  const trackedRef = useRef(false);
  
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');

  useEffect(() => {
    if (!slug) return;

    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`/api/categories/${slug}`);
        if (!response.ok) {
          // Redirect to homepage instead of showing error
          router.push('/');
          return;
        }
        const result = await response.json();
        if (result.success) {
          // Ensure proper UTF-8 decoding of category data
          if (result.category) {
            result.category.name = decodeUTF8(result.category.name);
            if (result.category.description) {
              result.category.description = decodeUTF8(result.category.description);
            }
          }
          
          // Ensure proper UTF-8 decoding of gift items
          if (result.giftItems) {
            result.giftItems = result.giftItems.map((item: GiftItem) => ({
              ...item,
              name: decodeUTF8(item.name),
              description: item.description ? decodeUTF8(item.description) : undefined,
              merchantId: {
                ...item.merchantId,
                name: decodeUTF8(item.merchantId.name)
              },
              locationIds: item.locationIds.map((location: MerchantLocation) => ({
                ...location,
                name: decodeUTF8(location.name),
                address: decodeUTF8(location.address)
              }))
            }));
          }

          // Ensure proper UTF-8 decoding of merchants
          if (result.merchants) {
            result.merchants = result.merchants.map((merchant: Merchant) => ({
              ...merchant,
              name: decodeUTF8(merchant.name)
            }));
          }
          
          setData(result);
        } else {
          // Redirect to homepage instead of showing error
          router.push('/');
          return;
        }
      } catch {
        // Redirect to homepage instead of showing error
        router.push('/');
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, router]);

  // Treat /category/cafes-treats as Willow & Wild QR scan
  useEffect(() => {
    if (trackedRef.current) return;
    if (slug !== 'cafes-treats') return;
    trackedRef.current = true;
    try {
      if (posthog) {
        posthog.capture('qr_code_scanned', {
          short_id: 'category-cafes-treats',
          merchant_id: '68483ef21d38b4b7195d45d0',
          merchant_name: 'Willow & Wild',
          location_id: '684946146cbbf9734d59d75f',
          location_name: 'Willow & Wild - Leixlip',
          is_from_redeem_page: false,
          referrer: document.referrer || undefined,
          page: 'category',
          path: window.location.pathname,
        });
      }
    } catch {}
  }, [slug, posthog]);

  // Handle redirect for missing data in useEffect
  useEffect(() => {
    if (!loading && !data) {
      router.push('/');
    }
  }, [loading, data, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-slate-700">Loading...</span>
      </div>
    );
  }

  // Return null if no data (redirect will happen in useEffect)
  if (!data) {
    return null;
  }

  const { category, giftItems, merchants } = data;

  // Filter gift items by selected merchant
  const filteredGiftItems = selectedMerchant 
    ? giftItems.filter(item => item.merchantId._id === selectedMerchant)
    : giftItems;

  const latestMerchants = giftItems
    .reduce((merchants: Merchant[], item: GiftItem) => {
      const existingMerchant = merchants.find(m => m._id === item.merchantId._id);
      if (!existingMerchant) {
        merchants.push(item.merchantId);
      }
      return merchants;
    }, [])
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8 px-4">
<div className="flex justify-center">
        <Image
          src="/brontie-logo.webp"
          alt="Brontie Logo"
          width={400}
          height={160}
          className="object-contain"
        />
      </div>

      {/* How to Send a Brontie Gift Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-[#73a7ae] rounded-2xl p-6 shadow-lg border border-teal-100">
          <h2 className="text-2xl font-bold text-center mb-6" style={{fontFamily: 'Alegreya SC, serif', color: '#fbbf24'}}>
            How to Send a Brontie Gift
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1️⃣
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Pick a Treat</h3>
              <p className="text-md" style={{color: 'white'}}>Choose a coffee, pastry, or other item from Willow & Wild.</p>
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
      </div>


      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
        <div className="flex items-center space-x-4">
          {category.imageUrl && (
            <Image
              src={category.imageUrl}
              alt={category.name}
              width={64}
              height={64}
              className="rounded-xl"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>{category.name}</h1>
            {category.description && (
              <p className="text-slate-600 mt-2">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      {latestMerchants.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
          <h2 className="text-lg font-semibold text-slate-700 mb-4" style={{fontFamily: 'Alegreya SC, serif'}}>
            Merchants in {category.name}
          </h2>
          <div className="flex flex-wrap gap-4">
            {latestMerchants.map((merchant) => (
              <div
                key={merchant._id}
                className="flex items-center space-x-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 hover:bg-orange-100 transition-colors border border-orange-100"
              >
                {merchant.logoUrl ? (
                  <Image
                    src={merchant.logoUrl}
                    alt={merchant.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-golden-honey rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {merchant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium text-slate-700 text-sm">
                  {merchant.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>Available Gifts</h2>
          
          {merchants && merchants.length > 0 && (
            <div className="flex items-center gap-3">
              <label htmlFor="merchant-filter" className="text-sm font-medium text-slate-600">
                Filter by Merchant:
              </label>
              <select
                id="merchant-filter"
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black bg-white"
              >
                <option value="">All Merchants</option>
                {merchants.map((merchant) => (
                  <option key={merchant._id} value={merchant._id}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {filteredGiftItems.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
              <span className="text-orange-500 text-2xl">☕</span>
            </div>
            <p className="text-slate-600">
              {selectedMerchant 
                ? 'No gifts available from the selected merchant.' 
                : 'No gifts available in this category yet.'
              }
            </p>
            <Link href="/" className="bg-orange-600 text-white font-bold px-6 py-2 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500 mt-4 inline-block">
              <span className="text-white">Browse other categories</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGiftItems.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-100 group">
                {item.imageUrl && (
                  <div className="h-48 relative rounded-t-2xl overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-slate-700 mb-2 group-hover:text-orange-600 transition-colors duration-300">{item.name}</h3>
                    {item.description && (
                      <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                    )}
                    <div className="text-2xl font-bold text-orange-600 animate-gentle-pulse">
                    €{item.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                    <div className="flex items-center space-x-2 mb-2">
                      {item.merchantId.logoUrl && (
                        <Image
                          src={item.merchantId.logoUrl}
                          alt={item.merchantId.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium text-slate-700">{item.merchantId.name}</span>
                    </div>
                    
                    {item.locationIds.length > 0 && (
                      <div className="text-sm text-slate-600">
                        {item.locationIds.map((location) => (
                          <div key={location._id} className="flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-600 hover:text-terracotta hover:underline transition-colors"
                            >
                              {location.address}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/product/${item._id}`}
                    className="w-full bg-orange-600 !text-white font-bold text-center py-2 px-4 rounded-full hover:bg-orange-700 transition-all duration-300 inline-block shadow-lg hover:shadow-xl border-2 border-orange-500"
                  >
                    Purchase Gift
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        
        {/* Call to Action - Final touch */}
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
    </div>
  );
}
