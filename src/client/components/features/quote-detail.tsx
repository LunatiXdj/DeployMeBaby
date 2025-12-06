'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Quote, DocumentItem, Project, Article, Customer } from '@/shared/types';
import { useToast } from "@/hooks/use-toast";
// Daten werden jetzt per fetch von den API-Routen geladen
import SignatureCanvas from 'react-signature-canvas';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    SelectSeparator,
    SelectGroup,
    SelectLabel
} from "../ui/select";
import { PlusCircle, Trash2, ArrowLeft, Save, Mail, BrainCircuit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ProjectForm } from './project-form';
import { saveQuote, uploadSignature } from '../../services/quoteService';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusOptions: { value: Quote['status'], label: string }[] = [
    { value: 'draft', label: 'Entwurf' },
    { value: 'sent', label: 'Gesendet' },
    { value: 'accepted', label: 'Angenommen' },
    { value: 'declined', label: 'Abgelehnt' },
    { value: 'invoiced', label: 'Fakturiert' },
]

const formatProjectLabel = (project: Project) => {
    const number = project.projectNumber?.trim();
    const name = project.projectName?.trim();
    if (number && name) return `${number} – ${name}`;
    if (number) return number;
    if (name) return name;
    return project.id;
};

export function QuoteDetail({ quoteId }: { quoteId: string }) {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const [newItemArticleId, setNewItemArticleId] = useState<string>('');
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [quickAddArticleNumber, setQuickAddArticleNumber] = useState('');
    const [descriptionSearch, setDescriptionSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
            const fetchData = async () => {
                try {
                    const [articlesRes, customersRes, projectsRes] = await Promise.all([
                        fetch('/api/articles'),
                        fetch('/api/customers'),
                        fetch('/api/projects')
                    ]);

                    // Check for HTTP errors before parsing JSON
                    if (!articlesRes.ok) {
                        console.error('Articles API error:', articlesRes.status, await articlesRes.text());
                        throw new Error(`Articles API returned ${articlesRes.status}`);
                    }
                    if (!customersRes.ok) {
                        console.error('Customers API error:', customersRes.status, await customersRes.text());
                        throw new Error(`Customers API returned ${customersRes.status}`);
                    }
                    if (!projectsRes.ok) {
                        console.error('Projects API error:', projectsRes.status, await projectsRes.text());
                        throw new Error(`Projects API returned ${projectsRes.status}`);
                    }

                    const fetchedArticles = await articlesRes.json();
                    const fetchedCustomers = await customersRes.json();
                    const fetchedProjects = await projectsRes.json();
                    setArticles(fetchedArticles as Article[]);
                    setCustomers(fetchedCustomers as Customer[]);
                    setProjects(fetchedProjects as Project[]);

                    if (quoteId && quoteId !== 'new') {
                        const quoteRes = await fetch(`/api/quotes/${quoteId}`);
                        if (!quoteRes.ok) {
                            console.error('Quote API error:', quoteRes.status, await quoteRes.text());
                            throw new Error(`Quote API returned ${quoteRes.status}`);
                        }
                        const quoteData = await quoteRes.json();
                        setQuote(quoteData);

                        const customer = fetchedCustomers.find((c: Customer) => c.id === quoteData.customerId);
                        if (customer) {
                            setSelectedCustomer(customer);
                        }
                        const project = fetchedProjects.find((p: Project) => p.id === quoteData.projectId);
                        if (project) {
                            setSelectedProject(project);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching quote detail data:', error);
                    // Optionally: Show error to user
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
    }, [quoteId]);

    useEffect(() => {
        if (quote?.customer && quote.customer.email) {
            setSelectedCustomer(prev => prev && prev.id === quote.customer?.id ? prev : quote.customer);
        } else if (quote?.project?.customerId) {
            const projectOwner = customers.find(c => c.id === quote.project?.customerId && c.email);
            if (projectOwner) {
                setSelectedCustomer(projectOwner);
            }
        }
    }, [quote, customers]);

    const handleProjectChange = (projectId: string) => {
        if (projectId === 'new-project') {
            setIsProjectFormOpen(true);
            return;
        }
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setSelectedProject(project);
            setQuote(prev => prev ? {
                ...prev,
                projectId: projectId,
                project: project,
            } : null);
        }
    };

    const handleFieldChange = (field: keyof Omit<Quote, 'customer' | 'project'>, value: any) => {
        setQuote(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleItemChange = (index: number, field: keyof DocumentItem, value: any) => {
        setQuote((prev: Quote | null) => {
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
    };

    const addArticle = (article: Article) => {
        if (article.type === 'group' && article.containsArticles?.length) {
            const newItems: DocumentItem[] = article.containsArticles.map(contained => {
                const containedArticle = articles.find(a => a.id === contained.articleId);
                return containedArticle ? {
                    articleId: containedArticle.id,
                    setName: article.name,
                    description: containedArticle.name,
                    longText: (containedArticle as any).longText || containedArticle.description || '',
                    quantity: 0,
                    unit: containedArticle.unit || 'Stk',
                    unitPrice: (containedArticle as any).grossSalesPrice ?? (containedArticle as any).price ?? 0,
                    groupId: (containedArticle as any).groupId || '',
                } : null;
            }).filter(Boolean) as DocumentItem[];
            if (newItems.length) {
                setQuote(prev => prev ? { ...prev, items: [...prev.items, ...newItems] } : null);
            }
            return;
        }

        const newItem: DocumentItem = {
            articleId: article.id,
            setName: '',
            description: article.name,
            longText: (article as any).longText || article.description || '',
            quantity: 1,
            unit: article.unit || 'Stk',
            unitPrice: (article as any).grossSalesPrice ?? (article as any).price ?? 0,
            groupId: (article as any).groupId || '',
        };
        setQuote((prev: Quote | null) => prev ? { ...prev, items: [...prev.items, newItem] } : null);
    };

    const addNewItem = () => {
        if (!newItemArticleId) return;
        const article = articles.find(a => a.id === newItemArticleId);
        if (!article) return;
        addArticle(article);
        setNewItemArticleId('');
    };

    const handleEmail = () => {
        const customer = selectedCustomer || quote?.customer;
        if (!customer || !customer.email) {
            toast({ title: "E-Mail nicht möglich", description: "Bitte wählen Sie einen Kunden mit E-Mail aus.", variant: "destructive" });
            return;
        }

        const subject = `Angebot ${quote?.quoteNumber ?? ''}`;
        const salutation = customer.salutation === 'Firma' ? 'Damen und Herren' : `${customer.salutation} ${customer.name}`;
        const body = `Sehr geehrte/r ${salutation},%0D%0A%0D%0Aanbei erhalten Sie unser Angebot.%0D%0A%0D%0A(Bitte fügen Sie hier die generierte PDF-Datei als Anhang hinzu.)%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A[Ihre Firma]`;
        window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleProjectSaved = (project: Project) => {
        setProjects(prev => {
            const exists = prev.some(p => p.id === project.id);
            if (exists) {
                return prev.map(p => p.id === project.id ? project : p);
            }
            return [...prev, project];
        });
        setSelectedProject(project);
        setQuote(prev => prev ? { ...prev, projectId: project.id, project } : prev);
        setIsProjectFormOpen(false);
        toast({ title: "Projekt erstellt", description: "Das Projekt wurde gespeichert und verknüpft." });
    };

    const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const article = articles.find(a => a.articleNumber === quickAddArticleNumber);
            if (article) {
                addArticle(article);
                setQuickAddArticleNumber('');
            } else {
                toast({ title: "Fehler", description: "Artikel mit dieser Nummer nicht gefunden.", variant: "destructive" });
            }
        }
    };

    const filteredArticlesByDescription = useMemo(() => {
        if (!descriptionSearch) return [];
        return articles.filter(a => a.name.toLowerCase().includes(descriptionSearch.toLowerCase()));
    }, [descriptionSearch, articles]);

    const removeItem = (index: number) => {
        setQuote(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : null);
    };

    const calculateTotal = () => {
        return quote?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    };

    const totalAmount = useMemo(calculateTotal, [quote?.items]);

    const groupedArticles = useMemo(() => {
        // Fallback: projects ist immer ein Array
        const validProjects = Array.isArray(projects) ? projects.filter(p => p && typeof p.name === 'string') : [];
        const sortedGroups = validProjects.sort((a, b) => a.name.localeCompare(b.name));
        const groupNameToArticles: Record<string, Article[]> = {};

        sortedGroups.forEach(g => {
            groupNameToArticles[g.name] = [];
        });
        groupNameToArticles['Unkategorisiert'] = [];

        const sortedArticles = Array.isArray(articles)
            ? articles.filter(a => a && typeof a.name === 'string').sort((a, b) => a.name.localeCompare(b.name))
            : [];

        sortedArticles.forEach(article => {
            const groupName = article.group || 'Unkategorisiert';
            if (groupNameToArticles[groupName]) {
                groupNameToArticles[groupName].push(article);
            } else {
                if (!groupNameToArticles[groupName]) {
                    groupNameToArticles[groupName] = [];
                }
                groupNameToArticles[groupName].push(article);
            }
        });

        Object.keys(groupNameToArticles).forEach(key => {
            if (groupNameToArticles[key].length === 0) {
                delete groupNameToArticles[key];
            }
        });

        return groupNameToArticles;
    }, [articles, projects]);

    const handleSave = async () => {
        if (!selectedCustomer) {
            toast({ title: "Fehler", description: "Bitte wählen Sie einen Kunden aus.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const currentItems = quote?.items ?? [];
            const quoteData: Quote = {
                ...quote!,
                totalAmount: calculateTotal(),
                customer: selectedCustomer,
                items: currentItems,
                projectId: selectedProject?.id || null,
            };
            const savedQuote = await saveQuote(quoteData);
            setQuote(savedQuote);
            if (quoteId === 'new') {
                router.push(`/quotes/${savedQuote.id}`);
            }
            toast({ title: "Gespeichert", description: "Das Angebot wurde erfolgreich gespeichert." });
        } catch (error) {
            console.error("Failed to save quote", error);
            toast({ title: "Fehler beim Speichern", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSign = async (signature: string) => {
        if (!quote?.id) return;
        setIsSaving(true);
        try {
            const signatureUrl = await uploadSignature(quote.id, signature);
            setQuote((prev: Quote | null) => prev ? { ...prev, status: 'signed', signatureUrl } : prev);
            toast({ title: "Unterschrieben", description: "Das Angebot wurde erfolgreich unterschrieben." });
        } catch (error) {
            console.error("Error signing quote:", error);
            toast({ title: "Fehler", description: "Die Unterschrift konnte nicht gespeichert werden.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignatureSave = async () => {
        if (!sigCanvas.current) {
            toast({ title: "Signatur fehlt", description: "Bitte unterschreiben Sie zuerst.", variant: "destructive" });
            return;
        }
        const signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        if (!signature) {
            toast({ title: "Signatur fehlt", description: "Bitte unterschreiben Sie zuerst.", variant: "destructive" });
            return;
        }
        await handleSign(signature);
        setIsSignatureModalOpen(false);
        sigCanvas.current?.clear();
    };

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
        );
    }

    if (!quote) {
        return (
            <Card>
                <CardHeader><CardTitle>Angebot nicht gefunden</CardTitle></CardHeader>
                <CardContent>
                    <p>Das angeforderte Angebot konnte nicht gefunden werden.</p>
                    <Button asChild variant="link" className='p-0 h-auto'><Link href="/quotes">Zurück zur Übersicht</Link></Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" className="shrink-0">
                        <Link href="/quotes"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        Angebot {quote.quoteNumber}
                    </h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        {quote.status !== 'accepted' && (
                            <Button variant="default" size="sm" onClick={() => setIsSignatureModalOpen(true)}>
                                In Auftrag umwandeln
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="mr-2 h-4 w-4" /> Als E-Mail senden</Button>
                        <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Speichern</Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Angebotsdetails</CardTitle>
                        <CardDescription>Passen Sie die Details des Angebots an und fügen Sie Positionen hinzu.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="quoteNumber">Angebots-Nr.</Label>
                            <Input id="quoteNumber" value={quote.quoteNumber} onChange={e => handleFieldChange('quoteNumber', e.target.value)} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="date">Datum</Label>
                            <Input id="date" type="date" value={quote.date} onChange={e => handleFieldChange('date', e.target.value)} />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="project">Projekt</Label>
                            <Select value={quote.projectId} onValueChange={handleProjectChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Projekt auswählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {formatProjectLabel(project)}
                                        </SelectItem>
                                    ))}
                                    <SelectSeparator />
                                    <SelectItem value="new-project">
                                        <span className='flex items-center gap-2'><PlusCircle className="h-4 w-4" /> Neues Projekt erstellen...</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="status">Status</Label>
                            <Select value={quote.status} onValueChange={(value) => handleFieldChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status auswählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 grid gap-3">
                            <Label>Kunde</Label>
                            <p className="text-sm text-muted-foreground">{quote.customer?.name || 'N/A'}</p>
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
                                {quote.items.map((item: DocumentItem, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input value={(item as any).setName || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'setName' as keyof DocumentItem, e.target.value)} placeholder="Set / Gruppe" />
                                        </TableCell>
                                        <TableCell>
                                            <Textarea value={item.description || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleItemChange(index, 'description', e.target.value)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Kurzbeschreibung" />
                                        </TableCell>
                                        <TableCell>
                                            <Textarea value={(item as any).longText || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleItemChange(index, 'longText' as keyof DocumentItem, e.target.value)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Langtext / Details" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', e.target.value)} />
                                        </TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.unitPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'unitPrice', e.target.value)} className="text-right" />
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                    <TableCell colSpan={4}>Gesamtsumme Netto</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div>
                                <Label className="font-semibold">Smarte Artikelsuche</Label>
                                <Textarea
                                    placeholder="Geben Sie eine Beschreibung ein, um Artikel zu finden..."
                                    value={descriptionSearch}
                                    onChange={e => setDescriptionSearch(e.target.value)}
                                    className="mt-2"
                                />
                                {filteredArticlesByDescription.length > 0 && (
                                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                                        {filteredArticlesByDescription.map(article => (
                                            <div
                                                key={article.id}
                                                className="p-2 hover:bg-muted cursor-pointer"
                                                onClick={() => { addArticle(article); setDescriptionSearch(''); }}
                                            >
                                                <p className="font-semibold">{article.name}</p>
                                                <p className="text-sm text-muted-foreground">{formatCurrency(article.price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="font-semibold">Schnelleingabe per Artikelnummer</Label>
                                <Input
                                    placeholder="Artikelnummer eingeben..."
                                    value={quickAddArticleNumber}
                                    onChange={e => setQuickAddArticleNumber(e.target.value)}
                                    onKeyDown={handleQuickAdd}
                                    className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Artikelnummer eingeben und mit Enter bestätigen.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full pt-4 border-t">
                            <Select value={newItemArticleId} onValueChange={setNewItemArticleId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Artikel aus Gruppe auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(groupedArticles).map(([groupName, articlesInGroup]) => (
                                        <SelectGroup key={groupName}>
                                            <SelectLabel>{groupName}</SelectLabel>
                                            {articlesInGroup.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={addNewItem} size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" /> Hinzufügen
                            </Button>
                            <Button onClick={() => toast({ title: "In Entwicklung", description: "Der KI-Assistent wird in Kürze verfügbar sein." })} size="sm" variant="outline" className="gap-1">
                                <BrainCircuit className="h-4 w-4" /> KI-Vorschläge
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
                <div className="flex items-center justify-end gap-2 md:hidden">
                    <Button variant="outline" size="sm" onClick={() => router.push('/quotes')}>
                        Abbrechen
                    </Button>
                    <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Speichern</Button>
                </div>
            </div>
            <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Neues Projekt erstellen</DialogTitle>
                        <DialogDescription>
                            Erstellen Sie ein neues Projekt. Der zugehörige Kunde wird automatisch verknüpft.
                        </DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                        project={null}
                        customers={customers}
                        onSave={handleProjectSaved}
                        onCancel={() => setIsProjectFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Auftrag bestätigen und unterschreiben</DialogTitle>
                        <DialogDescription>
                            Der Kunde kann hier unterschreiben, um das Angebot zu bestätigen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="border bg-background rounded-md">
                            <SignatureCanvas
                                ref={sigCanvas}
                                penColor="black"
                                canvasProps={{ className: 'w-full h-[200px]' }}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => sigCanvas.current?.clear()}>
                                Löschen
                            </Button>
                            <Button onClick={handleSignatureSave}>
                                Unterschrift speichern
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
