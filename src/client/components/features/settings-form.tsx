
 'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
// Use client-side fetch to call server API routes instead of importing server-only admin services
import type { CompanySettings } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Firmenname ist erforderlich'),
  ownerName: z.string().min(1, 'Inhaber ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  phone: z.string().min(1, 'Telefon ist erforderlich'),
  email: z.string().email('Gültige E-Mail ist erforderlich'),
  website: z.string().url().or(z.literal('')),
  taxId: z.string().optional(),
  vatId: z.string().optional(),
  bankName: z.string().min(1, 'Bankname ist erforderlich'),
  iban: z.string().min(1, 'IBAN ist erforderlich'),
  bic: z.string().min(1, 'BIC ist erforderlich'),
  logoUrl: z.string().url().or(z.literal('')).optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function CompanySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
  const res = await fetch('/api/company-settings');
  const settings = await res.json();
        if (settings) {
          reset(settings);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        toast({ title: 'Fehler', description: 'Einstellungen konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
  await fetch('/api/company-settings', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
      toast({
        title: 'Gespeichert',
        description: 'Ihre Firmeneinstellungen wurden erfolgreich aktualisiert.',
        className: 'bg-accent text-accent-foreground',
      });
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({ title: 'Fehler', description: 'Einstellungen konnten nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
             <CardFooter>
                 <Skeleton className="h-10 w-24" />
             </CardFooter>
        </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten & Firmendaten</CardTitle>
          <CardDescription>
            Verwalten Sie hier die zentralen Daten Ihres Unternehmens. Diese Informationen werden automatisch auf Dokumenten wie Angeboten und Rechnungen verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input id="companyName" {...register('companyName')} />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Inhaber</Label>
              <Input id="ownerName" {...register('ownerName')} />
               {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Vollständige Adresse</Label>
            <Input id="address" {...register('address')} placeholder="Straße, PLZ, Ort" />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="website">Webseite</Label>
                <Input id="website" {...register('website')} placeholder="https://..." />
                {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="logoUrl">Firmenlogo URL</Label>
                <Input id="logoUrl" {...register('logoUrl')} placeholder="https://.../logo.png" />
                {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
            </div>
          </div>
           <hr />
            <h3 className="text-lg font-medium">Finanz- & Steuerdaten</h3>
           <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">Steuernummer</Label>
              <Input id="taxId" {...register('taxId')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatId">Umsatzsteuer-ID</Label>
              <Input id="vatId" {...register('vatId')} />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bankname</Label>
              <Input id="bankName" {...register('bankName')} />
               {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register('iban')} />
              {errors.iban && <p className="text-sm text-destructive">{errors.iban.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="bic">BIC</Label>
              <Input id="bic" {...register('bic')} />
              {errors.bic && <p className="text-sm text-destructive">{errors.bic.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Einstellungen speichern
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
