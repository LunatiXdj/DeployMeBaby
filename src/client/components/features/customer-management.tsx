'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, MoreHorizontal, AlertCircle, FileText, FileBadge, FileSignature, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import type { Customer } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { getCustomers, saveCustomer, deleteCustomer } from '../../services/customerService';
import { Skeleton } from '../ui/skeleton';
import { createNewQuote } from '../../services/quoteService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { createBlankInvoice } from '../../services/invoiceService';
import { CustomerDetailView } from './customer-detail-view';


const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusMapping: Record<Customer['status'], { label: string; className: string }> = {
    'Kundenportal NEU': { label: 'Kundenportal NEU', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
    active: { label: 'Aktiv', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    completed: { label: 'Abgeschlossen', className: 'bg-green-100 text-green-800 border-green-200' },
}

type SortKey = 'name' | 'id' | 'status';

export function CustomerManagement() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [hideCompleted, setHideCompleted] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isPending, startTransition] = useTransition();

    const fetchCustomers = async () => {
        try {
            console.log('Fetching customers...');
            setLoading(true);
            const customersFromDb = await getCustomers();
            console.log('Customers fetched:', customersFromDb);
            setCustomers(customersFromDb);
        } catch (error) {
            console.error("Failed to fetch customers from Firestore", error);
            toast({
                title: "Fehler beim Laden",
                description: "Die Kundendaten konnten nicht geladen werden.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        console.log('CustomerManagement component mounted.');
        fetchCustomers();
    }, [toast]);

    const handleViewDetails = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailViewOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setIsFormDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCustomer(id);
            setCustomers(customers.filter(c => c.id !== id));
            toast({
                title: "Kunde gelöscht",
                description: "Der Kunde wurde erfolgreich entfernt.",
            });
        } catch (error) {
            console.error("Failed to delete customer", error);
            toast({
                title: "Fehler beim Löschen",
                description: "Der Kunde konnte nicht gelöscht werden.",
                variant: "destructive",
            })
        }
    }

    const handleSave = async (formData: FormData) => {
        const customerData = {
            salutation: formData.get('salutation') as Customer['salutation'],
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            phone: formData.get('phone') as string,
            mobilePhone: formData.get('mobilePhone') as string,
            email: formData.get('email') as string,
            website: formData.get('website') as string,
            socialMediaLink: formData.get('socialMediaLink') as string,
            isPrivate: formData.get('isPrivate') === 'on',
            usePaypal: formData.get('usePaypal') === 'on',
            billingInfo: formData.get('billingInfo') as string,
            contactPerson: formData.get('contactPerson') as string,
            notes: formData.get('notes') as string,
            status: formData.get('status') as Customer['status'],
        };

        try {
            const savedCustomer = await saveCustomer(selectedCustomer ? selectedCustomer.id : null, customerData);
            if (selectedCustomer) {
                setCustomers(customers.map(c => c.id === selectedCustomer.id ? savedCustomer : c));
                toast({
                    title: "Kunde aktualisiert",
                    description: "Die Kundendaten wurden erfolgreich gespeichert.",
                })
            } else {
                setCustomers([...customers, savedCustomer]);
                toast({
                    title: "Kunde erstellt",
                    description: "Ein neuer Kunde wurde erfolgreich angelegt.",
                    variant: "default",
                    className: "bg-accent text-accent-foreground"
                })
            }
            fetchCustomers();
        } catch (error) {
            console.error("Failed to save customer", error);
            toast({
                title: "Fehler beim Speichern",
                description: "Der Kunde konnte nicht gespeichert werden.",
                variant: "destructive"
            });
        }

        setIsFormDialogOpen(false);
        setSelectedCustomer(null);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }

    const filteredAndSortedCustomers = useMemo(() => {
        return customers
            .filter(customer => {
                if (hideCompleted && customer.status === 'completed') {
                    return false;
                }
                const term = searchTerm.toLowerCase();
                return term === '' ||
                    customer.name.toLowerCase().includes(term) ||
                    (customer.id || '').toLowerCase().includes(term);
            })
            .sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [customers, searchTerm, hideCompleted, sortKey, sortDirection]);

    return (
        <>
            {console.log('Rendering CustomerManagement component...')}
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Kundenverwaltung</CardTitle>
                            <CardDescription>
                                Verwalten Sie Ihre Kunden an einem zentralen Ort.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAddNew} size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            Neuer Kunde
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Suche nach Name oder Kunden-Nr..."
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="hide-completed" checked={hideCompleted} onCheckedChange={(checked) => setHideCompleted(!!checked)} />
                            <Label htmlFor="hide-completed" className="text-sm font-medium whitespace-nowrap">
                                Abgeschlossene ausblenden
                            </Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">
                                    <Button variant="ghost" onClick={() => handleSort('id')}>
                                        Kunden-Nr.
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('name')}>
                                        Name
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">
                                    <Button variant="ghost" onClick={() => handleSort('status')}>
                                        Status
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <span className="sr-only">Aktionen</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-center hidden sm:table-cell"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredAndSortedCustomers.length > 0 ? (
                                filteredAndSortedCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-mono text-xs">{customer.id.substring(0, 8).toUpperCase()}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {customer.dunningLevelReached && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Kunde hat die höchste Mahnstufe erreicht.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                <button onClick={() => handleViewDetails(customer)} className="text-left hover:underline">
                                                    <span>{customer.name}</span>
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm">{customer.address}</TableCell>
                                        <TableCell className="hidden md:table-cell text-sm">{customer.phone}</TableCell>
                                        <TableCell className="text-center hidden sm:table-cell">
                                            <Badge variant="outline" className={statusMapping[customer.status]?.className}>
                                                {statusMapping[customer.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <CustomerActions customer={customer} onEdit={() => handleEdit(customer)} onDelete={() => handleDelete(customer.id)} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        Keine Kunden gefunden, die den Kriterien entsprechen.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <CustomerFormDialog
                open={isFormDialogOpen}
                onOpenChange={setIsFormDialogOpen}
                customer={selectedCustomer}
                onSave={handleSave}
            />
            <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
                <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="sr-only">Kundendetails für {selectedCustomer?.name}</DialogTitle>
                        <DialogDescription className="sr-only">Eine detaillierte Ansicht des Kunden, seiner Projekte, Dokumente und Einsätze.</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && <CustomerDetailView customerId={selectedCustomer.id} />}
                </DialogContent>
            </Dialog>
        </>
    );
}

