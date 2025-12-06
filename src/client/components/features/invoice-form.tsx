'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";

import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '../ui/table';
import { useToast } from "../../hooks/use-toast";
import type { Project, Invoice, Article, DocumentItem, ArticleGroup, MaterialConsumption } from "../../shared/types";
import { getProject, getProjects } from "../../services/projectService";
import { createInvoice, updateInvoice } from "../../services/invoiceService";
import { getArticles } from "../../services/articleService";
import { getArticleGroups } from "../../services/articleGroupService";
import { getUnbilledMaterialConsumption, updateMaterialBilledStatus } from '../../services/materialConsumptionService';
import { PlusCircle, Trash2 } from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const documentItemSchema = z.object({
    articleId: z.string(),
    description: z.string(),
    quantity: z.coerce.number(),
    unit: z.string(),
    unitPrice: z.coerce.number(),
});

const invoiceFormSchema = z.object({
    invoiceNumber: z.string().min(1, "Rechnungsnummer erforderlich."),
    projectId: z.string({
        required_error: "Bitte wählen Sie ein Projekt aus."
    }),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Gültiges Rechnungsdatum erforderlich."
    }),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Gültiges Fälligkeitsdatum erforderlich."
    }),
    status: z.enum(['offen', 'paid', 'overdue', 'sent'], {
        required_error: "Bitte wählen Sie einen Status aus."
    }),
    items: z.array(documentItemSchema).min(1, "Die Rechnung muss mindestens eine Position enthalten."),
}); type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
    invoice?: Invoice;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newItemArticleId, setNewItemArticleId] = useState<string>('');
    const [quickAddArticleNumber, setQuickAddArticleNumber] = useState('');
    const [customer, setCustomer] = useState<any>(null);
    const [articleSearchOpen, setArticleSearchOpen] = useState(false);
    const [articleSearchTerm, setArticleSearchTerm] = useState('');

    const isEditMode = !!invoice;
    const invoiceType = searchParams.get('type');
    const isDownPayment = invoiceType === 'abschlag';
    const customerId = searchParams.get('customerId');

    const toISODateString = (date?: string) => date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const getDefaultDueDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
    };

    const defaultValues: Partial<InvoiceFormValues> = {
        invoiceNumber: invoice?.invoiceNumber || "",
        projectId: invoice?.projectId || "",
        date: toISODateString(invoice?.date),
        dueDate: invoice?.dueDate ? toISODateString(invoice.dueDate) : getDefaultDueDate(),
        status: invoice?.status || "offen",
        items: invoice?.items || [],
    };

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues,
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const projectId = form.watch('projectId');

    useEffect(() => {
        async function fetchData() {
            try {
                const [projectsData, articlesData, articleGroupsData] = await Promise.all([
                    getProjects(),
                    getArticles(),
                    getArticleGroups()
                ]);
                setProjects(projectsData);
                setArticles(articlesData);
                setArticleGroups(articleGroupsData);

                // Load customer if customerId is provided
                if (customerId) {
                    const { getCustomer } = await import('@/services/customerService');
                    const customerData = await getCustomer(customerId);
                    if (customerData) {
                        setCustomer(customerData);
                    }
                }
            } catch (error) {
                toast({
                    title: "Fehler",
                    description: "Projektdaten oder Artikel konnten nicht geladen werden.",
                    variant: "destructive",
                });
            }
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalAmount = useMemo(() => {
        const items = form.watch('items');
        return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    }, [form.watch('items')]);

    const taxAmount = useMemo(() => {
        return totalAmount * 0.19; // 19% Steuer
    }, [totalAmount]);

    const totalGross = useMemo(() => {
        return totalAmount + taxAmount;
    }, [totalAmount, taxAmount]);

    const addArticle = useCallback((article: Article) => {
        if (article.type === 'group' && article.containsArticles) {
            article.containsArticles.forEach(contained => {
                const containedArticle = articles.find(a => a.id === contained.articleId);
                if (containedArticle) {
                    append({
                        articleId: containedArticle.id,
                        setName: article.name,
                        description: containedArticle.name,
                        longText: containedArticle.longText || containedArticle.description || '',
                        quantity: 0,
                        unit: containedArticle.unit,
                        unitPrice: containedArticle.grossSalesPrice ?? (containedArticle as any).price ?? 0,
                    });
                }
            });
            toast({ title: "Artikelgruppe hinzugefügt", description: `Die Artikel der Gruppe "${article.name}" wurden zur Rechnung hinzugefügt.` });
        } else {
            append({
                articleId: article.id,
                setName: '',
                description: article.name,
                longText: article.longText || article.description || '',
                quantity: 1,
                unit: article.unit,
                unitPrice: article.grossSalesPrice ?? (article as any).price ?? 0,
            });
            toast({ title: "Artikel hinzugefügt", description: `"${article.name}" wurde zur Rechnung hinzugefügt.` });
        }
    }, [append, articles, toast]);

    const addNewItem = useCallback(() => {
        if (!newItemArticleId) return;
        const article = articles.find(a => a.id === newItemArticleId);
        if (!article) return;
        addArticle(article);
        setNewItemArticleId('');
    }, [articles, newItemArticleId, addArticle]);

    const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const article = articles.find(a => a.articleNumber.toLowerCase() === quickAddArticleNumber.toLowerCase());
            if (article) {
                addArticle(article); // Uses the updated addArticle logic
                setQuickAddArticleNumber('');
            } else {
                toast({ title: "Fehler", description: "Artikel mit dieser Nummer nicht gefunden.", variant: "destructive" });
            }
        }
    };

    const handleLoadMaterials = async () => {
        if (!projectId) {
            toast({ title: "Fehler", description: "Bitte wählen Sie zuerst ein Projekt aus.", variant: "destructive" });
            return;
        }
        try {
            const materials = await getUnbilledMaterialConsumption(projectId);
            if (materials.length === 0) {
                toast({ title: "Kein Material", description: "Es gibt keinen unabgerechneten Materialverbrauch für dieses Projekt." });
                return;
            }

            const itemsToAdd = materials.map(material => {
                const article = articles.find(a => a.id === material.articleId);
                return {
                    articleId: material.articleId,
                    description: article ? `${article.name}\n${article.description || ''}`.trim() : material.notes,
                    quantity: material.quantity,
                    unit: article ? article.unit : 'Stk',
                    unitPrice: article ? article.price : 0,
                };
            });

            append(itemsToAdd);

            toast({ title: "Erfolg", description: `${materials.length} Materialpositionen wurden hinzugefügt.` });

        } catch (error) {
            console.error("Failed to load material consumption", error);
            toast({ title: "Fehler", description: "Materialverbrauch konnte nicht geladen werden.", variant: "destructive" });
        }
    };

    const handleLoadTimeEntries = async () => {
        if (!projectId) {
            toast({ title: "Fehler", description: "Bitte wählen Sie zuerst ein Projekt aus.", variant: "destructive" });
            return;
        }
        toast({ title: "Info", description: "Laden von Arbeitszeiten ist noch nicht implementiert." });
    };

    const groupedArticles = useMemo(() => {
        const sortedGroups = [...articleGroups].sort((a, b) => a.name.localeCompare(b.name));
        const groupNameToArticles: Record<string, Article[]> = {};

        sortedGroups.forEach(g => {
            groupNameToArticles[g.name] = [];
        });
        groupNameToArticles['Unkategorisiert'] = [];

        const sortedArticles = [...articles].sort((a, b) => a.name.localeCompare(b.name));

        sortedArticles.forEach(article => {
            const groupName = article.group || 'Unkategorisiert';
            if (!groupNameToArticles[groupName]) {
                groupNameToArticles[groupName] = [];
            }
            groupNameToArticles[groupName].push(article);
        });

        Object.keys(groupNameToArticles).forEach(key => {
            if (groupNameToArticles[key].length === 0) {
                delete groupNameToArticles[key];
            }
        });

        return groupNameToArticles;
    }, [articles, articleGroups]);

    const filteredArticles = useMemo(() => {
        if (!articleSearchTerm) return articles;
        const term = articleSearchTerm.toLowerCase();
        return articles.filter(a =>
            a.name.toLowerCase().includes(term) ||
            a.articleNumber.toLowerCase().includes(term) ||
            a.description?.toLowerCase().includes(term)
        );
    }, [articles, articleSearchTerm]);

    async function onSubmit(data: InvoiceFormValues) {
        setIsLoading(true);
        const invoiceData = {
            ...data,
            totalAmount: totalGross, // Save the GROSS amount (includes 19% tax)
            netAmount: totalAmount,  // Also save net for reference
            taxAmount: taxAmount,    // And tax amount
            isDownPayment: isDownPayment, // Add flag for down payment
            ...(customer && { customer: { id: customer.id, name: customer.name } }), // Add customer if available
        };

        try {
            let savedInvoiceId = invoice?.id;
            if (isEditMode && invoice) {
                await updateInvoice(invoice.id, invoiceData);
                savedInvoiceId = invoice.id;
            } else {
                const created = await createInvoice(invoiceData);
                savedInvoiceId = created.id;
            }

            // If status is "sent", send email with PDF
            if (data.status === 'sent' && savedInvoiceId) {
                try {
                    const emailResponse = await fetch('/api/invoices/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ invoiceId: savedInvoiceId })
                    });

                    if (emailResponse.ok) {
                        const result = await emailResponse.json();
                        toast({
                            title: "E-Mail versendet",
                            description: result.message || "Rechnung wurde per E-Mail versendet."
                        });
                    } else {
                        const error = await emailResponse.json();
                        console.warn('Email sending failed:', error);
                        toast({
                            title: "Warnung",
                            description: "Rechnung wurde gespeichert, aber E-Mail konnte nicht versendet werden.",
                            variant: "destructive"
                        });
                    }
                } catch (emailError) {
                    console.error("Email sending error:", emailError);
                    toast({
                        title: "Warnung",
                        description: "Rechnung wurde gespeichert, aber E-Mail konnte nicht versendet werden.",
                        variant: "destructive"
                    });
                }
            }

            if (data.status === 'sent' && data.projectId) {
                try {
                    await updateMaterialBilledStatus(data.projectId);
                    toast({ title: "Status aktualisiert", description: "Materialverbrauch wurde als abgerechnet markiert." });
                } catch (error) {
                    console.error("Failed to update billed status", error);
                    toast({ title: "Abrechnungsstatus Fehler", description: "Der Abrechnungsstatus für Material konnte nicht aktualisiert werden.", variant: "destructive" });
                }
            }

            toast({ title: "Erfolg", description: `Rechnung wurde erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}.` });
            router.push("/invoices");
            router.refresh();
        } catch (error) {
            console.error("Failed to save invoice", error);
            toast({
                title: "Fehler",
                description: "Die Rechnung konnte nicht gespeichert werden.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditMode ? 'Rechnung bearbeiten' : (isDownPayment ? 'Neue Abschlagsrechnung' : 'Neue Rechnung erstellen')}</CardTitle>
                <CardDescription>
                    {isEditMode ? `Details für Rechnung #${invoice?.invoiceNumber} ändern.` : 'Füllen Sie das Formular aus, um eine neue Rechnung anzulegen.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="invoiceNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rechnungsnummer</FormLabel>
                                    <FormControl><Input {...field} placeholder="z.B. RE202511-001" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Projekt</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Wählen Sie ein zugehöriges Projekt" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.projectName} ({project.projectNumber})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {projectId && (
                            <div className="flex space-x-2">
                                <Button type="button" onClick={handleLoadMaterials} disabled={!projectId || isLoading}>Materialverbrauch laden...</Button>
                                <Button type="button" onClick={handleLoadTimeEntries} disabled={!projectId || isLoading}>Arbeitszeit von Projekt laden...</Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rechnungsdatum</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dueDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fälligkeitsdatum</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Positionen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Beschreibung</TableHead>
                                            <TableHead className="w-24">Menge</TableHead>
                                            <TableHead className="w-24">Einheit</TableHead>
                                            <TableHead className="w-32 text-right">Einzelpreis</TableHead>
                                            <TableHead className="w-32 text-right">Gesamt</TableHead>
                                            <TableHead className="w-12"><span className="sr-only">Aktion</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Textarea {...form.register(`items.${index}.description`)} className="min-h-0 p-1 h-auto" rows={3} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" step="any" {...form.register(`items.${index}.quantity`)} />
                                                </TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell>
                                                    <Input type="number" step="any" {...form.register(`items.${index}.unitPrice`)} className="text-right" />
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0))}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={4}>Umsatzsteuer (19%)</TableCell>
                                            <TableCell className="text-right">{formatCurrency(taxAmount)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/70 font-bold hover:bg-muted/70">
                                            <TableCell colSpan={4}>Gesamtsumme Brutto</TableCell>
                                            <TableCell className="text-right text-lg">{formatCurrency(totalGross)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <h3 className="font-semibold mb-2">Artikel suchen & hinzufügen</h3>
                                        <div className="flex gap-2 w-full">
                                            <Input
                                                placeholder="Artikel Nr., Name oder Beschreibung eingeben..."
                                                value={articleSearchTerm}
                                                onChange={(e) => {
                                                    setArticleSearchTerm(e.target.value);
                                                    setArticleSearchOpen(true);
                                                }}
                                                onFocus={() => setArticleSearchOpen(true)}
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={addNewItem}
                                                size="sm"
                                                className="gap-1"
                                                type="button"
                                                disabled={!newItemArticleId}
                                            >
                                                <PlusCircle className="h-4 w-4" /> Hinzufügen
                                            </Button>
                                        </div>
                                        {articleSearchOpen && filteredArticles.length > 0 && (
                                            <div className="mt-2 border rounded-lg bg-background max-h-64 overflow-y-auto z-10">
                                                {filteredArticles.map(article => (
                                                    <button
                                                        key={article.id}
                                                        onClick={() => {
                                                            setNewItemArticleId(article.id);
                                                            setArticleSearchTerm('');
                                                            setArticleSearchOpen(false);
                                                            addArticle(article);
                                                        }}
                                                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0 flex justify-between"
                                                    >
                                                        <div>
                                                            <div className="font-medium">{article.articleNumber} - {article.name} {article.type === 'group' && '(Gruppe)'}</div>
                                                            <div className="text-xs text-muted-foreground">{article.description}</div>
                                                        </div>
                                                        <div className="text-right text-xs">
                                                            {formatCurrency(article.price)}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Schnelleingabe per Artikelnummer</h3>
                                        <Input
                                            placeholder="Artikelnummer eingeben..."
                                            value={quickAddArticleNumber}
                                            onChange={e => setQuickAddArticleNumber(e.target.value)}
                                            onKeyDown={handleQuickAdd}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Artikelnummer eingeben und mit Enter bestätigen.</p>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="offen">Offen</SelectItem>
                                        <SelectItem value="sent">Versendet</SelectItem>
                                        <SelectItem value="paid">Bezahlt</SelectItem>
                                        <SelectItem value="overdue">Überfällig</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (isEditMode ? 'Speichern...' : 'Erstellen...') : (isEditMode ? 'Änderungen speichern' : 'Rechnung erstellen')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
