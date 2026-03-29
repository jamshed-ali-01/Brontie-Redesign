"use client";

import { useState } from "react";
import { Building2, Mail, Phone, Globe, MapPin, Upload, X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateOrganizationPage() {
      const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    description: "",
    phone: "",
    website: "",
    address: "",
    status: "active",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFile = (e:any) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Max 5MB");
        return;
      }
      setLogoFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setPreview("");
    }
  };

  const removeImage = () => {
    setLogoFile(null);
    setPreview("");
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Organization name is required");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("description", form.description);
      fd.append("phone", form.phone);
      fd.append("website", form.website);
      fd.append("address", form.address);
      fd.append("status", form.status);
      if (logoFile) fd.append("logo", logoFile);

      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed");
      }
      // alert("success");
      router.push("/admin/organizations");
    } catch (err) {
      alert((err as Error)?.message || "Failed to create");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-teal-600/40 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
              <p className="text-gray-600 text-sm mt-1">
                Add a new café partner — temporary password will be generated and emailed automatically
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-teal-600" />
                </div>
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="Enter organization name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      placeholder="+92 3xx xxxxxx"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      className="w-full border border-gray-300 pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
                    rows={4}
                    placeholder="Brief description about the organization..."
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="w-full border border-gray-300 pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      placeholder="Full address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-teal-600" />
                </div>
                Organization Logo
              </h2>

              {!preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-teal-600" />
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-teal-600 font-medium hover:text-teal-700">
                      Click to upload
                    </span>
                    <span className="text-gray-600"> or drag and drop</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                </div>
              ) : (
                <div className="relative bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 bg-white rounded-xl shadow-md overflow-hidden flex-shrink-0">
                      <img
                        src={preview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-900">Logo uploaded successfully</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your logo looks great! You can remove it and upload a different one if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4 border-t">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-teal-500/30"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Organization"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}