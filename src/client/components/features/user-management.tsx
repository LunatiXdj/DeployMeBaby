
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getUsers, updateUserRole, type UserData } from '@/client/services/userService';
import type { UserRole } from '@/types';
import { useAuth } from '@/contexts/auth-context';

const roleMapping: Record<UserRole, { label: string; className: string }> = {
    admin: { label: 'Admin', className: 'bg-primary/20 text-primary-foreground border-primary/30'},
    user: { label: 'Benutzer', className: 'bg-muted text-muted-foreground'},
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { authUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast({ title: "Fehler", description: "Benutzer konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);
  
  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
        await updateUserRole(uid, newRole);
        toast({ title: "Rolle aktualisiert", description: `Die Rolle des Benutzers wurde erfolgreich auf ${newRole} geändert.`, className: "bg-accent text-accent-foreground"});
        fetchUsers();
    } catch (error) {
        toast({ title: "Fehler", description: "Die Rolle konnte nicht geändert werden.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benutzerverwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Benutzer und ihre Rollen in der Anwendung.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-Mail</TableHead>
              <TableHead className="w-[180px] text-center">Rolle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Select 
                        value={user.role} 
                        onValueChange={(newRole: UserRole) => handleRoleChange(user.uid, newRole)}
                        disabled={user.uid === authUser?.uid} // Prevent admin from changing their own role
                    >
                      <SelectTrigger>
                        <SelectValue>
                            <Badge variant="outline" className={roleMapping[user.role]?.className}>
                                {roleMapping[user.role]?.label}
                            </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleMapping).map(([role, {label}]) => (
                            <SelectItem key={role} value={role}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
