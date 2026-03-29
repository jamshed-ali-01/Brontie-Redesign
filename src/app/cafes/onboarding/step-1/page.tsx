'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Coffee } from 'lucide-react';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function OnboardingStep1() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    contactEmail: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/cafes/profile');
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phone: data.contactPhone || data.phone || '',
            website: data.website || '',
            contactEmail: data.contactEmail || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const validateForm = () => {
    if (!formData.name) return "Business name is required";
    if (!formData.address) return "Primary address is required";
    if (!formData.contactEmail) return "Contact email is required";
    if (!formData.phone) return "Phone number is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowValidation(true);

    const validationError = validateForm();
    if (validationError) {
      // Rely on inline validation messages
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/cafes/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.name,
          address: formData.address,
          contactEmail: formData.contactEmail,
          contactPhone: formData.phone,
          mobileNumber: formData.phone,
          website: formData.website,
          signupStep: 2 
        })
      });

      if (response.ok) {
        router.push('/cafes/onboarding/step-2');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-[#fef6eb]">
      {/* Header */}
      <header className="bg-[#6ca3a4] h-[80px] px-12 flex items-center justify-between relative z-50">
        <div className={`text-[#f4c24d] text-4xl ${lobster.className}`}>Brontie</div>
      </header>

      {/* Main Content with Branded Background */}
      <main className="flex-1 relative flex flex-col items-center">
        {/* Yellow Background & Wave */}
        <div className="absolute top-0 left-0 w-full h-[60%] bg-[#f4c24d] z-0 overflow-hidden">
           {/* Motifs */}
           <div className="absolute top-20 left-10 opacity-40">
              <Coffee className="text-white w-20 h-20 rotate-[-15deg]" />
           </div>
           
           {/* Circular Wave Mask */}
           <div className="absolute bottom-[-100%] left-[50%] -translate-x-1/2 w-[250%] h-[200%] bg-[#fef6eb] rounded-[50%] z-10"></div>
        </div>

        {/* Form Content */}
        <div className="relative z-20 w-full max-w-xl px-4 pt-12 flex flex-col items-center">
           {/* Progress Indicator */}
           <div className="w-full flex flex-col items-start mb-12">
              <div className="flex items-center justify-between w-full mb-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-900/40 uppercase tracking-[0.2em] mb-1">Setup Progress</span>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Business Profile</span>
                 </div>
                 <span className="text-[10px] font-black text-gray-900/40 uppercase tracking-wider">Step 1 of 5</span>
              </div>
              <div className="flex w-full gap-2">
                 <div className="h-1.5 flex-1 bg-[#6ca3a4] rounded-full"></div>
                 <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                 <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                 <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
                 <div className="h-1.5 flex-1 bg-white opacity-40 rounded-full"></div>
              </div>
           </div>

           {/* Lobster Title */}
           <div className="text-center mb-12">
              <h1 className={`text-4xl md:text-5xl text-white drop-shadow-sm ${lobster.className}`}>
                 Complete your Brontie
              </h1>
              <h1 className={`text-5xl md:text-6xl text-[#2c3e50] mt-1 ${lobster.className}`}>
                 Business Profile
              </h1>
           </div>

           {/* Form Card */}
           <form onSubmit={handleSubmit} className="w-full space-y-8 pb-32">
              <div className="bg-white rounded-[40px] shadow-2xl shadow-[#6ca3a4]/10 p-10 space-y-8 border border-white/50">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-[0.15em] ml-1">Business Name</label>
                       <input
                         type="text"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="Enter your Business Name"
                         className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-base h-[64px] placeholder:text-gray-300 font-bold transition-all ${
                            showValidation && !formData.name ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                         }`}
                       />
                       {showValidation && !formData.name && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">Business name is required</p>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-[0.15em] ml-1">Primary Business or Cafe Address</label>
                       <input
                         type="text"
                         value={formData.address}
                         onChange={(e) => setFormData({...formData, address: e.target.value})}
                         placeholder="Enter your Primary Business Address"
                         className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-base h-[64px] placeholder:text-gray-300 font-bold transition-all ${
                            showValidation && !formData.address ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                         }`}
                       />
                       {showValidation && !formData.address && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">Address is required</p>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-[0.15em] ml-1">Your Mobile Number</label>
                       <input
                         type="tel"
                         value={formData.phone}
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         placeholder="087 123 4567"
                         className={`w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-2 focus:ring-0 text-base h-[64px] placeholder:text-gray-300 font-bold transition-all ${
                            showValidation && !formData.phone ? 'border-red-200' : 'border-transparent focus:border-[#f4c24d]'
                         }`}
                       />
                       {showValidation && !formData.phone && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">Phone number is required</p>
                       )}
                       <p className="text-[10px] text-gray-400 font-bold ml-1 italic opacity-60">Only used by Brontie, not shown publicly.</p>
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-gray-900/40 uppercase tracking-[0.15em] ml-1">Website (Optional)</label>
                       <input
                         type="url"
                         value={formData.website}
                         onChange={(e) => setFormData({...formData, website: e.target.value})}
                         placeholder="Enter your website URL"
                         className="w-full bg-[#fef6eb] px-6 rounded-2xl text-black border-none focus:ring-2 focus:ring-[#f4c24d] text-base h-[64px] placeholder:text-gray-300 font-bold"
                       />
                    </div>
                 </div>

                 {/* Global Error Box (Matches Step 2 - Only for API Errors) */}
                 {error && (
                    <div className="bg-red-50 text-red-600 text-xs text-center font-bold p-4 rounded-xl animate-in fade-in zoom-in border border-red-100">
                       {error}
                    </div>
                 )}
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-center">
                 <button
                   type="submit"
                   disabled={saving}
                   className="w-full bg-[#f4c24d] text-[#2c3e50] font-black h-[72px] rounded-[24px] flex items-center justify-center space-x-3 hover:bg-[#e5b54d] transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_12px_24px_-10px_rgba(244,194,77,0.5)] group"
                 >
                   <span className="text-xl">{saving ? 'Saving...' : 'Save & Continue'}</span>
                   <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <p className="text-gray-300 text-[10px] mt-6 text-center font-bold italic">
                   *You can save and return anytime.
                 </p>
              </div>
           </form>
        </div>
      </main>
    </div>
  );
}
