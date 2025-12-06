
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ImageIcon, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SiteLog } from '@/shared/types';
import { deleteSiteLog } from '@/client/services/siteLogService';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';

interface SiteLogTableProps {
  projectId: string;
  siteLogs: SiteLog[];
  loading: boolean;
  onEdit: (siteLog: SiteLog) => void;
  onSiteLogDeleted: () => void;
}

export function SiteLogTable({ projectId, siteLogs, loading, onEdit, onSiteLogDeleted }: SiteLogTableProps) {
  const { toast } = useToast();
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSiteLog(id);
      toast({
        title: 'Eintrag gelöscht',
        description: 'Der Baustellendokumentationseintrag wurde erfolgreich entfernt.',
      });
      onSiteLogDeleted(); // Callback to parent to refresh the list
    } catch (error) {
      console.error('Failed to delete site log:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Der Baustellendokumentationseintrag konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleViewImages = (imageUrls: string[]) => {
    setSelectedImages(imageUrls);
    setIsImageGalleryOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Beschreibung</TableHead>
            <TableHead className="hidden md:table-cell">Materialien</TableHead>
            <TableHead className="hidden lg:table-cell">Probleme</TableHead>
            <TableHead className="text-center">Bilder</TableHead>
            <TableHead>
              <span className="sr-only">Aktionen</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-48" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell className="text-center">
                    <Skeleton className="h-8 w-8 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))
          ) : siteLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Keine Einträge für dieses Projekt gefunden.
              </TableCell>
            </TableRow>
          ) : (
            siteLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.date}</TableCell>
                <TableCell className="max-w-[200px] truncate">{log.description}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[150px] truncate">{log.materials}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-[150px] truncate">{log.problems}</TableCell>
                <TableCell className="text-center">
                  {log.imageUrls && log.imageUrls.length > 0 ? (
                    <Button variant="ghost" size="icon" onClick={() => handleViewImages(log.imageUrls)}>
                      <ImageIcon className="h-4 w-4" />
                       ({log.imageUrls.length})
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menü umschalten</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(log)}>Bearbeiten</DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">Löschen</DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird der Baustellendokumentationseintrag dauerhaft gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(log.id)}>Löschen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Image Gallery Dialog */}
      <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Bilder</DialogTitle>
            <DialogDescription>Vorschau der hochgeladenen Bilder.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {selectedImages.map((imageUrl, index) => (
              <div key={index} className="relative w-full h-40 overflow-hidden rounded-md">
                <img
                  src={imageUrl}
                  alt={`Baustellenbild ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                 <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                    aria-label={`Bild ${index + 1} in neuem Tab öffnen`}
                  >
                    <Eye className="h-4 w-4" />
                  </a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
