
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from '@/hooks/use-toast';
import { CompanySettings } from '@/shared/types';
import { getCompanySettings } from '@/client/services/settingsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

export default function KontaktPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCompanySettings().then(data => {
            setSettings(data);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            toast({ title: "Nachricht gesendet", description: "Vielen Dank für Ihre Anfrage. Wir werden uns in Kürze bei Ihnen melden." });
            (e.target as HTMLFormElement).reset();
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        toast({ title: "Fehler", description: "Nachricht konnte nicht gesendet werden.", variant: "destructive" });
    }
  };

  return (
    <div className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Kontaktieren Sie uns</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              Haben Sie Fragen oder möchten ein Projekt besprechen? Füllen Sie das Formular aus oder rufen Sie uns an. Wir freuen uns darauf, von Ihnen zu hören.
            </p>
            <div className="space-y-2">
              {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-56" />
                  </>
              ) : settings ? (
                  <>
                    <h3 className="font-semibold">{settings.companyName}</h3>
                    <p className="text-muted-foreground">{settings.address}</p>
                    <p className="text-muted-foreground">Telefon: {settings.phone}</p>
                    <p className="text-muted-foreground">E-Mail: {settings.email}</p>
                  </>
              ) : <p className="text-destructive">Unternehmensdaten konnten nicht geladen werden.</p>}
            </div>
          </div>
          <div className="space-y-4">
              <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" name="firstName" placeholder="Max" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" name="lastName" placeholder="Mustermann" required/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Ihre Nachricht</Label>
                <Textarea id="message" name="message" placeholder="Ihre Nachricht an uns" className="min-h-[100px]" required/>
              </div>
              <Button type="submit" className="w-full">Nachricht senden</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
