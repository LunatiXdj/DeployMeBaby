
import { WebsiteLayout } from '@/client/components/website/layout';
import React from 'react';
import { type ReactNode } from 'react';

export default function PublicWebsiteLayout({ children }: { children: ReactNode }) {
    return (
        <WebsiteLayout>{children}</WebsiteLayout>
    );
}
