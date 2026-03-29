"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Organization {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  status: "active" | "inactive";
  logoUrl?: string;
  qrImageUrl?: string; // saved QR image url
}

export default function OrganizationListPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organizations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrganizations(data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      alert("Organization deleted successfully");
      fetchOrganizations();
    } catch (err) {
      console.error(err);
      alert("Failed to delete organization");
    }
  };

  // const handleDelete = async (id: string) => {
  // if (!confirm("Are you sure you want to delete this organization?")) return;

  // try {
  //   const res = await fetch(`/api/admin/organizations/${id}`, {
  //     method: "DELETE",
  //   });
  //   if (!res.ok) throw new Error("Failed to delete");
  //   setOrganizations(prev => prev.filter(o => o._id !== id));
  //   alert("Organization deleted successfully");
  // } catch (err) {
  //   console.error(err);
  //   alert((err as Error)?.message || "Failed to delete");
  // }
  // };
  const handleView = (org: Organization) => {
    setSelectedOrg(org);
    setShowModal(true);
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-600/40 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Organizations
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage all café partners and their details
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                (window.location.href = "/admin/organizations/create")
              }
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition shadow-lg shadow-teal-500/30"
            >
              <Plus className="w-5 h-5" />
              Add New Organization
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                Loading organizations...
              </p>
            </div>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No results found" : "No organizations yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first organization"}
            </p>
            {!searchQuery && (
              <button
                onClick={() =>
                  (window.location.href = "/admin/organizations/create")
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add Organization
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-teal-500">
                <p className="text-sm text-gray-600 mb-1">
                  Total Organizations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {organizations.filter((o) => o.status === "active").length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
                <p className="text-sm text-gray-600 mb-1">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {organizations.filter((o) => o.status === "inactive").length}
                </p>
              </div>
            </div>

            {/* Organization Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org) => (
                <div
                  key={org._id}
                  className="bg-white shadow-lg rounded-2xl drop-shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4">
                    <div className="flex items-start gap-4">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-md">
                          <Building2 className="w-8 h-8 text-teal-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-white truncate">
                          {org.name}
                        </h2>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                            org.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {org.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {org.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {org.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {org.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{org.email}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{org.phone}</span>
                        </div>
                      )}
                      {org.website && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:text-teal-600 transition"
                          >
                            {org.website}
                          </a>
                        </div>
                      )}
                      {org.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{org.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleView(org)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/organizations/${org._id}/edit`)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounde d-lg hover:bg-teal-100 transition font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(org._id, org.name)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* View Modal */}
        {/* View Modal */}
        {showModal && selectedOrg && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedOrg.logoUrl ? (
                    <img
                      src={selectedOrg.logoUrl}
                      alt={selectedOrg.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-md">
                      <Building2 className="w-8 h-8 text-teal-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedOrg.name}
                    </h2>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        selectedOrg.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedOrg.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {selectedOrg.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Description
                    </h3>
                    <p className="text-gray-600">{selectedOrg.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedOrg.email && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedOrg.email}</p>
                    </div>
                  )}

                  {selectedOrg.phone && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{selectedOrg.phone}</p>
                    </div>
                  )}

                  {selectedOrg.website && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Website</p>
                      <a
                        href={selectedOrg.website}
                        target="_blank"
                        className="font-medium text-teal-600 hover:underline"
                      >
                        {selectedOrg.website}
                      </a>
                    </div>
                  )}

                  {selectedOrg.address && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium">{selectedOrg.address}</p>
                    </div>
                  )}
                </div>

                {/* 🔥 QR CODE SECTION */}
                {selectedOrg.qrImageUrl && (
                  <div className="border rounded-xl p-5 bg-gradient-to-br from-teal-50 to-blue-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">
                      Organization QR Code
                    </h3>

                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-xl shadow">
                        <img
                          src={selectedOrg.qrImageUrl}
                          alt="Organization QR"
                          className="w-44 h-44 object-contain"
                        />
                      </div>

                        <button
                          onClick={async () => {
                            try {
                              if (!selectedOrg.qrImageUrl) {
                                alert('QR code URL not available');
                                return;
                              }
                              const response = await fetch(selectedOrg.qrImageUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${selectedOrg.name}-qr.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Download failed:', error);
                              alert('Failed to download QR code');
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition shadow"
                        >
                          Download QR Code
                        </button>

                      <p className="text-xs text-gray-500 text-center">
                        Print or share this QR to bring traffic
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
