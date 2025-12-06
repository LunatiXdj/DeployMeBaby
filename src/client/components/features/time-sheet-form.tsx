
'use client';

import { useState, useEffect } from 'react';
import { TimeSheetProtocol, Employee } from '@/shared/types';
import { Input } from '@/client/components/ui/input';
import { Label } from '@/client/components/ui/label';
import { Textarea } from '@/client/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/client/components/ui/select';
import { getEmployees } from '@/client/services/employeeService';

interface TimeSheetFormProps {
  initialData: Partial<TimeSheetProtocol>;
  onDataChange: (data: Partial<TimeSheetProtocol>) => void;
  disabled?: boolean;
}

export function TimeSheetForm({ initialData, onDataChange, disabled }: TimeSheetFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (name: keyof TimeSheetProtocol, value: any) => {
    onDataChange({ [name]: value });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Arbeitszeitnachweis</h3>
      
      <div className="grid gap-2">
        <Label htmlFor="employeeId">Mitarbeiter</Label>
        <Select 
            value={initialData.employeeId || ''} 
            onValueChange={(value) => handleChange('employeeId', value)}
            disabled={disabled}
            required
        >
            <SelectTrigger id="employeeId">
                <SelectValue placeholder="Mitarbeiter auswählen" />
            </SelectTrigger>
            <SelectContent>
                {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <Label htmlFor="startTime">Arbeitsbeginn</Label>
            <Input 
                id="startTime" 
                name="startTime" 
                type="time" 
                value={initialData.startTime || ''} 
                onChange={(e) => handleChange('startTime', e.target.value)} 
                disabled={disabled} 
                required
            />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="endTime">Arbeitsende</Label>
            <Input 
                id="endTime" 
                name="endTime" 
                type="time" 
                value={initialData.endTime || ''} 
                onChange={(e) => handleChange('endTime', e.target.value)} 
                disabled={disabled} 
                required
            />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="pauseTime">Pause (in Minuten)</Label>
        <Input 
            id="pauseTime" 
            name="pauseTime" 
            type="number" 
            value={initialData.pauseTime || ''} 
            onChange={(e) => handleChange('pauseTime', e.target.value)} 
            placeholder="z.B. 45" 
            disabled={disabled} 
            required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="activities">Ausgeführte Tätigkeiten</Label>
        <Textarea 
            id="activities" 
            name="activities" 
            value={initialData.activities || ''} 
            onChange={(e) => handleChange('activities', e.target.value)} 
            placeholder="Beschreiben Sie die durchgeführten Arbeiten..." 
            disabled={disabled}
            required
        />
      </div>
    </div>
  );
}
