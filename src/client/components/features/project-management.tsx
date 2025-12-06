
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/client/components/ui/badge';
import { PlusCircle, MoreHorizontal, Wrench, CalendarPlus, FileUp, CheckCircle, FilePlus, ShoppingCart, Hammer, FileClock } from 'lucide-react';
import type { Project, Customer } from '@/shared/types';
import { useToast } from "@/client/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
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
  } from "@/client/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/client/components/ui/dialog';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { Checkbox } from '@/client/components/ui/checkbox';
import { getProjects, updateProject } from '@/client/services/projectService';
import { getCustomers } from '@/client/services/customerService';
import { Skeleton } from '../ui/skeleton';
import { TimeEntryTable } from '@/client/components/features/time-entry-table';
import { TimeEntryForm } from '@/client/components/features/time-entry-form';
import { QuickTimeEntryForm } from './quick-time-entry-form';
import { ProjectPlanningForm } from './project-planning-form';
import { useRouter } from 'next/navigation';
import { createBlankInvoice, createInvoiceFromMaterials, createInvoiceFromTimeEntries } from '@/client/services/invoiceService';
import { MaterialOrderForm } from './material-order-form';
import { ProjectForm } from './project-form';


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

export function ProjectManagement() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState("");
    const [sortDesc, setSortDesc] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTimeEntryFormDialogOpen, setIsTimeEntryFormDialogOpen] = useState(false);
  const [isQuickTimeEntryFormDialogOpen, setIsQuickTimeEntryFormDialogOpen] = useState(false);
  const [isTimeEntryTableDialogOpen, setIsTimeEntryTableDialogOpen] = useState(false);
  const [isPlanningDialogOpen, setIsPlanningDialogOpen] = useState(false);
  const [isMaterialOrderDialogOpen, setIsMaterialOrderDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [projectsFromDb, customersFromDb] = await Promise.all([
            getProjects(),
            getCustomers()
        ]);
        setProjects(projectsFromDb);
        setCustomers(customersFromDb);
    } catch (error) {
        console.error("Failed to fetch data from Firestore", error);
        toast({
            title: "Fehler beim Laden",
            description: "Die Projekt- und Kundendaten konnten nicht geladen werden.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
}
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'N/A';
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };
  
  const handleSave = async (savedProject: Project) => {
    toast({ title: editingProject ? "Projekt aktualisiert" : "Projekt erstellt", className: editingProject ? "" : "bg-accent text-accent-foreground" });
    setIsDialogOpen(false);
    setEditingProject(null);
    fetchData();
  };

  const handleViewTimeEntries = (project: Project) => {
    setEditingProject(project);
    setIsTimeEntryTableDialogOpen(true);
  };
  
  const handleTimeEntrySave = () => {
      setIsTimeEntryFormDialogOpen(false);
      setIsQuickTimeEntryFormDialogOpen(false);
      fetchData();
  }
  
  const handlePlanningSave = () => {
      setIsPlanningDialogOpen(false);
      fetchData();
  }
  
  const handleMaterialOrderSave = () => {
    setIsMaterialOrderDialogOpen(false);
    fetchData();
  }

    let filteredProjects = projects.filter(project => {
        if (hideCompleted) {
                return project.status !== 'Abgeschlossen';
        }
        return true;
    });
    if (search.trim()) {
        const s = search.trim().toLowerCase();
        filteredProjects = filteredProjects.filter(p =>
            p.projectNumber?.toLowerCase().includes(s) ||
            p.projectName?.toLowerCase().includes(s) ||
            getCustomerName(p.customerId).toLowerCase().includes(s)
        );
    }
    filteredProjects = filteredProjects.sort((a, b) => {
        if (sortDesc) {
            return (b.projectNumber || '').localeCompare(a.projectNumber || '', undefined, { numeric: true });
        } else {
            return (a.projectNumber || '').localeCompare(b.projectNumber || '', undefined, { numeric: true });
        }
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Projektverwaltung</CardTitle>
                <CardDescription>
                    Behalten Sie den Überblick über alle Ihre laufenden und abgeschlossenen Projekte.
                </CardDescription>
            </div>
            <Button onClick={handleAddNew} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Neues Projekt
            </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-4 gap-2">
            <div className="flex items-center space-x-2">
                <Checkbox id="hide-completed" checked={hideCompleted} onCheckedChange={(checked) => setHideCompleted(!!checked)} />
                <Label htmlFor="hide-completed" className="text-sm font-medium">
                    Abgeschlossene Projekte ausblenden
                </Label>
            </div>
            <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Suche Projekt-Nr., Name, Kunde..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-56"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDesc(s => !s)}
                  title={sortDesc ? "Nach Projekt-Nr. aufsteigend sortieren" : "Nach Projekt-Nr. absteigend sortieren"}
                >
                  {sortDesc ? "↓" : "↑"} Sortierung
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projekt-Nr.</TableHead>
              <TableHead>Projektname</TableHead>
              <TableHead className="hidden sm:table-cell">Kunde</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead><span className="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : (
                filteredProjects.map((project) => (
                <TableRow key={project.id}>
                    <TableCell className="font-mono font-medium">{project.projectNumber}</TableCell>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getCustomerName(project.customerId)}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className={statusMapping[project.status]?.className}>
                            {statusMapping[project.status]?.label}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <ProjectActions 
                            project={project}
                            customer={customers.find(c => c.id === project.customerId)} 
                            onEdit={() => handleEdit(project)} 
                            onPlanProject={() => { setEditingProject(project); setIsPlanningDialogOpen(true); }}
                            onAddTimeEntry={() => { setEditingProject(project); setIsTimeEntryFormDialogOpen(true); } } 
                            onAddQuickTimeEntry={() => { setEditingProject(project); setIsQuickTimeEntryFormDialogOpen(true); } } 
                            onViewTimeEntries={() => handleViewTimeEntries(project)}
                            onAddMaterialOrder={() => { setEditingProject(project); setIsMaterialOrderDialogOpen(true); }}
                            onProjectStatusChange={fetchData} 
                        />
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingProject ? 'Projekt bearbeiten' : 'Neues Projekt anlegen'}</DialogTitle>
                </DialogHeader>
                <ProjectForm 
                    project={editingProject}
                    customers={customers}
                    onSave={handleSave}
                    onCancel={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
       {/* Dialog for Planning Form */}
        <Dialog open={isPlanningDialogOpen} onOpenChange={setIsPlanningDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Projekt "{editingProject?.projectName}" planen</DialogTitle>
                </DialogHeader>
                {editingProject && <ProjectPlanningForm project={editingProject} onSave={handlePlanningSave} onCancel={() => setIsPlanningDialogOpen(false)} />}
            </DialogContent>
        </Dialog>

       {/* Dialog for Time Entry Form */}
        <Dialog open={isTimeEntryFormDialogOpen} onOpenChange={setIsTimeEntryFormDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Arbeitszeit für Projekt erfassen</DialogTitle>
                </DialogHeader>
                {editingProject && <TimeEntryForm projectId={editingProject.id} onSave={handleTimeEntrySave} onOpenChange={setIsTimeEntryFormDialogOpen} />}
            </DialogContent>
        </Dialog>
        
        {/* Dialog for Material Order Form */}
        <Dialog open={isMaterialOrderDialogOpen} onOpenChange={setIsMaterialOrderDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>Materialbedarf für Projekt "{editingProject?.projectName}"</DialogTitle>
                </DialogHeader>
                {editingProject && <MaterialOrderForm project={editingProject} onSave={handleMaterialOrderSave} onCancel={() => setIsMaterialOrderDialogOpen(false)} />}
            </DialogContent>
        </Dialog>

       {/* Dialog for Quick Time Entry Form */}
        <Dialog open={isQuickTimeEntryFormDialogOpen} onOpenChange={setIsQuickTimeEntryFormDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Arbeitszeit (Schnelleingabe)</DialogTitle>
                </DialogHeader>
                {editingProject && <QuickTimeEntryForm projectId={editingProject.id} onSave={handleTimeEntrySave} onOpenChange={setIsQuickTimeEntryFormDialogOpen} />}
            </DialogContent>
        </Dialog>        

        {/* Dialog for Time Entry Table */}
        <Dialog open={isTimeEntryTableDialogOpen} onOpenChange={setIsTimeEntryTableDialogOpen}>
            <DialogContent className="sm:max-w-[800px]"> 
                <DialogHeader>
                    <DialogTitle>Arbeitszeiterfassung bearbeiten</DialogTitle>
                </DialogHeader>
                {editingProject && <TimeEntryTable projectId={editingProject.id} />}
            </DialogContent>
        </Dialog>
    </Card>
  );
}

function ProjectActions({ 
    project,
    customer,
    onEdit, 
    onPlanProject, 
    onAddTimeEntry, 
    onAddQuickTimeEntry, 
    onViewTimeEntries,
    onAddMaterialOrder,
    onProjectStatusChange,
}: { 
    project: Project,
    customer?: Customer,
    onEdit: () => void; 
    onPlanProject: () => void; 
    onAddTimeEntry: () => void; 
    onAddQuickTimeEntry: () => void; 
    onViewTimeEntries: () => void;
    onAddMaterialOrder: () => void;
    onProjectStatusChange: () => void;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isCompleteAlertOpen, setIsCompleteAlertOpen] = useState(false);
    
    // This is the important change: check if project and project.id exist
    const projectId = project?.id;

    const handleCompleteProject = async () => {
        if (!projectId) return;
        try {
            await updateProject(projectId, { status: 'Abgeschlossen' });
            toast({ title: "Projekt abgeschlossen", description: `Das Projekt "${project.projectName}" wurde als abgeschlossen markiert.`});
            onProjectStatusChange();
        } catch (error) {
            console.error("Failed to complete project", error);
            toast({ title: "Fehler", description: "Projekt konnte nicht abgeschlossen werden.", variant: "destructive"});
        }
        setIsCompleteAlertOpen(false);
    }

    const handleCreateBlankInvoice = async () => {
        if (!projectId || !customer?.id) return;
        toast({ title: "Leere Rechnung wird erstellt...", description: "Einen Moment, bitte..." });
        try {
            const newInvoiceId = await createBlankInvoice(customer.id, project.projectName, projectId);
            if (newInvoiceId) {
                toast({ title: "Erfolgreich!", description: "Sie werden zur neuen Rechnung weitergeleitet." });
                router.push(`/invoices/${newInvoiceId}`);
            } else {
                throw new Error("Konnte keine Rechnungs-ID erhalten.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
            console.error("Failed to create blank invoice", error);
            toast({ title: "Fehler", description: `Rechnung konnte nicht erstellt werden: ${errorMessage}`, variant: "destructive" });
        }
    }

    const handleCreateMaterialInvoice = async () => {
        if (!projectId) return;
        toast({ title: "Materialrechnung wird erstellt...", description: "Materialverbrauch wird geladen..." });
        try {
            const newInvoiceId = await createInvoiceFromMaterials(projectId);
            if (newInvoiceId) {
                toast({ title: "Erfolgreich!", description: "Sie werden zur neuen Rechnung weitergeleitet." });
                router.push(`/invoices/${newInvoiceId}`);
            } else {
                 throw new Error("Kein Material zum Abrechnen gefunden oder Fehler bei der Erstellung.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
            console.error("Failed to create material invoice", error);
            toast({ title: "Fehler", description: `Materialrechnung konnte nicht erstellt werden: ${errorMessage}`, variant: "destructive" });
        }
    }
    
    const handleCreateTimeInvoice = async () => {
        if (!projectId) return;
        toast({ title: "Zeitrechnung wird erstellt...", description: "Arbeitszeiten werden geladen..." });
        try {
            const newInvoiceId = await createInvoiceFromTimeEntries(projectId);
            if (newInvoiceId) {
                toast({ title: "Erfolgreich!", description: "Sie werden zur neuen Rechnung weitergeleitet." });
                router.push(`/invoices/${newInvoiceId}`);
            } else {
                throw new Error("Keine Arbeitszeiten zum Abrechnen gefunden oder Fehler bei der Erstellung.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
            console.error("Failed to create time invoice", error);
            toast({ title: "Fehler", description: `Zeitrechnung konnte nicht erstellt werden: ${errorMessage}`, variant: "destructive" });
        }
    }
    
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!projectId}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menü umschalten</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleCreateMaterialInvoice} disabled={!projectId} className="flex items-center gap-2"><Hammer className='w-4 h-4' />Materialverbrauch abrechnen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCreateTimeInvoice} disabled={!projectId} className="flex items-center gap-2"><FileClock className='w-4 h-4' />Arbeitszeit abrechnen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCreateBlankInvoice} disabled={!projectId || !customer?.id} className="flex items-center gap-2"><FilePlus className='w-4 h-4' />Leere Rechnung erstellen</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild disabled={!projectId}>
                        <Link href={`/sitelogs?projectId=${projectId}`} className='flex items-center gap-2'>
                           <FileUp className='w-4 h-4' /> Fotos hochladen
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild disabled={!projectId}>
                        <Link href={`/projects/${projectId}/materials`} className='flex items-center gap-2'>
                           <Wrench className='w-4 h-4' /> Materialliste
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onAddMaterialOrder} disabled={!projectId} className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Materialbedarf erfassen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onPlanProject} disabled={!projectId} className="flex items-center gap-2"><CalendarPlus className='w-4 h-4' />Projekt planen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onAddTimeEntry} disabled={!projectId}>Arbeitszeit für Projekt erfassen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onAddQuickTimeEntry} disabled={!projectId}>Arbeitszeit für mehrere Tage erfassen</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onViewTimeEntries} disabled={!projectId}>Arbeitszeiterfassung bearbeiten</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onEdit} disabled={!projectId}>Bearbeiten</DropdownMenuItem>
                     {project.status !== 'Abgeschlossen' && (
                        <DropdownMenuItem onSelect={() => setIsCompleteAlertOpen(true)} disabled={!projectId} className="text-green-600 focus:text-green-700 flex items-center gap-2">
                           <CheckCircle className='w-4 h-4' /> Projekt abschließen
                       </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isCompleteAlertOpen} onOpenChange={setIsCompleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie dieses Projekt wirklich als abgeschlossen markieren? Diese Aktion setzt auch den zugehörigen Kunden auf "abgeschlossen".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteProject}>Abschließen</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
