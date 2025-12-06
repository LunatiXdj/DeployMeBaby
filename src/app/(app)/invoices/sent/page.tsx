
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, Project, Customer } from '@/types';
import { getInvoices, updateInvoice } from '@/client/services/invoiceService';
import { getProjects } from '@/services/projectService';
import { getCustomers } from '@/services/customerService';
import { cn } from '@/lib/utils';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('de-DE');
const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

interface EnrichedInvoice extends Invoice {
    customerName: string;
    customerAddress: string;
    projectNumber: string;
    dunningLevel: number;
}

export default function SentInvoicesPage() {
  const [invoices, setInvoices] = useState<EnrichedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSentInvoices = useCallback(async () => {
    setLoading(true);
    try {
        const [invoicesData, projectsData, customersData] = await Promise.all([
            getInvoices(),
            getProjects(),
            getCustomers(),
        ]);
        
        const projectsMap = new Map(projectsData.map(p => [p.id, p]));
        const customersMap = new Map(customersData.map(c => [c.id, c]));

        const openInvoices = invoicesData
            .filter(inv => inv.status === 'offen' || inv.status === 'overdue')
            .map(inv => {
                const project = projectsMap.get(inv.projectId);
                const customer = project ? customersMap.get(project.customerId) : undefined;
                return {
                    ...inv,
                    customerName: customer?.name || 'N/A',
                    customerAddress: customer?.address || 'N/A',
                    projectNumber: project?.projectNumber || 'N/A',
                    dunningLevel: customer?.dunningLevel || 0,
                };
            });

        setInvoices(openInvoices);

    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({ title: "Fehler beim Laden", description: "Rechnungen konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSentInvoices();
  }, [fetchSentInvoices]);

  const handleStatusChange = async (invoiceId: string, isPaid: boolean) => {
    if (!isPaid) return; // We only handle marking as paid

    const originalInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!originalInvoice) return;
    
    // Create a new object for saving, excluding the enriched fields
    const { customerName, customerAddress, projectNumber, dunningLevel, ...invoiceToSave } = originalInvoice;

    try {
      await updateInvoice(invoiceToSave.id, { status: 'paid' });
      toast({
        title: 'Status aktualisiert',
        description: 'Die Rechnung wurde als "Bezahlt" markiert.',
        className: 'bg-accent text-accent-foreground',
      });
      fetchSentInvoices();
    } catch (error) {
      console.error("Failed to update invoice status", error);
      toast({ title: "Fehler", description: "Status konnte nicht aktualisiert werden.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offene Rechnungen</CardTitle>
        <CardDescription>
          Übersicht aller offenen und überfälligen Rechnungen. Markieren Sie bezahlte Rechnungen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Bezahlt</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead className="hidden md:table-cell">Adresse</TableHead>
              <TableHead>Rechnungs-Nr.</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Fällig am</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
              <TableHead className="text-center">Mahnstufe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">Keine offenen Rechnungen gefunden.</TableCell>
                </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className={cn(invoice.dunningLevel > 1 ? 'bg-destructive/10' : '')}>
                  <TableCell>
                    <Checkbox
                      id={`paid-${invoice.id}`}
                      checked={invoice.status === 'paid'}
                      disabled={invoice.status === 'paid'}
                      onCheckedChange={(checked) => handleStatusChange(invoice.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{invoice.customerName}</TableCell>
                  <TableCell className="hidden md:table-cell">{invoice.customerAddress}</TableCell>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-center font-bold">{invoice.dunningLevel > 0 ? invoice.dunningLevel : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
