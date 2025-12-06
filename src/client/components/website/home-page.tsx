
"use client";
import Link from 'next/link';
import { Button } from '@/client/components/ui/button';
import { Card, CardContent } from '@/client/components/ui/card';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/client/components/ui/sheet';



const services = [
    {
        icon: <span className="material-symbols-outlined h-8 w-8 text-primary">plumbing</span>,
        title: "Sanitärinstallation",
        description: "Moderne Bäder, Feininstallation, Versiegelungstechnik, Fugenwartung und Systemumbauten (z.B. Wanne zu Dusche)."
    },
    {
        icon: <span className="material-symbols-outlined h-8 w-8 text-primary">handyman</span>,
        title: "Montageservice",
        description: "Ob Duschkabine, Tv-Halterung, Schränke oder nur ein Handtuch-Halter; Wir montieren nahezu alles zu fairen Pauschalkonditionen. Nutzen Sie das unverbindliche Anfrageportal um eine auf Sie zugeschnittene Lösung zu erhalten!"
    },
    {
        icon: <span className="material-symbols-outlined h-8 w-8 text-primary">air</span>,
        title: "Klima & Lüftung",
        description: "Optimale Raumtemperierung und frische Luft für Ihr Zuhause oder Büro."
    }
]

const navItems = [
    { href: '/', label: 'Home' },
    { href: '/leistungen', label: 'Leistungen' },
    { href: '/referenzen', label: 'Referenzen' },
    { href: '/kontakt', label: 'Kontakt' },
    { href: '/portal', label: 'Anfrageportal' },
];

export function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="PH-Service Logo" width={40} height={40} className="h-10 w-10 object-contain" />
                    <span className="font-bold text-xl">PH-Service</span>
                </Link>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Menü öffnen</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <nav className="flex flex-col gap-4 mt-8">
                            {navItems.map((item) => (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className="text-lg font-medium hover:text-primary transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background text-foreground">
            <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                Objektbetreuung & Facilitymanagement für Gewerbe und Privat
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                PH-Service steht für Qualität, Zuverlässigkeit und innovative Haustechnik. Wir bringen Komfort und Effizienz in Ihr Zuhause.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row">
                            <Button asChild size="lg">
                                <Link href="/portal">
                                    Jetzt anfragen
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                               <Link href="/leistungen">
                                  Unsere Leistungen
                               </Link>
                            </Button>
                        </div>
                    </div>
                     <Image
                      src="/logo.png"
                      alt="Hero"
                      width="500"
                      height="500"
                      className="mx-auto aspect-square overflow-hidden rounded-xl object-contain sm:w-full h-auto lg:order-last"
                    />
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background text-foreground">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                         <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-muted-foreground">Unsere Leistungen</div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Kompetenz in allen Bereichen</h2>
                         <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Von der detaillierten Planung über die fachgerechte Installation bis zur regelmäßigen Wartung – wir sind Ihr verlässlicher Partner.
                         </p>
                    </div>
                 </div>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
                    {services.map((service, index) => (
                         <div key={index} className="grid gap-1 text-center">
                            <div className="flex justify-center items-center mb-4">
                               {service.icon}
                            </div>
                            <h3 className="text-lg font-bold">{service.title}</h3>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                         </div>
                    ))}
                 </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background text-foreground">
             <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                        Bereit für Ihr nächstes Projekt?
                    </h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Lassen Sie uns gemeinsam die beste Lösung für Ihre Anforderungen finden. Kontaktieren Sie uns für eine unverbindliche Beratung.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button asChild size="lg" className="w-full">
                        <Link href="/portal">
                            Kontakt aufnehmen
                        </Link>
                    </Button>
                </div>
             </div>
        </section>
    </>
  );
}
