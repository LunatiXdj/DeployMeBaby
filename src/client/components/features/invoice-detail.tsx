
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '../ui/table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { ArrowLeft, Save, Printer, Mail, FileDown, PlusCircle, Trash2 } from 'lucide-react';
import type { Invoice, Project, Customer, DocumentItem, Article } from '../../shared/types';
import { useToast } from "../../hooks/use-toast";
import { getInvoice, saveInvoice } from '../../services/invoiceService';
import { getProjects } from '../../services/projectService';
import { getCustomers } from '../../services/customerService';
import { useAuth } from '../../contexts/auth-context';
import { getArticles } from '../../services/articleService';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusOptions: { value: Invoice['status'], label: string }[] = [
    { value: 'offen', label: 'Offen' },
    { value: 'paid', label: 'Bezahlt' },
    { value: 'overdue', label: 'Überfällig' },
]

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { loading: authLoading } = useAuth();
    const router = useRouter();

    const [newItemArticleId, setNewItemArticleId] = useState<string>('');


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [invoiceData, projectsData, customersData, articlesData] = await Promise.all([
                getInvoice(invoiceId),
                getProjects(),
                getCustomers(),
                getArticles(),
            ]);
            setInvoice(invoiceData);
            setProjects(projectsData);
            setCustomers(customersData);
            setArticles(articlesData);
        } catch (error) {
            console.error("Failed to fetch invoice data", error);
            toast({ title: "Fehler beim Laden der Daten", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [invoiceId, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [fetchData, authLoading]);

    const { customer, project } = useMemo(() => {
        if (!invoice || !invoice.projectId) return { customer: null, project: null };
        const foundProject = projects.find(p => p.id === invoice.projectId);
        if (!foundProject) return { customer: null, project: null };
        const foundCustomer = customers.find(c => c.id === foundProject.customerId);
        return {
            customer: foundCustomer || null,
            project: foundProject || null,
        }
    }, [invoice, projects, customers]);

    const handleFieldChange = useCallback((field: keyof Omit<Invoice, 'customer' | 'project'>, value: any) => {
        setInvoice((prev: Invoice | null) => prev ? { ...prev, [field]: value } : null);
    }, []);

    const handleItemChange = useCallback((index: number, field: keyof DocumentItem, value: any) => {
        setInvoice((prev: Invoice | null) => {
            if (!prev) return null;
            const newItems = [...prev.items];
            const item = { ...newItems[index] };

            if (field === 'quantity' || field === 'unitPrice') {
                (item[field] as number) = parseFloat(value) || 0;
            } else {
                (item[field] as any) = value;
            }

            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    }, []);

    const addNewItem = useCallback(() => {
        if (!newItemArticleId) return;
        const article = articles.find(a => a.id === newItemArticleId);
        if (!article) return;

        const newItem: DocumentItem = {
            articleId: article.id,
            setName: '',
            description: article.name,
            longText: (article as any).longText || article.description || '',
            quantity: 1,
            unit: article.unit,
            unitPrice: (article as any).grossSalesPrice ?? (article as any).price ?? 0,
            source: 'manual'
        };
        setInvoice((prev: Invoice | null) => prev ? { ...prev, items: [...prev.items, newItem] } : null);
        setNewItemArticleId('');
    }, [articles, newItemArticleId]);

    const addLongTextItem = useCallback(() => {
        const newItem: DocumentItem = {
            articleId: 'long-text',
            description: 'Hier Langtext einfügen...',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 0,
            source: 'manual'
        };
        setInvoice((prev: Invoice | null) => prev ? { ...prev, items: [...prev.items, newItem] } : null);
    }, []);

    const removeItem = useCallback((index: number) => {
        setInvoice((prev: Invoice | null) => prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : null);
    }, []);

    const totalAmount = useMemo(() => {
        return invoice?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    }, [invoice?.items]);


    const handleSave = useCallback(async () => {
        if (!invoice) return;
        try {
            const { customer, project, ...invoiceToSave } = invoice;
            await saveInvoice({ ...invoiceToSave, totalAmount: totalAmount });
            toast({ title: "Rechnung gespeichert", description: "Die Änderungen wurden erfolgreich übernommen.", className: "bg-accent text-accent-foreground" });
            router.push('/invoices');
        } catch (error) {
            console.error("Failed to save invoice", error);
            toast({ title: "Fehler beim Speichern", variant: "destructive" });
        }
    }, [invoice, totalAmount, toast, router]);

    const generatePdf = useCallback(async (options: { openInNewTab?: boolean, triggerPrint?: boolean } = {}) => {
        toast({ title: "Funktion nicht verfügbar", description: "Die PDF-Generierung wird derzeit überarbeitet.", variant: "destructive" });
    }, [toast]);

    const handleEmail = useCallback(() => {
        if (!customer || !customer.email || !invoice) {
            toast({ title: "E-Mail nicht möglich", description: "Kunde hat keine E-Mail oder Rechnungsdaten fehlen.", variant: "destructive" });
            return;
        }
        const subject = `Rechnung ${invoice.invoiceNumber}`;
        const body = `Sehr geehrte/r ${customer.salutation === 'Firma' ? 'Damen und Herren' : `${customer.salutation} ${customer.name}`},%0D%0A%0D%0Aanbei erhalten Sie Ihre Rechnung.%0D%0A%0D%0A(Bitte fügen Sie hier die generierte PDF-Datei als Anhang hinzu.)%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A[Ihr Name]`;
        window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, [customer, invoice, toast]);

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
        );
    }

    if (!invoice) {
        return (
            <Card>
                <CardHeader><CardTitle>Rechnung nicht gefunden</CardTitle></CardHeader>
                <CardContent>
                    <p>Die angeforderte Rechnung konnte nicht gefunden werden.</p>
                    <Button asChild variant="link" className='p-0 h-auto'><Link href="/invoices">Zurück zur Übersicht</Link></Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="shrink-0">
                    <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Rechnung {invoice.invoiceNumber}
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" onClick={() => generatePdf()}><FileDown className="mr-2 h-4 w-4" /> PDF generieren</Button>
                    <Button variant="outline" size="sm" onClick={() => generatePdf({ triggerPrint: true })}><Printer className="mr-2 h-4 w-4" /> Drucken</Button>
                    <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="mr-2 h-4 w-4" /> Als E-Mail senden</Button>
                    <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Speichern</Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Rechnungsdetails</CardTitle>
                    <CardDescription>Verwalten Sie den Status und die Details der Rechnung.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="invoiceNumber">Rechnungs-Nr.</Label>
                        <Input id="invoiceNumber" value={invoice.invoiceNumber} onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="date">Rechnungsdatum</Label>
                        <Input id="date" type="date" value={invoice.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                        <Input id="dueDate" type="date" value={invoice.dueDate} onChange={(e) => handleFieldChange('dueDate', e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="status">Status</Label>
                        <Select value={invoice.status} onValueChange={(value: Invoice['status']) => handleFieldChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-3">
                        <Label>Projekt</Label>
                        <p className="text-sm text-muted-foreground">{project?.projectNumber} - {project?.projectName}</p>
                    </div>
                    <div className="grid gap-3">
                        <Label>Kunde</Label>
                        <p className="text-sm text-muted-foreground">{customer?.name}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Positionen</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Set</TableHead>
                                <TableHead>Beschreibung</TableHead>
                                <TableHead>Langtext</TableHead>
                                <TableHead className="w-24">Menge</TableHead>
                                <TableHead className="w-24">Einheit</TableHead>
                                <TableHead className="w-32 text-right">Einzelpreis</TableHead>
                                <TableHead className="w-32 text-right">Gesamt</TableHead>
                                <TableHead className="w-12"><span className="sr-only">Aktion</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                let lastSet = '__INIT__';
                                return invoice.items.map((item: DocumentItem, index: number) => {
                                    const currentSet = (item.setName || '').trim();
                                    const showSetHeader = currentSet !== lastSet;
                                    lastSet = currentSet;
                                    return (
                                        <React.Fragment key={index}>
                                            {showSetHeader && (
                                                <TableRow className="bg-muted/50">
                                                    <TableCell colSpan={8} className="font-semibold">
                                                        {currentSet ? `Set: ${currentSet}` : 'Positionen ohne Set'}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow>
                                                <TableCell>
                                                    <Input value={item.setName || ''} onChange={e => handleItemChange(index, 'setName' as keyof DocumentItem, e.target.value)} placeholder="Set / Gruppe" />
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Kurzbeschreibung" />
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea value={item.longText || ''} onChange={e => handleItemChange(index, 'longText' as keyof DocumentItem, e.target.value)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Langtext / Details" />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="text-right" />
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted/50 font-bold hover:bg-muted/50 text-base">
                                <TableCell colSpan={6}>Gesamtsumme Netto</TableCell>
                                <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                    <h3 className="font-semibold">Neue Position hinzufügen</h3>
                    <div className="flex gap-2 w-full">
                        <Select value={newItemArticleId} onValueChange={setNewItemArticleId}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Artikel auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {articles.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={addNewItem} size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" /> Artikel Hinzufügen
                        </Button>
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button onClick={addLongTextItem} size="sm" variant="outline" className="gap-1">
                            <PlusCircle className="h-4 w-4" /> Langtext Hinzufügen
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <div className="flex items-center justify-end gap-2 md:hidden">
                <Button variant="outline" size="sm" onClick={() => router.push('/invoices')}>
                    Abbrechen
                </Button>
                <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Speichern</Button>
            </div>
        </div>
    );
}
