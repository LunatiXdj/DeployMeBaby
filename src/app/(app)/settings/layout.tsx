'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNavItems = [
  { href: '/settings/company', label: 'Firma' },
  { href: '/settings/articlegroups', label: 'Warengruppen' },
  { href: '/settings/references', label: 'Referenzen' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <aside>
        <nav className="flex flex-col gap-1">
          {settingsNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary',
                { 'bg-muted font-semibold text-primary': pathname.startsWith(item.href) }
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        {children}
      </main>
    </div>
  );
}
