'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

/* =======================
   TYPES
   ======================= */
interface OrganizationData {
  _id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string; // ✅ NEW
  status: 'active' | 'inactive';
}

export default function OrganizationProfilePage() {
  /* PROFILE STATES */
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false); // ✅ NEW
  const [error, setError] = useState('');

  /* SUCCESS MODAL */
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* PASSWORD MODAL */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  /* =======================
     LOAD PROFILE
     ======================= */
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/organizations/profile');
      if (!res.ok) throw new Error();
      setOrg(await res.json());
    } catch {
      setError('Failed to load organization profile');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SAVE PROFILE
     ======================= */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/organizations/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: org.name,
          phone: org.phone,
          website: org.website,
          address: org.address,
          description: org.description,
          logoUrl: org.logoUrl,
          coverImageUrl: org.coverImageUrl, // ✅ NEW
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     LOGO UPLOAD
     ======================= */
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setOrg((prev) => (prev ? { ...prev, logoUrl: data.url } : prev));
    } catch {
      setError('Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  /* =======================
     COVER IMAGE UPLOAD ✅ NEW
     ======================= */
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setOrg((prev) => (prev ? { ...prev, coverImageUrl: data.url } : prev));
    } catch {
      setError('Cover image upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  /* =======================
     CHANGE PASSWORD
     ======================= */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/organizations/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      setPasswordSuccess('Password updated successfully');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Password update failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-teal-600 rounded-full" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between">
          <h1 className="text-2xl font-bold">🏢 Organization Profile</h1>
          <Link href="/organizations/dashboard" className="bg-gray-700 text-white px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow p-8 space-y-8">
          {/* LOGO */}
          <div className="flex items-center gap-6">
            {org.logoUrl ? (
              <img src={org.logoUrl} className="w-28 h-28 rounded-full object-cover border" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                {org.name.charAt(0)}
              </div>
            )}

            <label className="cursor-pointer">
              <input
                type="file"
                hidden
                accept="image/*"
                disabled={uploadingLogo}
                onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
              />
              <span className="px-4 py-2 border rounded-lg bg-white">
                {uploadingLogo ? 'Uploading...' : 'Change Logo'}
              </span>
            </label>
          </div>

          {/* COVER IMAGE ✅ NEW */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Community Cover Photo
            </label>
            <p className="text-xs text-gray-500">
              This photo appears on the success page when someone gifts your organisation. Use a photo of your group or community.
            </p>
            {org.coverImageUrl && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border">
                <img
                  src={org.coverImageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                hidden
                accept="image/*"
                disabled={uploadingCover}
                onChange={(e) => e.target.files && handleCoverUpload(e.target.files[0])}
              />
              <span className="px-4 py-2 border rounded-lg bg-white text-sm inline-block">
                {uploadingCover ? 'Uploading...' : org.coverImageUrl ? 'Change Cover Photo' : 'Upload Cover Photo'}
              </span>
            </label>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className="border px-4 py-2 rounded-lg"
              value={org.name}
              onChange={(e) => setOrg({ ...org, name: e.target.value })}
              placeholder="Organization Name"
            />

            {/* EMAIL (READ ONLY) */}
            <input
              disabled
              className="border px-4 py-2 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              value={org.email || ''}
            />

            <input
              className="border px-4 py-2 rounded-lg"
              value={org.phone || ''}
              onChange={(e) => setOrg({ ...org, phone: e.target.value })}
              placeholder="Phone"
            />

            <input
              className="border px-4 py-2 rounded-lg"
              value={org.website || ''}
              onChange={(e) => setOrg({ ...org, website: e.target.value })}
              placeholder="Website"
            />
          </div>

          <textarea
            className="border px-4 py-2 rounded-lg w-full"
            rows={3}
            value={org.address || ''}
            onChange={(e) => setOrg({ ...org, address: e.target.value })}
            placeholder="Address"
          />

          <textarea
            className="border px-4 py-2 rounded-lg w-full"
            rows={4}
            value={org.description || ''}
            onChange={(e) => setOrg({ ...org, description: e.target.value })}
            placeholder="Description"
          />

          <input
            disabled
            className="border px-4 py-2 rounded-lg bg-gray-100 w-full"
            value={org.slug}
          />

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="text-teal-600 font-medium hover:underline"
            >
              Change Password
            </button>

            <button
              disabled={saving}
              className="bg-teal-600 text-white px-8 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Profile Updated</h2>
            <p className="text-gray-600 mb-6">
              Your organization profile has been updated successfully.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">🔐 Change Password</h2>

            {passwordError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current password"
                  className="border px-4 py-2 rounded-lg w-full pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  className="border px-4 py-2 rounded-lg w-full pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="border px-4 py-2 rounded-lg w-full pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={passwordLoading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
