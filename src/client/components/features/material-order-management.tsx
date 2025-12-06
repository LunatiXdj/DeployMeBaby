
'use client';

import { useState, useEffect } from 'react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getSubmittedMaterialOrders, EnrichedMaterialOrder, updateMaterialOrderStatus } from '@/services/materialOrderService';
import { Button } from '../ui/button';
import { CheckCircle } from 'lucide-react';

const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? value : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
};

export function MaterialOrderManagement() {
  const [orders, setOrders] = useState<EnrichedMaterialOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const submittedOrders = await getSubmittedMaterialOrders();
      setOrders(submittedOrders);
    } catch (error) {
      console.error("Failed to fetch material orders", error);
      toast({ title: "Fehler", description: "Materialbestellungen konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [toast]);
  
  const handleMarkAsOrdered = async (orderId: string) => {
      try {
          await updateMaterialOrderStatus(orderId, 'ordered');
          toast({ title: "Bestellung markiert", description: "Die Materialbestellung wurde als 'bestellt' markiert." });
          fetchOrders();
      } catch (error) {
          toast({ title: "Fehler", description: "Status konnte nicht aktualisiert werden.", variant: "destructive" });
      }
  }

  const groupedOrders = orders.reduce((acc, order) => {
      const key = `${order.project.projectNumber} - ${order.project.projectName}`;
      if (!acc[key]) {
          acc[key] = [];
      }
      acc[key].push(order);
      return acc;
  }, {} as Record<string, EnrichedMaterialOrder[]>);


  if (loading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materialbestellungen</CardTitle>
        <CardDescription>
          Übersicht aller übermittelten Materialanforderungen von Mitarbeitern.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedOrders).length === 0 ? (
          <p className="text-center text-muted-foreground p-8">Keine offenen Materialbestellungen gefunden.</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedOrders).map(([projectKey, projectOrders]) => (
                 <AccordionItem value={projectKey} key={projectKey}>
                    <AccordionTrigger className="text-lg font-semibold">{projectKey}</AccordionTrigger>
                    <AccordionContent>
                        {projectOrders.map(order => (
                            <div key={order.id} className="mb-6 p-4 border rounded-lg">
                               <div className="flex justify-between items-center mb-2">
                                 <div>
                                    <p><strong>Mitarbeiter:</strong> {order.employee.firstName} {order.employee.lastName}</p>
                                    <p className="text-sm text-muted-foreground"><strong>Angefordert am:</strong> {new Date(order.createdAt!).toLocaleDateString('de-DE')}</p>
                                 </div>
                                 <Button size="sm" onClick={() => handleMarkAsOrdered(order.id)}>
                                     <CheckCircle className="mr-2 h-4 w-4" />
                                     Als bestellt markieren
                                 </Button>
                               </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bezeichnung</TableHead>
                                            <TableHead className="w-24">Stückzahl</TableHead>
                                            <TableHead className="w-32 text-right">Preis (ca.)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
