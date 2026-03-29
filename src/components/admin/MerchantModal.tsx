import FileUpload from '@/components/FileUpload';
import { Merchant, MerchantFormData } from '@/types/merchant';

interface MerchantModalProps {
  isOpen: boolean;
  editingMerchant: Merchant | null;
  formData: MerchantFormData;
  setFormData: (data: MerchantFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function MerchantModal({
  isOpen,
  editingMerchant,
  formData,
  setFormData,
  onSubmit,
  onClose
}: MerchantModalProps) {
  if (!isOpen) return null;

  const handleLogoUpload = (url: string) => {
    setFormData({ ...formData, logoUrl: url });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingMerchant ? 'Edit Merchant' : 'Add Merchant'}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Email *</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
              rows={3}
              placeholder="Full address of the business"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
              rows={3}
              placeholder="Brief description of the business"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Category *</label>
            <select
              value={formData.businessCategory}
              onChange={(e) => setFormData({ 
                ...formData, 
                businessCategory: e.target.value as MerchantFormData['businessCategory']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
              required
            >
              <option value="Café & Treats">☕ Café & Treats</option>
              <option value="Tickets & Passes">🎫 Tickets & Passes</option>
              <option value="Dining & Meals">🍽️ Dining & Meals</option>
              <option value="Other">🔧 Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                placeholder="+353 1 234 5678"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-black"
                placeholder="https://yourcafe.com"
              />
            </div>
          </div>

          <div className="mb-6">
            <FileUpload
              onUpload={handleLogoUpload}
              currentUrl={formData.logoUrl}
              label="Logo"
              accept="image/*"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {editingMerchant ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
