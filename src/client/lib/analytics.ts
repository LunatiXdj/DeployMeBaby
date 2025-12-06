'use client';

/**
 * Google Analytics Event Tracking Helper
 * Use this to track custom events throughout your application
 */

export const trackEvent = (
    eventName: string,
    eventData?: Record<string, any>
) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventData);
    }
};

/**
 * Common event tracking examples:
 * 
 * // Track user login
 * trackEvent('login', { method: 'email' });
 * 
 * // Track form submission
 * trackEvent('generate_lead', { value: 9.99, currency: 'EUR' });
 * 
 * // Track conversion/purchase
 * trackEvent('purchase', { 
 *   value: 99.99, 
 *   currency: 'EUR',
 *   items: [{ name: 'Product', quantity: 1, price: 99.99 }]
 * });
 * 
 * // Track custom action
 * trackEvent('custom_action', { action_type: 'button_click', location: 'header' });
 */

/**
 * Usage in components:
 * 
 * import { trackEvent } from '@/client/lib/analytics';
 * 
 * export function MyComponent() {
 *   return (
 *     <button onClick={() => trackEvent('my_custom_event', { data: 'value' })}>
 *       Click me
 *     </button>
 *   );
 * }
 */
