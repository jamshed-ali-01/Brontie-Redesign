'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { getCategoryIdByBusiness } from '@/lib/category-client';
import { getCategoryNameById } from '@/lib/category-client';
import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface GiftItem {
  _id: string;
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

interface FormData {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
}

export default function CafeItemsPage() {
  const [items, setItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);
  const [merchantBusinessCategory, setMerchantBusinessCategory] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    price: 0.50,
    description: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [merchantName, setMerchantName] = useState('Cafe Name M');
  const [merchantLogo, setMerchantLogo] = useState('');

  const fetchMerchantInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/cafes/profile');
      if (response.ok) {
        const data = await response.json();
        setMerchantBusinessCategory(data.businessCategory || 'Café & Treats');
        setMerchantName(data.merchantName || 'Cafe Name M');
        setMerchantLogo(data.logoUrl || '');
      }
    } catch (error) {
      console.error('Failed to fetch merchant info:', error);
      setMerchantBusinessCategory('Café & Treats');
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/cafes/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        if (response.status === 401) {
          router.push('/cafes/login');
          return;
        }
        setError('Failed to load items');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMerchantInfo();
    fetchItems();
  }, [fetchMerchantInfo, fetchItems]);

  const handleImageUpload = async (file: File) => {
    if (!file) return '';

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      setError('Image upload failed');
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleImageUpload(file);
      if (url) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingItem ? `/api/cafes/items/${editingItem._id}` : '/api/cafes/items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingItem) {
          setItems(prev => prev.map(item =>
            item._id === editingItem._id ? data.giftItem : item
          ));
        } else {
          setItems(prev => [data.giftItem, ...prev]);
        }

        resetForm();
        setShowAddForm(false);
        setEditingItem(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save item');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: GiftItem) => {
    try {
      const newStatus = !item.isActive;
      // Optimistically update
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: newStatus } : i));

      const response = await fetch(`/api/cafes/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...item, isActive: newStatus }),
      });

      if (!response.ok) {
        // Revert on failure
        setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: !newStatus } : i));
        setError('Failed to update status');
      }
    } catch (err) {
      // Revert on failure
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isActive: !item.isActive } : i));
      setError('Network error when updating status');
    }
  };

  const handleEdit = (item: GiftItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId || getCategoryIdByBusiness(merchantBusinessCategory),
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/cafes/items/${itemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems(prev => prev.filter(item => item._id !== itemId));
      } else {
        setError('Failed to delete item');
      }
    } catch {
      setError('Network error');
    }
  };

  const resetForm = () => {
    const autoCategoryId = getCategoryIdByBusiness(merchantBusinessCategory);
    setFormData({
      name: '',
      categoryId: autoCategoryId,
      price: 0.50,
      description: '',
      imageUrl: ''
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    resetForm();
    setShowAddForm(false);
  };


  if (loading && items.length === 0 && !showAddForm) {
    return (
      <CafeDashboardLayout cafeName="Loading..." ownerName="">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#f4c24d] rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-[#6ca3a4] rounded-full border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-[16px] font-bold text-gray-800 tracking-wide">Loading menu items...</h3>
        </div>
      </CafeDashboardLayout>
    );
  }

  const formatCurrency = (val: number) => `€${(val || 0).toFixed(2)}`;

  return (
    <CafeDashboardLayout cafeName={merchantName} cafeLogo={merchantLogo} ownerName="">
      <div className="pb-12 max-w-5xl">
        <h1 className={`text-[42px] tracking-tight text-[#6ca3a4] mb-2 ${lobster.className}`}>Menu Items</h1>
        <p className="text-[14px] font-medium text-[#879bb1] mb-8">Manage and showcase your cafe menu items here</p>

        {showAddForm ? (
          /* ADD/EDIT FORM UI */
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6ca3a4] focus:border-transparent text-[14px] font-medium"
                    placeholder="e.g., Cappuccino"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Price (€) *</label>
                  <input
                    type="number"
                    required
                    min="0.50"
                    step="0.10"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6ca3a4] focus:border-transparent text-[14px] font-medium"
                    placeholder="4.50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {formData.imageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer bg-[#fcfdfd] border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-600 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                      {uploading ? 'Uploading...' : (formData.imageUrl ? 'Change Image' : 'Upload Image')}
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6ca3a4] focus:border-transparent text-[14px] font-medium resize-none shadow-sm"
                    placeholder="Brief description of the item..."
                  />
                  <p className="text-[11px] font-medium text-gray-400 mt-2 text-right">
                    {formData.description.length}/200 characters
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[13px] border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-[#879bb1] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#6ca3a4] hover:bg-[#5b8c8d] text-white px-8 py-2.5 rounded-xl text-[14px] font-bold shadow-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : (editingItem ? 'Update Menu Item' : 'Add Menu Item')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* MAIN TABLE */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col pt-2 pb-2 mb-8 relative">
              
              <div className="overflow-x-auto w-full px-2">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 px-6 w-[30%]">Item</th>
                      <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 pr-6 w-[15%]">Your Price</th>
                      <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 pr-6 w-[20%]">Brontie Listed Price</th>
                      <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 pr-6 w-[20%]">Status</th>
                      <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 px-6 w-[15%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.length > 0 ? items.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-gray-50" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#f0f4f4] flex items-center justify-center shrink-0 border border-[#e2ecec]">
                                <ImageIcon className="w-5 h-5 text-[#879bb1]" />
                              </div>
                            )}
                            <span className="text-[13px] font-bold text-gray-900 group-hover:text-[#6ca3a4] transition-colors">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-6 text-[13px] font-bold text-[#879bb1]">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="py-4 pr-6 text-[13px] font-bold text-[#879bb1]">
                          €{item.price.toFixed(2)}
                        </td>
                        <td className="py-4 pr-6">
                           <button 
                             onClick={() => handleToggleActive(item)}
                             className="flex items-center gap-3 cursor-pointer group/toggle"
                           >
                             <div className={`w-[46px] h-[26px] rounded-full flex items-center px-[3px] transition-colors ${item.isActive ? 'bg-[#eaf1f1]' : 'bg-gray-200'}`}>
                               <div className={`w-[20px] h-[20px] rounded-full transform transition-transform duration-200 shadow-sm ${item.isActive ? 'bg-[#6ca3a4] translate-x-[20px]' : 'bg-white translate-x-0'}`}></div>
                             </div>
                             <span className="text-[14px] font-medium text-gray-700 select-none">Visible</span>
                           </button>
                        </td>
                        <td className="py-4 px-6 text-right relative">
                          <div className="flex items-center justify-end gap-5">
                            <button onClick={() => handleEdit(item)} className="text-[#879bb1] hover:text-[#6ca3a4] transition-colors">
                              <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="text-[#ff4747] hover:text-[#d33a3a] transition-colors">
                              <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-[14px] font-medium text-gray-400">No menu items found. Add your first item!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ERROR LIMIT */}
            {error && !showAddForm && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[13px] border border-red-100 font-medium mb-6 text-center">
                  {error}
                </div>
            )}

            {/* DASHED ADD BUTTON */}
            <button
               onClick={() => {
                  if (items.length >= 15) {
                    setError('You can only have up to 15 items. Please remove some items before adding new ones.');
                    return;
                  }
                  const autoCategoryId = getCategoryIdByBusiness(merchantBusinessCategory);
                  setFormData({
                    name: '',
                    categoryId: autoCategoryId,
                    price: 0.5,
                    description: '',
                    imageUrl: ''
                  });
                  setShowAddForm(true);
                }}
              className="w-full flex flex-col items-center justify-center py-6 rounded-2xl border-[1.5px] border-dashed border-[#88b5b5] bg-[#fdfefe] hover:bg-[#f6fcfc] transition-colors group cursor-pointer"
            >
              <Plus className="w-7 h-7 text-[#88b5b5] mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span className="text-[14px] font-medium text-[#88b5b5]">Add another Menu Item</span>
            </button>
          </>
        )}

      </div>
    </CafeDashboardLayout>
  );
}