function CustomerActions({ customer, onEdit, onDelete }: { customer: Customer, onEdit: () => void; onDelete: () => Promise<void>; }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleCreateQuote = async () => {
        toast({ title: "Angebot wird erstellt...", description: "Sie werden weitergeleitet." });
        try {
            const newQuoteId = await createNewQuote(customer.id);
            router.push(`/quotes/${newQuoteId}`);
        } catch (error) {
            console.error("Failed to create quote", error);
            toast({ title: "Fehler", description: "Angebot konnte nicht erstellt werden.", variant: "destructive" });
        }
    }

    const handleCreateInvoice = async () => {
        toast({ title: "Rechnung wird erstellt...", description: "Sie werden zur neuen Rechnung weitergeleitet." });
        try {
            const newInvoiceId = await createBlankInvoice(customer.id, customer.name);
            router.push(`/invoices/${newInvoiceId}`);
        } catch (error) {
            console.error("Failed to create blank invoice", error);
            toast({ title: "Fehler", description: "Rechnung konnte nicht erstellt werden.", variant: "destructive" });
        }
    }

    const handleCreateLetter = () => {
        router.push(`/letter?customerId=${customer.id}`);
    }

    const handleToggleActive = async () => {
        try {
            const newStatus = customer.status === 'active' ? 'completed' : 'active';
            await saveCustomer(customer.id, { status: newStatus });
            toast({ title: 'Status aktualisiert', description: `Kundenstatus zu ${newStatus} geändert.` });
            // Optimistically update UI
            router.refresh();
        } catch (err) {
            console.error('Failed to update customer status', err);
            toast({ title: 'Fehler', description: 'Status konnte nicht geändert werden.', variant: 'destructive' });
        }
    }

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
                    <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Bearbeiten</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleCreateQuote}><FileText className="mr-2 h-4 w-4" />Angebot erstellen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCreateInvoice}><FileBadge className="mr-2 h-4 w-4" />Rechnung erstellen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCreateLetter}><FileSignature className="mr-2 h-4 w-4" />Brief erstellen</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleToggleActive}>{customer.status === 'active' ? 'Auf Inaktiv setzen' : 'Auf Aktiv setzen'}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Löschen</DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Kunde dauerhaft gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete()}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function CustomerFormDialog({ open, onOpenChange, customer, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, customer: Customer | null, onSave: (data: FormData) => void }) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{customer ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}</DialogTitle>
                        <DialogDescription>
                            Füllen Sie die Details unten aus. Klicken Sie auf Speichern, wenn Sie fertig sind.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="salutation" className="text-right">Anrede</Label>
                            <Select name="salutation" defaultValue={customer?.salutation} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Anrede auswählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herr">Herr</SelectItem>
                                    <SelectItem value="Frau">Frau</SelectItem>
                                    <SelectItem value="Firma">Firma</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name/Firma</Label>
                            <Input id="name" name="name" defaultValue={customer?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactPerson" className="text-right">Ansprechpartner</Label>
                            <Input id="contactPerson" name="contactPerson" defaultValue={customer?.contactPerson} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Adresse</Label>
                            <Textarea id="address" name="address" defaultValue={customer?.address} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">Telefon</Label>
                                <Input id="phone" name="phone" defaultValue={customer?.phone} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="mobilePhone" className="text-right">Mobil</Label>
                                <Input id="mobilePhone" name="mobilePhone" defaultValue={customer?.mobilePhone} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">E-Mail</Label>
                            <Input id="email" name="email" type="email" defaultValue={customer?.email} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="website" className="text-right">Webseite</Label>
                                <Input id="website" name="website" defaultValue={customer?.website} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="socialMediaLink" className="text-right">Social Media</Label>
                                <Input id="socialMediaLink" name="socialMediaLink" defaultValue={customer?.socialMediaLink} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="billingInfo" className="text-right">Abrechnungsinfo</Label>
                            <Textarea id="billingInfo" name="billingInfo" defaultValue={customer?.billingInfo} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Optionen</Label>
                            <div className="col-span-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isPrivate" name="isPrivate" defaultChecked={customer?.isPrivate} />
                                    <Label htmlFor="isPrivate">Privatkunde</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="usePaypal" name="usePaypal" defaultChecked={customer?.usePaypal} />
                                    <Label htmlFor="usePaypal">PayPal-Zahlung erwünscht</Label>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Notizen</Label>
                            <Textarea id="notes" name="notes" defaultValue={customer?.notes} className="col-span-3" />
                        </div>
                        {customer && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">Status</Label>
                                    <Select name="status" defaultValue={customer?.status || 'active'}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Status auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statusMapping).map(([key, { label }]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Projekte</Label>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        {customer.projectIds.join(', ')}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <Label className="text-right">Offene Posten</Label>
                                        <Input value={formatCurrency(customer.openBalance)} readOnly disabled />
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <Label className="text-right">Mahnstufe</Label>
                                        <Input value={customer.dunningLevel} readOnly disabled />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="pt-4 border-t">
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
