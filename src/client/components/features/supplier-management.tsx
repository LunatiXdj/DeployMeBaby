'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Supplier } from '@/shared/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { getSuppliers, saveSupplier, deleteSupplier } from '../../services/supplierService';
import { Skeleton } from '../ui/skeleton';

export function SupplierManagement() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const suppliersFromDb = await getSuppliers();
                setSuppliers(suppliersFromDb);
            } catch (error) {
                console.error("Failed to fetch suppliers", error);
                toast({
                    title: "Fehler beim Laden",
                    description: "Die Lieferantendaten konnten nicht geladen werden.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsFormDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setIsFormDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSupplier(id);
            setSuppliers(suppliers.filter(s => s.id !== id));
            toast({
                title: "Lieferant gelöscht",
                description: "Der Lieferant wurde erfolgreich entfernt.",
            });
        } catch (error) {
            console.error("Failed to delete supplier", error);
            toast({
                title: "Fehler beim Löschen",
                description: "Der Lieferant konnte nicht gelöscht werden.",
                variant: "destructive",
            })
        }
    }

    const handleSave = async (supplierData: Omit<Supplier, 'id'> & { id?: string }) => {
        try {
            const savedSupplier = await saveSupplier(supplierData, supplierData.id);
            const updatedSuppliers = await getSuppliers();
            setSuppliers(updatedSuppliers);

            toast({
                title: supplierData.id ? "Lieferant aktualisiert" : "Lieferant erstellt",
            });
        } catch (error) {
            console.error("Failed to save supplier", error);
            toast({
                title: "Fehler beim Speichern",
                description: "Der Lieferant konnte nicht gespeichert werden.",
                variant: "destructive"
            });
        }

        setIsFormDialogOpen(false);
        setSelectedSupplier(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lieferantenstamm</CardTitle>
                            <CardDescription>
                                Verwalten Sie Ihre Lieferanten.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAddNew} size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Neuer Lieferant
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Firmierung</TableHead>
                                <TableHead>Ansprechpartner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>UsT-ID</TableHead>
                                <TableHead>
                                    <span className="sr-only">Aktionen</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : suppliers.length > 0 ? (
                                suppliers.map((supplier) => (
                                    <TableRow key={supplier.id} className="hover:bg-muted">
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.companyName}</TableCell>
                                        <TableCell>{supplier.contactPerson}</TableCell>
                                        <TableCell>{supplier.email}</TableCell>
                                        <TableCell>{supplier.phone}</TableCell>
                                        <TableCell>{supplier.vatId}</TableCell>
                                        <TableCell>
                                            <SupplierActions supplier={supplier} onEdit={() => handleEdit(supplier)} onDelete={() => handleDelete(supplier.id)} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        Keine Lieferanten gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <SupplierFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                supplier={selectedSupplier}
                onSave={handleSave}
            />
        </>
    );
}

function SupplierActions({ supplier, onEdit, onDelete }: { supplier: Supplier, onEdit: () => void; onDelete: () => Promise<void>; }) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menü umschalten</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Löschen
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Lieferant dauerhaft gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface SupplierFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
    onSave: (data: Omit<Supplier, 'id'> & { id?: string }) => void;
}

function SupplierFormDialog({ open, onOpenChange, supplier, onSave }: SupplierFormDialogProps) {
    const [formSupplier, setFormSupplier] = useState<Partial<Supplier>>(supplier || {});

    useEffect(() => {
        setFormSupplier(supplier || { 
            name: '', 
            contactPerson: '', 
            email: '', 
            phone: '', 
            address: '', 
            website: '',
            companyName: '',
            legalForm: '',
            commercialRegister: '',
            taxNumber: '',
            vatId: '',
            internalSalesContact: '',
            fieldSalesContact: '',
            isSpecialistDealer: false,
        });
    }, [supplier]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormSupplier(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave(formSupplier as Omit<Supplier, 'id'> & { id?: string });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{supplier ? 'Lieferant bearbeiten' : 'Neuen Lieferant anlegen'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" value={formSupplier.name || ''} onChange={handleInputChange} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="companyName" className="text-right">Firmierung</Label>
                            <Input id="companyName" name="companyName" value={formSupplier.companyName || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactPerson" className="text-right">Ansprechpartner</Label>
                            <Input id="contactPerson" name="contactPerson" value={formSupplier.contactPerson || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="internalSalesContact" className="text-right">Innendienst</Label>
                            <Input id="internalSalesContact" name="internalSalesContact" value={formSupplier.internalSalesContact || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fieldSalesContact" className="text-right">Außendienst</Label>
                            <Input id="fieldSalesContact" name="fieldSalesContact" value={formSupplier.fieldSalesContact || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" value={formSupplier.email || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telefon</Label>
                            <Input id="phone" name="phone" value={formSupplier.phone || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Adresse</Label>
                            <Input id="address" name="address" value={formSupplier.address || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="website" className="text-right">Webseite</Label>
                            <Input id="website" name="website" value={formSupplier.website || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="legalForm" className="text-right">Rechtsform</Label>
                            <Input id="legalForm" name="legalForm" value={formSupplier.legalForm || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="commercialRegister" className="text-right">Handelsregister</Label>
                            <Input id="commercialRegister" name="commercialRegister" value={formSupplier.commercialRegister || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="taxNumber" className="text-right">Steuernummer</Label>
                            <Input id="taxNumber" name="taxNumber" value={formSupplier.taxNumber || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vatId" className="text-right">UsT-ID</Label>
                            <Input id="vatId" name="vatId" value={formSupplier.vatId || ''} onChange={handleInputChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="isSpecialistDealer" className="text-right">Fachhandel</Label>
                            <div className="col-span-3 flex items-center">
                                <Input id="isSpecialistDealer" name="isSpecialistDealer" type="checkbox" checked={formSupplier.isSpecialistDealer || false} onChange={handleInputChange} className="h-4 w-4" />
                            </div>
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
}
