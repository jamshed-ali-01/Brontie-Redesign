import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Merchant, MerchantLocation } from '@/types/merchant';

interface MerchantDialogProps {
  merchant: Merchant;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchantId: string) => void;
  onAddLocation: (merchantId: string) => void;
  onEditLocation: (merchantId: string, location: MerchantLocation) => void;
  onDeleteLocation: (merchantId: string, locationId: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
}

export default function MerchantDialog({
  merchant,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onApprove,
  onDeny
}: MerchantDialogProps) {
  // states and effects must be declared before any returns

  const [locations, setLocations] = useState<MerchantLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [brontieFee, setBrontieFee] = useState<Merchant['brontieFeeSettings']>(merchant.brontieFeeSettings);
  const [editingEmail, setEditingEmail] = useState<string>(merchant.contactEmail);
  const [updatingEmail, setUpdatingEmail] = useState<boolean>(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLocationsLoading(true);
        setLocationsError(null);
        const res = await fetch(`/api/admin/merchants/${merchant._id}/locations`);
        if (!res.ok) throw new Error(`Failed to load locations (${res.status})`);
        const data = await res.json();
        setLocations(data.locations || []);
      } catch (e) {
        setLocationsError(e instanceof Error ? e.message : 'Failed to load locations');
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    };

    if (isOpen && merchant?._id) {
      void fetchLocations();
    }
  }, [isOpen, merchant?._id]);

  if (!isOpen) return null;

  const handleActivateBrontieFee = async (merchantId: string) => {
    if (!confirm('Are you sure you want to activate the 10% Brontie fee for this merchant? This will apply to all future transactions.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/brontie-fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'activate' }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setBrontieFee(result?.brontieFeeSettings || { isActive: true });
        toast.success('Brontie fee activated');
      } else {
        toast.error('Failed to activate Brontie fee');
      }
    } catch (error) {
      console.error('Error activating Brontie fee:', error);
      alert('Network error');
    }
  };

  const handleDeactivateBrontieFee = async (merchantId: string) => {
    const reason = prompt('Please provide a reason for deactivating the Brontie fee (optional):');
    
    if (!confirm('Are you sure you want to deactivate the 10% Brontie fee for this merchant? This will make all future transactions free of Brontie commission.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/brontie-fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deactivate', reason }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setBrontieFee(result?.brontieFeeSettings || { isActive: false });
        toast.success('Brontie fee deactivated');
      } else {
        toast.error('Failed to deactivate Brontie fee');
      }
    } catch (error) {
      console.error('Error deactivating Brontie fee:', error);
      alert('Network error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'denied':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Denied</span>;
      default:
        return null;
    }
  };

  const handleEmailUpdate = async () => {
    if (editingEmail === merchant.contactEmail) return;
    
    if (!editingEmail || !editingEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      setEditingEmail(merchant.contactEmail);
      return;
    }

    try {
      setUpdatingEmail(true);
      const response = await fetch(`/api/admin/merchants/${merchant._id}/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactEmail: editingEmail }),
      });

      if (response.ok) {
        toast.success('Email updated successfully');
        onEdit({ ...merchant, contactEmail: editingEmail });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update email');
        setEditingEmail(merchant.contactEmail);
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Network error');
      setEditingEmail(merchant.contactEmail);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleResendPassword = async (email: string) => {
    if (!confirm(`Send temporary password to ${email}?`)) return;

    try {
      const response = await fetch(`/api/admin/merchants/${merchant._id}/resend-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('Temporary password sent successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send temporary password');
      }
    } catch (error) {
      console.error('Error sending password:', error);
      toast.error('Network error');
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-teal-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-teal-200 transition-colors text-2xl"
          >
            ×
          </button>
          
          <div className="flex items-center space-x-4">
            {merchant.logoUrl ? (
              <div className="w-20 h-20 relative bg-white rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/20">
                <Image
                  src={merchant.logoUrl}
                  alt={`${merchant.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20">
                <span className="text-2xl text-white">🏪</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold !text-white">{merchant.name}</h2>
                {getStatusBadge(merchant.status)}
              </div>
              {merchant.description && (
                <p className="!text-teal-100 text-sm max-w-md leading-relaxed">{merchant.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] min-h-0">
          {/* Merchant Information */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Merchant Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-teal-500 mr-2">📧</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                  </div>
                  <button
                    onClick={() => handleResendPassword(merchant.contactEmail)}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-md transition-colors"
                  >
                    Resend Password
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editingEmail}
                    onChange={(e) => setEditingEmail(e.target.value)}
                    onBlur={() => handleEmailUpdate()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEmailUpdate();
                        e.currentTarget.blur();
                      }
                      if (e.key === 'Escape') {
                        setEditingEmail(merchant.contactEmail);
                        e.currentTarget.blur();
                      }
                    }}
                    className="flex-1 text-sm text-gray-800 font-medium bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-teal-500"
                    disabled={updatingEmail}
                  />
                  {updatingEmail && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                  )}
                </div>
              </div>
              
              {/* Phone */}
              {merchant.contactPhone && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <span className="text-orange-500 mr-2">📞</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{merchant.contactPhone}</p>
                </div>
              )}
              
              {/* Address */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-amber-500 mr-2">📍</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</span>
                </div>
                <p className="text-sm text-gray-800 font-medium break-words">{merchant.address}</p>
              </div>
              
              {/* Created Date */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-slate-500 mr-2">📅</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</span>
                </div>
                <p className="text-sm text-gray-800 font-medium">{new Date(merchant.createdAt).toLocaleDateString()}</p>
              </div>
              
              {/* Locations count */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-green-500 mr-2">🏪</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Locations</span>
                </div>
                <p className="text-sm text-gray-800 font-medium">{locations.length} location(s)</p>
              </div>
              
              {/* Website */}
              {merchant.website && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-2">
                    <span className="text-teal-500 mr-2">🌐</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</span>
                  </div>
                  <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:text-teal-800 font-medium break-all hover:underline">
                    {merchant.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Payout Details */}
          {merchant.payoutDetails && (
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 mb-6 border border-teal-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-teal-800">Payout Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Holder */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-100">
                  <div className="flex items-center mb-2">
                    <span className="text-teal-500 mr-2">👤</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Holder</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{merchant.payoutDetails.accountHolderName}</p>
                </div>
                
                {/* BIC */}
                {merchant.payoutDetails.bic && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-100">
                    <div className="flex items-center mb-2">
                      <span className="text-orange-500 mr-2">🏦</span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">BIC</span>
                    </div>
                    <p className="text-sm font-mono text-gray-800 font-medium break-all" title={merchant.payoutDetails.bic}>
                      {merchant.payoutDetails.bic}
                    </p>
                  </div>
                )}
              </div>
              
              {/* IBAN */}
              <div className="mt-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-100">
                  <div className="flex items-center mb-2">
                    <span className="text-amber-500 mr-2">🔢</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">IBAN</span>
                  </div>
                  <p className="text-sm font-mono text-gray-800 font-medium break-all" title={merchant.payoutDetails.iban}>
                    {merchant.payoutDetails.iban}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stripe Connect Status */}
          {merchant.status === 'approved' && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 mb-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">🔗</span>
                </div>
                <h3 className="text-lg font-semibold text-green-800">Stripe Connect Status</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Connection Status */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-teal-500 mr-2">🔌</span>
                      <span className="text-sm font-medium text-gray-700">Connection</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      merchant.stripeConnectSettings?.isConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {merchant.stripeConnectSettings?.isConnected ? '✅ Connected' : '❌ Not Connected'}
                    </span>
                  </div>
                </div>
                
                {/* Payouts Status */}
                {merchant.stripeConnectSettings?.isConnected && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-orange-500 mr-2">💰</span>
                        <span className="text-sm font-medium text-gray-700">Payouts</span>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        merchant.stripeConnectSettings?.payoutsEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {merchant.stripeConnectSettings?.payoutsEnabled ? '✅ Enabled' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brontie Fee Control for Approved Merchants */}
          {merchant.status === 'approved' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-amber-800">Brontie Fee Control</h3>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-amber-500 mr-2">📊</span>
                    <span className="text-sm font-medium text-gray-700">Current Status</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    brontieFee?.isActive ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {brontieFee?.isActive ? '✅ Active (10%)' : '🆓 Inactive (Free)'}
                  </span>
                </div>
                
                {brontieFee?.isActive && brontieFee?.activatedAt && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Activated:</span> {new Date(brontieFee.activatedAt).toLocaleDateString()}
                  </p>
                )}
                {!brontieFee?.isActive && brontieFee?.deactivatedAt && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Deactivated:</span> {new Date(brontieFee.deactivatedAt).toLocaleDateString()}
                    {brontieFee.deactivationReason && (
                      <span> - {brontieFee.deactivationReason}</span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="flex justify-center">
                {!brontieFee?.isActive ? (
                  <button
                    onClick={() => handleActivateBrontieFee(merchant._id)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    ✅ Activate 10% Fee
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeactivateBrontieFee(merchant._id)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    🚫 Deactivate Fee
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Approval Actions for Pending Merchants */}
          {merchant.status === 'pending' && onApprove && onDeny && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 mb-6 border border-yellow-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">⏳</span>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800">Action Required</h3>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100 mb-4">
                <p className="text-sm text-gray-700 text-center">
                  This merchant is waiting for approval. Review their information and decide whether to approve or deny their application.
                </p>
              </div>
              
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={onApprove}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ✅ Approve Merchant
                </button>
                <button
                  onClick={onDeny}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ❌ Deny Application
                </button>
              </div>
            </div>
          )}

          {/* Locations Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">📍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Locations</h3>
              </div>
              <button
                onClick={() => onAddLocation(merchant._id)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                + Add Location
              </button>
            </div>
            
            {locationsLoading ? (
              <div className="text-center text-gray-500">Loading locations...</div>
            ) : locationsError ? (
              <div className="text-center text-red-600">{locationsError}</div>
            ) : locations && locations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((location, index) => (
                  <div key={location._id} className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <span className="text-teal-500 mr-2">🏪</span>
                          <span className="font-semibold text-gray-800">{location.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 break-words">
                          {location.address}
                        </div>
                        <div className="text-sm text-teal-600 font-medium">
                          {location.city}, {location.country}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-3">
                        <button
                          onClick={() => onEditLocation(merchant._id, location)}
                          className="bg-teal-100 hover:bg-teal-200 text-teal-600 p-2 rounded-lg transition-colors"
                          title="Edit location"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteLocation(merchant._id, location._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                          title="Delete location"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl border-2 border-dashed border-teal-200">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-teal-500">📍</span>
                </div>
                <p className="text-gray-600 font-medium mb-2">No locations added yet</p>
                <p className="text-sm text-gray-500">Click &quot;Add Location&quot; to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
         <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => onEdit(merchant)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl transition-colors text-sm font-medium"
            >
              ✏️ Edit Merchant
            </button>
            <button
              onClick={() => onDelete(merchant._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors text-sm font-medium"
            >
              🗑️ Delete Merchant
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
