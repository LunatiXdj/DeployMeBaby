'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import type { Tool } from '@/types';
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { getTools, saveTool, deleteTool } from '@/client/services/toolService';
import { Skeleton } from '../ui/skeleton';


const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const statusMapping: Record<Tool['status'], { label: string; className: string }> = {
    active: { label: 'Aktiv', className: 'bg-green-100 text-green-800 border-green-200'},
    defective: { label: 'Defekt', className: 'bg-red-100 text-red-800 border-red-200'},
}

export function ToolManagement() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
        try {
            setLoading(true);
            const toolsFromDb = await getTools();
            setTools(toolsFromDb);
        } catch (error) {
            console.error("Failed to fetch tools from Firestore", error);
            toast({
                title: "Fehler beim Laden",
                description: "Die Gerätedaten konnten nicht geladen werden.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }
    fetchTools();
  }, [toast]);

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingTool(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      try {
        await deleteTool(id);
        setTools(tools.filter(t => t.id !== id));
        toast({
            title: "Gerät gelöscht",
            description: "Das Gerät wurde erfolgreich entfernt.",
        })
      } catch (error) {
        console.error("Failed to delete tool", error);
        toast({
            title: "Fehler beim Löschen",
            description: "Das Gerät konnte nicht gelöscht werden.",
            variant: "destructive",
        });
      }
  };

  const handleSave = async (formData: FormData) => {
    const toolData: Omit<Tool, 'id' | 'createdAt'> = {
        name: formData.get('name') as string,
        purchasePrice: parseFloat(formData.get('purchasePrice') as string),
        status: formData.get('status') as Tool['status'],
        notes: formData.get('notes') as string,
    };

    try {
        const savedTool = await saveTool(editingTool ? editingTool.id : null, toolData);
        if (editingTool) {
            setTools(tools.map(t => t.id === editingTool.id ? savedTool : t));
            toast({ title: "Gerät aktualisiert", description: "Die Gerätedaten wurden gespeichert." });
        } else {
            setTools([...tools, savedTool]);
            toast({ title: "Gerät erstellt", description: "Ein neues Gerät wurde angelegt.", className: "bg-accent text-accent-foreground" });
        }
    } catch (error) {
        console.error("Failed to save tool", error);
        toast({
            title: "Fehler beim Speichern",
            description: "Das Gerät konnte nicht gespeichert werden.",
            variant: "destructive",
        });
    }
    
    setIsDialogOpen(false);
    setEditingTool(null);
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Werkzeug- & Maschinenpark</CardTitle>
            <CardDescription>
                Verwalten Sie Ihre Werkzeuge, Maschinen und deren Status.
            </CardDescription>
        </div>
        <Button onClick={handleAddNew} size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Neues Gerät
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gerätename</TableHead>
              <TableHead className="text-right">Anschaffungspreis</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Anmerkungen</TableHead>
              <TableHead><span className="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : (
                tools.map((tool) => (
                <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tool.purchasePrice)}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={statusMapping[tool.status]?.className}>
                            {statusMapping[tool.status]?.label}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{tool.notes}</TableCell>
                    <TableCell>
                    <ToolActions onEdit={() => handleEdit(tool)} onDelete={() => handleDelete(tool.id)} />
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
       <ToolFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        tool={editingTool}
        onSave={handleSave}
       />
    </Card>
  );
}

function ToolActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => Promise<void>; }) {
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
                    <DropdownMenuItem onSelect={onEdit}>Bearbeiten</DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">Löschen</DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Gerät dauerhaft gelöscht.
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

function ToolFormDialog({ open, onOpenChange, tool, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, tool: Tool | null, onSave: (data: FormData) => void }) {
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{tool ? 'Gerät bearbeiten' : 'Neues Gerät anlegen'}</DialogTitle>
              <DialogDescription>
                Füllen Sie die Details unten aus und speichern Sie die Änderungen.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" defaultValue={tool?.name} className="col-span-3" required/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">Kaufpreis</Label>
                <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={tool?.purchasePrice} className="col-span-3" required/>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <div className="col-span-3">
                    <Select name="status" defaultValue={tool?.status || 'active'} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Status auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="defective">Defekt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Anmerkungen</Label>
                <Textarea id="notes" name="notes" defaultValue={tool?.notes} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Abbrechen</Button>
                </DialogClose>
                <Button type="submit">Speichern</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
}
