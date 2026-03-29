import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Teal Header */}
      <header className="bg-[#6ca3a4] py-6 px-12 flex justify-start">
        <Link href="/">
          <span className={`text-[#f4c24d] text-4xl ${lobster.className}`}>Brontie</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-[#fef6eb] flex items-center justify-center p-4">
        {/* Content Area */}
        <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
}
