'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Check, 
  X, 
  Camera, 
  Trash2, 
  FileUp,
  Coffee,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import SetupLayout from '@/components/shared/auth/SetupLayout';
import { Lobster } from 'next/font/google';
import Image from 'next/image';

const lobster = Lobster({
   weight: '400',
   subsets: ['latin'],
   display: 'swap',
});

export default function OnboardingStep4() {
   const [logo, setLogo] = useState<string | null>(null);
   const [brandingPhoto, setBrandingPhoto] = useState<string | null>(null);
   const [useDefaults, setUseDefaults] = useState(false);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState('');
   const router = useRouter();

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'photo') => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            if (type === 'logo') setLogo(reader.result as string);
            else setBrandingPhoto(reader.result as string);
         };
         reader.readAsDataURL(file);
      }
   };

   const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError('');
      setSaving(true);
      try {
         const response = await fetch('/api/cafes/onboarding/branding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               logoUrl: logo,
               brandingPhotoUrl: brandingPhoto,
               useDefaults
            })
         });
         if (response.ok) router.push('/cafes/onboarding/step-5');
         else {
            const data = await response.json();
            setError(data.error || 'Failed to save branding');
         }
      } catch (err) {
         setError('Network error. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   return (
    <SetupLayout
      currentStep={4}
      stepName="Branding"
      headingPart1="Add Your"
      headingPart2="Branding (Optional)"
      subtitle="We'll use this to create promotional materials and social content for your café"
      onBack={() => router.back()}
      onContinue={handleSubmit}
      isSaving={saving}
      // maxWidth="max-w-[640px]"
      buttonLayout="split"
    >
      <div className="w-full space-y-8 pb-10 mt-12">
        
        {/* Logo Upload Card */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-black mb-1 font-sans">Brand Logo</label>
          <div className={`relative bg-white rounded-[24px] py-8 px-6 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2 ${logo ? 'border-[#6ca3a4]' : 'border-slate-200 hover:border-slate-300'}`}>
            {logo ? (
              <div className="relative w-32 h-32 rounded-[20px] overflow-hidden shadow-sm border border-gray-100">
                <Image src={logo} alt="Logo" layout="fill" objectFit="cover" />
                <button onClick={() => setLogo(null)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors z-10">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center mt-2">
                <div className="w-[42px] h-[42px] bg-[#fdf3db] rounded-full flex items-center justify-center text-[#f4c24d] mb-2">
                  <FileUp className="w-5 h-5 stroke-[2]" color='#F4C24D' />
                </div>
                <p className="text-[12px] font-bold text-[#2c3e50] mb-0.5">Drag & drop your logo here</p>
                <p className="text-[10px] text-slate-400 font-medium opacity-90">Square logos work best</p>
              </div>
            )}
            <input 
              type="file" accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
              onChange={(e) => handleFileChange(e, 'logo')}
            />
            {!logo && (
              <button className="mt-4 h-[30px] px-5 bg-transparent border border-[#6ca3a4]/40 rounded-[6px] text-[10px] font-medium tracking-wide text-[#6ca3a4] flex items-center gap-1.5 pointer-events-none">
                <Plus className="w-3 h-3 text-[#6ca3a4] opacity-70" /> Upload logo
              </button>
            )}
          </div>
        </div>

        {/* Brand Image Upload Card */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-black mb-1 font-sans mt-2">Brand Image</label>
          <div className={`relative bg-white rounded-[24px] py-8 px-6 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2 ${brandingPhoto ? 'border-[#6ca3a4]' : 'border-slate-200 hover:border-slate-300'}`}>
            {brandingPhoto ? (
              <div className="relative w-full aspect-[2/1] rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
                <Image src={brandingPhoto} alt="Branding" layout="fill" objectFit="cover" />
                <button onClick={() => setBrandingPhoto(null)} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600 transition-colors z-10">
                  <X className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center mt-2">
                <div className="w-[42px] h-[42px] bg-[#fdf3db] rounded-full flex items-center justify-center text-[#f4c24d] mb-2">
                  <FileUp className="w-5 h-5 stroke-[2] " color='#F4C24D' />
                </div>
                <p className="text-[12px] font-bold text-[#2c3e50] mb-0.5">Drag & drop your Cafe Photo here</p>
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-[10px] text-slate-400 font-medium">Drag & drop your Care Brand image here</p>
                  <p className="text-[10px] text-slate-400 font-medium">This can be a shopfront, sign, or café counter.</p>
                  <p className="text-[10px] text-slate-400 font-medium">Clear, well-lit photos work best</p>
                </div>
              </div>
            )}
            <input 
              type="file" accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
              onChange={(e) => handleFileChange(e, 'photo')}
            />
            {!brandingPhoto && (
              <button className="mt-4 h-[30px] px-5 bg-transparent border border-[#6ca3a4]/40 rounded-[6px] text-[10px] font-medium tracking-wide text-[#6ca3a4] flex items-center gap-1.5 pointer-events-none">
                <Plus className="w-3 h-3 text-[#6ca3a4] opacity-70" /> Upload Photo
              </button>
            )}
          </div>
          <p className="text-[10px] text-black opacity-90 font-medium pb-2">Used for promotional materials and content we create for your café</p>
        </div>

        {/* Use Defaults Logic */}
        <div 
          onClick={() => setUseDefaults(!useDefaults)}
          className="bg-[#fdf3db] rounded-[10px] px-5 py-4 border border-[#f4c24d]/30 flex items-center gap-4 cursor-pointer transition-all w-full mt-8"
        >
          <div className={`w-4 h-4 rounded-[4px] border-[1px] flex flex-shrink-0 items-center justify-center transition-all bg-white ${useDefaults ? 'border-[#f4c24d]' : 'border-[#f4c24d]/40 hover:border-[#f4c24d]'}`}>
            {useDefaults && <Check className="w-3 h-3 text-[#f4c24d] stroke-[4]" />}
          </div>
          <div className="flex flex-col gap-0.5">
             <p className="text-[10px] font-bold text-[#2c3e50]">Use Brontie default images for now</p>
             <p className="text-[9px] font-medium text-[#2c3e50] opacity-60">You can always update your branding later in settings.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-center font-bold text-[11px] p-4 rounded-xl border border-red-100 italic">{error}</div>
        )}
      </div>
    </SetupLayout>
   );
}
