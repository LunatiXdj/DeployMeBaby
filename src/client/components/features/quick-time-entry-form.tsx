'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { saveMultipleTimeEntries } from '@/services/timeEntryService';
import { getEmployees } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import type { TimeEntry, Employee } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';

const timeEntryRowSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Gültiges Datum erforderlich.",
  }),
  totalHours: z.coerce.number().positive({ message: "Stunden müssen positiv sein." }),
});

const quickTimeEntryFormSchema = z.object({
  employeeId: z.string().min(1, "Bitte wählen Sie einen Mitarbeiter aus."),
  entries: z.array(timeEntryRowSchema).min(1, "Es muss mindestens ein Eintrag vorhanden sein."),
});

type QuickTimeEntryFormValues = z.infer<typeof quickTimeEntryFormSchema>;

interface QuickTimeEntryFormProps {
  projectId: string;
  onSave: () => void;
  onOpenChange: (open: boolean) => void;
}

export function QuickTimeEntryForm({ projectId, onSave, onOpenChange }: QuickTimeEntryFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();

  const form = useForm<QuickTimeEntryFormValues>({
    resolver: zodResolver(quickTimeEntryFormSchema),
    defaultValues: {
      employeeId: '',
      entries: [{ date: new Date().toISOString().split('T')[0], totalHours: 8 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      const employeeData = await getEmployees();
      setEmployees(employeeData);
    };
    fetchEmployees();
  }, []);

  const onSubmit = async (data: QuickTimeEntryFormValues) => {
    const timeEntries: Omit<TimeEntry, 'id' | 'createdAt'>[] = data.entries.map(entry => {
        const hours = entry.totalHours;
        const durationMinutes = hours * 60;
        const pauseMinutes = 45; // Fixed pause time
        const netWorkingTimeMinutes = durationMinutes - pauseMinutes;

        if (netWorkingTimeMinutes <= 0) {
            toast({
                title: "Ungültige Arbeitszeit",
                description: `Die Nettoarbeitszeit für den ${entry.date} muss größer als Null sein (Gesamtzeit - 45min Pause).`,
                variant: "destructive",
            });
            throw new Error("Invalid net working time");
        }

        const startTimeMinutes = 8 * 60; // Assume a start time of 8:00 AM
        const endTimeMinutes = startTimeMinutes + durationMinutes;

        const formatTime = (minutes: number): string => {
            const h = Math.floor(minutes / 60).toString().padStart(2, '0');
            const m = (minutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        return {
            projectId,
            employeeId: data.employeeId,
            date: entry.date,
            startTime: formatTime(startTimeMinutes),
            endTime: formatTime(endTimeMinutes),
            pauseTime: pauseMinutes,
            activities: 'Schnelleingabe',
            totalTime: hours,
        };
    });

    try {
        await saveMultipleTimeEntries(timeEntries);
        toast({ title: "Arbeitszeiten erfasst", description: "Die Arbeitszeiten wurden erfolgreich gespeichert." });
        onSave();
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to save multiple time entries", error);
        if (error.message !== "Invalid net working time") {
            toast({
                title: "Fehler beim Speichern",
                description: "Die Arbeitszeiten konnten nicht gespeichert werden.",
                variant: "destructive"
            });
        }
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Mitarbeiter</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Mitarbeiter auswählen" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage className="col-span-4 text-right" />
                    </FormItem>
                )}
            />

        <div className="space-y-4">
            {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg">
                <div className="grid flex-1 grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`entries.${index}.date`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Datum</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`entries.${index}.totalHours`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stunden</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.5" placeholder="z.B. 8.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                >
                <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            ))}
        </div>

        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ date: new Date().toISOString().split('T')[0], totalHours: 8 })}
            className="gap-1 justify-self-start"
        >
            <PlusCircle className="h-4 w-4" />
            Zeile hinzufügen
        </Button>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit">Alle Speichern</Button>
        </div>
        </form>
    </Form>
  );
}
