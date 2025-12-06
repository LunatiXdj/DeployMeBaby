
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { submitPortalRequest } from '@/client/services/portalService';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const portalSchema = z.object({
  salutation: z.enum(['Herr', 'Frau', 'Firma']),
  firstName: z.string().optional(), 
  lastName: z.string().min(1, 'Nachname oder Firmenname ist erforderlich'),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  zipCode: z.string().min(1, 'PLZ ist erforderlich'),
  city: z.string().min(1, 'Ort ist erforderlich'),
  phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
  mobilePhone: z.string().optional(),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  projectDescription: z.string().min(1, 'Projektbeschreibung ist erforderlich'),
  budget: z.string().optional(),
  executionDate: z.string().optional().refine((val) => !val || !isNaN(new Date(val).getTime()), {
    message: "Ungültiges Datumformat"
  }),
});

type PortalFormData = z.infer<typeof portalSchema>;

export default function PortalPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<PortalFormData>({
        resolver: zodResolver(portalSchema),
    });

    const onSubmit: SubmitHandler<PortalFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await submitPortalRequest(data);
            setIsSubmitted(true);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Fehler',
                description: 'Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder Kontaktieren Sie uns über 02857 - 959 0 816',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                 <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Vielen Dank!</CardTitle>
                        <CardDescription>
                            Ihre Anfrage wurde erfolgreich an PH-Service übermittelt. Wir werden uns in Kürze mit Ihnen in Verbindung setzen.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
            <Card className="w-full max-w-4xl">
                <div className="grid lg:grid-cols-2">
                    <div className="p-8 space-y-6">
                        <CardHeader className="p-0">
                            <CardTitle className="text-3xl">Kundenportal</CardTitle>
                            <CardDescription>
                                Senden Sie uns hier Ihre Projektanfrage. Wir werden uns schnellstmöglich bei Ihnen melden. 
                                Wir versuchen Ihr Vorhaben gemäß Ihrer Datumsvorgabe zu erfüllen. Wir bitten um Verständnis sollte dies aus Kapazitätsgründen nicht möglich sein.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kontaktdaten</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Select onValueChange={(value) => setValue('salutation', value as any)} defaultValue="">
                                        <SelectTrigger><SelectValue placeholder="Anrede *" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Herr">Herr</SelectItem>
                                            <SelectItem value="Frau">Frau</SelectItem>
                                            <SelectItem value="Firma">Firma</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.salutation && <p className="text-destructive text-xs">{errors.salutation.message}</p>}
                                    <Input {...register('firstName')} placeholder="Vorname" />
                                    <Input {...register('lastName')} placeholder="Nachname / Firma *" />
                                    {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
                                </div>
                                <Input {...register('address')} placeholder="Straße und Hausnummer *" />
                                 {errors.address && <p className="text-destructive text-xs">{errors.address.message}</p>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <Input {...register('zipCode')} placeholder="PLZ *" />
                                    {errors.zipCode && <p className="text-destructive text-xs">{errors.zipCode.message}</p>}
                                   <Input {...register('city')} placeholder="Ort *" />
                                    {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
                                </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <Input {...register('phone')} placeholder="Telefon *" />
                                    {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
                                   <Input {...register('mobilePhone')} placeholder="Mobil" />
                                </div>
                                <Input {...register('email')} placeholder="E-Mail-Adresse *" type="email"/>
                                 {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Projektdetails</Label>
                                <Textarea {...register('projectDescription')} placeholder="Was soll gemacht werden? *" rows={5}/>
                                 {errors.projectDescription && <p className="text-destructive text-xs">{errors.projectDescription.message}</p>}
                                <Input {...register('budget')} placeholder="Budget für die Umsetzung" />
                                <div>
                                   <Input {...register('executionDate')} placeholder="Geplanter Ausführungstermin" type="date"/>
                                   {errors.executionDate && <p className="text-destructive text-xs">{errors.executionDate.message}</p>}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Anfrage senden
                            </Button>
                        </form>
                    </div>
                     <div className="hidden lg:flex items-center justify-center bg-black p-8">
                         <Image
                          src="/logo.png"
                          alt="Firmenlogo"
                          width="300"
                          height="300"
                          className="object-contain"
                          unoptimized
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
