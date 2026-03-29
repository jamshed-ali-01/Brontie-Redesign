'use client';

import { useState, useEffect } from 'react';

interface Merchant {
  _id: string;
  name: string;
  status: string;
}

interface MerchantSelectorProps {
  selectedMerchantId: string;
  onMerchantChange: (merchantId: string) => void;
  showAllOption?: boolean;
}

export default function MerchantSelector({ 
  selectedMerchantId, 
  onMerchantChange, 
  showAllOption = true 
}: MerchantSelectorProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch('/api/admin/merchants');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setMerchants(data.data);
          setError(null);
        } else {
          setMerchants([]);
          setError('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching merchants:', error);
        setMerchants([]);
        setError(error instanceof Error ? error.message : 'Failed to load merchants');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Select Café:
        </label>
        <div className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px] bg-gray-100 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Select Café:
        </label>
        <div className="border border-red-300 rounded-lg px-3 py-2 text-sm min-w-[200px] bg-red-50 text-red-700">
          Error loading merchants
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Select Café:
      </label>
      <select
        value={selectedMerchantId}
        onChange={(e) => onMerchantChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[200px]"
      >
        {showAllOption && (
          <option value="">🏪 All Cafés</option>
        )}
        {Array.isArray(merchants) && merchants.length > 0
          ? merchants
              .filter(merchant => merchant && merchant.status === 'approved')
              .map((merchant) => (
                <option key={merchant._id} value={merchant._id}>
                  ☕ {merchant.name}
                </option>
              ))
          : <option disabled>No merchants available</option>
        }
      </select>
    </div>
  );
}
