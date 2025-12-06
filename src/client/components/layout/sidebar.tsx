
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Users,
  Package,
  FolderKanban,
  FileText,
  FileBadge,
  HardHat,
  PieChart,
  Wrench,
  Calendar,
  User as EmployeeIcon,
  Send,
  ScrollText,
  FileSignature,
  ShoppingCart,
  LayoutDashboard,
  Globe,
  UserCog,
  DollarSign,
  Palette,
  Truck
} from 'lucide-react';
import { cn } from '@/client/lib/utils';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/client/components/ui/accordion"
import React from 'react';
import { useAuth } from '@/client/contexts/auth-context';

interface NavContentProps {
  onLinkClick?: () => void;
}

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/customers', icon: Users, label: 'Kunden' },
  { href: '/articles', icon: Package, label: 'Artikel' },
  { href: '/suppliers', icon: Truck, label: 'Lieferanten' },
  { href: '/tools', icon: Wrench, label: 'Werkzeuge' },
  { href: '/employees', icon: EmployeeIcon, label: 'Mitarbeiter' },
  { href: '/users', icon: UserCog, label: 'Benutzer', adminOnly: true },
  { href: '/orders', icon: ShoppingCart, label: 'Materialbestellungen', adminOnly: true },
  { href: '/finance', icon: DollarSign, label: 'Finanzen' },
  { href: '/letter', icon: FileSignature, label: 'Brief-Assistent' },
  { href: '/sitelogs', icon: HardHat, label: 'Baustellendoku' },
  { href: '/pnl', icon: PieChart, label: 'GuV' },
];

export function NavContent({ onLinkClick }: NavContentProps) {
  const pathname = usePathname();
  const { authUser } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const getActiveAccordion = () => {
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/quotes')) return 'quotes';
    if (pathname.startsWith('/invoices')) return 'invoices';
    if (pathname.startsWith('/settings')) return 'settings';
    return undefined;
  }

  const handleLinkClick = (href: string) => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <>
      <div className="flex h-14 items-center border-b border-gray-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <Image src="/logo.png" alt="Logo" width={32} height={32} unoptimized loading="eager" />
          <span className="font-bold">PH-Service</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-4 text-sm font-medium">
          {mainNavItems.map((item) => {
            if (item.adminOnly && authUser?.role !== 'admin') {
              return null;
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => handleLinkClick(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': isLinkActive(item.href) }
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          <Accordion type="single" collapsible defaultValue={getActiveAccordion()} className="w-full">
            <AccordionItem value="projects" className="border-b-0">
              <AccordionTrigger className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:hover:no-underline [&[data-state=open]>svg]:rotate-180',
                { 'bg-gray-700 text-white': isLinkActive('/projects') }
              )}>
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-4 w-4" />
                  <span>Projekte</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-0 pt-1">
                <Link href="/projects" onClick={() => handleLinkClick('/projects')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/projects' }
                )}>
                  Projektübersicht
                </Link>
                <Link href="/projects/calendar" onClick={() => handleLinkClick('/projects/calendar')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/projects/calendar' }
                )}>
                  <Calendar className="h-4 w-4" /> Kalender
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quotes" className="border-b-0">
              <AccordionTrigger className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800 hover:no-underline [&[data-state=open]>svg]:rotate-180',
                { 'bg-gray-700 text-white': isLinkActive('/quotes') }
              )}>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span>Angebote</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-0 pt-1">
                <Link href="/quotes" onClick={() => handleLinkClick('/quotes')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/quotes' }
                )}>
                  <ScrollText className="h-4 w-4" /> Angebotsübersicht
                </Link>
                <Link href="/quotes/sent" onClick={() => handleLinkClick('/quotes/sent')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/quotes/sent' }
                )}>
                  <Send className="h-4 w-4" /> Offene Angebote
                </Link>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="invoices" className="border-b-0">
              <AccordionTrigger className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800 hover:no-underline [&[data-state=open]>svg]:rotate-180',
                { 'bg-gray-700 text-white': isLinkActive('/invoices') }
              )}>
                <div className="flex items-center gap-3">
                  <FileBadge className="h-4 w-4" />
                  <span>Rechnungen</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-0 pt-1">
                <Link href="/invoices" onClick={() => handleLinkClick('/invoices')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/invoices' }
                )}>
                  <ScrollText className="h-4 w-4" /> Rechnungsübersicht
                </Link>
                <Link href="/invoices/sent" onClick={() => handleLinkClick('/invoices/sent')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/invoices/sent' }
                )}>
                  <Send className="h-4 w-4" /> Offene Rechnungen
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-gray-800">
        <Link
          href="/"
          onClick={() => handleLinkClick('/')}
          className='flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800'
        >
          <Globe className="h-4 w-4" />
          <span>Zur Webseite</span>
        </Link>

        <Accordion type="single" collapsible defaultValue={getActiveAccordion()} className="w-full">
            <AccordionItem value="settings" className="border-b-0">
              <AccordionTrigger className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800 hover:no-underline [&[data-state=open]>svg]:rotate-180',
                { 'bg-gray-700 text-white': isLinkActive('/settings') }
              )}>
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Einstellungen</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-0 pt-1">
                <Link href="/settings/company" onClick={() => handleLinkClick('/settings/company')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/settings/company' }
                )}>
                  Firma
                </Link>
                <Link href="/settings/articlegroups" onClick={() => handleLinkClick('/settings/articlegroups')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/settings/articlegroups' }
                )}>
                  Warengruppen
                </Link>
                 <Link href="/settings/references" onClick={() => handleLinkClick('/settings/references')} className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  { 'bg-gray-700 text-white': pathname === '/settings/references' }
                )}>
                  Referenzen
                </Link>
              </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden bg-black text-white sm:flex sm:flex-col sm:border-r">
      <NavContent />
    </aside>
  );
}
