'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface CountyFilterProps {
  merchants: Array<{ _id: string; name: string; county?: string }>;
}

export default function CountyFilter({ merchants }: CountyFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [counties, setCounties] = useState<string[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>('');

  useEffect(() => {
    // Get unique counties from merchants
    const uniqueCounties = [...new Set(merchants.map(m => m.county).filter((county): county is string => Boolean(county)))];
    setCounties(uniqueCounties.sort());
    
    // Set initial selected county from URL params
    const countyParam = searchParams.get('county');
    if (countyParam && uniqueCounties.includes(countyParam)) {
      setSelectedCounty(countyParam);
    }
  }, [merchants, searchParams]);

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    
    const params = new URLSearchParams(searchParams.toString());
    if (county) {
      params.set('county', county);
    } else {
      params.delete('county');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredMerchants = selectedCounty 
    ? merchants.filter(m => m.county === selectedCounty)
    : merchants;

  if (counties.length === 0) {
    return null;
  }

  return (
    <div className="custom-container mt-6">
      <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-full p-4 mb-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium text-sm md:text-base">Filter by County:</span>
            <select
              value={selectedCounty}
              onChange={(e) => handleCountyChange(e.target.value)}
              className="px-4 py-2 border border-amber-300 rounded-full bg-white text-amber-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
            >
              <option value="">All Counties</option>
              {counties.map(county => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCounty && (
            <div className="flex items-center gap-2">
              <span className="text-amber-700 text-sm">
                {filteredMerchants.length} café{filteredMerchants.length !== 1 ? 's' : ''} in {selectedCounty}
              </span>
              <button
                onClick={() => handleCountyChange('')}
                className="text-amber-600 hover:text-amber-800 text-sm underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Display filtered merchants */}
      {filteredMerchants.length > 0 && (
        <div className="w-full overflow-x-auto">
          <nav className="flex gap-3 md:gap-4 items-center whitespace-nowrap py-3 px-2 md:px-0">
            {filteredMerchants.map((m) => (
              <Link
                key={m._id}
                href={`/store/${m._id}`}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200 text-amber-800 hover:bg-amber-50 transition-colors text-sm md:text-base max-w-[220px] truncate"
              >
                {m.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
      
      {filteredMerchants.length === 0 && selectedCounty && (
        <div className="text-center py-8">
          <p className="text-amber-700">No cafés found in {selectedCounty}</p>
        </div>
      )}
    </div>
  );
}

