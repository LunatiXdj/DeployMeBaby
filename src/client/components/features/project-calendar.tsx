
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, EventProps, stringOrDate, Event as BigCalendarEvent } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps, DragFromOutsideItemArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useToast } from '@/hooks/use-toast';
import { getProjects, saveProject } from '@/client/services/projectService';
import { Project, PlannedEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/client/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

// Explicitly type the DnDCalendar component for better type inference
const DnDCalendar = withDragAndDrop(Calendar as React.ComponentType<any>) as React.ComponentType<withDragAndDropProps<FullCalendarEvent>>;


const statusColors: Record<Project['status'], string> = {
    'Kundenportal NEU': 'hsl(var(--muted-foreground))',
    offen: 'hsl(var(--muted-foreground))',
    Planung: 'hsl(var(--chart-4))',
    Aktiv: 'hsl(var(--chart-1))',
    Restarbeiten: 'hsl(var(--chart-5))',
    Abgeschlossen: 'hsl(var(--chart-2))',
    'on-hold': 'hsl(var(--secondary-foreground))',
    'Administrativ': 'hsl(var(--purple-500))',
};

const plannedEventColor = '#4ade80';

// Interface for events that represent the entire project duration
interface CalendarProjectEvent extends Project {
    type: 'project';
    start: Date;
    end: Date;
    title: string;
    allDay?: boolean;
}

// Interface for specific, planned events within a project
// Omit 'start' and 'end' from PlannedEvent to avoid type conflict (string vs Date)
interface CalendarPlannedEvent extends Omit<PlannedEvent, 'start' | 'end'> {
    type: 'planned';
    project: Project;
    start: Date;
    end: Date;
}

type FullCalendarEvent = CalendarProjectEvent | CalendarPlannedEvent;

const CustomEvent = ({ event }: EventProps<FullCalendarEvent>) => {
    const isPlanned = event.type === 'planned';
    const projectStatus = (isPlanned ? (event as CalendarPlannedEvent).project.status : event.status) as Project['status'];
    const backgroundColor = isPlanned ? plannedEventColor : statusColors[projectStatus];
    
    const titleText = isPlanned 
        ? (event as CalendarPlannedEvent).title 
        : `${(event as CalendarProjectEvent).projectNumber}: ${(event as CalendarProjectEvent).projectName}`;

    return (
      <div style={{ backgroundColor, color: 'white' }} className="rounded-md p-1 h-full text-xs overflow-hidden">
          <div className="rbc-event-content whitespace-normal break-words">
              <strong>{isPlanned ? 'Einsatz' : 'Projekt'}</strong>
              <p>{titleText}</p>
          </div>
      </div>
    );
};


export function ProjectCalendar() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAndSetEvents = useCallback(async () => {
    setLoading(true);
    try {
      const projects = await getProjects();
      setAllProjects(projects);
    } catch (error) {
      toast({ title: "Fehler beim Laden der Projekte", variant: "destructive" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndSetEvents();
  }, [fetchAndSetEvents]);

  const { scheduledEvents, unscheduledProjects } = useMemo<{ scheduledEvents: FullCalendarEvent[]; unscheduledProjects: Project[] }>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allEvents: FullCalendarEvent[] = [];
    const unscheduled: Project[] = [];

    allProjects.forEach((p: Project) => {
      if (p.startDate && p.endDate) {
        let currentStatus = p.status;
        if (p.status === 'Planung' && new Date(p.startDate) <= today) {
          currentStatus = 'Aktiv';
          saveProject(p.id, { status: 'Aktiv' }).catch(err => console.error("Failed to auto-update status", err));
        }
        allEvents.push({
          ...p,
          type: 'project',
          title: `${p.projectNumber}: ${p.projectName}`,
          start: new Date(p.startDate),
          end: addDays(new Date(p.endDate), 1),
          status: currentStatus,
          allDay: true,
        });
      } else {
        if(p.status !== 'Abgeschlossen' && p.status !== 'on-hold') {
          unscheduled.push(p);
        }
      }
      
      if (p.plannedEvents) {
        p.plannedEvents.forEach(pe => {
          allEvents.push({
            ...pe,
            type: 'planned',
            project: p,
            title: pe.title,
            start: new Date(pe.start),
            end: new Date(pe.end),
          });
        });
      }
    });
    return { scheduledEvents, unscheduledProjects };
  }, [allProjects]);

  const handleEventDrop: withDragAndDropProps<FullCalendarEvent>['onEventDrop'] = useCallback(
    async ({ event, start, end }) => {
        const fullEvent = event as FullCalendarEvent;
        if (fullEvent.type === 'planned') {
          toast({ title: "Aktion nicht erlaubt", description: "Geplante Einsätze können nicht verschoben werden.", variant: "destructive"});
          return;
      }

      const { id, projectName } = fullEvent;
      const updatedProjectData = {
          startDate: format(new Date(start), 'yyyy-MM-dd'),
          endDate: format(addDays(new Date(end), -1), 'yyyy-MM-dd'),
      };

      try {
          await saveProject(id, updatedProjectData);
          toast({ title: "Projekt geplant", description: `"${projectName}" wurde neu terminiert.` });
          fetchAndSetEvents();
      } catch (error) {
          toast({ title: "Fehler beim Speichern", variant: "destructive" });
          console.error(error);
      }
    },
    [toast, fetchAndSetEvents]
  );
  
  const handleSelectSlot = useCallback(
    async ({ start, end }: { start: Date, end: Date }) => {
      // Logic for creating a new event can go here
    },
    []
  );

  const onDropFromOutside: withDragAndDropProps<FullCalendarEvent>['onDropFromOutside'] = useCallback(
    async (args) => {
      const { start, end } = args;
      // The resource object is dynamically attached by react-dnd, so we assert its type
      const resource = (args as any).resource as { event: Project } | undefined;

      if (!resource || !resource.event) return;

      const event = resource.event;
      const { id, projectName, status } = event;
      const updatedProjectData: Partial<Project> = {
          startDate: format(new Date(start), 'yyyy-MM-dd'),
          endDate: format(addDays(new Date(end), -1), 'yyyy-MM-dd'),
      };
      
      if (status !== 'Administrativ') {
          updatedProjectData.status = 'Planung';
      }

       try {
          await saveProject(id, updatedProjectData);
          toast({ title: "Projekt geplant", description: `"${projectName}" wurde neu terminiert.` });
          fetchAndSetEvents();
      } catch (error) {
          toast({ title: "Fehler beim Speichern", variant: "destructive" });
          console.error(error);
      }
    },
    [fetchAndSetEvents, toast]
  );

  if (loading) {
      return (
          <Card>
              <CardHeader>
                <CardTitle>Projektkalender</CardTitle>
                <CardDescription>Planen Sie Ihre Projekte visuell per Drag & Drop.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-[70vh] w-full" />
              </CardContent>
          </Card>
      );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle>Projektkalender</CardTitle>
          <CardDescription>Planen Sie Ihre Projekte visuell. Ziehen Sie Projekte aus der linken Liste in den Kalender.</CardDescription>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-[250px_1fr] gap-6">
          <div>
            <h3 className='font-semibold mb-2'>Ungeplante Projekte</h3>
            <ScrollArea className="h-[65vh] border rounded-md p-2">
              <div className='flex flex-col gap-2'>
              {unscheduledProjects.map((project: Project) => (
                <DraggableEvent key={project.id} event={project} />
              ))}
              {unscheduledProjects.length === 0 && <p className='text-sm text-muted-foreground p-2'>Alle Projekte sind geplant.</p>}
              </div>
            </ScrollArea>
          </div>
          <div className="h-[70vh] flex flex-col">
            <DnDCalendar
              className="flex-1"
              localizer={localizer}
              events={scheduledEvents}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventDrop}
              onDropFromOutside={onDropFromOutside}
              onSelectSlot={handleSelectSlot}
              draggableAccessor={(event: FullCalendarEvent) => event.type === 'project'}
              resizableAccessor={(event: FullCalendarEvent) => event.type === 'project'}
              resizable
              selectable
              culture='de'
              messages={{
                  next: "Nächster",
                  previous: "Vorheriger",
                  today: "Heute",
                  month: "Monat",
                  week: "Woche",
                  day: "Tag",
                  agenda: "Agenda",
                  date: "Datum",
                  time: "Zeit",
                  event: "Ereignis",
                  noEventsInRange: "Keine Termine in diesem Zeitraum.",
                  showMore: (total: number) => `+ ${total} weitere`,
              }}
               components={{
                  event: CustomEvent
               }}
            />
          </div>
        </CardContent>
      </Card>
    </DndProvider>
  );
}

function DraggableEvent({ event }: { event: Project }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'event',
    item: { resource: { event } },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any} // Cast to any to resolve type conflict with legacy refs
      className={`p-2 border rounded-md cursor-move text-sm ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ backgroundColor: statusColors[event.status] || '#a1a1aa', color: 'white' }}
    >
      <strong>{event.projectNumber}</strong>: {event.projectName}
    </div>
  );
}
