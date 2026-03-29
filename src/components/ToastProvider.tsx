// components/ToastProvider.tsx
'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <>
      <Toaster
        position="top-right"
        containerClassName="!top-4 !right-4 !bottom-auto"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              background: '#065f46',
              color: 'white',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* <style jsx global>{`
        [data-theme="react-hot-toast"] {
          top: 16px !important;
          right: 16px !important;
          bottom: auto !important;
          left: auto !important;
        }
      `}</style> */}
    </>
  );
}