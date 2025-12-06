
'use client';

import { useState, useEffect } from 'react';
import { getCustomerDetails, type CustomerDetails, addContactLogEntry } from '@/services/customerService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { HardHat, MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '@/contexts/auth-context';
import type { ContactLogEntry } from '@/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE').format(date);
};
const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

export function CustomerDetailView({ customerId }: { customerId: string }) {
    const [details, setDetails] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const customerDetails = await getCustomerDetails(customerId);
            setDetails(customerDetails);
        } catch (error) {
            console.error("Failed to fetch customer details", error);
            toast({ title: 'Fehler', description: 'Kundendetails konnten nicht geladen werden.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchDetails();
        }
    }, [customerId, toast]);

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!details) {
        return <p>Kunde nicht gefunden.</p>;
    }

    const { customer, projects, quotes, invoices, timeEntries } = details;
    const mapSrc = mapsApiKey 
        ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent(customer.address)}`
        : '';

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-6 border-b">
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>{customer.address}</CardDescription>
            </div>
            <Tabs defaultValue="overview" className="flex-grow flex flex-col overflow-hidden">
                <TabsList className="mx-6 mt-4 shrink-0">
                    <TabsTrigger value="overview">Übersicht</TabsTrigger>
                    <TabsTrigger value="contacts">Kontakte ({customer.contactLog?.length || 0})</TabsTrigger>
                    <TabsTrigger value="projects">Projekte ({projects.length})</TabsTrigger>
                    <TabsTrigger value="documents">Dokumente ({quotes.length + invoices.length})</TabsTrigger>
                    <TabsTrigger value="deployments">Einsätze ({timeEntries.length})</TabsTrigger>
                </TabsList>
                <div className="flex-grow overflow-y-auto">
                    <TabsContent value="overview" className="m-0 p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                             <div>
                                <h3 className="font-semibold mb-2">Stammdaten</h3>
                                <div className="text-sm space-y-1">
                                    <p><strong>Ansprechpartner:</strong> {customer.contactPerson || customer.name}</p>
                                    <p><strong>Telefon:</strong> {customer.phone}</p>
                                    <p><strong>Mobil:</strong> {customer.mobilePhone}</p>
                                    <p><strong>E-Mail:</strong> <a href={`mailto:${customer.email}`} className="text-primary hover:underline">{customer.email}</a></p>
                                    {customer.website && <p><strong>Webseite:</strong> <a href={customer.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{customer.website}</a></p>}
                                </div>
                                <h3 className="font-semibold mt-4 mb-2">Notizen</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes || 'Keine Notizen vorhanden.'}</p>
                            </div>
                            <div>
                                {mapsApiKey ? (
                                     <iframe
                                        width="100%"
                                        height="350"
                                        style={{ border: 0 }}
                                        src={mapSrc}
                                        allowFullScreen
                                        className="rounded-lg"
                                        title="Google Maps Location"
                                    ></iframe>
                                ) : (
                                    <div className="h-[350px] bg-muted rounded-lg flex items-center justify-center text-center text-muted-foreground p-4">
                                        Google Maps-Anzeige nicht verfügbar. <br/> API-Schlüssel nicht konfiguriert.
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="contacts" className="m-0 p-6">
                        <ContactLog customerId={customer.id} log={customer.contactLog || []} onLogAdded={fetchDetails} />
                    </TabsContent>
                    <TabsContent value="projects" className="m-0 p-6">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Projekt-Nr.</TableHead>
                                    <TableHead>Projektname</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aktion</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono">{p.projectNumber}</TableCell>
                                        <TableCell>{p.projectName}</TableCell>
                                        <TableCell>{p.status}</TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="outline" size="sm" asChild>
                                                <Link href={`/sitelogs?projectId=${p.id}`} target="_blank"><HardHat className="mr-2 h-4 w-4"/>Doku</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </TabsContent>
                    <TabsContent value="documents" className="m-0 p-6 grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Angebote</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Nr.</TableHead><TableHead>Datum</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Betrag</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {quotes.map(q => (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-mono"><Link className="text-primary hover:underline" href={`/quotes/${q.id}`} target="_blank">{q.quoteNumber}</Link></TableCell>
                                            <TableCell>{formatDate(q.date)}</TableCell>
                                            <TableCell>{q.status}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(q.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Rechnungen</h3>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/invoices/new?customerId=${customerId}&type=abschlag`}>Neuer Abschlagsrechnung</Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href={`/invoices/new?customerId=${customerId}`}>Neue Rechnung</Link>
                                    </Button>
                                </div>
                            </div>
                             <Table>
                                <TableHeader><TableRow><TableHead>Nr.</TableHead><TableHead>Datum</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Betrag</TableHead></TableRow></TableHeader>
                                <TableBody>
                                     {invoices.map(i => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-mono"><Link className="text-primary hover:underline" href={`/invoices/${i.id}`} target="_blank">{i.invoiceNumber}</Link></TableCell>
                                            <TableCell>{formatDate(i.date)}</TableCell>
                                            <TableCell>{i.status}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(i.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                    <TabsContent value="deployments" className="m-0 p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mitarbeiter</TableHead>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Projekt</TableHead>
                                    <TableHead className="text-right">Stunden</TableHead>
                                    <TableHead className="text-right">Personalkosten</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timeEntries.map((entry, index) => (
                                    <TableRow key={entry.id || index}>
                                        <TableCell>{entry.employeeName}</TableCell>
                                        <TableCell>{formatDate(entry.date)}</TableCell>
                                        <TableCell>{entry.projectName}</TableCell>
                                        <TableCell className="text-right">{entry.totalTime.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(entry.cost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function ContactLog({ customerId, log, onLogAdded }: { customerId: string, log: ContactLogEntry[], onLogAdded: () => void }) {
    const { authUser } = useAuth();
    const { toast } = useToast();
    const [type, setType] = useState<'Telefonat' | 'E-Mail' | 'Besuch' | 'Sonstiges'>('Telefonat');
    const [notes, setNotes] = useState('');

    const sortedLog = [...log].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) {
            toast({ title: 'Notiz erforderlich', description: 'Bitte geben Sie eine Notiz für den Kontakt ein.', variant: 'destructive'});
            return;
        }

        const newEntry: Omit<ContactLogEntry, 'id'> = {
            date: new Date().toISOString(),
            type,
            notes,
            userName: authUser?.email || 'System'
        };

        try {
            await addContactLogEntry(customerId, newEntry);
            toast({ title: 'Kontakt protokolliert', className: 'bg-accent text-accent-foreground'});
            setNotes('');
            onLogAdded();
        } catch(error) {
            toast({ title: 'Fehler', description: 'Kontakt konnte nicht gespeichert werden.', variant: 'destructive'});
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Neuen Kontakt protokollieren</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                             <div>
                                <Label htmlFor="contact-type">Kontaktart</Label>
                                <Select value={type} onValueChange={(v) => setType(v as any)}>
                                    <SelectTrigger id="contact-type"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Telefonat">Telefonat</SelectItem>
                                        <SelectItem value="E-Mail">E-Mail</SelectItem>
                                        <SelectItem value="Besuch">Besuch</SelectItem>
                                        <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="contact-notes">Notizen</Label>
                                <Textarea id="contact-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Worüber wurde gesprochen?" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit"><PlusCircle className="mr-2 h-4 w-4"/> Eintrag hinzufügen</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="space-y-4">
                <h3 className="font-semibold">Kontakthistorie</h3>
                {sortedLog.length === 0 ? <p className="text-muted-foreground">Keine Einträge vorhanden.</p> : (
                    sortedLog.map(entry => (
                        <div key={entry.id} className="flex items-start gap-4">
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                           </div>
                           <div className="flex-grow">
                                <p className="font-medium">{entry.type} <span className="text-sm text-muted-foreground font-normal">- {formatDateTime(entry.date)}</span></p>
                                <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Von: {entry.userName}</p>
                           </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
