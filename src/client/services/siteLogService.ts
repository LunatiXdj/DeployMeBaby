import { getFirebaseDb, getFirebaseStorage } from '@/client/lib/firebase';
import type { SiteLog } from '@/shared/types';
import { collection, query, where, getDocs, doc, deleteDoc, addDoc, updateDoc, getDoc, QueryDocumentSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage, blobToFile, formatFileSize } from '@/client/lib/imageCompression';

function getSiteLogsCollection() {
  const db = getFirebaseDb();
  return collection(db, 'siteLogs');
}

function siteLogFromDoc(doc: QueryDocumentSnapshot): SiteLog {
  const data = doc.data();
  return { id: doc.id, ...data } as SiteLog;
}

export async function getSiteLogs(projectId: string): Promise<SiteLog[]> {
  const q = query(getSiteLogsCollection(), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(siteLogFromDoc);
}

// Backwards-compatible alias used by some server/client imports
export async function getSiteLogsByProjectId(projectId: string): Promise<SiteLog[]> {
  return await getSiteLogs(projectId);
}

export async function getSiteLog(id: string): Promise<SiteLog | null> {
  const docRef = doc(getSiteLogsCollection(), id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? siteLogFromDoc(docSnap as QueryDocumentSnapshot) : null;
}

export async function saveSiteLog(log: Partial<Omit<SiteLog, 'id'>> & { id?: string }): Promise<SiteLog> {
  const { id, ...logData } = log;
  if (id) {
    const docRef = doc(getSiteLogsCollection(), id);
    await setDoc(docRef, { ...logData, updatedAt: new Date().toISOString() }, { merge: true });
    const updatedDoc = await getDoc(docRef);
    return siteLogFromDoc(updatedDoc as QueryDocumentSnapshot);
  } else {
    const docRef = await addDoc(getSiteLogsCollection(), { ...logData, createdAt: new Date().toISOString() });
    const newDoc = await getDoc(docRef);
    return siteLogFromDoc(newDoc as QueryDocumentSnapshot);
  }
}

export async function deleteSiteLog(id: string): Promise<void> {
  await deleteDoc(doc(getSiteLogsCollection(), id));
}

export async function deleteSiteLogImage(imagePath: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (err) {
    // ignore missing files but log for debugging
    // eslint-disable-next-line no-console
    console.error('deleteSiteLogImage failed', err);
    throw err;
  }
}

/**
 * Komprimiert und lädt Bilder mit Fortschrittsanzeige hoch
 */
export async function uploadFilesWithCompression(
  projectId: string,
  logId: string,
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<string[]> {
  const storage = getFirebaseStorage();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, `Komprimiere: ${file.name}...`);

    try {
      // Komprimiere das Bild
      const compressedBlob = await compressImage(file, 500, 0.8);
      const compressedFile = blobToFile(compressedBlob, file.name);

      const savings = Math.round(((file.size - compressedBlob.size) / file.size) * 100);
      // eslint-disable-next-line no-console
      console.log(
        `Bild ${i + 1}/${files.length} komprimiert: ${formatFileSize(file.size)} → ${formatFileSize(compressedBlob.size)} (${savings}% Ersparnis)`
      );

      onProgress?.(i + 1, files.length, `Lädt hoch: ${file.name}...`);

      const timestamp = Date.now();
      const filePath = `Baustellendokumentation/Fotos/${projectId}/${logId}/${timestamp}_${file.name}`;
      const fileRef = ref(storage, filePath);

      await uploadBytes(fileRef, compressedFile);
      const downloadUrl = await getDownloadURL(fileRef);
      uploadedUrls.push(downloadUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Fehler beim Hochladen von ${file.name}:`, error);
      throw new Error(`Fehler beim Hochladen von ${file.name}`);
    }
  }

  return uploadedUrls;
}
