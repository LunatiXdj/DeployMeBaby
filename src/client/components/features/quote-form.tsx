'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import type { Project, Quote, Article, DocumentItem, ArticleGroup } from "@/types";
import { getProjects } from "@/services/projectService";
import { createQuote, updateQuote } from "@/services/quoteService";
import { getArticles } from "@/services/articleService";
import { getArticleGroups } from "@/services/articleGroupService";
import { PlusCircle, Trash2 } from "lucide-react";

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const documentItemSchema = z.object({
    articleId: z.string(),
    setName: z.string().optional().default(''),
    description: z.string().optional().default(''),
    longText: z.string().optional().default(''),
    quantity: z.coerce.number().nonnegative(),
    unit: z.string(),
    unitPrice: z.coerce.number().nonnegative(),
});

const quoteFormSchema = z.object({
    projectId: z.string({
        required_error: "Bitte wählen Sie ein Projekt aus."
    }),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Gültiges Angebotsdatum erforderlich."
    }),
    status: z.enum(["draft", "sent", "accepted", "declined", "invoiced"], {
        required_error: "Bitte wählen Sie einen Status aus."
    }),
    items: z.array(documentItemSchema).min(1, "Das Angebot muss mindestens eine Position enthalten."),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
    quote?: Quote;
}

export function QuoteForm({ quote }: QuoteFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newItemArticleId, setNewItemArticleId] = useState<string>('');
    const [quickAddArticleNumber, setQuickAddArticleNumber] = useState('');

    const isEditMode = !!quote;

    const toISODateString = (date?: string) => date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const defaultValues: Partial<QuoteFormValues> = {
        projectId: quote?.projectId || "",
        date: toISODateString(quote?.date),
        status: quote?.status || "draft",
        items: quote?.items || [],
    };

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteFormSchema),
        defaultValues,
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

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
                        quantity: 0, // Quantity is 0 for grouped articles
                        unit: containedArticle.unit,
                        unitPrice: containedArticle.grossSalesPrice ?? (containedArticle as any).price ?? 0,
                    });
                }
            });
            toast({ title: "Artikelgruppe hinzugefügt", description: `Die Artikel der Gruppe "${article.name}" wurden zum Angebot hinzugefügt.` });
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
            toast({ title: "Artikel hinzugefügt", description: `"${article.name}" wurde zum Angebot hinzugefügt.` });
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
            const article = articles.find(a => a.articleNumber === quickAddArticleNumber);
            if (article) {
                addArticle(article);
                setQuickAddArticleNumber('');
            } else {
                toast({ title: "Fehler", description: "Artikel mit dieser Nummer nicht gefunden.", variant: "destructive" });
            }
        }
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

    async function onSubmit(data: QuoteFormValues) {
        setIsLoading(true);
        const quoteData = {
            ...data,
            totalAmount: totalGross, // Save the GROSS amount (includes 19% tax)
            netAmount: totalAmount,  // Also save net for reference
            taxAmount: taxAmount,    // And tax amount
        };

        try {
            if (isEditMode && quote) {
                await updateQuote(quote.id, quoteData);
                toast({ title: "Erfolg", description: "Angebot wurde erfolgreich aktualisiert." });
            } else {
                await createQuote(quoteData);
                toast({ title: "Erfolg", description: "Neues Angebot wurde erfolgreich erstellt." });
            }
            router.push("/quotes");
            router.refresh();
        } catch (error) {
            console.error("Failed to save quote", error);
            toast({
                title: "Fehler",
                description: "Das Angebot konnte nicht gespeichert werden.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditMode ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}</CardTitle>
                <CardDescription>
                    {isEditMode ? `Details für Angebot #${quote?.quoteNumber} ändern.` : 'Füllen Sie das Formular aus, um ein neues Angebot anzulegen.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Angebotsdatum</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

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
                                        {fields.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Input {...form.register(`items.${index}.setName`)} placeholder="Set / Gruppe" />
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea {...form.register(`items.${index}.description`)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Kurzbeschreibung" />
                                                </TableCell>
                                                <TableCell>
                                                    <Textarea {...form.register(`items.${index}.longText`)} className="min-h-0 p-1 h-auto" rows={3} placeholder="Langtext / Details" />
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
                                            <TableCell colSpan={6}>Gesamtsumme Netto</TableCell>
                                            <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={6}>Umsatzsteuer (19%)</TableCell>
                                            <TableCell className="text-right">{formatCurrency(taxAmount)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/70 font-bold hover:bg-muted/70">
                                            <TableCell colSpan={6}>Gesamtsumme Brutto</TableCell>
                                            <TableCell className="text-right text-lg">{formatCurrency(totalGross)}</TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <h3 className="font-semibold mb-2">Per Dropdown hinzufügen</h3>
                                        <div className="flex gap-2 w-full">
                                            <Select value={newItemArticleId} onValueChange={setNewItemArticleId}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Artikel auswählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(groupedArticles).map(([groupName, articlesInGroup]) => (
                                                        <SelectGroup key={groupName}>
                                                            <SelectLabel>{groupName}</SelectLabel>
                                                            {articlesInGroup.map(a => <SelectItem key={a.id} value={a.id}>{a.articleNumber} - {a.name} {a.type === 'group' && '(Gruppe)'}</SelectItem>)}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={addNewItem} size="sm" className="gap-1" type="button">
                                                <PlusCircle className="h-4 w-4" /> Hinzufügen
                                            </Button>
                                        </div>
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
                                        <SelectItem value="draft">Entwurf</SelectItem>
                                        <SelectItem value="sent">Gesendet</SelectItem>
                                        <SelectItem value="accepted">Akzeptiert</SelectItem>
                                        <SelectItem value="declined">Abgelehnt</SelectItem>
                                        <SelectItem value="invoiced">In Rechnung gestellt</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (isEditMode ? 'Speichern...' : 'Erstellen...') : (isEditMode ? 'Änderungen speichern' : 'Angebot erstellen')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
