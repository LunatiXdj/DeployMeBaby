
'use client';

import { useState, useEffect, useRef } from 'react';
import { MaterialRequestProtocol, MaterialRequestItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface MaterialRequestFormProps {
  initialData: Partial<MaterialRequestProtocol>;
  onDataChange: (data: Partial<MaterialRequestProtocol>) => void;
  disabled?: boolean;
}

export function MaterialRequestForm({ initialData, onDataChange, disabled }: MaterialRequestFormProps) {
  const [items, setItems] = useState<MaterialRequestItem[]>(initialData.items || []);
  const [currentItem, setCurrentItem] = useState({ description: '', quantity: '', price: '' });
  
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onDataChange({ items });
  }, [items, onDataChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!currentItem.description.trim()) {
        return; // Don't add empty items
    }
    setItems(prev => [...prev, { id: uuidv4(), ...currentItem }]);
    setCurrentItem({ description: '', quantity: '', price: '' }); // Reset for next entry
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
  
  const formatCurrency = (value: string | number) => {
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Materialbedarf</h3>
      
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
            disabled={disabled}
          />
          <Input
            id="quantity"
            name="quantity"
            value={currentItem.quantity}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="z.B. 5"
            disabled={disabled}
          />
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={currentItem.price}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="z.B. 12,50"
            disabled={disabled}
          />
          <Button type="button" size="sm" onClick={handleAddItem} disabled={disabled}>
            Hinzufügen
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead className="w-[100px]">Stückzahl</TableHead>
                    <TableHead className="w-[120px] text-right">Preis</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Löschen</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell>
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={disabled}
                             >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      )}

    </div>
  );
}
