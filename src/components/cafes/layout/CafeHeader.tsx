'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lobster } from 'next/font/google';
import { useRouter } from 'next/navigation';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface CafeHeaderProps {
  cafeName?: string;
  ownerName?: string;
  cafeLogo?: string;
}

export default function CafeHeader({ cafeName = 'Cafe Name', ownerName = '', cafeLogo }: CafeHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials for avatar (based on cafe name usually)
  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(cafeName);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/cafe-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/cafes/login');
      } else {
        router.push('/cafes/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/cafes/login');
    }
  };

  return (
    <header className="h-[64px] bg-[#6ca3a4] fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 shrink-0 shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/cafes/dashboard" className="relative w-[120px] h-[32px] block">
          <Image src="/images/logo-main.svg" alt="Brontie" fill className="object-contain object-left" />
        </Link>
        <div className={`hidden md:block text-white text-2xl tracking-wide ${lobster.className}`}>
          {cafeName}
        </div>
      </div>
      
      <div className="flex items-center relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-10 h-10 rounded-full bg-[#f4c24d] flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden relative border border-[#f4c24d]"
        >
          {cafeLogo ? (
            <Image src={cafeLogo} alt={cafeName} fill className="object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-[120%] right-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link 
              href="/cafes/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Profile / Settings
            </Link>
            <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-red-600 transition-colors"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
