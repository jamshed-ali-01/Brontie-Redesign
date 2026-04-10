'use client';

import React, { useState } from 'react';
import { MerchantLocation } from '@/types/merchant';
import { Diff, MapPin, Phone, Plus, Loader2 } from 'lucide-react';

interface LocationTabProps {
  locations: MerchantLocation[];
  merchantLogoUrl?: string;
  onAddLocation: () => void;
  onEditLocation: (location: MerchantLocation) => void;
  onDeleteLocation: (locationId: string) => void;
  onUploadCoverPhoto?: (locationId: string, file: File) => Promise<void> | void;
}

export default function LocationTab({ locations, merchantLogoUrl, onAddLocation, onEditLocation, onDeleteLocation, onUploadCoverPhoto }: LocationTabProps) {
  const [uploadingLocationId, setUploadingLocationId] = useState<string | null>(null);

  const formatTime = (time?: string) => time ? time : 'Not Set';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        {locations.map((location) => (
          <div key={location._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
            {/* Image Placeholder */}
            <div className="h-48 bg-gray-200 relative group/image">
              <img 
                src={location.photoUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"} 
                alt={location.name} 
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: uploadingLocationId === location._id ? 0.6 : 1 }}
              />
              
              {/* Loading Overlay */}
              {uploadingLocationId === location._id && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[2px] z-20">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}

              <label className="absolute top-4 right-4 bg-white/90 backdrop-blur w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white shadow-sm transition-colors group z-30">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  disabled={uploadingLocationId === location._id}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && onUploadCoverPhoto && location._id) {
                      setUploadingLocationId(location._id);
                      try {
                        await onUploadCoverPhoto(location._id, file);
                      } finally {
                        setUploadingLocationId(null);
                      }
                    }
                  }} 
                />
                <Plus className={`size-4 text-[#f4c24d] transition-transform ${uploadingLocationId === location._id ? 'opacity-50' : 'group-hover:scale-110'}`} />
              </label>

              {/* Logo Overlay */}
              <div className="absolute -bottom-8 right-8 w-20 h-20 rounded-full bg-white shadow-md p-1 z-30">
                <div className="w-full h-full rounded-full border border-dashed border-gray-300 bg-[#fef6eb] flex items-center justify-center overflow-hidden">
                  {merchantLogoUrl ? (
                    <img src={merchantLogoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gray-200 opacity-20" style={{ backgroundImage: 'radial-gradient(#ccc 2px, transparent 2px)', backgroundSize: '10px 10px' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
              
              <div className="space-y-2 mb-6 sm:mb-8">
                <div className="flex items-start text-[#94A3B8] text-sm">
                  <span className="text-gray-400 mr-2 mt-0.5"><MapPin className="size-3" color='#94A3B8' /></span>
                  {location.address}{location.area ? `, ${location.area}` : ''}, {location.county}
                </div>
                {location.phoneNumber && (
                  <div className="flex items-center text-[#94A3B8] text-sm ">
                    <span className="text-gray-400 mr-2"><Phone className="size-3" color='#94A3B8' /></span>
                    {location.phoneNumber}
                  </div>
                )}
              </div>

                <div className="mt-auto">
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider mb-2 sm:mb-3">OPENING HOURS</p>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-5 sm:mb-6">
                  {/* Mon-Fri */}
                  <div className="bg-[#fbfafe] rounded-xl p-1.5 sm:p-3 text-center border border-gray-50 flex flex-col justify-center items-center h-full">
                    <div className="text-[9px] sm:text-[10px] font-bold text-gray-600 mb-0.5 sm:mb-1">MON-FRI</div>
                    <div className="text-[9px] sm:text-xs font-bold text-gray-900 leading-tight">
                      {!location.openingHours ? 'Not Set' : location.openingHours.monday?.closed ? 'Closed' : `${formatTime(location.openingHours.monday?.open)} - ${formatTime(location.openingHours.monday?.close)}`}
                    </div>
                  </div>
                  {/* Sat */}
                  <div className="bg-[#fbfafe] rounded-xl p-1.5 sm:p-3 text-center border border-gray-50 flex flex-col justify-center items-center h-full">
                    <div className="text-[9px] sm:text-[10px] font-bold text-gray-600 mb-0.5 sm:mb-1">SAT</div>
                    <div className="text-[9px] sm:text-xs font-bold text-gray-900 leading-tight">
                      {!location.openingHours ? 'Not Set' : location.openingHours.saturday?.closed ? 'Closed' : `${formatTime(location.openingHours.saturday?.open)} - ${formatTime(location.openingHours.saturday?.close)}`}
                    </div>
                  </div>
                  {/* Sun */}
                  <div className="bg-[#fbfafe] rounded-xl p-1.5 sm:p-3 text-center border border-gray-50 flex flex-col justify-center items-center h-full">
                    <div className="text-[9px] sm:text-[10px] font-bold text-gray-600 mb-0.5 sm:mb-1">SUN</div>
                    <div className="text-[9px] sm:text-xs font-bold text-gray-900 leading-tight">
                      {!location.openingHours ? 'Not Set' : location.openingHours.sunday?.closed ? 'Closed' : `${formatTime(location.openingHours.sunday?.open)} - ${formatTime(location.openingHours.sunday?.close)}`}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
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
