import Image from 'next/image';
import { useState, useRef } from 'react';

interface FileUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  label: string;
  accept?: string;
  className?: string;
} 

export default function FileUpload({  
  currentUrl, 
  onUpload, 
  label, 
  accept = "image/*",
  className = "" 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      onUpload(result.url);
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
      
      // Reset preview on error
      setPreview(currentUrl || null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {preview && (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Preview"
            width={120}
            height={120}
            className="rounded-lg object-cover border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
        />
        <label
          htmlFor={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Select Image'}
        </label>
        
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
      </p>
    </div>
  );
}
