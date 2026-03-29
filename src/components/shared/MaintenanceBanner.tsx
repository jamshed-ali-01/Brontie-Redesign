'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

export default function MaintenanceBanner({ maintenanceMode }: { maintenanceMode: boolean }) {
    const [visible, setVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // 1. Maintenance mode is ON
        // 2. We are NOT on the maintenance page itself
        // 3. We are NOT on the login page
        if (maintenanceMode && pathname !== '/maintenance' && !pathname.includes('/login')) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [maintenanceMode, pathname]);

    if (!visible) return null;

    return (
        <div className="bg-amber-600 text-white px-4 py-3 text-center text-sm font-medium shadow-lg fixed bottom-0 left-0 right-0 z-[20102] animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                    <strong>MAINTENANCE MODE ACTIVE</strong> — You are viewing the site via Admin Bypass. All actions use the <strong>LOCAL/TEST</strong> database.
                </span>
            </div>
        </div>
    );
}
