'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Check, 
  X, 
  Camera, 
  Trash2, 
  UploadCloud,
  Coffee,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
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

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
      <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#fef6eb]">
         <header className="bg-[#6ca3a4] h-[64px] px-8 flex items-center relative z-50">
            <div className={`text-[#f4c24d] text-2xl ${lobster.className}`}>Brontie</div>
         </header>

         <main className="flex-1 relative flex flex-col items-center">
            {/* Header Section with progress */}
            <div className="absolute top-0 left-0 w-full h-[380px] bg-[#f4c24d] z-0 overflow-hidden">
               <div className="absolute top-8 left-[-40px] opacity-10 pointer-events-none scale-75 rotate-[-12deg]">
                  <Coffee className="text-white w-48 h-48" />
               </div>
               <div className="absolute bottom-[-150px] left-[50%] -translate-x-1/2 w-[300vw] h-[500px] bg-[#fef6eb] rounded-[100%] z-10"></div>
            </div>

            <div className="relative z-20 w-full max-w-2xl px-4 pt-6 flex flex-col items-center gap-8">
               
               {/* Progress Tracking */}
               <div className="w-full max-w-xl">
                  <div className="flex items-end justify-between mb-2 px-1">
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">Branding Setup</span>
                     <span className="text-[9px] font-black text-[#2c3e50]/40 uppercase tracking-widest">4 / 6</span>
                  </div>
                  <div className="flex gap-1.5">
                     {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div key={step} className={`h-1 flex-1 rounded-full ${step <= 4 ? 'bg-[#6ca3a4]' : 'bg-white shadow-sm'}`} />
                     ))}
                  </div>
               </div>

               {/* Headline */}
               <div className="text-center mb-4">
                  <h1 className={`text-5xl text-white drop-shadow-sm mb-2 ${lobster.className}`}>
                     Add Your <span className="text-[#2c3e50]">Branding (Optional)</span>
                  </h1>
                  <p className="text-[#2c3e50]/70 text-[12px] font-bold max-w-md mx-auto leading-relaxed">
                     We&apos;ll use this to create promotional materials and social content for your café
                  </p>
               </div>

               {/* Upload Sections */}
               <div className="w-full space-y-8">
                  
                  {/* Logo Upload Card */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-[#2c3e50]/60 tracking-widest uppercase ml-1">Brand Logo</label>
                     <div className={`relative bg-white rounded-[32px] p-8 border-2 border-dashed ${logo ? 'border-[#6ca3a4]' : 'border-gray-200'} shadow-sm flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/60 group`}>
                        {logo ? (
                           <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg border border-white/50">
                              <Image src={logo} alt="Logo" layout="fill" objectFit="cover" />
                              <button onClick={() => setLogo(null)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10">
                                 <X className="w-3 h-3" />
                              </button>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-[#fef6eb] rounded-2xl flex items-center justify-center text-[#f4c24d]">
                                 <ImageIcon className="w-8 h-8" />
                              </div>
                              <div className="text-center">
                                 <p className="text-[14px] font-black text-[#2c3e50]">Drag & drop your logo here</p>
                                 <p className="text-[11px] font-medium text-gray-400">Square logos work best</p>
                              </div>
                           </div>
                        )}
                        <input 
                           type="file" accept="image/*" 
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={(e) => handleFileChange(e, 'logo')}
                        />
                        <button className="h-10 px-8 bg-white border border-gray-100 rounded-xl text-[12px] font-black uppercase text-[#6ca3a4] shadow-sm pointer-events-none group-hover:shadow-md transition-all">Upload logo</button>
                     </div>
                  </div>

                  {/* Brand Image Upload Card */}
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-[#2c3e50]/60 tracking-widest uppercase ml-1">Brand Image</label>
                     <div className={`relative bg-white rounded-[32px] p-10 border-2 border-dashed ${brandingPhoto ? 'border-[#6ca3a4]' : 'border-gray-200'} shadow-sm flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/60 group`}>
                        {brandingPhoto ? (
                           <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-lg border border-white/50">
                              <Image src={brandingPhoto} alt="Branding" layout="fill" objectFit="cover" />
                              <button onClick={() => setBrandingPhoto(null)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10">
                                 <X className="w-4 h-4" />
                              </button>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-[#fef6eb] rounded-2xl flex items-center justify-center text-[#f4c24d]">
                                 <Camera className="w-8 h-8" />
                              </div>
                              <div className="text-center">
                                 <p className="text-[14px] font-black text-[#2c3e50]">Drag & drop your Cafe Photo here</p>
                                 <p className="text-[11px] font-medium text-gray-400 max-w-[280px]">This can be a storefront, sign, or cafe interior. Clean, well-lit photos work best.</p>
                              </div>
                           </div>
                        )}
                        <input 
                           type="file" accept="image/*" 
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={(e) => handleFileChange(e, 'photo')}
                        />
                        <button className="h-10 px-8 bg-white border border-gray-100 rounded-xl text-[12px] font-black uppercase text-[#6ca3a4] shadow-sm pointer-events-none group-hover:shadow-md transition-all">Upload Photo</button>
                     </div>
                     <p className="text-[10px] font-black text-gray-400/80 uppercase tracking-widest text-center mt-4">Used for promotional materials and content we create for your café</p>
                  </div>

                  {/* Use Defaults Logic */}
                  <div 
                     onClick={() => setUseDefaults(!useDefaults)}
                     className="bg-[#fef6eb] rounded-2xl p-6 border border-[#f4c24d]/20 flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                  >
                     <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${useDefaults ? 'bg-[#f4c24d] border-[#f4c24d]' : 'bg-white border-[#f4c24d]/30 group-hover:border-[#f4c24d]'}`}>
                        {useDefaults && <Check className="w-4 h-4 text-white stroke-[4]" />}
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-[#2c3e50]">Use Brontie default images for now</p>
                        <p className="text-[10px] font-medium text-gray-500">You can always update your branding later in settings.</p>
                     </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between pt-8 pb-20">
                     <button 
                        onClick={() => router.back()} 
                        className="px-10 h-14 bg-white rounded-2xl text-[14px] font-black uppercase text-[#2c3e50] shadow-sm hover:shadow-md active:scale-95 transition-all"
                     >
                        Go Back
                     </button>
                     <button 
                        onClick={handleSubmit} 
                        disabled={saving}
                        className="bg-[#f4c24d] text-[#2c3e50] flex items-center justify-center font-black px-16 h-[64px] rounded-2xl text-xl uppercase shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                        {saving ? 'Saving...' : 'Save & Continue'}
                     </button>
                  </div>

                  {error && (
                     <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-100 italic">{error}</p>
                  )}
               </div>
            </div>
         </main>
      </div>
   );
}
