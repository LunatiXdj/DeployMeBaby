"use client";
import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card';
import { Button } from '@/client/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table';
import { Input } from '@/client/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/client/components/ui/select';
import { Badge } from '@/client/components/ui/badge';
import { MoreHorizontal, FileDown, Printer, Mail, Pencil, Trash2, ArrowUpDown, Search } from 'lucide-react';
import type { Invoice, Project, Customer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from "@/client/components/ui/dropdown-menu";
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
  } from "@/client/components/ui/alert-dialog"
import { getInvoices, deleteInvoice, getInvoice } from '@/services/invoiceService';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE');

const statusMapping: Record<Invoice['status'], { label: string; className: string }> = {
    offen: { label: 'Offen', className: 'bg-yellow-100 text-yellow-800 border-yellow-200'},
    paid: { label: 'Bezahlt', className: 'bg-green-100 text-green-800 border-green-200'},
    overdue: { label: 'Überfällig', className: 'bg-red-100 text-red-800 border-red-200'},
}

interface EnrichedInvoice extends Invoice {
    customerName: string;
}

type SortKey = 'invoiceNumber' | 'customerName' | 'dueDate' | 'totalAmount' | 'status';

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPending, startTransition] = useTransition();

  const fetchAllData = async () => {
    try {
        setLoading(true);
        const invoicesData = await getInvoices();
        setInvoices(invoicesData);
    } catch (error) {
        console.error("Failed to fetch data", error);
        toast({
            title: "Fehler beim Laden",
            description: "Die Rechnungsdaten konnten nicht geladen werden.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
}

  useEffect(() => {
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleDelete = async (id: string) => {
      try {
        await deleteInvoice(id);
        setInvoices(invoices.filter(q => q.id !== id));
        toast({
            title: "Rechnung gelöscht",
            description: "Die Rechnung wurde erfolgreich entfernt.",
        })
      } catch (error) {
        console.error("Failed to delete invoice", error);
        toast({
            title: "Fehler beim Löschen",
            description: "Die Rechnung konnte nicht gelöscht werden.",
            variant: "destructive",
        })
      }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  }

  const filteredAndSortedInvoices = useMemo(() => {
    return invoices
        .filter(invoice => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = term === '' || 
                invoice.invoiceNumber.toLowerCase().includes(term) ||
                (invoice.customer?.name || '').toLowerCase().includes(term);
            
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let valA: any, valB: any;
            if (sortKey === 'customerName') {
                valA = a.customer?.name || '';
                valB = b.customer?.name || '';
            } else {
                valA = a[sortKey as keyof Invoice];
                valB = b[sortKey as keyof Invoice];
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
  }, [invoices, searchTerm, statusFilter, sortKey, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rechnungsverwaltung</CardTitle>
        <CardDescription>
            Verwalten Sie Ihre offenen, bezahlten und überfälligen Rechnungen.
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Suche nach Rechnungs-Nr. oder Kunde..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        {Object.entries(statusMapping).map(([key, {label}]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild>
                    <Link href="/invoices/new?type=abschlag">Neuer Abschlagsrechnung</Link>
                </Button>
                <Button asChild>
                    <Link href="/invoices/new">Neue Rechnung</Link>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('invoiceNumber')}>
                  Rechnungs-Nr.
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                 <Button variant="ghost" onClick={() => handleSort('customerName')}>
                    Kunde
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('dueDate')}>
                    Fälligkeitsdatum
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                 <Button variant="ghost" onClick={() => handleSort('totalAmount')}>
                    Betrag
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                 <Button variant="ghost" onClick={() => handleSort('status')}>
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead><span className="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAndSortedInvoices.length > 0 ? (
                filteredAndSortedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell">{invoice.customer?.name}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={statusMapping[invoice.status]?.className}>
                                {statusMapping[invoice.status]?.label}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <InvoiceActions 
                                invoiceId={invoice.id}
                                onDelete={() => handleDelete(invoice.id)}
                            />
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        Keine Rechnungen gefunden, die den Kriterien entsprechen.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvoiceActions({ invoiceId, onDelete }: { invoiceId: string, onDelete: () => Promise<void>; }) {
    const { toast } = useToast();

    const generatePdf = async (options: { openInNewTab?: boolean, triggerPrint?: boolean } = {}) => {
        try {
            const response = await fetch('/api/generate-invoice-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invoiceId }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            if (options.openInNewTab) {
                window.open(url, '_blank');
            } else if (options.triggerPrint) {
                 const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        window.URL.revokeObjectURL(url);
                    }, 100);
                };
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = `Rechnung-${invoiceId}.pdf`; 
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            toast({ title: "PDF generiert", description: "Die Rechnung wurde erfolgreich als PDF erstellt."});
        } catch (error: any) {
            console.error("Failed to generate PDF", error);
            toast({ title: "Fehler bei PDF-Generierung", description: error.message, variant: "destructive" });
        }
    };
    
    const handleEmail = async () => {
        const fullInvoice = await getInvoice(invoiceId);
        if (!fullInvoice || !fullInvoice.customer || !fullInvoice.customer.email) {
            toast({ title: "E-Mail nicht möglich", description: "Kunde hat keine E-Mail oder Rechnungsdaten fehlen.", variant: "destructive" });
            return;
        }
        const subject = `Rechnung ${fullInvoice.invoiceNumber}`;
        const body = `Sehr geehrte/r ${fullInvoice.customer.salutation === 'Firma' ? 'Damen und Herren' : `${fullInvoice.customer.salutation} ${fullInvoice.customer.name}`},%0D%0A%0D%0Aanbei erhalten Sie Ihre Rechnung.%0D%0A%0D%0A(Bitte fügen Sie hier die generierte PDF-Datei als Anhang hinzu.)%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A[Ihr Name]`;
        window.location.href = `mailto:${fullInvoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

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
                    <DropdownMenuItem asChild>
                       <Link href={`/invoices/${invoiceId}`} className="flex items-center gap-2"><Pencil className="h-4 w-4" />Details ansehen</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => generatePdf()} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" /> PDF generieren
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generatePdf({ triggerPrint: true })} className="flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Drucken
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEmail} className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Als E-Mail senden
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Löschen
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird die Rechnung dauerhaft gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.preventDefault(); onDelete(); }}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}