'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function MaintenanceSettings() {
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(false);
    const [bypassPassword, setBypassPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/maintenance');
            const data = await res.json();
            if (res.ok) {
                setEnabled(data.maintenanceMode);
                setBypassPassword(data.bypassPassword);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maintenanceMode: enabled,
                    bypassPassword
                }),
            });

            if (res.ok) {
                toast.success(enabled ? 'Maintenance Mode ENABLED' : 'Maintenance Mode DISABLED');
                // If enabled, warn about environment switching
                if (enabled) {
                    toast((t) => (
                        <span>
                            <b>Note:</b> Application is now using <b>LOCAL</b> database and Stripe keys.
                        </span>
                    ), { icon: '⚠️', duration: 5000 });
                }
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Maintenance Settings</h1>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSave} className="space-y-6">

                    <div className="flex items-center justify-between py-4 border-b">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Maintenance Mode Status</h3>
                            <p className="text-sm text-gray-500">
                                When enabled, correct database will switch to LOCAL and public access will be blocked.
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`${enabled ? 'bg-amber-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
                            role="switch"
                            aria-checked={enabled}
                            onClick={() => setEnabled(!enabled)}
                        >
                            <span
                                aria-hidden="true"
                                className={`${enabled ? 'translate-x-5' : 'translate-x-0'
                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    Current Status: <strong>{enabled ? 'ENABLED (Under Maintenance)' : 'DISABLED (Live)'}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="bypassPassword" className="block text-sm font-medium text-gray-700">
                            Bypass Password
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="bypassPassword"
                                id="bypassPassword"
                                value={bypassPassword}
                                onChange={(e) => setBypassPassword(e.target.value)}
                                className="shadow-sm focus:ring-amber-500 focus:border-amber-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="Enter a secret password for Admin/Test access"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Share this password with anyone who needs access during maintenance.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
