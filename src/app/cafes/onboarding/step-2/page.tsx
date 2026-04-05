'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Coffee, MapPin, Home, Building2, Clock, Check, Plus } from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
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

   const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
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
    <SetupLayout
      currentStep={2}
      stepName="Location Selection"
      headingPart1="Do you have more than"
      headingPart2="one location?"
      subtitle="Customers can redeem gifts at any of your locations"
      onBack={() => router.back()}
      onContinue={handleSubmit}
      isSaving={saving}
      maxWidth="max-w-[800px]"
      buttonLayout="split"
    >
      <div className="space-y-10 items-center justify-center md:px-4 w-full relative z-20 mt-20">
        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[620px] mx-auto w-full">
          <div
            onClick={() => setFormData({ ...formData, locationType: 'single' })}
            className={`relative cursor-pointer py-8 px-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center ${
              formData.locationType === 'single' ? 'bg-white border-[#f4c24d] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-center text-[#f4c24d] mb-4">
              <Home className="w-9 h-9 stroke-[2]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#2c3e50] mb-2 tracking-tight">Just one location</h3>
            <p className="text-[10px] text-gray-500 font-medium font-sans opacity-80">Keep it simple</p>
            {formData.locationType === 'single' && (
              <div className="absolute top-4 right-4 text-[#f4c24d]">
                 <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#f4c24d] flex items-center justify-center">
                   <Check className="w-3 h-3 stroke-[3]" />
                 </div>
              </div>
            )}
          </div>

          <div
            onClick={() => setFormData({ ...formData, locationType: 'multiple' })}
            className={`relative cursor-pointer py-8 px-6 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center text-center ${
              formData.locationType === 'multiple' ? 'bg-white border-[#f4c24d] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-center text-[#f4c24d] mb-4">
              <Building2 className="w-9 h-9 stroke-[2]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#2c3e50] mb-2 tracking-tight">More than one location</h3>
            <p className="text-[10px] text-gray-500 font-medium font-sans opacity-80">Customers can redeem at any of your cafés</p>
            {formData.locationType === 'multiple' && (
              <div className="absolute top-4 right-4 text-[#f4c24d]">
                 <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#f4c24d] flex items-center justify-center">
                   <Check className="w-3 h-3 stroke-[3]" />
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message Hook */}
        {success && (
          <div className="w-full max-w-2xl mx-auto bg-green-50 border border-green-100 text-green-600 rounded-2xl md:p-5 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-sm font-bold">{success}</span>
            </div>
            <button type="button" onClick={() => setSuccess('')} className="text-xs uppercase font-bold opacity-40">✕</button>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 md:p-10 p-6 w-full flex flex-col gap-8 relative overflow-hidden">
          {/* ... added locations logic removed for brevity to just focus on layout below ... */}
          {locations.length > 0 && formData.locationType === 'multiple' && (
            <div className="w-full pb-8 border-b border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[10px] font-bold text-[#2c3e50]/40 uppercase tracking-[0.15em]">Added Locations</h2>
              </div>
              <div className="flex space-x-5 overflow-x-auto pb-4 scrollbar-hide">
                {locations.map((loc, idx) => (
                  <div key={loc._id} className="flex-shrink-0 w-60 bg-[#fefeec] rounded-2xl p-5 shadow-sm border border-[#f4c24d]/20 hover:scale-[1.02] transition-transform">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-[#6ca3a4] shadow-sm">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">#{idx + 1}</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#2c3e50] mb-1 truncate">{loc.name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium mb-1">{loc.area}, {loc.county}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-1 truncate">{loc.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSingleAndDone ? (
            <div className="py-16 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-[#fefeec] rounded-2xl flex items-center justify-center text-[#6ca3a4]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className={`text-2xl text-[#2c3e50] ${lobster.className}`}>One Location Added!</h2>
              <p className="text-[#2c3e50]/60 text-[12px] font-medium max-w-xs">
                You've set up your café location. Click Save & Continue below to move to the next stage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 w-full animate-in fade-in">
              {/* Left: Location Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-[#6ca3a4] mb-6">
                  <MapPin className="w-[18px] h-[18px]" />
                  <h2 className="text-[13px] font-bold text-[#2c3e50] tracking-tight">Location Details</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">County</label>
                    <div className="relative">
                      <select
                        value={formData.county}
                        onChange={(e) => setFormData({ ...formData, county: e.target.value, area: '' })}
                        className={`w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 text-[13px] h-[50px] appearance-none outline-none transition-all ${
                          showValidation && !formData.county ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
                        }`}
                      >
                        <option value="">Select County</option>
                        {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Area</label>
                    <div className="relative">
                      <select
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className={`w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 text-[13px] h-[50px] appearance-none outline-none transition-all ${
                          showValidation && !formData.area ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
                        }`}
                        disabled={!formData.county}
                      >
                        <option value="">Select Area / Town</option>
                        {availableAreas.map(area => <option key={area} value={area}>{area}</option>)}
                        <option value="other">Other (Specify below)</option>
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Eircode</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="Enter Eircode"
                      className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] outline-none text-[13px] h-[50px] placeholder:text-gray-400 transition-all"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Main Street Clare, Kildare"
                      rows={4}
                      className={`w-full bg-[#fbecce] px-3 py-3 rounded-[12px] text-[#2c3e50] border-2 text-[13px] placeholder:text-gray-400 resize-none outline-none transition-all pb-8 ${
                        showValidation && (!formData.address || formData.address.length < 5) ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
                      }`}
                    />
                    <span className="absolute bottom-3 right-4 text-[9px] text-gray-500 font-bold opacity-60">
                      {formData.address.length}/150
                    </span>
                  </div>

                  {formData.locationType === 'multiple' && (
                    <button
                      type="button"
                      onClick={handleAddAnother}
                      disabled={saving}
                      className="text-[#6ca3a4] text-[11px] font-bold flex items-center justify-center gap-2 border border-[#6ca3a4] px-5 h-[46px] rounded-[12px] hover:bg-[#6ca3a4]/5 transition-all mt-6 max-w-[200px]"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{saving ? 'Adding...' : 'Add another location'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Opening Hours */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-[#6ca3a4] mb-6">
                  <Clock className="w-[18px] h-[18px]" />
                  <h2 className="text-[13px] font-bold text-[#2c3e50] tracking-tight">Opening Hours</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Mon-Fri</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] outline-none text-[13px] h-[50px] appearance-none transition-all" value={formData.openingHours.monFri.open} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, monFri: { ...formData.openingHours.monFri, open: e.target.value } } })}>
                          <option value="08:00">8:00AM</option><option value="09:00">9:00AM</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 rotate-90 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] outline-none text-[13px] h-[50px] appearance-none transition-all" value={formData.openingHours.monFri.close} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, monFri: { ...formData.openingHours.monFri, close: e.target.value } } })}>
                          <option value="17:00">5:00PM</option><option value="18:00">6:00PM</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Sat-Sun</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="relative">
                        <select className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] outline-none text-[13px] h-[50px] appearance-none transition-all" value={formData.openingHours.satSun.open} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, satSun: { ...formData.openingHours.satSun, open: e.target.value } } })}>
                          <option value="09:00">9:00AM</option><option value="10:00">10:00AM</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 rotate-90 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] outline-none text-[13px] h-[50px] appearance-none transition-all" value={formData.openingHours.satSun.close} onChange={(e) => setFormData({ ...formData, openingHours: { ...formData.openingHours, satSun: { ...formData.openingHours.satSun, close: e.target.value } } })}>
                           <option value="15:00">3:00PM</option>
                           <option value="16:00">4:00PM</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Days Closed</label>
                    <div className="flex flex-col gap-y-2.5">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day} className="flex items-center space-x-3 cursor-pointer group" onClick={() => toggleDayClosed(day)}>
                          <div className={`w-[16px] h-[16px] rounded-[4px] border-[2px] flex items-center justify-center transition-all ${formData.openingHours.daysClosed.includes(day) ? 'bg-[#f4c24d] border-[#f4c24d]' : 'bg-transparent border-[#f4c24d] hover:border-[#f4c24d]/80'}`}>
                            {formData.openingHours.daysClosed.includes(day) && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <span className="text-[9px] font-medium text-[#2c3e50]">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-[11px] text-center font-bold p-4 rounded-2xl border border-red-100 animate-in fade-in zoom-in">
              {error}
            </div>
          )}
        </div>
      </div>
    </SetupLayout>
  );
}
