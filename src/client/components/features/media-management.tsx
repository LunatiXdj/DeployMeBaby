
'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { compressImage, blobToFile, formatFileSize } from '@/client/lib/imageCompression';

export default function MediaManagement() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { toast } = useToast();

  const fetchImages = async () => {
    const storage = getStorage();
    const storageRef = ref(storage, 'references');
    const result = await listAll(storageRef);
    const urls = await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
    setImages(urls);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(`Komprimiere: ${file.name} (${formatFileSize(file.size)})...`);

    try {
      // Komprimiere das Bild
      const compressedBlob = await compressImage(file, 500, 0.8);
      const compressedFile = blobToFile(compressedBlob, file.name);

      setUploadProgress(
        `Lädt hoch: ${file.name} (${formatFileSize(file.size)} → ${formatFileSize(compressedBlob.size)})...`
      );

      const storage = getStorage();
      const storageRef = ref(storage, `references/${file.name}`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      setImages((prev) => [...prev, url]);

      const savings = Math.round(((file.size - compressedBlob.size) / file.size) * 100);
      toast({
        title: 'Bild erfolgreich hochgeladen',
        description: `Datengröße um ${savings}% reduziert`
      });
    } catch (error) {
      toast({ title: 'Fehler beim Hochladen des Bildes', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (url: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, url);

    try {
      await deleteObject(storageRef);
      setImages((prev) => prev.filter((image) => image !== url));
      toast({ title: 'Bild erfolgreich gelöscht' });
    } catch (error) {
      toast({ title: 'Fehler beim Löschen des Bildes', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">{uploadProgress}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((url) => (
          <div key={url} className="relative">
            <Image src={url} alt="Referenzbild" width={200} height={200} className="object-cover w-full h-full" />
            <Button variant="destructive" size="sm" onClick={() => handleDelete(url)} className="absolute top-2 right-2">
              Löschen
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
