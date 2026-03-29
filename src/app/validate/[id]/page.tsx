'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Voucher {
  _id: string;
  giftItemId: string;
  merchantLocationId: string;
  status: 'active' | 'redeemed';
  createdAt: string;
  redeemedAt?: string;
  recipientName: string;
  senderName: string;
  redemptionLink: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  merchantId: {
    _id: string;
    name: string;
  };
  categoryId: {
    _id: string;
    name: string;
  };
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  merchantId: string;
}

export default function ValidatePage() {
  const params = useParams();
  const voucherId = params.id as string;
  
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [giftItem, setGiftItem] = useState<GiftItem | null>(null);
  const [merchantLocation, setMerchantLocation] = useState<MerchantLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantLocationId, setMerchantLocationId] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoucherDetails = async () => {
      try {
        // Fetch voucher details
        const voucherResponse = await fetch(`/api/voucher/${voucherId}`);
        if (!voucherResponse.ok) {
          throw new Error('Failed to fetch voucher details');
        }
        
        const data = await voucherResponse.json();
        setVoucher(data.voucher);
        setGiftItem(data.giftItem);
        setMerchantLocation(data.merchantLocation);
        
        // Pre-fill merchant location ID if already redeemed
        if (data.voucher.status === 'redeemed') {
          setMerchantLocationId(data.merchantLocation._id);
          setValidationMessage('This voucher has already been redeemed.');
        }
      } catch (err) {
        setError('Error loading voucher details. Please check the link and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (voucherId) {
      fetchVoucherDetails();
    }
  }, [voucherId]);

  const handleRedeemVoucher = async () => {
    if (!voucher || !giftItem || !merchantLocation || isSubmitting) return;
    
    if (voucher.status === 'redeemed') {
      setValidationMessage('This voucher has already been redeemed.');
      return;
    }
    
    if (!merchantLocationId) {
      setValidationMessage('Please enter your merchant location ID to validate this voucher.');
      return;
    }
    
    setIsSubmitting(true);
    setValidationMessage(null);
    
    try {
      const response = await fetch(`/api/voucher/${voucherId}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantLocationId: merchantLocationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem voucher');
      }
      
      setSuccess(true);
      setVoucher({
        ...voucher,
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
      });
      setValidationMessage('Voucher successfully redeemed!');
    } catch (err: unknown) {
      setValidationMessage(`Error: ${err instanceof Error ? err.message : 'Failed to redeem voucher'}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-warm-terracotta"></div>
        </div>
      </div>
    );
  }

  if (error || !voucher || !giftItem || !merchantLocation) {
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
        <div className="max-w-md mx-auto text-center p-6 mt-8 bg-white rounded-2xl shadow-lg border border-orange-100">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
            <span className="text-orange-500 text-2xl">☕</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-700 mb-4" style={{fontFamily: 'Alegreya SC, serif'}}>Voucher Not Found</h1>
          <div className="text-red-500 mb-4">{error || 'Voucher not found'}</div>
          <Link 
            href="/" 
            className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isRedeemed = voucher.status === 'redeemed';
  const formattedCreatedDate = new Date(voucher.createdAt).toLocaleDateString();
  const formattedRedeemedDate = voucher.redeemedAt 
    ? new Date(voucher.redeemedAt).toLocaleDateString() 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8">
      <div className="flex justify-center">
        <Image
          src="/brontie-logo.webp"
          alt="Brontie Logo"
          width={400}
          height={160}
          className="object-contain"
        />
      </div>
      <div className="max-w-lg mx-auto px-4">
      <div className="bg-white border border-orange-100 rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{fontFamily: 'Alegreya SC, serif'}}>Validate Voucher</h1>
              <p className="text-midnight-teal">{giftItem.name}</p>
              <p className="text-sm text-warm-terracotta">{giftItem.categoryId.name}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              success 
                ? 'bg-green-100 text-green-800 animate-gentle-pulse' 
                : isRedeemed 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-green-100 text-green-800'
            }`}>
              {success ? 'Just Redeemed' : isRedeemed ? 'Already Redeemed' : 'Active'}
            </div>
          </div>
          
          {validationMessage && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              success 
                ? 'bg-green-100 text-green-800 animate-gentle-pulse' 
                : 'bg-golden-honey bg-opacity-20 text-amber-800 border border-golden-honey'
            }`}>
              {validationMessage}
            </div>
          )}
        </div>
        
        {/* Voucher Details */}
        <div className="p-6 border-t border-b border-orange-100">
          <h3 className="font-semibold mb-4 text-midnight-teal" style={{fontFamily: 'Alegreya SC, serif'}}>Voucher Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm mb-1">Gift Item</p>
              <p className="font-medium text-midnight-teal">{giftItem.name}</p>
              <p className="text-warm-terracotta font-medium animate-gentle-pulse">€{giftItem.price.toFixed(2)}</p>
              
              <p className="text-gray-500 text-sm mt-4 mb-1">Recipient</p>
              <p className="font-medium">{voucher.recipientName}</p>
              
              <p className="text-gray-500 text-sm mt-4 mb-1">From</p>
              <p className="font-medium">{voucher.senderName}</p>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm mb-1">Merchant</p>
              <p className="font-medium">{giftItem.merchantId.name}</p>
              <p className="text-sm text-gray-600">{merchantLocation.name}</p>
              <p className="text-sm text-gray-600">{merchantLocation.address}</p>
              
              <p className="text-gray-500 text-sm mt-4 mb-1">Created</p>
              <p className="font-medium">{formattedCreatedDate}</p>
              
              {isRedeemed && (
                <>
                  <p className="text-gray-500 text-sm mt-4 mb-1">Redeemed</p>
                  <p className="font-medium">{formattedRedeemedDate}</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Validation Form */}
        <div className="p-6 bg-parchment-white">
          <h3 className="font-semibold mb-4 text-midnight-teal" style={{fontFamily: 'Alegreya SC, serif'}}>Merchant Validation</h3>
          
          {!isRedeemed ? (
            <div>
              <div className="mb-4">
                <label htmlFor="merchantLocationId" className="block text-gray-700 mb-2">
                  Enter Merchant Location ID to validate
                </label>
                <input
                  type="text"
                  id="merchantLocationId"
                  value={merchantLocationId}
                  onChange={(e) => setMerchantLocationId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                  placeholder={`Location ID (e.g., ${merchantLocation._id})`}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  For demo purposes, enter the location ID: {merchantLocation._id}
                </p>
              </div>
              
              <button
                onClick={handleRedeemVoucher}
                disabled={isSubmitting}
                className={`w-full py-3 rounded-full text-white font-bold ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-warm-terracotta hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500'
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Validate & Redeem Voucher'}
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-lg text-center">
              <div className="text-4xl mb-2 text-green-600 animate-gentle-pulse">✓</div>
              <p className="text-midnight-teal font-medium">This voucher has already been redeemed.</p>
              <p className="text-sm text-gray-600 mt-2">
                Redeemed on {formattedRedeemedDate} at {merchantLocation.name}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          href="/"
          className="text-warm-terracotta hover:text-orange-700 transition-colors duration-300 font-medium"
        >
          Return to Home
        </Link>
      </div>
    </div>
    </div>
  );
}
