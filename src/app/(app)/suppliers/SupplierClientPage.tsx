
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, Article } from '@/shared/types';
import { getSuppliers, saveSupplier, deleteSupplier } from '@/client/services/supplierService';
import { getArticles } from '@/client/services/articleService';
import { Button } from '@/client/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/client/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/client/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/client/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/client/components/ui/alert-dialog';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { useToast } from '@/client/hooks/use-toast';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/client/components/ui/skeleton';

const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') {
        return 'N/A';
    }
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

const SupplierClientPage = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [suppliersData, articlesData] = await Promise.all([getSuppliers(), getArticles()]);
            setSuppliers(suppliersData);
            setArticles(articlesData);
        } catch (error) {
            toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const articlesBySupplier = useMemo(() => {
        return suppliers.reduce((acc, supplier) => {
            acc[supplier.id] = articles.filter(article => article.supplierId === supplier.id);
            return acc;
        }, {} as Record<string, Article[]>);
    }, [suppliers, articles]);

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setIsFormDialogOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!supplierToDelete) return;
        try {
            await deleteSupplier(supplierToDelete.id);
            setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
            toast({ title: 'Erfolg', description: 'Lieferant wurde gelöscht.' });
        } catch (error) {
            toast({ title: 'Fehler', description: 'Lieferant konnte nicht gelöscht werden.', variant: 'destructive' });
        } finally {
            setIsDeleteDialogOpen(false);
            setSupplierToDelete(null);
        }
    };

    const handleSave = async (supplierData: Omit<Supplier, 'id'>) => {
        try {
            const saved = await saveSupplier(supplierData, selectedSupplier?.id);
            if (selectedSupplier) {
                setSuppliers(suppliers.map(s => s.id === saved.id ? saved : s));
            } else {
                setSuppliers([...suppliers, saved]);
            }
            toast({ title: 'Erfolg', description: 'Lieferant wurde gespeichert.' });
            setIsFormDialogOpen(false);
        } catch (error) {
            toast({ title: 'Fehler', description: 'Lieferant konnte nicht gespeichert werden.', variant: 'destructive' });
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Lieferanten</CardTitle>
                            <CardDescription>Verwalten Sie Ihre Lieferanten und deren Artikel.</CardDescription>
                        </div>
                        <Button onClick={handleAddNew} size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Neuer Lieferant
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {suppliers.map(supplier => (
                                <AccordionItem value={supplier.id} key={supplier.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <span className="font-medium">{supplier.name}</span>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}><Pencil className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(supplier)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ArticleTable articles={articlesBySupplier[supplier.id] || []} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            <SupplierFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                supplier={selectedSupplier}
                onSave={handleSave}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Der Lieferant wird dauerhaft gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

interface ArticleTableProps {
    articles: Article[];
}

const ArticleTable: React.FC<ArticleTableProps> = ({ articles }) => {
    if (articles.length === 0) {
        return <p className="text-center text-sm text-gray-500 py-4">Keine Artikel für diesen Lieferanten gefunden.</p>;
    }

    return (
        <Table>
                        <TableHeader>
                <TableRow>
                    <TableHead>Artikelnr.</TableHead>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Einheit</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {articles.map((article) => (
                    <TableRow>
                        <TableCell>{article.id}</TableCell>
                        <TableCell>{article.name}</TableCell>
                        <TableCell>{article.unit}</TableCell>
                        <TableCell>{article.price}</TableCell>
                        <TableCell className="text-right">{article.quantity}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

interface SupplierFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
    onSave: (data: Omit<Supplier, 'id'>) => void;
}

const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({ open, onOpenChange, supplier, onSave }) => {
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({ name: '', contactPerson: '', address: '', phone: '', email: '', website: '' });

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        } else {
            setFormData({ name: '', contactPerson: '', address: '', phone: '', email: '', website: '' });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{supplier ? 'Lieferant bearbeiten' : 'Neuen Lieferant anlegen'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactPerson" className="text-right">Ansprechpartner</Label>
                            <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Adresse</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telefon</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">E-Mail</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="website" className="text-right">Webseite</Label>
                            <Input id="website" name="website" value={formData.website} onChange={handleChange} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Abbrechen</Button>
                        </DialogClose>
                        <Button type="submit">Speichern</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SupplierClientPage;
