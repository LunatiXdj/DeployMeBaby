'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from '@/components/ui/alert-dialog';
import { getTimeEntriesForProject } from '@/client/services/timeEntryService';
import { TimeEntry } from '@/shared/types'; // Assuming TimeEntry type is in types.ts
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table';
import { Button } from '@/client/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { deleteTimeEntry } from '@/client/services/timeEntryService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/client/components/ui/dialog'; // Assuming Dialog components are here
import { TimeEntryForm } from './time-entry-form'; // Assuming TimeEntryForm is in time-entry-form.tsx
import { useToast } from '@/client/hooks/use-toast'; // Assuming useToast hook is here
import { Skeleton } from '@/client/components/ui/skeleton';

interface TimeEntryTableProps {
  projectId: string;
}

export function TimeEntryTable({ projectId }: TimeEntryTableProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null); // State to hold the entry being edited
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null); // State to hold the ID of the entry to be deleted
  const { toast } = useToast();

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const entries = await getTimeEntriesForProject(projectId);
      setTimeEntries(entries); // Update state with fetched entries
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      toast({ title: 'Fehler', description: 'Arbeitszeiten konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTimeEntries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const sortedTimeEntries = useMemo(() => {
    return [...timeEntries].sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        // Assuming startTime is in "HH:mm" format
        return a.startTime.localeCompare(b.startTime);
    });
  }, [timeEntries]);


  const handleEditClick = (entry: TimeEntry) => {
    setEditingEntry(entry); // Set the entry to be edited
  };

  const handleDelete = async () => {
    if (entryToDeleteId) {
      try {
        await deleteTimeEntry(entryToDeleteId);
        toast({ title: 'Arbeitszeiteintrag gelöscht', description: 'Der Eintrag wurde erfolgreich entfernt.' });
        fetchTimeEntries(); // Refresh the list after deletion
      } catch (error) {
        console.error('Failed to delete time entry:', error);
        toast({ title: 'Fehler beim Löschen', description: 'Der Arbeitszeiteintrag konnte nicht gelöscht werden.', variant: 'destructive' });
      } finally {
        setEntryToDeleteId(null); // Close the alert dialog
      }
    }
  };
  const handleFormSave = () => {
    setEditingEntry(null); // Close the dialog
    fetchTimeEntries(); // Refresh the time entries list after saving
  };
  
  const handleFormOpenChange = (open: boolean) => {
    if (!open) {
        setEditingEntry(null);
    }
  }

  return (
    <AlertDialog>
      {loading ? (
         <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Beginn</TableHead>
              <TableHead>Ende</TableHead>
              <TableHead>Pause (Min.)</TableHead>
              <TableHead>Tätigkeiten</TableHead>
              <TableHead>Arbeitszeit (Std.)</TableHead>
              <TableHead>
                <span className='sr-only'>Aktionen</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTimeEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.startTime}</TableCell>
                <TableCell>{entry.endTime}</TableCell>
                <TableCell>{entry.pauseTime}</TableCell>
                <TableCell className="max-w-[200px] truncate">{entry.activities}</TableCell>
                <TableCell>{entry.totalTime ? entry.totalTime.toFixed(2) : 'N/A'}</TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleEditClick(entry)}>
                      <Edit className='h-4 w-4' />
                    </Button>
                    <AlertDialogTrigger asChild>
                    <Button
                    variant='outline'
                    size='sm'
                    className='text-destructive'
                    onClick={() => setEntryToDeleteId(entry.id)}>
                    <Trash className='h-4 w-4' />
                    </Button>
                    </AlertDialogTrigger>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sortedTimeEntries.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className='text-center'>
                  Keine Arbeitszeiteinträge gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingEntry} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Arbeitszeiterfassung bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details des Arbeitszeiteintrags.</DialogDescription>
          </DialogHeader>
          {editingEntry && <TimeEntryForm projectId={projectId} initialData={editingEntry} onSave={handleFormSave} onOpenChange={handleFormOpenChange} />}
        </DialogContent>
      </Dialog>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
          <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Arbeitszeiteintrag dauerhaft gelöscht.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setEntryToDeleteId(null)}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
