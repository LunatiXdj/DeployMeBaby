
'use client';

import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/auth-context';
import { Project, MaterialOrderItem } from '@/types';
import { saveMaterialOrder } from '@/services/materialOrderService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomer } from '@/services/customerService';
import { getEmployee } from '@/services/employeeService';


interface MaterialOrderFormProps {
  project: Project;
  onSave: () => void;
  onCancel: () => void;
}

export function MaterialOrderForm({ project, onSave, onCancel }: MaterialOrderFormProps) {
  const [items, setItems] = useState<MaterialOrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ description: '', quantity: '', price: '' });
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const { authUser } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!currentItem.description.trim()) return;
    setItems(prev => [...prev, { id: uuidv4(), ...currentItem }]);
    setCurrentItem({ description: '', quantity: '', price: '' });
    descriptionInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!authUser) {
        toast({ title: 'Fehler', description: 'Sie müssen angemeldet sein.', variant: 'destructive'});
        return;
    }
    
    try {
      await saveMaterialOrder(null, {
        projectId: project.id,
        employeeId: authUser.uid,
        items,
        status,
      });
      toast({ title: 'Gespeichert', description: `Materialbedarf wurde als ${status === 'draft' ? 'Entwurf' : 'übermittelt'} gespeichert.`});
      onSave();
    } catch(err) {
      toast({ title: 'Fehler', description: 'Materialbedarf konnte nicht gespeichert werden.', variant: 'destructive'});
    }
  };

  const handleForward = async () => {
    const employee = authUser ? await getEmployee(authUser.uid) : null;
    const customer = await getCustomer(project.customerId);

    const subject = `Bestellung Material für ${project.projectNumber} von ${employee?.firstName || 'Mitarbeiter'}`;
    let body = `Ein Mitarbeiter hat für das Projekt ${project.projectNumber} - ${project.projectName} bei Kunde ${customer?.name || 'N/A'} folgende Artikel zur Bestellung ausgelöst:\n\n`;
    body += 'Bezeichnung'.padEnd(30) + 'Stückzahl'.padEnd(20) + 'Preis\n';
    body += '-'.repeat(70) + '\n';
    items.forEach(item => {
        body += `${item.description.padEnd(30)}${item.quantity.padEnd(20)}${item.price}\n`;
    });
    body += '\n\nBitte prüfen und bestellen.\n\nSystemadministrator\n--';

    window.location.href = `mailto:p.hueting@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    await handleSave('submitted');
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_120px] gap-2">
                <Label htmlFor="description">Bezeichnung</Label>
                <Label htmlFor="quantity">Stückzahl</Label>
                <Label htmlFor="price">Preis (ca.)</Label>
            </div>
            <div className="grid grid-cols-[1fr_100px_120px_auto] gap-2 items-center">
                <Input
                    id="description"
                    name="description"
                    ref={descriptionInputRef}
                    value={currentItem.description}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="z.B. HT-Rohr DN 50"
                />
                <Input
                    id="quantity"
                    name="quantity"
                    value={currentItem.quantity}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="z.B. 5"
                />
                <Input
                    id="price"
                    name="price"
                    type="text"
                    value={currentItem.price}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="z.B. 12,50"
                />
                <Button type="button" size="sm" onClick={handleAddItem}>Hinzufügen</Button>
            </div>
        </div>

        {items.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bezeichnung</TableHead>
                            <TableHead className="w-[100px]">Stückzahl</TableHead>
                            <TableHead className="w-[120px]">Preis</TableHead>
                            <TableHead className="w-[50px]"><span className="sr-only">Löschen</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.price}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
        
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
            <Button variant="secondary" onClick={() => handleSave('draft')}>Speichern</Button>
            <Button onClick={handleForward}>Bestellung an Vorgesetzten weiterleiten</Button>
        </div>
    </div>
  );
}
