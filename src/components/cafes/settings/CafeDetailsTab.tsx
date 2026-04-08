'use client';

import React, { useState, useEffect } from 'react';

interface CafeDetailsTabProps {
  merchantData: any;
  onSaveProfile: (data: any) => Promise<void>;
  onUploadLogo: (file: File) => Promise<void>;
}

export default function CafeDetailsTab({ merchantData, onSaveProfile, onUploadLogo }: CafeDetailsTabProps) {
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailOnRedeem: false,
    emailOnMarketing: false
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (merchantData) {
      setFormData({
        name: merchantData.name || '',
        contactEmail: merchantData.contactEmail || '',
        contactPhone: merchantData.contactPhone || '',
        website: merchantData.website || '',
        address: merchantData.address || ''
      });
    }
  }, [merchantData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveProfile(formData);
    setSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadLogo(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Form Column */}
      <div className="flex-1 space-y-8">
        
        {/* Edit Cafe Details */}
        <div>
          <h3 className="text-[32px] font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-lobster), cursive' }}>
            Edit Cafe Details
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 tracking-wider mb-2 uppercase">Cafe Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#f4c24d]"
                placeholder="Your cafe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 tracking-wider mb-2 uppercase">Contact Email</label>
                <input
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#f4c24d]"
                  placeholder="info@yourcafe.ie"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 tracking-wider mb-2 uppercase">Phone No</label>
                <input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#f4c24d]"
                  placeholder="+353 123 456 789"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 tracking-wider mb-2 uppercase">Website</label>
              <input
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#f4c24d]"
                placeholder="www.yourcafe.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 tracking-wider mb-2 uppercase">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#f4c24d] resize-none"
                placeholder="12 Cafe Lane, Maynooth..."
              />
            </div>
            
            <div className="flex justify-end">
               <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#f4c24d] text-gray-900 px-8 py-3 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>

        {/* Your Test Voucher Block */}
        <div className="bg-white border text-center relative border-dashed border-[#6ca3a4]/40 rounded-[28px] p-8 pb-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] pt-12">
          <div className="absolute -top-3 left-8 flex items-center gap-2">
            <h3 className="text-[28px] font-bold text-gray-900 bg-white px-2" style={{ fontFamily: 'var(--font-lobster), cursive' }}>
              Your Test Voucher
            </h3>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">● Active</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
             <div className="w-[140px] h-[140px] shrink-0 rounded-xl overflow-hidden bg-gray-100 drop-shadow-sm">
                <img src="/images/gift-preview.jpg" alt="Coffee" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80';
                }}/>
             </div>
             <div className="text-left flex-1">
                <h4 className="text-xl font-bold text-gray-900">Coffee</h4>
                <p className="text-sm text-gray-500 mb-3">Your Cafe Demo only</p>
                <div className="bg-[#f0f4f4] rounded-lg p-3 text-sm text-gray-600 font-medium truncate w-full border border-gray-100">
                    www.brontie.ie/voucher/E3JX9Y23
                </div>
                <div className="flex gap-2 mt-3">
                   <button className="w-10 h-10 rounded-lg bg-[#6ca3a4]/10 text-[#6ca3a4] flex items-center justify-center hover:bg-[#6ca3a4]/20 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                   </button>
                   <button className="w-10 h-10 rounded-lg bg-[#fceec9] text-[#e5b54d] flex items-center justify-center hover:bg-[#f4c24d]/30 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-5 mt-6 border border-gray-100 mb-8">
             <div className="w-20 h-20 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                 {/* Dummy QR */}
                 <div className="w-16 h-16 bg-[pattern-dots] bg-gray-200 opacity-30" style={{ backgroundImage: 'radial-gradient(#ccc 2px, transparent 2px)', backgroundSize: '4px 4px' }}></div>
             </div>
             <div className="text-left">
                <h4 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lobster), cursive' }}>Your Sample QR</h4>
                <p className="text-sm text-gray-500 mt-1">Scan this QR via your sample voucher.<br/><span className="font-medium text-gray-400">Note: This is not your cafes QR, it is just for test purposes</span></p>
             </div>
          </div>

          <div className="text-left">
             <h4 className="text-[14px] font-bold tracking-wider uppercase text-gray-800 mb-4">How to complete the demo</h4>
             <div className="space-y-4">
               <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-[#fcf2d9] text-[#e5b54d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                 <p className="text-sm text-gray-800"><span className="font-bold">Send yourself the link</span> via WhatsApp</p>
               </div>
               <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-[#fcf2d9] text-[#e5b54d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                 <p className="text-sm text-gray-800"><span className="font-bold">Open the link on your phone</span> — you'll see the voucher your customer receives</p>
               </div>
               <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-[#fcf2d9] text-[#e5b54d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                 <p className="text-sm text-gray-800"><span className="font-bold">Tap Redeem</span> on your phone, then <span className="font-bold">scan the QR above</span> on this screen</p>
               </div>
               <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-[#fcf2d9] text-[#e5b54d] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</div>
                 <p className="text-sm text-gray-800">Watch the voucher status change to <span className="text-teal-600 font-medium">Redeemed ✓</span></p>
               </div>
             </div>
          </div>

          <div className="mt-8 flex gap-4 w-full">
            <button className="flex items-center justify-center py-3.5 px-6 rounded-xl border border-gray-200 bg-white font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
            </button>
            <button className="flex-1 py-3.5 rounded-xl bg-[#f4c24d] font-bold text-sm text-gray-900 hover:bg-[#e5b54d] transition-colors shadow-sm">
                Generate New Test Voucher
            </button>
          </div>

        </div>

        {/* Notifications */}
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-gray-400 mb-4 uppercase">Notifications</label>
          <div className="space-y-3">
             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={notifications.emailOnRedeem} onChange={() => setNotifications(p => ({...p, emailOnRedeem: !p.emailOnRedeem}))} className="w-5 h-5 rounded border-gray-300 text-[#6ca3a4] focus:ring-[#6ca3a4]" />
                <span className="text-sm text-gray-700">Email me when a voucher is redeemed</span>
             </label>
             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={notifications.emailOnMarketing} onChange={() => setNotifications(p => ({...p, emailOnMarketing: !p.emailOnMarketing}))} className="w-5 h-5 rounded border-gray-300 text-[#6ca3a4] focus:ring-[#6ca3a4]" />
                <span className="text-sm text-gray-700">Email me once a new marketing asset is available</span>
             </label>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-[28px] font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lobster), cursive' }}>
            Password
          </h3>
          <p className="text-sm text-gray-500 mb-6">Add or update your password. You can always sign in with a magic link instead - No password needed.</p>

          <div className="bg-[#fff9eb] border border-[#fde6b3] rounded-xl p-4 flex gap-3 mb-6">
            <span className="text-[#e5b54d]">💡</span>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">You are signed in with a magic link. A password is optional - Only set one if you prefer email and password sign in.</p>
          </div>

          <div className="space-y-5">
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">Current Password</label>
                <input type="password" placeholder="Your Current Password" className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Leave blank if none set.</p>
             </div>
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">New Password</label>
                <input type="password" placeholder="Choose New Password" className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Minimum 8 Characters.</p>
             </div>
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">Repeat Password</label>
                <input type="password" placeholder="Confirm New Password" className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" />
             </div>
             <button className="w-full bg-[#f4c24d] text-gray-900 py-3.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm shadow-sm flex items-center justify-center">
                Save Password <span className="ml-2">→</span>
             </button>
             <div className="text-center">
                <a href="#" className="text-xs text-gray-500 font-medium hover:text-gray-900 inline-flex items-center gap-1">Forgot your password? <span className="text-[#6ca3a4]">Reset it here</span> <span className="text-[#6ca3a4]">→</span></a>
             </div>
          </div>
        </div>

        {/* Deactivate Account */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className="text-[28px] font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lobster), cursive' }}>
            Account
          </h3>
          <p className="text-sm font-medium text-gray-700 mb-1">Deactivate Cafe Account.</p>
          <p className="text-xs text-gray-500 font-medium">Contact <a href="mailto:hello@brontie.ie" className="text-[#6ca3a4]">hello@brontie.ie</a> to close your account.</p>
        </div>

      </div>

      {/* Right Column: Logo */}
      <div className="w-full lg:w-[300px] shrink-0">
         <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] text-center border border-gray-50">
             <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-lobster), cursive' }}>{formData.name || 'Your Cafe Name'}</h3>
             <p className="text-xs text-gray-500 mt-1 leading-relaxed px-4">{formData.address || 'Your Cafe Address'}</p>
             
             <div className="w-[120px] h-[120px] rounded-full mx-auto my-6 border border-dashed border-gray-300 relative bg-gray-50 p-2 overflow-hidden shadow-inner">
               {merchantData?.logoUrl ? (
                 <img src={merchantData.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
               ) : (
                 <div className="w-full h-full bg-[pattern-dots] bg-gray-200 opacity-30 rounded-full" style={{ backgroundImage: 'radial-gradient(#ccc 2px, transparent 2px)', backgroundSize: '6px 6px' }}></div>
               )}
             </div>

             <div className="relative">
                <input 
                    type="file" 
                    id="logo-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <label 
                    htmlFor="logo-upload"
                    className="bg-[#f4c24d] text-gray-900 px-6 py-2.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm shadow-sm inline-block cursor-pointer"
                >
                    Replace Logo
                </label>
             </div>
         </div>
      </div>
    </div>
  );
}
