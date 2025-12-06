
'use client';

import { PressureTestProtocol } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface PressureTestFormProps {
  initialData: Partial<PressureTestProtocol>;
  onDataChange: (data: Partial<PressureTestProtocol>) => void;
  disabled?: boolean;
}

export function PressureTestForm({ initialData, onDataChange, disabled }: PressureTestFormProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    onDataChange({ [name]: isCheckbox ? checked : value });
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Druckprüfungsprotokoll</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="kunde">Kundendaten</Label>
            <Textarea id="kunde" name="kunde" value={initialData.kunde || ''} onChange={handleChange} placeholder="Name, Adresse..." disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="pruefgas">Prüfgas</Label>
            <Input id="pruefgas" name="pruefgas" value={initialData.pruefgas || ''} onChange={handleChange} disabled={disabled} />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="anlagendruck">Anlagendruck</Label>
            <Input id="anlagendruck" name="anlagendruck" value={initialData.anlagendruck || ''} onChange={handleChange} placeholder="z.B. 10 bar" disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="pruefdruck">Prüfdruck</Label>
            <Input id="pruefdruck" name="pruefdruck" value={initialData.pruefdruck || ''} onChange={handleChange} placeholder="z.B. 12 bar" disabled={disabled} />
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="beginn">Beginn (hh:mm)</Label>
            <Input id="beginn" name="beginn" type="time" value={initialData.beginn || ''} onChange={handleChange} disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="pruefzeit">Prüfzeit (hh:mm)</Label>
            <Input id="pruefzeit" name="pruefzeit" type="time" value={initialData.pruefzeit || ''} onChange={handleChange} disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="druckschwankung">Druckschwankung</Label>
            <Input id="druckschwankung" name="druckschwankung" value={initialData.druckschwankung || ''} onChange={handleChange} disabled={disabled} />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="temperaturausgleich" name="temperaturausgleich" checked={initialData.temperaturausgleich || false} onCheckedChange={(checked) => onDataChange({ temperaturausgleich: !!checked })} disabled={disabled} />
        <Label htmlFor="temperaturausgleich">Temperaturausgleich durchgeführt?</Label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="pumpe">Pumpe</Label>
            <Input id="pumpe" name="pumpe" value={initialData.pumpe || ''} onChange={handleChange} disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="zielvakuum">Zielvakuum</Label>
            <Input id="zielvakuum" name="zielvakuum" value={initialData.zielvakuum || ''} onChange={handleChange} disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="haltezeit">Haltezeit (hh:mm)</Label>
            <Input id="haltezeit" name="haltezeit" type="time" value={initialData.haltezeit || ''} onChange={handleChange} disabled={disabled} />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="result">Resultat</Label>
        <Textarea id="result" name="result" value={initialData.result || ''} onChange={handleChange} disabled={disabled} />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="leckageOrt">Ort der Leckage (falls vorhanden)</Label>
        <Textarea id="leckageOrt" name="leckageOrt" value={initialData.leckageOrt || ''} onChange={handleChange} disabled={disabled} />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="behoben" name="behoben" checked={initialData.behoben || false} onCheckedChange={(checked) => onDataChange({ behoben: !!checked })} disabled={disabled} />
        <Label htmlFor="behoben">Leckage behoben?</Label>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="datum">Datum</Label>
            <Input id="datum" name="datum" type="date" value={initialData.datum || ''} onChange={handleChange} disabled={disabled} />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="unterschrift">Unterschrift Monteur</Label>
            <Input id="unterschrift" name="unterschrift" value={initialData.unterschrift || ''} onChange={handleChange} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
