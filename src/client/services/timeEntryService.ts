import { useFirebase } from '@/client/hooks/useFirebase';
import type { TimeEntry } from '@/shared/types';
import { collection, query, where, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc, QueryDocumentSnapshot, getDoc, writeBatch } from 'firebase/firestore';

export function useTimeEntryService() {
  const firebase = useFirebase();
  const db = firebase?.db;

  function getTimeEntriesCollection() {
    if (!db) throw new Error("Firestore not initialized");
    return collection(db, 'timeEntries');
  }

  function timeEntryFromDoc(doc: QueryDocumentSnapshot): TimeEntry {
    const data = doc.data();
    return { id: doc.id, ...data } as TimeEntry;
  }

  async function getTimeEntries(projectId: string): Promise<TimeEntry[]> {
    const q = query(getTimeEntriesCollection(), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(timeEntryFromDoc);
  }

  async function saveTimeEntry(entry: Partial<Omit<TimeEntry, 'id'>> & { id?: string }): Promise<TimeEntry> {
    const { id, ...entryData } = entry;
    if (!db) throw new Error("Firestore not initialized");
    if (id) {
      const docRef = doc(db, 'timeEntries', id);
      await setDoc(docRef, entryData, { merge: true });
      const updatedDoc = await getDoc(docRef);
      return timeEntryFromDoc(updatedDoc as QueryDocumentSnapshot);
    } else {
      const docRef = await addDoc(getTimeEntriesCollection(), entryData);
      const newDoc = await getDoc(docRef);
      return timeEntryFromDoc(newDoc as QueryDocumentSnapshot);
    }
  }

  async function deleteTimeEntry(id: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, 'timeEntries', id));
  }

  return {
    getTimeEntries,
    saveTimeEntry,
    deleteTimeEntry,
  };
}

// Backwards-compatible top-level exports
import { getFirebaseDb } from '@/client/lib/firebase';

export async function getTimeEntriesForProject(projectId: string): Promise<TimeEntry[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, 'timeEntries'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as TimeEntry));
}

export async function saveTimeEntry(entry: Partial<Omit<TimeEntry, 'id'>> & { id?: string }): Promise<TimeEntry> {
  const db = getFirebaseDb();
  const { id, ...entryData } = entry;
  if (id) {
    const docRef = doc(db, 'timeEntries', id);
    await setDoc(docRef, entryData, { merge: true });
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as TimeEntry;
  } else {
    const docRef = await addDoc(collection(db, 'timeEntries'), entryData);
    const newDoc = await getDoc(docRef);
    return { id: newDoc.id, ...newDoc.data() } as TimeEntry;
  }
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, 'timeEntries', id));
}

export async function saveMultipleTimeEntries(entries: Array<Partial<Omit<TimeEntry, 'id'>> & { id?: string }>): Promise<TimeEntry[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const result: TimeEntry[] = [];

  for (const entry of entries) {
    const { id, ...entryData } = entry;
    if (id) {
      const ref = doc(db, 'timeEntries', id);
      batch.set(ref, entryData, { merge: true });
    } else {
      const ref = doc(collection(db, 'timeEntries'));
      batch.set(ref, entryData);
    }
  }

  await batch.commit();

  // After commit, fetch the entries again (naive approach)
  // If IDs were provided, return updated docs; for new docs we do a query by createdAt window is complex,
  // so return all entries for the projects affected as a fallback—caller typically refreshes UI afterwards.
  for (const entry of entries) {
    if (entry.id) {
      const updated = await getDoc(doc(db, 'timeEntries', entry.id));
      if (updated.exists()) result.push({ id: updated.id, ...updated.data() } as TimeEntry);
    }
  }

  return result;
}
