'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Newspaper {
    _id: string;
    title: string;
    content: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function NewspapersPage() {
    const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNewspaper, setEditingNewspaper] = useState<Newspaper | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        imageWidth: 661,
        imageHeight: 441,
        displayOrder: 0,
        isActive: true
    });

    useEffect(() => {
        fetchNewspapers();
    }, []);

    const fetchNewspapers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/newspapers');
            if (response.ok) {
                const data = await response.json();
                setNewspapers(data.newspapers || []);
            }
        } catch (error) {
            console.error('Error fetching newspapers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        try {
            const response = await fetch('/admin/upload', {
                method: 'POST',
                body: uploadFormData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingNewspaper
                ? `/api/admin/newspapers/${editingNewspaper._id}`
                : '/api/admin/newspapers';

            const method = editingNewspaper ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                await fetchNewspapers();
                handleCloseModal();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save newspaper');
            }
        } catch (error) {
            console.error('Error saving newspaper:', error);
            alert('Failed to save newspaper');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this newspaper entry?')) return;

        try {
            const response = await fetch(`/api/admin/newspapers/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchNewspapers();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete newspaper');
            }
        } catch (error) {
            console.error('Error deleting newspaper:', error);
            alert('Failed to delete newspaper');
        }
    };

    const handleEdit = (newspaper: Newspaper) => {
        setEditingNewspaper(newspaper);
        setFormData({
            title: newspaper.title,
            content: newspaper.content,
            imageUrl: newspaper.imageUrl,
            imageWidth: newspaper.imageWidth,
            imageHeight: newspaper.imageHeight,
            displayOrder: newspaper.displayOrder,
            isActive: newspaper.isActive
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingNewspaper(null);
        setFormData({
            title: '',
            content: '',
            imageUrl: '',
            imageWidth: 661,
            imageHeight: 441,
            displayOrder: 0,
            isActive: true
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 font-primary text-black">Newspapers</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                >
                    Add Newspaper
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newspapers.map((item) => (
                    <div key={item._id} className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden flex flex-col">
                        <div className="relative h-48 w-full">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 leading-tight flex-1 mr-2">{item.title}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{item.content}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                                <span className="text-xs text-gray-500">
                                    Order: {item.displayOrder}
                                </span>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {newspapers.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">No newspaper entries found.</div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Add Your First Entry
                    </button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-black">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 font-primary text-black">
                                    {editingNewspaper ? 'Edit Newspaper' : 'Add Newspaper'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 ">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-black"
                                        placeholder="Newspaper headline..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                    <div className="flex items-start space-x-4">
                                        <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300 flex items-center justify-center">
                                            {formData.imageUrl ? (
                                                <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                                            ) : (
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                                                disabled={uploadingImage}
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                {uploadingImage ? 'Uploading...' : 'Upload an image (Recommended 661x441)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                        <input
                                            type="number"
                                            value={formData.displayOrder}
                                            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-black"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Is Active</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[200px] text-black"
                                        placeholder="Full news article text..."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-all shadow-md disabled:opacity-50"
                                        disabled={uploadingImage}
                                    >
                                        {editingNewspaper ? 'Update Item' : 'Create Item'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
