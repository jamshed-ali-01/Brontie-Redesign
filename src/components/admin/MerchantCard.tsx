import Image from 'next/image';
import { useState } from 'react';
import { Merchant, MerchantLocation } from '@/types/merchant';
import MerchantDialog from './MerchantDialog';

interface MerchantCardProps {
  merchant: Merchant;
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchantId: string) => void;
  onAddLocation: (merchantId: string) => void;
  onEditLocation: (merchantId: string, location: MerchantLocation) => void;
  onDeleteLocation: (merchantId: string, locationId: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
}

export default function MerchantCard({
  merchant,
  onEdit,
  onDelete,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onApprove,
  onDeny
}: MerchantCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  return (
    <>
      <div 
        className="bg-teal-600 rounded-2xl shadow-lg border border-teal-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        {/* Header */}
        <div className="p-6 text-white">
          <div className="flex items-center space-x-4">
            {merchant.logoUrl ? (
              <div className="w-16 h-16 relative bg-white rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/20">
                <Image
                  src={merchant.logoUrl}
                  alt={`${merchant.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20">
                <span className="text-2xl text-white">🏪</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold !text-white">{merchant.name}</h3>
                {getStatusBadge(merchant.status)}
              </div>
              {merchant.description && (
                <p className="!text-white/90 text-sm max-w-md leading-relaxed">{merchant.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white/10 backdrop-blur-sm p-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="flex items-center">
              <span className="text-white/80 mr-2">📧</span>
              <span className="text-sm truncate">{merchant.contactEmail}</span>
            </div>
            <div className="flex items-center">
              <span className="text-white/80 mr-2">📍</span>
              <span className="text-sm truncate">{merchant.address}</span>
            </div>
            <div className="flex items-center">
              <span className="text-white/80 mr-2">🏪</span>
              <span className="text-sm">{merchant.locations?.length || 0} location(s)</span>
            </div>
            <div className="flex items-center">
              <span className="text-white/80 mr-2">📅</span>
              <span className="text-sm">{new Date(merchant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <MerchantDialog
        merchant={merchant}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddLocation={onAddLocation}
        onEditLocation={onEditLocation}
        onDeleteLocation={onDeleteLocation}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    </>
  );
}
