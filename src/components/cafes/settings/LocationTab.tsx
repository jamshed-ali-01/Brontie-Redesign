'use client';

import React from 'react';
import { MerchantLocation } from '@/types/merchant';

interface LocationTabProps {
  locations: MerchantLocation[];
  onAddLocation: () => void;
  onEditLocation: (location: MerchantLocation) => void;
  onDeleteLocation: (locationId: string) => void;
}

export default function LocationTab({ locations, onAddLocation, onEditLocation, onDeleteLocation }: LocationTabProps) {
  
  const formatTime = (time?: string) => time || '00:00';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
        {locations.map((location) => (
          <div key={location._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
            {/* Image Placeholder */}
            <div className="h-48 bg-gray-200 relative">
              <img 
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80" 
                alt="Cafe interior" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white shadow-sm">
                <span className="text-[#f4c24d] font-bold text-lg leading-none">+</span>
              </div>
              {/* Logo Overlay */}
              <div className="absolute -bottom-8 right-8 w-20 h-20 rounded-full bg-white shadow-md p-1">
                <div className="w-full h-full rounded-full border border-dashed border-gray-300 bg-[pattern-dots] bg-gray-50 flex items-center justify-center">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-gray-200 opacity-20" style={{ backgroundImage: 'radial-gradient(#ccc 2px, transparent 2px)', backgroundSize: '10px 10px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pt-10 flex-1 flex flex-col">
              <h3 className="text-[22px] font-bold text-gray-900 mb-4">{location.name}</h3>
              
              <div className="space-y-2 mb-8">
                <div className="flex items-start text-gray-500 text-sm">
                  <span className="text-gray-400 mr-2 mt-0.5">📍</span>
                  {location.address}{location.area ? `, ${location.area}` : ''}, {location.county}
                </div>
                {location.phoneNumber && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="text-gray-400 mr-2">📞</span>
                    {location.phoneNumber}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <p className="text-[11px] font-bold text-gray-400 tracking-wider mb-3">OPENING HOURS</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {/* Mon-Fri */}
                  <div className="bg-[#fbfafe] rounded-xl p-3 text-center border border-gray-50">
                    <div className="text-[10px] font-bold text-gray-600 mb-1">MON-FRI</div>
                    <div className="text-xs font-bold text-gray-900">
                      {location.openingHours?.monday?.closed ? 'Closed' : `${formatTime(location.openingHours?.monday?.open)} - ${formatTime(location.openingHours?.monday?.close)}`}
                    </div>
                  </div>
                  {/* Sat */}
                  <div className="bg-[#fbfafe] rounded-xl p-3 text-center border border-gray-50">
                    <div className="text-[10px] font-bold text-gray-600 mb-1">SAT</div>
                    <div className="text-xs font-bold text-gray-900">
                      {location.openingHours?.saturday?.closed ? 'Closed' : `${formatTime(location.openingHours?.saturday?.open)} - ${formatTime(location.openingHours?.saturday?.close)}`}
                    </div>
                  </div>
                  {/* Sun */}
                  <div className="bg-[#fbfafe] rounded-xl p-3 text-center border border-gray-50">
                    <div className="text-[10px] font-bold text-gray-600 mb-1">SUN</div>
                    <div className="text-xs font-bold text-gray-900">
                      {location.openingHours?.sunday?.closed ? 'Closed' : `${formatTime(location.openingHours?.sunday?.open)} - ${formatTime(location.openingHours?.sunday?.close)}`}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => onEditLocation(location)}
                    className="flex-1 bg-[#f4c24d] text-gray-900 py-3 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => location._id && onDeleteLocation(location._id)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Location */}
      <button 
        onClick={onAddLocation}
        className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#6ca3a4]/40 rounded-2xl bg-teal-50/10 hover:bg-teal-50/30 transition-colors cursor-pointer group"
      >
        <div className="w-10 h-10 mb-2 text-[#6ca3a4] group-hover:scale-110 transition-transform flex items-center justify-center font-light text-4xl">
          +
        </div>
        <span className="text-[#6ca3a4] font-medium">Add another location</span>
      </button>
    </div>
  );
}
