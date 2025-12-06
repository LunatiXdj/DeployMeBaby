
import { type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/client/components/ui/button';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/client/components/ui/sheet';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../layout/theme-toggle';

const navItems = [
    { href: '/', label: 'Home' },
    { href: '/leistungen', label: 'Leistungen' },
    { href: '/referenzen', label: 'Referenzen' },
    { href: '/kontakt', label: 'Kontakt' },
];

const secondaryNavItem = { href: '/lunatix/live', label: 'LunatiX LIVE' };

export function WebsiteLayout({ children, showLoginButton = true }: { children: ReactNode, showLoginButton?: boolean }) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 hidden md:flex">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <Image src="/logo.png" alt="PH-Service Logo" width={28} height={28} unoptimized loading="eager" />
                            <span className="font-bold sm:inline-block">PH-Service</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            {navItems.map(item => (
                                <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground/80 text-foreground/60" >{item.label}</Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle Menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left">
                                    <SheetHeader>
                                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    </SheetHeader>
                                    <Link href="/" className="flex items-center">
                                        <Image src="/logo.png" alt="PH-Service Logo" width={28} height={28} className="mr-2" />
                                        <span className="font-bold">PH-Service</span>
                                    </Link>
                                    <div className="grid gap-4 py-6">
                                        {navItems.map(item => (
                                            <Link key={item.href} href={item.href} className="flex w-full items-center py-2 text-lg font-semibold">{item.label}</Link>
                                        ))}
                                        <Link href={secondaryNavItem.href} className="flex w-full items-center py-2 text-lg font-semibold">{secondaryNavItem.label}</Link>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <nav className="flex items-center gap-2">
                            <Link href={secondaryNavItem.href} className="transition-colors hover:text-foreground/80 text-foreground/60 text-sm font-medium hidden md:block" >{secondaryNavItem.label}</Link>
                            <ThemeToggle />
                        </nav>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="py-6 md:px-8 md:py-0 border-t">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © {new Date().getFullYear()} PH-Service. Alle Rechte vorbehalten.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/impressum" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Impressum</Link>
                        <Link href="/datenschutz" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Datenschutz</Link>
                        {showLoginButton && (
                            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Mitarbeiter-Login</Link>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
