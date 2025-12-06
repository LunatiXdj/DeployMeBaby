'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getArticleGroups, saveArticleGroup, deleteArticleGroup, ArticleGroup } from '@/services/articleGroupService';
import { useToast } from "@/hooks/use-toast";

export default function ArticleGroupsPage() {
  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<ArticleGroup> | null>(null);
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedGroups = await getArticleGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to fetch article groups", error);
      toast({ title: "Fehler beim Laden der Warengruppen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSave = async () => {
    if (!currentGroup || !currentGroup.name) {
      toast({ title: "Name darf nicht leer sein", variant: "destructive" });
      return;
    }
    try {
      await saveArticleGroup(currentGroup);
      setIsDialogOpen(false);
      setCurrentGroup(null);
      fetchGroups();
      toast({ title: "Warengruppe gespeichert", className: "bg-accent text-accent-foreground" });
    } catch (error) {
      console.error("Failed to save article group", error);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sind Sie sicher, dass Sie diese Warengruppe löschen möchten?")) {
      try {
        await deleteArticleGroup(id);
        fetchGroups();
        toast({ title: "Warengruppe gelöscht" });
      } catch (error) {
        console.error("Failed to delete article group", error);
        toast({ title: "Fehler beim Löschen", variant: "destructive" });
      }
    }
  };

  const openDialog = (group: Partial<ArticleGroup> | null = null) => {
    setCurrentGroup(group ? { ...group } : { name: '' });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Warengruppen</CardTitle>
            <CardDescription>Verwalten Sie hier Ihre Artikel-Warengruppen.</CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Neue Gruppe
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Laden...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentGroup?.id ? 'Warengruppe bearbeiten' : 'Neue Warengruppe erstellen'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentGroup?.name || ''}
                onChange={(e) => setCurrentGroup(prev => prev ? { ...prev, name: e.target.value } : { name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
