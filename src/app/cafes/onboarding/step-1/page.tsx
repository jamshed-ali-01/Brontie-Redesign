'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Coffee } from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    <SetupLayout
      currentStep={1}
      stepName="Business Profile"
      headingPart1="Complete your Brontie"
      headingPart2="Business Profile"
      inlineHeading={false}
      onContinue={handleSubmit}
      isSaving={saving}
      hideBackButton  
      // maxWidth="max-w-[460px]"
    >
      {/* Form Card - Figma Styled */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-[#6ca3a4]/5 p-10 space-y-9 border border-white mt-10 max-w-[460px] mx-auto">
        <div className="space-y-7">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Business Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter your Business Name"
              className={`w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 transition-all text-[13px] h-[50px] placeholder:text-gray-400 ${
                showValidation && !formData.name ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
              }`}
            />
            {showValidation && !formData.name && (
              <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 animate-in fade-in italic">Business name is required</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Primary Business or Cafe Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter your Primary Business Address"
              className={`w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 transition-all text-[13px] h-[50px] placeholder:text-gray-400 ${
                showValidation && !formData.address ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
              }`}
            />
            {showValidation && !formData.address && (
              <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 animate-in fade-in italic">Address is required</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Your Mobile Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="087 123 4567"
              className={`w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 transition-all text-[13px] h-[50px] placeholder:text-gray-400 ${
                showValidation && !formData.phone ? 'border-red-400' : 'border-transparent focus:border-[#f4c24d]'
              }`}
            />
            {showValidation && !formData.phone && (
              <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 animate-in fade-in italic">Phone number is required</p>
            )}
            <p className="text-[10px] text-gray-500 font-bold ml-1 opacity-60">Only used by Brontie, not shown publicly</p>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-black mb-2 uppercase font-sans opacity-70">Website (Optional)</label>
            <input 
              type="text" 
              value={formData.website} 
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              placeholder="Enter your website URL" 
              className="w-full bg-[#fbecce] px-3 rounded-[12px] text-[#2c3e50] border-2 border-transparent focus:border-[#f4c24d] transition-all text-[13px] h-[50px] placeholder:text-gray-400"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-[11px] text-center font-black p-4 rounded-2xl animate-in fade-in zoom-in border border-red-100 italic">
            {error}
          </div>
        )}
      </div>
    </SetupLayout>
  );
}
