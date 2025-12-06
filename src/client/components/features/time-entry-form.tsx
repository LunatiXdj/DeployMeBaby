'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/client/components/ui/button';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { Textarea } from '@/client/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/components/ui/select';
import { useToast } from '@/client/hooks/use-toast';
import { saveTimeEntry } from '@/client/services/timeEntryService';
import { getEmployees } from '@/client/services/employeeService';
import { TimeEntry, Employee } from '@/shared/types';

interface TimeEntryFormProps {
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  initialData?: TimeEntry | null;
}
export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ projectId, onOpenChange, onSave, initialData }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [pauseTime, setPauseTime] = useState(initialData?.pauseTime || 0);
  const [activities, setActivities] = useState(initialData?.activities || '');
  const { toast } = useToast();

  useEffect(() => {
    const fetchEmployees = async () => {
      const employeeData = await getEmployees();
      setEmployees(employeeData);
    };
    fetchEmployees();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Prevent default form submission
    event.preventDefault();

    // Calculate totalTime in hours
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diffInMinutes = (end.getTime() - start.getTime()) / 60000;
    const totalTime = (diffInMinutes - pauseTime) / 60;

    if (totalTime <= 0) {
        toast({ title: "Ungültige Zeit", description: "Die Endzeit muss nach der Startzeit liegen und die Arbeitszeit muss die Pause übersteigen.", variant: "destructive" });
        return;
    }

    const timeEntryToSave: Omit<TimeEntry, 'createdAt'> = {
        id: initialData?.id || '', // Include ID if it's an existing entry
        projectId,
        employeeId,
        date,
        startTime,
        endTime,
        pauseTime,
        activities,
        totalTime: parseFloat(totalTime.toFixed(2)), // Store total time rounded to 2 decimal places
    };

    saveTimeEntry(timeEntryToSave.id, timeEntryToSave)
      .then(() => {
        toast({ title: "Arbeitszeit gespeichert", description: "Der Arbeitszeiteintrag wurde erfolgreich gespeichert." });
        onSave(); // Notify parent about successful save
        onOpenChange(false); // Close the dialog
      })
      .catch(error => {
        console.error("Error saving time entry:", error);
        toast({ title: "Fehler beim Speichern", description: "Die Arbeitszeit konnte nicht gespeichert werden.", variant: "destructive" });
      });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="employee" className="text-right">
          Mitarbeiter
        </Label>
        <Select value={employeeId} onValueChange={setEmployeeId} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Mitarbeiter auswählen" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">
          Datum
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="startTime" className="text-right">
          Beginn (Uhrzeit)
        </Label>
        <Input
          id="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endTime" className="text-right">
          Ende (Uhrzeit)
        </Label>
        <Input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="pauseTime" className="text-right">
          Pause (Minuten)
        </Label>
        <Input
          id="pauseTime"
          type="number"
          value={pauseTime}
          onChange={(e) => setPauseTime(parseInt(e.target.value) || 0)}
          className="col-span-3"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="activities" className="text-right">
          Tätigkeiten
        </Label>
        <Textarea
          id="activities"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          className="col-span-3"
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Speichern</Button>
      </div>
    </form>
  );
};
