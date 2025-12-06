
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProject } from '@/services/projectService';
import type { Project, PlannedEvent } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const plannedEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Titel ist erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  startTime: z.string().min(1, 'Startzeit ist erforderlich'),
  endTime: z.string().min(1, 'Endzeit ist erforderlich'),
}).refine(data => {
    const start = new Date(`${data.date}T${data.startTime}`);
    const end = new Date(`${data.date}T${data.endTime}`);
    return end > start;
}, {
    message: "Endzeit muss nach der Startzeit liegen",
    path: ["endTime"],
});

const projectPlanningSchema = z.object({
  plannedEvents: z.array(plannedEventSchema),
});

type ProjectPlanningFormValues = z.infer<typeof projectPlanningSchema>;

interface ProjectPlanningFormProps {
  project: Project;
  onSave: () => void;
  onCancel: () => void;
}

export function ProjectPlanningForm({ project, onSave, onCancel }: ProjectPlanningFormProps) {
  const { toast } = useToast();
  const { control, handleSubmit, formState: { errors } } = useForm<ProjectPlanningFormValues>({
    resolver: zodResolver(projectPlanningSchema),
    defaultValues: {
      plannedEvents: project.plannedEvents || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "plannedEvents",
  });

  const onSubmit = async (data: ProjectPlanningFormValues) => {
    try {
      await updateProject(project.id, { plannedEvents: data.plannedEvents });
      toast({
        title: "Projektplanung gespeichert",
        description: "Die geplanten Einsätze wurden erfolgreich aktualisiert.",
        className: "bg-accent text-accent-foreground"
      });
      onSave();
    } catch (error) {
      console.error("Failed to save project planning", error);
      toast({
        title: "Fehler beim Speichern",
        description: "Die Projektplanung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md relative">
          <div className="md:col-span-4">
             <Label htmlFor={`plannedEvents.${index}.title`}>Titel</Label>
             <Controller
                name={`plannedEvents.${index}.title`}
                control={control}
                render={({ field }) => <Input {...field} id={`plannedEvents.${index}.title`} />}
              />
              {errors.plannedEvents?.[index]?.title && <p className="text-destructive text-sm mt-1">{errors.plannedEvents[index]?.title?.message}</p>}
          </div>
          <div>
            <Label htmlFor={`plannedEvents.${index}.date`}>Datum</Label>
            <Controller
              name={`plannedEvents.${index}.date`}
              control={control}
              render={({ field }) => <Input type="date" {...field} id={`plannedEvents.${index}.date`} />}
            />
            {errors.plannedEvents?.[index]?.date && <p className="text-destructive text-sm mt-1">{errors.plannedEvents[index]?.date?.message}</p>}
          </div>
          <div>
            <Label htmlFor={`plannedEvents.${index}.startTime`}>Startzeit</Label>
            <Controller
              name={`plannedEvents.${index}.startTime`}
              control={control}
              render={({ field }) => <Input type="time" {...field} id={`plannedEvents.${index}.startTime`} />}
            />
             {errors.plannedEvents?.[index]?.startTime && <p className="text-destructive text-sm mt-1">{errors.plannedEvents[index]?.startTime?.message}</p>}
          </div>
          <div>
            <Label htmlFor={`plannedEvents.${index}.endTime`}>Endzeit</Label>
            <Controller
              name={`plannedEvents.${index}.endTime`}
              control={control}
              render={({ field }) => <Input type="time" {...field} id={`plannedEvents.${index}.endTime`} />}
            />
             {errors.plannedEvents?.[index]?.endTime && <p className="text-destructive text-sm mt-1">{errors.plannedEvents[index]?.endTime?.message}</p>}
          </div>
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      </div>

       <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), title: '', date: '', startTime: '', endTime: '' })} className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Einsatz hinzufügen
      </Button>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit">Speichern</Button>
      </div>
    </form>
  );
}
