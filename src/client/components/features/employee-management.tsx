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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MoreHorizontal, User, Trash2, Pencil } from 'lucide-react';
import type { Employee } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { useToast } from "@/hooks/use-toast";
import { getEmployees, saveEmployee, deleteEmployee } from '@/services/employeeService';
import { getFirebaseAuth } from '@/client/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);


export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
        setLoading(true);
        const employeesFromDb = await getEmployees();
        setEmployees(employeesFromDb);
    } catch (error) {
        console.error("Failed to fetch employees from Firestore", error);
        toast({
            title: "Fehler beim Laden",
            description: "Die Mitarbeiterdaten konnten nicht geladen werden.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, [toast]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      try {
        await deleteEmployee(id);
        setEmployees(employees.filter(e => e.id !== id));
        toast({
            title: "Mitarbeiter gelöscht",
            description: "Der Mitarbeiter wurde erfolgreich entfernt.",
        });
      } catch (error) {
        console.error("Failed to delete employee", error);
        toast({
            title: "Fehler beim Löschen",
            description: "Der Mitarbeiter konnte nicht gelöscht werden.",
            variant: "destructive",
        })
      }
  }

  const handleSave = async (formData: FormData, files: { photo?: File, contract?: File, documents?: File[] }) => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
        console.error("User not authenticated!");
        toast({
            title: "Nicht authentifiziert",
            description: "Sie müssen angemeldet sein, um zu speichern.",
            variant: "destructive",
        });
        return;
    }
    console.log("User is authenticated:", auth.currentUser.uid);

    const employeeData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        zipCode: formData.get('zipCode') as string,
        city: formData.get('city') as string,
        birthDate: formData.get('birthDate') as string,
        phone: formData.get('phone') as string,
        mobile: formData.get('mobile') as string,
        hasDriversLicense: formData.get('hasDriversLicense') === 'on',
        licenseClasses: formData.get('licenseClasses') as string,
        bankName: formData.get('bankName') as string,
        iban: formData.get('iban') as string,
        bic: formData.get('bic') as string,
        hourlyRate: parseFloat(formData.get('hourlyRate') as string),
        taxId: formData.get('taxId') as string,
        socialSecurityNumber: formData.get('socialSecurityNumber') as string,
        healthInsuranceNumber: formData.get('healthInsuranceNumber') as string,
    };

    try {
        const savedEmployee = await saveEmployee(editingEmployee ? editingEmployee.id : null, employeeData, files);
        toast({ title: editingEmployee ? "Mitarbeiter aktualisiert" : "Mitarbeiter erstellt", className: editingEmployee ? "" : "bg-accent text-accent-foreground" });
        fetchEmployees();
    } catch (error) {
        console.error("Failed to save employee", error);
        toast({
            title: "Fehler beim Speichern",
            description: "Der Mitarbeiter konnte nicht gespeichert werden.",
            variant: "destructive"
        });
    }
    
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mitarbeiterverwaltung</CardTitle>
          <CardDescription>
            Verwalten Sie alle Mitarbeiter und deren Informationen.
          </CardDescription>
        </div>
        <Button onClick={handleAddNew} size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Neuer Mitarbeiter
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Mitarbeiter</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead className="hidden md:table-cell">Stundensatz</TableHead>
              <TableHead className="hidden lg:table-cell">Adresse</TableHead>
              <TableHead>
                <span className="sr-only">Aktionen</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className='flex items-center gap-2'><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-32" /></div></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : (
                employees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                                    <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{employee.firstName} {employee.lastName}</span>
                            </div>
                        </TableCell>
                        <TableCell>{employee.phone || employee.mobile}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(employee.hourlyRate)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{employee.address}, {employee.zipCode} {employee.city}</TableCell>
                        <TableCell>
                            <EmployeeActions onEdit={() => handleEdit(employee)} onDelete={() => handleDelete(employee.id)} />
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <EmployeeFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        employee={editingEmployee}
        onSave={handleSave}
       />
    </Card>
  );
}

function EmployeeActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => Promise<void>; }) {
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
                    <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Bearbeiten</DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Löschen</DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Mitarbeiter dauerhaft gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete()}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function EmployeeFormDialog({ open, onOpenChange, employee, onSave }: { open: boolean, onOpenChange: (open: boolean) => void, employee: Employee | null, onSave: (data: FormData, files: { photo?: File, contract?: File, documents?: File[] }) => void }) {
    
    const [files, setFiles] = useState<{ photo?: File, contract?: File, documents?: File[] }>({});
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave(formData, files);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{employee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}</DialogTitle>
              <DialogDescription>
                Füllen Sie die Stammdaten unten aus. Klicken Sie auf Speichern, wenn Sie fertig sind.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Vorname</Label>
                        <Input id="firstName" name="firstName" defaultValue={employee?.firstName} required/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Nachname</Label>
                        <Input id="lastName" name="lastName" defaultValue={employee?.lastName} required/>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="address">Adresse (Straße, Hausnr.)</Label>
                    <Input id="address" name="address" defaultValue={employee?.address}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="zipCode">PLZ</Label>
                        <Input id="zipCode" name="zipCode" defaultValue={employee?.zipCode}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="city">Ort</Label>
                        <Input id="city" name="city" defaultValue={employee?.city}/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" name="phone" defaultValue={employee?.phone}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mobile">Mobil</Label>
                        <Input id="mobile" name="mobile" defaultValue={employee?.mobile}/>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="birthDate">Geburtsdatum</Label>
                        <Input id="birthDate" name="birthDate" type="date" defaultValue={employee?.birthDate}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="hourlyRate">Stundensatz (€)</Label>
                        <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" defaultValue={employee?.hourlyRate} required/>
                    </div>
                </div>
                <div className="grid gap-2">
                     <Label>Führerschein</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="hasDriversLicense" name="hasDriversLicense" defaultChecked={employee?.hasDriversLicense} />
                        <Label htmlFor="hasDriversLicense">Führerschein vorhanden</Label>
                    </div>
                     <Input id="licenseClasses" name="licenseClasses" placeholder="Klassen, z.B. B, BE" defaultValue={employee?.licenseClasses}/>
                </div>
                <hr className="my-4"/>
                <h3 className="text-lg font-semibold">Finanzielle Informationen</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="bankName">Bankname</Label>
                        <Input id="bankName" name="bankName" defaultValue={employee?.bankName}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bic">BIC</Label>
                        <Input id="bic" name="bic" defaultValue={employee?.bic}/>
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input id="iban" name="iban" defaultValue={employee?.iban}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="taxId">Steuer-ID</Label>
                        <Input id="taxId" name="taxId" defaultValue={employee?.taxId}/>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer</Label>
                        <Input id="socialSecurityNumber" name="socialSecurityNumber" defaultValue={employee?.socialSecurityNumber}/>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="healthInsuranceNumber">Krankenversicherungsnummer</Label>
                    <Input id="healthInsuranceNumber" name="healthInsuranceNumber" defaultValue={employee?.healthInsuranceNumber}/>
                </div>
                 <hr className="my-4"/>
                <h3 className="text-lg font-semibold">Dokumente</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="photo">Foto</Label>
                        <Input id="photo" name="photo" type="file" onChange={e => setFiles(f => ({...f, photo: e.target.files?.[0]}))}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="contract">Arbeitsvertrag</Label>
                        <Input id="contract" name="contract" type="file" onChange={e => setFiles(f => ({...f, contract: e.target.files?.[0]}))}/>
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="documents">Weitere Dokumente</Label>
                    <Input id="documents" name="documents" type="file" multiple onChange={e => setFiles(f => ({...f, documents: Array.from(e.target.files || [])}))}/>
                </div>
            </div>
            <DialogFooter className="pt-4 border-t">
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