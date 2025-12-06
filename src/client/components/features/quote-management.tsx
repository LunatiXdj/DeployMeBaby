

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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, FileCheck, FileDown, Printer, Mail, Pencil, Trash2, ArrowUpDown, Search } from 'lucide-react';
import type { Quote } from '@/types';
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
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
  } from "@/components/ui/alert-dialog"
import { getQuotes, deleteQuote, createNewQuote, getQuote } from '@/services/quoteService';
import { createInvoiceFromQuote } from '@/services/invoiceService';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE');

const statusMapping: Record<Quote['status'], { label: string; className: string }> = {
    draft: { label: 'Entwurf', className: 'bg-gray-100 text-gray-800 border-gray-200'},
    sent: { label: 'Gesendet', className: 'bg-blue-100 text-blue-800 border-blue-200'},
    accepted: { label: 'Angenommen', className: 'bg-green-100 text-green-800 border-green-200'},
    declined: { label: 'Abgelehnt', className: 'bg-red-100 text-red-800 border-red-200'},
    invoiced: { label: 'Fakturiert', className: 'bg-purple-100 text-purple-800 border-purple-200'},
}

type SortKey = 'quoteNumber' | 'customerName' | 'projectName' | 'date' | 'totalAmount' | 'status';

export function QuoteManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPending, startTransition] = useTransition();

  const fetchAllData = async () => {
    try {
        setLoading(true);
        const quotesData = await getQuotes();
        setQuotes(quotesData);
    } catch (error) {
        console.error("Failed to fetch data", error);
        toast({
            title: "Fehler beim Laden",
            description: "Die Angebotsdaten konnten nicht geladen werden.",
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
  
  const handleAddNew = async () => {
    try {
        const newQuoteId = await createNewQuote();
        router.push(`/quotes/${newQuoteId}`);
    } catch(error) {
        console.error("Failed to create new quote", error);
        toast({ title: "Fehler", description: "Neues Angebot konnte nicht erstellt werden.", variant: "destructive"});
    }
  };
  
  const handleDelete = async (id: string) => {
      try {
        await deleteQuote(id);
        setQuotes(quotes.filter(q => q.id !== id));
        toast({
            title: "Angebot gelöscht",
            description: "Das Angebot wurde erfolgreich entfernt.",
        })
      } catch (error) {
        console.error("Failed to delete quote", error);
        toast({
            title: "Fehler beim Löschen",
            description: "Das Angebot konnte nicht gelöscht werden.",
            variant: "destructive",
        })
      }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    try {
        const quote = await getQuote(quoteId);
        if (!quote) {
            toast({ title: "Fehler", description: "Angebot nicht gefunden.", variant: "destructive" });
            return;
        }
        await createInvoiceFromQuote(quote);
        toast({
            title: "Rechnung erstellt",
            description: `Rechnung wurde erfolgreich aus dem Angebot erstellt.`,
            className: "bg-accent text-accent-foreground"
        });
        fetchAllData(); // Refresh the data to show the new "invoiced" status
    } catch(error) {
        console.error("Failed to create invoice from quote", error);
        toast({
            title: "Fehler bei der Umwandlung",
            description: "Die Rechnung konnte nicht erstellt werden.",
            variant: "destructive",
        });
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

  const filteredAndSortedQuotes = useMemo(() => {
    return quotes
        .filter(quote => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = term === '' || 
                quote.quoteNumber.toLowerCase().includes(term) ||
                (quote.customer?.name || '').toLowerCase().includes(term) ||
                (quote.project?.projectName || '').toLowerCase().includes(term);
            
            const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let valA: any, valB: any;

            if (sortKey === 'customerName') {
                valA = a.customer?.name || '';
                valB = b.customer?.name || '';
            } else if (sortKey === 'projectName') {
                valA = a.project?.projectName || '';
                valB = b.project?.projectName || '';
            } else {
                valA = a[sortKey];
                valB = b[sortKey];
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
  }, [quotes, searchTerm, statusFilter, sortKey, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Angebotsverwaltung</CardTitle>
                <CardDescription>
                    Erstellen, versenden und verwalten Sie Ihre Angebote.
                </CardDescription>
            </div>
            <Button onClick={handleAddNew} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Neues Angebot
            </Button>
        </div>
        <div className="flex items-center gap-2 pt-4">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Suche nach Angebots-Nr., Kunde oder Projekt..."
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('quoteNumber')}>
                  Angebots-Nr.
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button variant="ghost" onClick={() => handleSort('customerName')}>
                  Kunde
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" onClick={() => handleSort('projectName')}>
                  Projekt
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('date')}>
                  Datum
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
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAndSortedQuotes.length > 0 ? (
                filteredAndSortedQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                        <TableCell className="font-mono font-medium">{quote.quoteNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell">{quote.customer?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{quote.project?.projectName || 'N/A'}</TableCell>
                        <TableCell>{formatDate(quote.date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(quote.totalAmount)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={statusMapping[quote.status]?.className}>
                                {statusMapping[quote.status]?.label}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <QuoteActions 
                                quote={quote}
                                onDelete={() => handleDelete(quote.id)}
                                onConvertToInvoice={() => handleConvertToInvoice(quote.id)}
                            />
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                       Keine Angebote gefunden, die den Kriterien entsprechen.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


interface QuoteActionsProps {
    quote: Quote;
    onDelete: () => Promise<void>;
    onConvertToInvoice: () => Promise<void>;
}


function QuoteActions({ quote, onDelete, onConvertToInvoice }: QuoteActionsProps) {
    const { toast } = useToast();

    const generatePdf = async (options: { openInNewTab?: boolean, triggerPrint?: boolean } = {}) => {
        try {
            const response = await fetch('/api/generate-quote-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quoteId: quote.id }),
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
                a.download = `Angebot-${quote.quoteNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
            toast({ title: "PDF generiert", description: "Das Angebot wurde erfolgreich als PDF erstellt." });
        } catch (error: any) {
            console.error("Failed to generate PDF", error);
            toast({ title: "Fehler bei PDF-Generierung", description: error.message, variant: "destructive" });
        } 
    };
    
    const handleEmail = async () => {
        const customer = quote.customer;
        if (!customer || !customer.email) {
            toast({ title: "E-Mail nicht möglich", description: "Der Kunde hat keine E-Mail-Adresse hinterlegt.", variant: "destructive" });
            return;
        }

        const subject = `Angebot ${quote.quoteNumber}`;
        const body = `Sehr geehrte/r ${customer.salutation === 'Firma' ? 'Damen und Herren' : `${customer.salutation} ${customer.name}`},%0D%0A%0D%0Aanbei erhalten Sie das von Ihnen angefragte Angebot.%0D%0A%0D%0A(Bitte fügen Sie hier die generierte PDF-Datei als Anhang hinzu.)%0D%0A%0D%0AMit freundlichen Grüßen%0D%0A[Ihr Name]`;
        window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
                    <DropdownMenuItem asChild>
                       <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2"><Pencil className="h-4 w-4" />Bearbeiten</Link>
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
                    {quote.status === 'accepted' && (
                        <DropdownMenuItem onClick={onConvertToInvoice} className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4" /> Rechnung erstellen
                        </DropdownMenuItem>
                    )}
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
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Angebot dauerhaft gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
