'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Coffee, MapPin, Home, Building2, Clock, Check, Plus } from 'lucide-react';
import { Lobster } from 'next/font/google';
import { COUNTY_AREAS, COUNTIES } from '@/constants/locations';

const lobster = Lobster({
   weight: '400',
   subsets: ['latin'],
   display: 'swap',
});

interface Location {
   _id: string;
   name: string;
   address: string;
   county: string;
   area: string;
}

export default function OnboardingStep2() {
   const [formData, setFormData] = useState({
      name: 'Main Café',
      locationType: 'single', // single or multiple
      county: 'Dublin',
      area: '',
      customArea: '',
      zipCode: '',
      address: '',
      openingHours: {
         monFri: { open: '08:00', close: '17:00' },
         satSun: { open: '09:00', close: '16:00' },
         daysClosed: [] as string[]
      }
   });

   const [availableAreas, setAvailableAreas] = useState<string[]>([]);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [showValidation, setShowValidation] = useState(false);
   const [locations, setLocations] = useState<Location[]>([]);
   const router = useRouter();

   // Fetch existing locations on mount
   const fetchLocations = async () => {
      try {
         const response = await fetch('/api/cafes/locations');
         if (response.ok) {
            const data = await response.json();
            const fetchedLocations = data.locations || [];
            setLocations(fetchedLocations);
            
            // Auto-set locationType if locations already exist
            if (fetchedLocations.length > 1) {
               setFormData(prev => ({ ...prev, locationType: 'multiple' }));
            }
         }
      } catch (err) {
         console.error('Failed to fetch locations:', err);
      }
   };

   useEffect(() => {
      fetchLocations();
   }, []);

   // Update available areas when county changes
   useEffect(() => {
      if (formData.county && COUNTY_AREAS[formData.county]) {
         setAvailableAreas([...COUNTY_AREAS[formData.county]].sort());
      } else {
         setAvailableAreas([]);
      }
   }, [formData.county]);

   const validateForm = () => {
      if (!formData.county) return "Please select a county";
      if (!formData.area) return "Please select an area or town";
      if (formData.area === 'other' && !formData.customArea) return "Please specify your custom area name";
      if (!formData.address || formData.address.length < 5) return "Please enter a valid full address";
      return null;
   };

   const saveLocationInstance = async () => {
      const payload = {
         name: formData.name,
         address: formData.address,
         county: formData.county,
         area: formData.area === 'other' ? formData.customArea : formData.area,
         zipCode: formData.zipCode,
         openingHours: {
            monday: { open: formData.openingHours.monFri.open, close: formData.openingHours.monFri.close, closed: formData.openingHours.daysClosed.includes('Monday') },
            tuesday: { open: formData.openingHours.monFri.open, close: formData.openingHours.monFri.close, closed: formData.openingHours.daysClosed.includes('Tuesday') },
            wednesday: { open: formData.openingHours.monFri.open, close: formData.openingHours.monFri.close, closed: formData.openingHours.daysClosed.includes('Wednesday') },
            thursday: { open: formData.openingHours.monFri.open, close: formData.openingHours.monFri.close, closed: formData.openingHours.daysClosed.includes('Thursday') },
            friday: { open: formData.openingHours.monFri.open, close: formData.openingHours.monFri.close, closed: formData.openingHours.daysClosed.includes('Friday') },
            saturday: { open: formData.openingHours.satSun.open, close: formData.openingHours.satSun.close, closed: formData.openingHours.daysClosed.includes('Saturday') },
            sunday: { open: formData.openingHours.satSun.open, close: formData.openingHours.satSun.close, closed: formData.openingHours.daysClosed.includes('Sunday') },
         }
      };

      const response = await fetch('/api/cafes/locations', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });

      return response;
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // If single location and already has one, just finish the step
      if (formData.locationType === 'single' && locations.length >= 1) {
         router.push('/cafes/onboarding/step-3');
         return;
      }

      setError('');
      setShowValidation(true);

      const validationError = validateForm();
      if (validationError) return;

      setSaving(true);
      try {
         const response = await saveLocationInstance();
         if (response.ok) {
            router.push('/cafes/onboarding/step-3'); // Redirect to items
         } else {
            const data = await response.json();
            setError(data.error || 'Failed to save location');
         }
      } catch (err) {
         setError('Network error. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   const handleAddAnother = async () => {
      setError('');
      setShowValidation(true);

      const validationError = validateForm();
      if (validationError) return;

      setSaving(true);
      try {
         const response = await saveLocationInstance();
         if (response.ok) {
            setSuccess('Location added successfully!');
            fetchLocations(); // Refresh list
            // Reset specific form fields
            setFormData(prev => ({
               ...prev,
               area: '',
               customArea: '',
               zipCode: '',
               address: ''
            }));
            setShowValidation(false);
            setTimeout(() => setSuccess(''), 4000);
         } else {
            const data = await response.json();
            setError(data.error || 'Failed to add location');
         }
      } catch (err) {
         setError('Network error. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   const toggleDayClosed = (day: string) => {
      setFormData(prev => ({
         ...prev,
         openingHours: {
            ...prev.openingHours,
            daysClosed: prev.openingHours.daysClosed.includes(day)
               ? prev.openingHours.daysClosed.filter(d => d !== day)
               : [...prev.openingHours.daysClosed, day]
         }
      }));
   };

   const isSingleAndDone = formData.locationType === 'single' && locations.length >= 1;

   return (
      <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-[#fef6eb]">
         {/* Header */}
         <header className="bg-[#6ca3a4] h-[80px] px-12 flex items-center justify-between relative z-50 shadow-md">
            <div className={`text-[#f4c24d] text-4xl ${lobster.className}`}>Brontie</div>
         </header>

         {/* Main Content Area */}
         <main className="flex-1 relative flex flex-col items-center">
            {/* Yellow Background & Wave Mask */}
            <div className="absolute top-0 left-0 w-full h-[60%] bg-[#f4c24d] z-0 overflow-hidden">
               <div className="absolute top-20 left-10 opacity-40">
                  <Coffee className="text-white w-20 h-20 rotate-[-15deg]" />
               </div>

               {/* Circular Wave Mask */}
               <div className="absolute bottom-[-100%] left-[50%] -translate-x-1/2 w-[250%] h-[200%] bg-[#fef6eb] rounded-[50%] z-10"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-20 w-full max-w-4xl px-4 pt-12 flex flex-col items-center">

               {/* Progress System */}
               <div className="w-full max-w-xl flex flex-col items-start mb-12">
                  <div className="flex items-center justify-between w-full mb-4">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-900/40 uppercase tracking-[0.2em] mb-1">Setup Progress</span>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Location Selection</span>
                     </div>
                     <span className="text-[10px] font-black text-gray-900/40 uppercase tracking-wider">Step 2 of 5</span>
                  </div>
                  <div className="flex w-full gap-2">
                     <div className="h-1.5 flex-1 bg-[#6ca3a4] rounded-full"></div>
                     <div className="h-1.5 flex-1 bg-[#6ca3a4] rounded-full"></div>
                     <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                     <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                     <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                  </div>
               </div>

               {/* Title Section */}
               <div className="text-center mb-12">
                  <h1 className={`text-4xl md:text-5xl text-white drop-shadow-sm ${lobster.className}`}>
                     {locations.length > 0 ? `You've added ${locations.length} location${locations.length === 1 ? '' : 's'}` : 'Do you have more than one location?'}
                  </h1>
                  <p className="text-[#2c3e50] text-sm font-bold opacity-60 mt-4">
                     Customers can redeem gifts at any of your locations
                  </p>
               </div>

               <form onSubmit={handleSubmit} className="w-full space-y-10 pb-32">

                  {/* Choice Cards (Only show if type not selected or just keep them for flexibility) */}
                  <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                     <div
                        onClick={() => setFormData({ ...formData, locationType: 'single' })}
                        className={`relative cursor-pointer p-8 rounded-[32px] border-2 transition-all duration-300 flex flex-col items-center text-center ${formData.locationType === 'single' ? 'bg-white border-[#f4c24d] shadow-xl' : 'bg-white/40 border-transparent border-white/50'
                           }`}
                     >
                        <div className="w-14 h-14 bg-[#fefeec] rounded-2xl flex items-center justify-center text-[#f4c24d] mb-4">
                           <Home className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-extrabold text-[#2c3e50] mb-1">Just one location</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Keep it simple</p>
                        {formData.locationType === 'single' && (
                           <div className="absolute top-4 right-4 text-[#f4c24d] bg-[#f4c24d]/10 rounded-full p-1.5">
                              <Check className="w-4 h-4 stroke-[4]" />
                           </div>
                        )}
                     </div>

                     <div
                        onClick={() => setFormData({ ...formData, locationType: 'multiple' })}
                        className={`relative cursor-pointer p-8 rounded-[32px] border-2 transition-all duration-300 flex flex-col items-center text-center ${formData.locationType === 'multiple' ? 'bg-white border-[#f4c24d] shadow-xl' : 'bg-white/40 border-transparent border-white/50'
                           }`}
                     >
                        <div className="w-14 h-14 bg-[#fefeec] rounded-2xl flex items-center justify-center text-[#f4c24d] mb-4">
                           <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-extrabold text-[#2c3e50] mb-1">More than one location</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">customer can redeem at any of your cafes</p>
                        {formData.locationType === 'multiple' && (
                           <div className="absolute top-4 right-4 text-[#f4c24d] bg-[#f4c24d]/10 rounded-full p-1.5">
                              <Check className="w-4 h-4 stroke-[4]" />
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Success Message Hook */}
                  {success && (
                     <div className="w-full max-w-2xl mx-auto bg-green-50 border border-green-100 text-green-600 rounded-2xl p-5 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                           </div>
                           <span className="text-sm font-bold">{success}</span>
                        </div>
                        <button type="button" onClick={() => setSuccess('')} className="text-xs uppercase font-black opacity-40 hover:opacity-100">✕</button>
                     </div>
                  )}

                  {/* Main Form Card */}
                  <div className="bg-white rounded-[40px] shadow-2xl shadow-[#6ca3a4]/10 p-12 border border-white/50 flex flex-col gap-12 relative overflow-hidden">
                     
                     {/* Added Locations List (Dynamic) - Shown at the TOP of the card as requested */}
                     {locations.length > 0 && (
                        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-700 pb-8 border-b border-gray-100">
                           <div className="flex items-center justify-between mb-6 px-2">
                              <h2 className="text-[10px] font-black text-[#2c3e50]/40 uppercase tracking-[0.2em]">Added Locations</h2>
                              <span className="text-[10px] font-black text-[#6ca3a4] uppercase tracking-wider">Scroll to view all</span>
                           </div>
                           <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide px-2">
                              {locations.map((loc, idx) => (
                                 <div key={loc._id} className="flex-shrink-0 w-64 bg-[#fef6eb] rounded-3xl p-6 shadow-sm border border-transparent relative group transition-transform hover:scale-[1.02]">
                                    <div className="flex items-start justify-between mb-4">
                                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6ca3a4] shadow-sm">
                                          <MapPin className="w-5 h-5" />
                                       </div>
                                       <span className="text-[10px] font-black text-gray-300/60 uppercase">Branch #{idx + 1}</span>
                                    </div>
                                    <h3 className="text-xs font-black text-[#2c3e50] mb-1 line-clamp-1">{loc.name || 'Café Location'}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold mb-3">{loc.area}, {loc.county}</p>
                                    <div className="pt-3 border-t border-gray-200/40">
                                       <p className="text-[9px] text-gray-400 font-bold line-clamp-2 leading-relaxed italic opacity-80">{loc.address}</p>
                                    </div>
                                 </div>
                              ))}
                              
                              {/* Add More Placeholder Card */}
                              {!isSingleAndDone && (
                                <div className="flex-shrink-0 w-64 border-2 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:bg-[#fef6eb]/50 transition-all opacity-40">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-300 mb-2">
                                      <Plus className="w-5 h-5" />
                                   </div>
                                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Next Branch</p>
                                </div>
                              )}
                           </div>
                        </div>
                     )}

                     {isSingleAndDone ? (
                        <div className="py-20 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                           <div className="w-20 h-20 bg-[#fef6eb] rounded-[32px] flex items-center justify-center text-[#6ca3a4] shadow-xl mb-4">
                              <Check className="w-10 h-10 stroke-[3]" />
                           </div>
                           <h2 className={`text-3xl text-[#2c3e50] ${lobster.className}`}>One Location Added!</h2>
                           <p className="text-[#2c3e50]/60 font-bold max-w-sm">
                              You've successfully set up your café location. Click below to continue your setup.
                           </p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full animate-in fade-in duration-500">
                           {/* Left: Location Details */}
                           <div className="space-y-8">
                              <div className="flex items-center space-x-3 text-[#6ca3a4]">
                                 <MapPin className="w-5 h-5" />
                                 <h2 className="text-xs font-black uppercase tracking-[0.2em] pt-0.5">Location Details</h2>
                              </div>

                              <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">County</label>
                                    <div className="relative">
                                       <select
                                          value={formData.county}
                                          onChange={(e) => setFormData({ ...formData, county: e.target.value, area: '' })}
                                          className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-sm h-[56px] appearance-none font-bold transition-all ${showValidation && !formData.county ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                                             }`}
                                       >
                                          <option value="">Select County</option>
                                          {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                       <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6ca3a4] rotate-90" />
                                    </div>
                                    {showValidation && !formData.county && (
                                       <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">Please select your county</p>
                                    )}
                                 </div>

                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Area</label>
                                    <div className="relative">
                                       <select
                                          value={formData.area}
                                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                          className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-sm h-[56px] appearance-none font-bold transition-all ${showValidation && !formData.area ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                                             }`}
                                          disabled={!formData.county}
                                       >
                                          <option value="">Select Area / Town</option>
                                          {availableAreas.map(area => <option key={area} value={area}>{area}</option>)}
                                          <option value="other">Other (Specify below)</option>
                                       </select>
                                       <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6ca3a4] rotate-90" />
                                    </div>
                                    {showValidation && !formData.area && (
                                       <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">Please select an area or town</p>
                                    )}
                                 </div>

                                 {formData.area === 'other' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                       <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Custom Area Name</label>
                                       <input
                                          type="text"
                                          value={formData.customArea}
                                          onChange={(e) => setFormData({ ...formData, customArea: e.target.value })}
                                          placeholder="Enter area/town name"
                                          className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-sm h-[56px] placeholder:text-gray-300 font-bold transition-all ${showValidation && !formData.customArea ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                                             }`}
                                       />
                                       {showValidation && !formData.customArea && (
                                          <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">Please specify your area name</p>
                                       )}
                                    </div>
                                 )}

                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Eircode</label>
                                    <input
                                       type="text"
                                       value={formData.zipCode}
                                       onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                       placeholder="Enter Eircode"
                                       className="w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-sm h-[56px] placeholder:text-gray-300 font-bold"
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Address</label>
                                    <textarea
                                       value={formData.address}
                                       onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                       placeholder="e.g. Main Street Clare, Kildare"
                                       rows={3}
                                       className={`w-full bg-[#fef6eb] px-6 py-4 rounded-2xl text-black border-2 focus:ring-0 text-sm placeholder:text-gray-300 font-bold resize-none transition-all ${showValidation && (!formData.address || formData.address.length < 5) ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                                          }`}
                                    />
                                    {showValidation && (!formData.address || formData.address.length < 5) && (
                                       <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">Please enter your full business address</p>
                                    )}
                                 </div>

                                 {formData.locationType === 'multiple' && (
                                    <button
                                       type="button"
                                       onClick={handleAddAnother}
                                       disabled={saving}
                                       className="text-[#6ca3a4] text-[11px] font-black uppercase flex items-center space-x-2 border-2 border-[#6ca3a4]/20 px-5 py-3 rounded-2xl hover:bg-[#6ca3a4]/5 hover:border-[#6ca3a4]/40 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                       <Plus className="w-4 h-4" />
                                       <span>{saving ? 'Adding...' : 'Add another location'}</span>
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* Right: Opening Hours */}
                           <div className="space-y-8">
                              <div className="flex items-center space-x-3 text-[#6ca3a4]">
                                 <Clock className="w-5 h-5" />
                                 <h2 className="text-xs font-black uppercase tracking-[0.2em] pt-0.5">Opening Hours</h2>
                              </div>

                              <div className="space-y-6">
                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Mon - Fri</label>
                                    <div className="grid grid-cols-2 gap-3">
                                       <input type="time" value={formData.openingHours.monFri.open} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, monFri: { ...formData.openingHours.monFri, open: e.target.value } } })} className="bg-[#fef6eb] px-4 rounded-xl text-xs h-[50px] border-none font-bold focus:ring-2 focus:ring-[#f4c24d]" />
                                       <input type="time" value={formData.openingHours.monFri.close} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, monFri: { ...formData.openingHours.monFri, close: e.target.value } } })} className="bg-[#fef6eb] px-4 rounded-xl text-xs h-[50px] border-none font-bold focus:ring-2 focus:ring-[#f4c24d]" />
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Sat - Sun</label>
                                    <div className="grid grid-cols-2 gap-3">
                                       <input type="time" value={formData.openingHours.satSun.open} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, satSun: { ...formData.openingHours.satSun, open: e.target.value } } })} className="bg-[#fef6eb] px-4 rounded-xl text-xs h-[50px] border-none font-bold focus:ring-2 focus:ring-[#f4c24d]" />
                                       <input type="time" value={formData.openingHours.satSun.close} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, satSun: { ...formData.openingHours.satSun, close: e.target.value } } })} className="bg-[#fef6eb] px-4 rounded-xl text-xs h-[50px] border-none font-bold focus:ring-2 focus:ring-[#f4c24d]" />
                                    </div>
                                 </div>

                                 <div className="space-y-4 pt-2">
                                    <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-widest ml-1">Days Closed</label>
                                    <div className="grid grid-cols-2 gap-y-3">
                                       {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                          <div key={day} className="flex items-center space-x-3 cursor-pointer group" onClick={() => toggleDayClosed(day)}>
                                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.openingHours.daysClosed.includes(day) ? 'bg-[#f4c24d] border-[#f4c24d]' : 'border-gray-100 group-hover:border-[#f4c24d]/40'
                                                }`}>
                                                {formData.openingHours.daysClosed.includes(day) && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                                             </div>
                                             <span className="text-[11px] font-bold text-gray-500">{day}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Bottom Error Box (Only for API Errors) */}
                     {error && (
                        <div className="md:col-span-2 bg-red-50 text-red-600 text-[11px] text-center font-bold p-4 rounded-2xl border border-red-100 animate-in fade-in zoom-in duration-300">
                           {error}
                        </div>
                     )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                     <button type="button" onClick={() => router.back()} className="text-[#2c3e50] font-black px-12 h-[64px] rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all">
                        Go Back
                     </button>
                     <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#f4c24d] text-[#2c3e50] font-black px-12 h-[64px] rounded-2xl flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_12px_24px_-10px_rgba(244,194,77,0.5)] group"
                     >
                        <span className="text-xl">
                            {isSingleAndDone ? 'Finish Step' : (saving ? 'Saving...' : 'Save & Continue')}
                        </span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </form>
            </div>
         </main>
      </div>
   );
}
