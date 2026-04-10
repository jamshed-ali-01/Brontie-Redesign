'use client';

import React, { useState, useEffect } from 'react';
import { Lobster } from 'next/font/google';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    repeatPassword: ''
  });

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSavePassword = async () => {
    if (merchantData?.hasPassword && !passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await fetch('/api/cafes/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', repeatPassword: '' });
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch {
      toast.error('Network error while updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
      {/* Main Form Column */}
      <div className="flex-1 space-y-8">
        
        {/* Main Card: Details, Voucher, Notifications */}
        <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-8 lg:space-y-12">
          
          {/* Edit Cafe Details */}
          <div>
            <h3 className={`text-2xl md:text-[28px] text-gray-900 mb-5 md:mb-6 ${lobster.className}`}>
              Edit Cafe Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-900 tracking-wider mb-2 uppercase">Cafe Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#fdf5dc] border-0 rounded-xl px-4 py-3 text-gray-900 text-[14px] font-medium focus:ring-2 focus:ring-[#f4c24d]"
                  placeholder="Your café"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-900 tracking-wider mb-2 uppercase">Contact Email</label>
                  <input
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full bg-[#fdf5dc] border-0 rounded-xl px-4 py-3 text-gray-900 text-[14px] font-medium focus:ring-2 focus:ring-[#f4c24d]"
                    placeholder="info@yourcafe.ie"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-900 tracking-wider mb-2 uppercase">Phone No</label>
                  <input
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full bg-[#fdf5dc] border-0 rounded-xl px-4 py-3 text-gray-900 text-[14px] font-medium focus:ring-2 focus:ring-[#f4c24d]"
                    placeholder="+353 123 456 789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-900 tracking-wider mb-2 uppercase">Website</label>
                <input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-[#fdf5dc] border-0 rounded-xl px-4 py-3 text-gray-900 text-[14px] font-medium focus:ring-2 focus:ring-[#f4c24d]"
                  placeholder="www.yourcafe.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-900 tracking-wider mb-2 uppercase">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-[#fdf5dc] border-0 rounded-xl px-4 py-3 text-gray-900 text-[14px] font-medium focus:ring-2 focus:ring-[#f4c24d] resize-none"
                  placeholder="12 Cafe Lane, Maynooth..."
                />
              </div>
            </div>
          </div>

          {/* Your Test Voucher Block */}
          <div className="relative border-[1.5px] border-dashed border-[#b6d0d1] rounded-[20px] lg:rounded-[24px] p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-white px-2 mb-5 md:mb-6">
            <h3 className={`text-xl md:text-[25px] text-gray-900 leading-none ${lobster.className}`}>
              Your Test Voucher
            </h3>
            <span className="bg-[#e4fcda] text-[#00a93c] text-[10px] font-bold px-2 py-1 rounded-md leading-none mt-0 md:mt-1">● Active</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 md:gap-6 items-center sm:items-start mt-2 text-center sm:text-left">
             <div className="w-[120px] h-[120px] md:w-[145px] md:h-[145px] shrink-0 rounded-[12px] overflow-hidden bg-gray-100 flex items-center justify-center">
                <img src="/images/gift-preview.jpg" alt="Coffee" className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80';
                }}/>
             </div>
             <div className="flex-1 mt-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left">
                <h4 className="text-lg font-bold text-[#1f2937] tracking-tight">Coffee</h4>
                <p className="text-[12px] text-gray-600 mb-4">Your Cafe-Demo only</p>
                <div className="bg-[#f3f7f8] rounded-xl px-4 py-3 text-[12px] text-[#4b5563] truncate w-full max-w-[280px] sm:max-w-none flex items-center justify-center sm:justify-start h-10 border-0 mb-3.5">
                    www.brontie.ie/voucher/ID/JKWH23
                </div>
                <div className="flex gap-2 justify-center sm:justify-start">
                   <button className="w-10 h-10 rounded-lg bg-[#6fa9aa] flex items-center justify-center hover:bg-[#5a8d8e] transition-colors">
                      <svg className="w-[20px] h-[20px]" fill="#fff" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                   </button>
                   <button className="w-10 h-10 rounded-lg bg-[#fceec9] text-[#111827] flex items-center justify-center hover:bg-[#f4c24d]/80 transition-colors">
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 mt-6 border border-[#f0f0f0] mb-6 md:mb-8 shadow-sm">
             <div className="w-[80px] h-[80px] md:size-[100px] bg-white rounded-[12px] border border-dashed border-gray-200 flex items-center justify-center shrink-0">
                 {/* Dummy QR */}
                 <div className="w-[70px] h-[70px] md:size-[90px] bg-[pattern-dots] bg-gray-200 opacity-20" style={{ backgroundImage: 'radial-gradient(#ccc 2px, transparent 2px)', backgroundSize: '4px 4px' }}></div>
             </div>
             <div className="pt-1 font-medium pb-1 text-center sm:text-left">
                <h4 className={`text-xl md:text-[24px] text-gray-900 leading-tight mb-0.5 md:mb-1 ${lobster.className}`}>Your Sample QR</h4>
                <p className="text-[12px] md:text-[14px] text-[#9ca3af] leading-snug">Scan this QR via your sample voucher.<br className="hidden sm:block" /><span className="text-[#9ca3af]">Note: This is not your cafes QR, it is just for test purposes</span></p>
             </div>
          </div>

          <div className="w-full pl-0 md:pl-2">
             <h4 className={`text-xl md:text-[24px] text-gray-900 mb-4 md:mb-5 text-center sm:text-left ${lobster.className}`}>How to complete the demo</h4>
             <div className="space-y-[18px] font-medium">
               <div className="flex gap-4 items-center">
                 <div className="w-[26px] h-[26px] rounded-full bg-[#fef5dc] text-[#d6aa37] text-[13px] font-bold flex items-center justify-center shrink-0">1</div>
                 <p className="text-sm text-[#4b5563] tracking-tight"><span className="font-bold text-[#1f2937]">Send yourself the link</span> via WhatsApp</p>
               </div>
                 <div className="flex gap-4 items-start sm:items-center">
                 <div className="w-[26px] h-[26px] rounded-full bg-[#fef5dc] text-[#d6aa37] text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">2</div>
                 <p className="text-sm text-[#4b5563] tracking-tight"><span className="font-bold text-[#1f2937]">Open the link on your phone</span> — you'll see the voucher<br className="hidden sm:block"/>your customer receives</p>
               </div>
               <div className="flex gap-4 items-start sm:items-center">
                 <div className="w-[26px] h-[26px] rounded-full bg-[#fef5dc] text-[#d6aa37] text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">3</div>
                 <p className="text-sm text-[#4b5563] tracking-tight"><span className="font-bold text-[#1f2937]">Tap Redeem</span> on your phone, then <span className="font-bold text-[#1f2937]">scan the QR above</span> on<br className="hidden sm:block"/>this screen</p>
               </div>
               <div className="flex gap-4 items-start sm:items-center">
                 <div className="w-[26px] h-[26px] rounded-full bg-[#fef5dc] text-[#d6aa37] text-[13px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">4</div>
                 <p className="text-sm text-[#4b5563] tracking-tight">Watch the voucher status change to <span className="text-[#6fa9aa]">Redeemed <span className="inline-block transform translate-y-[1px]">✓</span></span></p>
               </div>
             </div>
          </div>

          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
            <button className="flex items-center justify-center py-3.5 px-6 rounded-xl border border-gray-100 bg-white font-bold text-[14px] text-[#6fa9aa] hover:bg-gray-50 transition-colors gap-2 sm:min-w-[120px] shadow-sm w-full sm:w-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
            </button>
            <button className="flex-1 py-3.5 px-4 rounded-xl bg-[#f4c24d] font-bold text-[14px] text-[#1f2937] hover:bg-[#e5b54d] transition-colors shadow-sm w-full">
                Generate New Test Voucher
            </button>
          </div>

          </div>

          {/* Notifications */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-gray-900 mb-4 uppercase">Notifications</label>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.emailOnRedeem} onChange={() => setNotifications(p => ({...p, emailOnRedeem: !p.emailOnRedeem}))} className="w-5 h-5 rounded-md border-gray-300 text-[#6fa9aa] focus:ring-[#6fa9aa]" />
                  <span className="text-[13px] font-medium text-gray-700">Email me when a voucher is redeemed</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.emailOnMarketing} onChange={() => setNotifications(p => ({...p, emailOnMarketing: !p.emailOnMarketing}))} className="w-5 h-5 rounded-md border-gray-300 text-[#6fa9aa] focus:ring-[#6fa9aa]" />
                  <span className="text-[13px] font-medium text-gray-700">Email me once a new marketing asset is available</span>
              </label>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-2xl md:text-[28px] text-gray-900 mb-2 ${lobster.className}`}>
            Password
          </h3>
          <p className="text-sm text-[#94A3B8] mb-6">Add or update your password. You can always sign in with a magic link instead - No password needed.</p>

          <div className="bg-[#fff9eb] border-l-4 border-[#fde6b3] rounded-xl p-4 flex gap-3 mb-6">
            <span className="text-[#e5b54d]">💡</span>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">You are signed in with a magic link. A password is optional - Only set one if you prefer email and password sign in.</p>
          </div>

          <div className="space-y-5">
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Your Current Password" 
                  className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" 
                />
                {!merchantData?.hasPassword && (
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Leave blank if none set.</p>
                )}
             </div>
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Choose New Password" 
                  className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" 
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Minimum 8 Characters.</p>
             </div>
             <div>
                <label className="block text-[11px] font-bold tracking-wider text-gray-600 mb-2 uppercase">Repeat Password</label>
                <input 
                  type="password" 
                  name="repeatPassword"
                  value={passwordForm.repeatPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password" 
                  className="w-full bg-[#fceec9]/50 border-0 rounded-xl px-4 py-3.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#f4c24d]" 
                />
             </div>
             <button 
                onClick={handleSavePassword}
                disabled={updatingPassword}
                className="w-full bg-[#f4c24d] text-gray-900 py-3.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm shadow-sm flex items-center justify-center disabled:opacity-50"
             >
                {updatingPassword ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin mr-2" />
                     Saving...
                   </>
                ) : (
                   <>Save Password <span className="ml-2">→</span></>
                )}
             </button>
             <div className="text-center">
                <a href="#" className="text-sm text-gray-500 font-medium hover:text-gray-900 inline-flex items-center gap-1">Forgot your password? <span className="text-[#6ca3a4]">Reset it here</span> <span className="text-[#6ca3a4]">→</span></a>
             </div>
          </div>
        </div>

        {/* Deactivate Account */}
        <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h3 className={`text-2xl md:text-[28px] text-gray-900 mb-2 ${lobster.className}`}>
            Account
          </h3>
          <p className="text-sm font-medium text-gray-700 mb-1">Deactivate Cafe Account.</p>
          <p className="text-xs text-gray-600 font-medium">Contact <a href="mailto:hello@brontie.ie" className="text-[#6ca3a4]">hello@brontie.ie</a> to close your account.</p>
        </div>

      </div>

      {/* Right Column: Logo */}
      <div className="w-full lg:w-[300px] shrink-0">
         <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] text-center border border-gray-50">
             <h3 className={`text-2xl md:text-[24px] text-gray-900 ${lobster.className}`}>{formData.name || 'Your Cafe Name'}</h3>
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
