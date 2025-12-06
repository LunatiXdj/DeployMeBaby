
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, CheckSquare, Clock, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SiteLogTable } from '@/components/features/site-log-table';
import { SiteLogForm } from '@/components/features/site-log-form';
import { getSiteLogsByProjectId } from '@/services/siteLogService';
import { getProjects } from '@/services/projectService';
import { SiteLog, Project } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

export default function SiteLogsPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const projectId = searchParams.get('projectId');
 const [projects, setProjects] = useState<Project[]>([]);
 const [siteLogs, setSiteLogs] = useState<SiteLog[]>([]);
 const [loading, setLoading] = useState(true);
 
 const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
 const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
 const [editingSiteLog, setEditingSiteLog] = useState<SiteLog | null>(null);
 const [selectedLogType, setSelectedLogType] = useState<SiteLog['type']>('standard');

 useEffect(() => {
    const fetchProjects = async () => {
        const projectsData = await getProjects();
        setProjects(projectsData);
    };
    fetchProjects();
 }, []);
 
 const fetchSiteLogs = async (id: string) => {
    setLoading(true);
    const logs = await getSiteLogsByProjectId(id);
    setSiteLogs(logs);
    setLoading(false);
 };

 useEffect(() => {
    if (projectId) {
      fetchSiteLogs(projectId);
    } else {
        setLoading(false);
        setSiteLogs([]);
    }
 }, [projectId]);

 const handleProjectChange = (selectedProjectId: string) => {
    router.push(`/sitelogs?projectId=${selectedProjectId}`);
 };

 const handleEdit = (log: SiteLog) => {
    setEditingSiteLog(log);
    setSelectedLogType(log.type);
    setIsFormDialogOpen(true);
 };

 const handleAddNew = () => {
    setEditingSiteLog(null);
    setIsTemplateDialogOpen(true);
 };
 
 const handleTemplateSelect = (type: SiteLog['type']) => {
    setSelectedLogType(type);
    setIsTemplateDialogOpen(false);
    setIsFormDialogOpen(true);
 }

 const handleSave = () => {
    setIsFormDialogOpen(false);
    if(projectId) {
        fetchSiteLogs(projectId);
    }
 };

 const handleDelete = () => {
    if(projectId) {
        fetchSiteLogs(projectId);
    }
 }

 const getDialogTitle = () => {
    const titles: Record<SiteLog['type'], string> = {
        standard: 'Neuer Baustelleneintrag',
        druckpruefung: 'Neues Druckprüfungsprotokoll',
        stundenzettel: 'Neuer Arbeitszeitnachweis',
        problemerfassung: 'Neue Problemerfassung',
        materialbedarf: 'Neuer Materialbedarf',
        endabnahme: 'Neues Endabnahmeprotokoll'
    };
    const editTitles: Record<SiteLog['type'], string> = {
        standard: 'Eintrag bearbeiten',
        druckpruefung: 'Druckprüfungsprotokoll bearbeiten',
        stundenzettel: 'Arbeitszeitnachweis bearbeiten',
        problemerfassung: 'Problemerfassung bearbeiten',
        materialbedarf: 'Materialbedarf bearbeiten',
        endabnahme: 'Endabnahmeprotokoll bearbeiten'
    };

    if (editingSiteLog) {
        return editTitles[editingSiteLog.type] || 'Eintrag bearbeiten';
    }
    return titles[selectedLogType] || 'Neuer Eintrag';
 }

 return (
    <Card>
      <CardHeader>
        <div className='flex flex-row items-center justify-between'>
            <div>
                <CardTitle>Baustellendokumentation</CardTitle>
                <CardDescription>
                Führen Sie ein digitales Bautagebuch für Ihre Projekte.
                </CardDescription>
            </div>
            {projectId && (
                <Button size="sm" className="gap-1" onClick={handleAddNew}>
                    <PlusCircle className="h-4 w-4" />
                    Neuer Eintrag
                </Button>
            )}
        </div>
         <div className="mt-4">
            <Label htmlFor="project-select">Projekt auswählen</Label>
            <Select onValueChange={handleProjectChange} value={projectId || ''}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Wählen Sie ein Projekt" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.projectNumber} - {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {projectId ? (
          <SiteLogTable
            projectId={projectId}
            siteLogs={siteLogs}
            loading={loading}
            onEdit={handleEdit}
            onSiteLogDeleted={handleDelete}
          />
        ) : (
          <p className="text-center text-muted-foreground mt-8">Bitte wählen Sie oben ein Projekt aus, um die Einträge anzuzeigen.</p>
        )}
      </CardContent>

       <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vorlage auswählen</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('standard')}>
                  <FileText className="h-8 w-8" />
                  Standardeintrag
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('druckpruefung')}>
                  <CheckSquare className="h-8 w-8" />
                  Druckprüfung
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('stundenzettel')}>
                  <Clock className="h-8 w-8" />
                  Stundenzettel
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('problemerfassung')}>
                  <AlertTriangle className="h-8 w-8" />
                  Problemerfassung
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('materialbedarf')}>
                  <Package className="h-8 w-8" />
                  Materialbedarf
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleTemplateSelect('endabnahme')}>
                  <CheckCircle className="h-8 w-8" />
                  Endabnahme
              </Button>
          </div>
        </DialogContent>
       </Dialog>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          {projectId && (
            <SiteLogForm
              projectId={projectId}
              initialData={editingSiteLog}
              logType={selectedLogType}
              onSave={handleSave}
              onCancel={() => setIsFormDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
 );
}
