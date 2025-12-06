'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
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
} from '../ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '../ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import type { Article, Supplier } from '../../shared/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getArticles, saveArticle, deleteArticle } from '../../services/articleService';
import { getArticleGroups, ArticleGroup } from '../../services/articleGroupService';
import { getSuppliers } from '../../services/supplierService'; // Import supplier service
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { ArticleDetailDialog } from './ArticleDetailDialog'; // Import the new detail dialog
import ArticleForm, { ArticleFormPayload } from './ArticleForm';

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

type SortKey = keyof Article;

const statusMapping: Record<Article['status'], { label: string; className: string }> = {
    Aktiv: { label: 'Aktiv', className: 'bg-green-100 text-green-800 border-green-200'},
    Inaktiv: { label: 'Inaktiv', className: 'bg-red-100 text-red-800 border-red-200'},
}

export function ArticleManagement() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]); // State for suppliers
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false); // State for detail dialog
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [selectedArticleForDetail, setSelectedArticleForDetail] = useState<Article | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isPending, startTransition] = useTransition();
    const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [articlesFromDb, groups, suppliersFromDb] = await Promise.all([
                    getArticles(),
                    getArticleGroups(),
                    getSuppliers()
                ]);
                
                const uniqueGroups = Array.from(new Set(groups.map(g => g.name)))
                    .map(name => groups.find(g => g.name === name)!);
                
                setArticles(articlesFromDb);
                setArticleGroups(uniqueGroups);
                setSuppliers(suppliersFromDb);

            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({
                    title: "Fehler beim Laden",
                    description: "Die Artikel-, Gruppen- oder Lieferantendaten konnten nicht geladen werden.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [getArticles, toast]);

    const handleEdit = (article: Article) => {
        setSelectedArticle(article);
        setIsFormDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedArticle(null);
        setIsFormDialogOpen(true);
    };

    const handleRowClick = (article: Article) => {
        const supplier = suppliers.find(s => s.id === article.supplierId) || null;
        setSelectedArticleForDetail(article);
        setSelectedSupplier(supplier);
        setIsDetailDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteArticle(id);
            setArticles(articles.filter(a => a.id !== id));
            toast({
                title: "Artikel gelöscht",
                description: "Der Artikel wurde erfolgreich entfernt.",
            });
        } catch (error) {
            console.error("Failed to delete article", error);
            toast({
                title: "Fehler beim Löschen",
                description: "Der Artikel konnte nicht gelöscht werden.",
                variant: "destructive",
            })
        }
    }

    const handleSave = async (articleData: Omit<Article, 'id' | 'createdAt'> & { id?: string }) => {
        try {
            const savedArticle = await saveArticle(articleData.id || null, articleData);
            const updatedArticles = await getArticles();
            setArticles(updatedArticles);

            toast({
                title: articleData.id ? "Artikel aktualisiert" : "Artikel erstellt",
                className: articleData.id ? "" : "bg-accent text-accent-foreground",
            });
        } catch (error) {
            console.error("Failed to save article", error);
            toast({
                title: "Fehler beim Speichern",
                description: "Der Artikel konnte nicht gespeichert werden.",
                variant: "destructive"
            });
        }

        setIsFormDialogOpen(false);
        setSelectedArticle(null);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }

    const filteredAndSortedArticles = useMemo(() => {
        return articles
            .map(article => {
                const bhr = article.grossSalesPrice - article.grossPurchasePrice;
                const bhrPercentage = article.grossSalesPrice > 0 ? (bhr / article.grossSalesPrice) * 100 : 0;
                return {
                    ...article,
                    bhr,
                    bhrPercentage,
                    status: article.status || 'Aktiv'
                };
            })
            .filter(article => {
                const term = searchTerm.toLowerCase();
                const matchesSearch = term === '' ||
                    article.name.toLowerCase().includes(term) ||
                    (article.articleNumber || '').toLowerCase().includes(term);

                const matchesGroup = groupFilter === 'all' || article.group === groupFilter;

                return matchesSearch && matchesGroup;
            })
            .sort((a, b) => {
                const valA = a[sortKey] || '';
                const valB = b[sortKey] || '';

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }

                if (String(valA) < String(valB)) return sortDirection === 'asc' ? -1 : 1;
                if (String(valA) > String(valB)) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [articles, searchTerm, groupFilter, sortKey, sortDirection]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Artikelstamm</CardTitle>
                            <CardDescription>
                                Verwalten Sie Ihre Artikel und Materialien.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAddNew} size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Neuer Artikel
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Suche nach Name oder Artikel-Nr..."
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                            />
                        </div>
                        <Select value={groupFilter} onValueChange={setGroupFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Warengruppe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Gruppen</SelectItem>
                                {articleGroups.map(group => (
                                    <SelectItem key={group.id} value={group.name}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-2 px-3 cursor-pointer" onClick={() => handleSort('articleNumber')}>
                                        Artikel-Nr. <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="py-2 px-3 cursor-pointer" onClick={() => handleSort('name')}>
                                        Name <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="py-2 px-3 cursor-pointer" onClick={() => handleSort('group')}>
                                        Warengruppe <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="text-right py-2 px-3 cursor-pointer" onClick={() => handleSort('grossPurchasePrice')}>
                                        EK-Preis <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="text-right py-2 px-3 cursor-pointer" onClick={() => handleSort('grossSalesPrice')}>
                                        VK-Preis <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="text-right py-2 px-3 cursor-pointer" onClick={() => handleSort('bhr')}>
                                        BHR € <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="text-right py-2 px-3 cursor-pointer" onClick={() => handleSort('bhrPercentage')}>
                                        BHR % <ArrowUpDown className="ml-2 h-3 w-3 inline" />
                                    </TableHead>
                                    <TableHead className="py-2 px-3">Status</TableHead>
                                    <TableHead className="py-2 px-3 text-center">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell className="py-2 px-3"><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="text-right py-2 px-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-right py-2 px-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-right py-2 px-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-right py-2 px-3"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell className="py-2 px-3"><Skeleton className="h-8 w-24" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAndSortedArticles.length > 0 ? (
                                    filteredAndSortedArticles.map((article) => (
                                        <TableRow key={article.id} className="hover:bg-muted">
                                            <TableCell className="font-mono py-2 px-3" onClick={() => handleRowClick(article)}>{article.articleNumber}</TableCell>
                                            <TableCell className={cn("font-medium py-2 px-3", { "text-blue-600": article.type === 'group' })} onClick={() => handleRowClick(article)}>{article.name}</TableCell>
                                            <TableCell className="py-2 px-3" onClick={() => handleRowClick(article)}>{article.group}</TableCell>
                                            <TableCell className="text-right py-2 px-3" onClick={() => handleRowClick(article)}>{formatCurrency(article.grossPurchasePrice)}</TableCell>
                                            <TableCell className="text-right py-2 px-3" onClick={() => handleRowClick(article)}>{formatCurrency(article.grossSalesPrice)}</TableCell>
                                            <TableCell className="text-right py-2 px-3" onClick={() => handleRowClick(article)}>{formatCurrency(article.bhr)}</TableCell>
                                            <TableCell className="text-right py-2 px-3" onClick={() => handleRowClick(article)}>{article.bhrPercentage?.toFixed(2)}%</TableCell>
                                            <TableCell className="py-2 px-3" onClick={() => handleRowClick(article)}>{article.status}</TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}><Pencil className="h-4 w-4" /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Artikel dauerhaft gelöscht.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(article.id)}>Löschen</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <ArticleActions article={article} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24">
                                            Keine Artikel gefunden, die den Kriterien entsprechen.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <ArticleFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                article={selectedArticle}
                onSave={handleSave}
            />
            <ArticleDetailDialog 
                isOpen={isDetailDialogOpen}
                onClose={() => setIsDetailDialogOpen(false)}
                article={selectedArticleForDetail}
                supplier={selectedSupplier}
                onEdit={() => {
                    setSelectedArticle(selectedArticleForDetail);
                    setIsFormDialogOpen(true);
                }}
            />
        </>
    );
}

function ArticleActions({ article }: { article: Article }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menü umschalten</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {/* Future actions can be added here */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface ArticleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    article: Article | null;
    onSave: (data: Omit<Article, 'id' | 'createdAt'> & { id?: string }) => void;
}

function ArticleFormDialog({ open, onOpenChange, article, onSave }: ArticleFormDialogProps) {
    const [isSaving, setIsSaving] = useState(false);

    const dialogInitialData = article ? {
        articleNumber: article.articleNumber,
        group: article.group,
        name: article.name,
        description: article.description,
        grossPurchasePrice: article.grossPurchasePrice,
        grossSalesPrice: article.grossSalesPrice,
        unit: article.unit,
        status: article.status,
    } : undefined;

    const handleArticleFormSave = async (data: ArticleFormPayload) => {
        setIsSaving(true);
        try {
            await onSave({
                ...data,
                id: article?.id,
                type: article?.type || 'article',
                createdAt: article?.createdAt,
            });
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDialogCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{article ? 'Artikel bearbeiten' : 'Neuen Artikel anlegen'}</DialogTitle>
                    <DialogDescription>
                        Füllen Sie die Details unten aus. Klicken Sie auf Speichern, wenn Sie fertig sind.
                    </DialogDescription>
                </DialogHeader>
                <ArticleForm onSave={handleArticleFormSave} loading={isSaving} initialData={dialogInitialData} />
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={handleDialogCancel}>Abbrechen</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}