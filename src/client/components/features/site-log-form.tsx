
'use client';

import { useState, useCallback, useRef } from 'react';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { Button } from '@/client/components/ui/button';
import { Textarea } from '@/client/components/ui/textarea';
import { format } from 'date-fns';
import { SiteLog, PressureTestProtocol, TimeSheetProtocol, MaterialRequestProtocol } from '@/shared/types';
import { useToast } from '@/client/hooks/use-toast';
import { saveSiteLog, deleteSiteLogImage } from '@/client/services/siteLogService';
import { Loader2, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { PressureTestForm } from './pressure-test-form';
import { TimeSheetForm } from './time-sheet-form';
import { MaterialRequestForm } from './material-request-form';

// --- PROPS INTERFACE ---
interface SiteLogFormProps {
  projectId: string;
  initialData?: SiteLog | null;
  logType: 'standard' | 'druckpruefung' | 'stundenzettel' | 'problemerfassung' | 'materialbedarf' | 'endabnahme';
  onSave: () => void;
  onCancel: () => void;
}

// --- COMPONENT ---
export function SiteLogForm({ projectId, initialData = null, logType, onSave, onCancel }: SiteLogFormProps) {
  const { toast } = useToast();

  // --- STATE MANAGEMENT ---
  const [log, setLog] = useState<Partial<SiteLog>>({
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    description: initialData?.description || '',
    materials: initialData?.materials || '',
    problems: initialData?.problems || '',
    protocolData: initialData?.protocolData || {},
  });
  
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.imageUrls || []);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLog(prev => ({ ...prev, [name]: value }));
  };

  const handleProtocolDataChange = useCallback((newData: Partial<any>) => {
    setLog(prev => ({ ...prev, protocolData: { ...prev.protocolData, ...newData }}));
  }, []);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    if (existingImageUrls.length + filesToUpload.length + newFiles.length > 30) {
      toast({ title: "Maximale Bildanzahl erreicht", description: "Sie können maximal 30 Bilder hochladen.", variant: 'destructive' });
      return;
    }
    setFilesToUpload(prev => [...prev, ...newFiles]);
     // Clear the file input for the next selection
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeNewFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = async (urlToRemove: string) => {
    // Optimistic UI update
    setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));
    
    try {
      // If it's an existing entry, we need to delete the image from storage
      if (initialData?.id) {
        await deleteSiteLogImage(urlToRemove);
        const updatedLogData: Omit<SiteLog, 'id' | 'createdAt' | 'updatedAt'> = {
            projectId,
            date: log.date!,
            type: logType,
            description: log.description!,
            materials: log.materials!,
            problems: log.problems!,
            imageUrls: existingImageUrls.filter(url => url !== urlToRemove),
            protocolData: log.protocolData,
        };
        // We save immediately to persist the deletion
        await saveSiteLog(initialData.id, updatedLogData, []);
        toast({ title: "Bild entfernt", description: "Das Bild wurde erfolgreich gelöscht." });
      }
    } catch (error) {
      // Revert UI if the deletion fails
      setExistingImageUrls(prev => [...prev, urlToRemove]);
      console.error("Failed to delete image", error);
      toast({ title: "Fehler", description: "Das Bild konnte nicht gelöscht werden.", variant: "destructive" });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    
    const siteLogData: Omit<SiteLog, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId,
        date: log.date!,
        type: logType,
        description: log.description!,
        materials: log.materials!,
        problems: log.problems!,
        imageUrls: existingImageUrls, // Pass only the existing URLs
        protocolData: log.protocolData,
    };

    try {
        await saveSiteLog(initialData?.id || null, siteLogData, filesToUpload);
        toast({ title: "Gespeichert", description: "Der Eintrag wurde erfolgreich gespeichert.", className: "bg-accent text-accent-foreground"});
        onSave();
    } catch(error) {
        console.error("Failed to save site log", error);
        toast({ title: "Fehler", description: "Der Eintrag konnte nicht gespeichert werden.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  // --- RENDER LOGIC ---
  const renderProtocolForm = () => {
    switch(logType) {
        case 'druckpruefung':
            return <PressureTestForm initialData={log.protocolData as Partial<PressureTestProtocol>} onDataChange={handleProtocolDataChange} disabled={isSaving} />;
        case 'stundenzettel':
            return <TimeSheetForm initialData={log.protocolData as Partial<TimeSheetProtocol>} onDataChange={handleProtocolDataChange} disabled={isSaving} />;
        case 'materialbedarf':
            return <MaterialRequestForm initialData={log.protocolData as Partial<MaterialRequestProtocol>} onDataChange={handleProtocolDataChange} disabled={isSaving} />;
        default: return null;
    }
  }

  const renderStandardFields = () => (
    <>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung / Notizen</Label>
        <Textarea id="description" name="description" value={log.description} onChange={handleInputChange} required disabled={isSaving} />
      </div>
      {logType === 'standard' && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="materials">Verwendete Materialien</Label>
            <Textarea id="materials" name="materials" value={log.materials} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="problems">Aufgetretene Probleme</Label>
            <Textarea id="problems" name="problems" value={log.problems} onChange={handleInputChange} disabled={isSaving} />
          </div>
        </>
      )}
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-h-[80vh] overflow-y-auto p-1">
      <div className="grid gap-2">
        <Label htmlFor="date">Datum</Label>
        <Input id="date" name="date" type="date" value={log.date} onChange={handleInputChange} required disabled={isSaving} />
      </div>
      
      {renderProtocolForm()}
      {logType !== 'druckpruefung' && logType !== 'stundenzettel' && logType !== 'materialbedarf' && renderStandardFields()}

      <div className="grid gap-2">
        <Label htmlFor="images">Bilder (max. 30)</Label>
        <Input 
            id="images" 
            ref={fileInputRef}
            name="images" 
            type="file" 
            multiple 
            accept="image/*,.heic,.heif" 
            onChange={handleFileSelection} 
            disabled={isSaving || (existingImageUrls.length + filesToUpload.length >= 30)}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {existingImageUrls.map((url) => (
            <div key={url} className="relative group">
              <Image src={url} alt="Vorschau" width={150} height={150} className="w-full h-auto object-cover rounded-md aspect-square" />
              <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeExistingImage(url)} disabled={isSaving}>
                <Trash2 className="h-4 w-4"/>
              </Button>
            </div>
          ))}
          {filesToUpload.map((file, index) => (
            <div key={index} className="relative group">
              <Image src={URL.createObjectURL(file)} alt={file.name} width={150} height={150} className="w-full h-auto object-cover rounded-md aspect-square" />
              <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeNewFile(index)} disabled={isSaving}>
                <X className="h-4 w-4"/>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background py-4 px-1 -mx-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Abbrechen</Button>
        <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Speichern...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}
