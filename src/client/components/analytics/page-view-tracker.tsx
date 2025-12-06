'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Component to track page views in Google Analytics
 * This automatically tracks every page change
 */
export function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, {
                page_path: pathname,
                page_title: document.title,
            });
        }
    }, [pathname]);

    return null;
}

// Extend the Window interface to include gtag
declare global {
    interface Window {
        gtag: any;
    }
}
