
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import type { Project, Customer } from '@/types';
import { saveProject } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormProps {
    project: Project | null;
    customers: Customer[];
    onSave: (savedProject: Project) => void;
    onCancel: () => void;
}

const statusMapping: Record<Project['status'], { label: string; className: string }> = {
    'Kundenportal NEU': { label: 'Kundenportal NEU', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'},
    offen: { label: 'Offen', className: 'bg-zinc-100 text-zinc-800 border-zinc-200'},
    Planung: { label: 'Planung', className: 'bg-yellow-100 text-yellow-800 border-yellow-200'},
    Aktiv: { label: 'Aktiv', className: 'bg-blue-100 text-blue-800 border-blue-200'},
    Restarbeiten: { label: 'Restarbeiten', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    Abgeschlossen: { label: 'Abgeschlossen', className: 'bg-green-100 text-green-800 border-green-200'},
    'on-hold': { label: 'Angehalten', className: 'bg-gray-100 text-gray-800 border-gray-200'},
    'Administrativ': { label: 'Administrativ', className: 'bg-purple-100 text-purple-800 border-purple-200' },
}

export function ProjectForm({ project, customers, onSave, onCancel }: ProjectFormProps) {
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'plannedEvents'>> = {
            projectName: formData.get('projectName') as string,
            projectNumber: formData.get('projectNumber') as string,
            customerId: formData.get('customerId') as string,
            status: formData.get('status') as Project['status'],
            startDate: formData.get('startDate') as string || null,
            endDate: formData.get('endDate') as string || null,
        };

        if (!projectData.customerId) {
            toast({
                title: "Kunde erforderlich",
                description: "Bitte weisen Sie dem Projekt einen Kunden zu.",
                variant: "destructive"
            });
            return;
        }

        try {
            const savedProject = await saveProject(project ? project.id : null, projectData);
            onSave(savedProject);
        } catch (error) {
            console.error("Failed to save project", error);
            toast({
                title: "Fehler beim Speichern",
                description: "Das Projekt konnte nicht gespeichert werden.",
                variant: "destructive"
            });
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="projectNumber" className="text-right">Projekt-Nr.</Label>
                    <Input id="projectNumber" name="projectNumber" defaultValue={project?.projectNumber || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="projectName" className="text-right">Projektname</Label>
                    <Input id="projectName" name="projectName" defaultValue={project?.projectName || ''} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customerId" className="text-right">Kunde</Label>
                    <div className="col-span-3">
                        <Select name="customerId" defaultValue={project?.customerId || ''} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Kunde auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <div className="col-span-3">
                        <Select name="status" defaultValue={project?.status || 'offen'} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Status auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusMapping).map(([key, {label}]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">Startdatum</Label>
                    <Input id="startDate" name="startDate" type="date" defaultValue={project?.startDate || ''} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">Enddatum</Label>
                    <Input id="endDate" name="endDate" type="date" defaultValue={project?.endDate || ''} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onCancel}>Abbrechen</Button>
                <Button type="submit">Speichern</Button>
            </DialogFooter>
        </form>
    )
}
