'use client';

import { useState, useEffect } from 'react';
import { getFirebaseDb, getFirebaseStorage } from '@/client/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card';
import { Button } from '@/client/components/ui/button';
import { Input } from '@/client/components/ui/input';
import { Textarea } from '@/client/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/components/ui/select';
import { useToast } from '@/client/hooks/use-toast';
import type { Reference, ReferenceCategory } from '@/shared/types';
import { compressImage, blobToFile, formatFileSize } from '@/client/lib/imageCompression';

const categories: ReferenceCategory[] = [
    'Bad-Umbauten (Wanne zu Dusche, Dusche zu Dusche)',
    'Hausmeisterdienste',
    'Objektpflege & Betreuung',
    'Montageservices'
];

export function ReferenceManagement() {
    const [references, setReferences] = useState<Reference[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [category, setCategory] = useState<ReferenceCategory>(categories[0]);
    const [imageScale, setImageScale] = useState<'cover' | 'contain'>('cover');
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchReferences = async () => {
            try {
                const db = getFirebaseDb();
                const querySnapshot = await getDocs(collection(db, 'references'));
                const refs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reference));
                setReferences(refs);
            } catch (err) {
                console.error('ReferenceManagement: failed to fetch references', err);
            }
        };
        fetchReferences();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !text || (!image && !editingId)) {
            toast({ title: 'Fehler', description: 'Bitte füllen Sie alle Felder aus und wählen Sie ein Bild aus.', variant: 'destructive' });
            return;
        }

        try {
            let imageUrl = editingId ? references.find(r => r.id === editingId)?.imageUrl : '';

            if (image) {
                const storage = getFirebaseStorage();

                // Komprimiere das Bild
                const compressedBlob = await compressImage(image, 500, 0.8);
                const compressedFile = blobToFile(compressedBlob, image.name);

                const savings = Math.round(((image.size - compressedBlob.size) / image.size) * 100);
                console.log(`Bild komprimiert: ${formatFileSize(image.size)} → ${formatFileSize(compressedBlob.size)} (${savings}% Ersparnis)`);

                const storageRef = ref(storage, `references/${Date.now()}_${image.name}`);
                await uploadBytes(storageRef, compressedFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            if (!imageUrl) {
                toast({ title: 'Fehler', description: 'Bild-URL konnte nicht erstellt werden.', variant: 'destructive' });
                return;
            }

            const db = getFirebaseDb();
            const refData = { title, text, category, imageUrl, imageScale };

            if (editingId) {
                await updateDoc(doc(db, 'references', editingId), refData);
                setReferences(references.map(r => r.id === editingId ? { ...r, ...refData } : r));
                toast({ title: 'Erfolg', description: 'Referenz aktualisiert.' });
            } else {
                const docRef = await addDoc(collection(db, 'references'), refData);
                setReferences([...references, { id: docRef.id, ...refData }]);
                toast({ title: 'Erfolg', description: 'Referenz hinzugefügt.' });
            }

            // Reset form
            setTitle('');
            setText('');
            setImage(null);
            setCategory(categories[0]);
            setImageScale('cover');
            setEditingId(null);

        } catch (error) {
            console.error("Error saving reference:", error);
            toast({ title: 'Fehler', description: 'Fehler beim Speichern der Referenz.', variant: 'destructive' });
        }
    };

    const handleEdit = (ref: Reference) => {
        setEditingId(ref.id);
        setTitle(ref.title);
        setText(ref.text);
        setCategory(ref.category);
        setImageScale(ref.imageScale);
        setImage(null);
    };

    const handleDelete = async (id: string) => {
        try {
            const refToDelete = references.find(r => r.id === id);
            if (refToDelete?.imageUrl) {
                const storage = getFirebaseStorage();
                const imageRef = ref(storage, refToDelete.imageUrl);
                await deleteObject(imageRef);
            }
            const db = getFirebaseDb();
            await deleteDoc(doc(db, 'references', id));
            setReferences(references.filter(r => r.id !== id));
            toast({ title: 'Erfolg', description: 'Referenz gelöscht.' });
        } catch (error) {
            console.error("Error deleting reference:", error);
            toast({ title: 'Fehler', description: 'Fehler beim Löschen der Referenz.', variant: 'destructive' });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>{editingId ? 'Referenz bearbeiten' : 'Neue Referenz erstellen'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} />
                        <Textarea placeholder="Text" value={text} onChange={e => setText(e.target.value)} />
                        <Select value={category} onValueChange={(value: ReferenceCategory) => setCategory(value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input type="file" onChange={handleImageChange} />
                        <Select value={imageScale} onValueChange={(value: 'cover' | 'contain') => setImageScale(value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cover">Cover</SelectItem>
                                <SelectItem value="contain">Contain</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit">{editingId ? 'Aktualisieren' : 'Erstellen'}</Button>
                        {editingId && <Button variant="ghost" onClick={() => setEditingId(null)}>Abbrechen</Button>}
                    </form>
                </CardContent>
            </Card>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {references.map(ref => (
                    <Card key={ref.id}>
                        <img src={ref.imageUrl} alt={ref.title} className={`w-full h-48 object-${ref.imageScale}`} />
                        <CardHeader>
                            <CardTitle>{ref.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{ref.category}</p>
                            <p>{ref.text}</p>
                            <div className="flex gap-2 mt-4">
                                <Button size="sm" onClick={() => handleEdit(ref)}>Bearbeiten</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(ref.id)}>Löschen</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
