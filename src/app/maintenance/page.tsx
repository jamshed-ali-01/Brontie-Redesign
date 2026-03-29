'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/maintenance/bypass', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                // Reload to bypass middleware
                window.location.href = '/';
            } else {
                const data = await response.json();
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

            {/* 1. Background Layers (Fixing height issue) */}
            <div className="absolute inset-0 z-0">
                {/* Color Layer - Teal */}
                <div className="absolute inset-0 bg-primary-100"></div>
                {/* Texture Layer - Noise */}
                <div className="absolute inset-0 bg-[url('/images/noice-texture-bg2.png')] bg-cover bg-top bg-no-repeat mix-blend-overlay opacity-40"></div>
                {/* Note: Adjusting opacity/blend to ensure text remains readable as per original design intent */}
            </div>

            {/* Content Container - Z-Index 100 to sit above background */}
            <div className="max-w-3xl w-full text-center z-[10] space-y-8 relative">

                {/* Brand Icon - Coffee Cup or similar */}
                <div className="flex justify-center mb-6">
                    <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl text-white font-primary tracking-wide leading-tight drop-shadow-md">
                        We'll be back <span className="text-secondary-100">soon.</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-white/90 font-secondary max-w-lg mx-auto leading-relaxed drop-shadow-sm">
                        We're currently making some improvements to your gifting experience.
                        Brontie will be online shortly!
                    </p>
                </div>

                {/* Hidden Access Trigger Area */}
                <div className="h-40 flex flex-col items-center justify-end relative mt-8">
                    {!showLogin ? (
                        <div className="w-full flex justify-center pb-4">
                            {/* Discrete trigger - Lock Icon */}
                            <button
                                onClick={() => setShowLogin(true)}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 group backdrop-blur-sm"
                                aria-label="Admin Access"
                            >
                                <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white p-6 rounded-[20px] shadow-2xl">
                                <h3 className="text-mono-100 font-primary text-2xl mb-4">Admin Access</h3>
                                <form className="relative flex flex-col gap-3" onSubmit={handleSubmit}>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            autoFocus
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-[12px] bg-gray-50 text-mono-100 placeholder-gray-400 focus:ring-2 focus:ring-secondary-100 focus:border-transparent text-lg font-secondary transition-all"
                                            placeholder="Enter Access Key"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowLogin(false)}
                                            className="flex-1 py-3 px-4 rounded-[12px] text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-[12px] text-mono-0 font-medium bg-secondary-100 hover:bg-secondary-100/90 focus:outline-none transition-colors shadow-md"
                                        >
                                            {loading ? 'Verifying...' : 'Unlock'}
                                        </button>
                                    </div>
                                </form>
                                {error && (
                                    <p className="text-center mt-3 text-sm text-error font-medium">{error}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full text-center z-[100]">
                <p className="text-sm text-white/60 font-secondary">
                    &copy; {new Date().getFullYear()} Brontie. All rights reserved.
                </p>
            </div>
        </div>
    );
}
