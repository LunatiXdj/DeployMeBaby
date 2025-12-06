'use client';

import Script from 'next/script';

export default function GoogleAnalytics() {
    const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

    if (!measurementId) {
        console.warn('Google Analytics Measurement ID not configured');
        return null;
    }

    return (
        <>
            {/* Google Analytics Script */}
            <Script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="afterInteractive"
            />

            {/* Initialize gtag */}
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
                }}
            />
        </>
    );
}
