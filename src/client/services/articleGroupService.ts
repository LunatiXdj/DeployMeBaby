import { getFirebaseDb } from '@/client/lib/firebase';

export interface ArticleGroup {
  id: string;
  name: string;
}

async function withFirestore() {
  const db = await getFirebaseDb();
  const mod = await import('firebase/firestore');
  const { collection, getDocs, doc, addDoc, setDoc, deleteDoc } = mod as any;
  return { db, collection, getDocs, doc, addDoc, setDoc, deleteDoc } as const;
}

export async function getArticleGroups(): Promise<ArticleGroup[]> {
  const { db, collection, getDocs } = await withFirestore();
  const col = collection(db, 'articleGroups');
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as ArticleGroup));
}

export async function saveArticleGroup(group: Partial<ArticleGroup>): Promise<string> {
  const { db, collection, doc, addDoc, setDoc } = await withFirestore();
  const col = collection(db, 'articleGroups');
  if (group.id) {
    const docRef = doc(col, group.id);
    await setDoc(docRef, group, { merge: true });
    return group.id as string;
  } else {
    const docRef = await addDoc(col, { name: group.name });
    return docRef.id;
  }
}

export async function deleteArticleGroup(id: string): Promise<void> {
  const { db, collection, doc, deleteDoc } = await withFirestore();
  const docRef = doc(collection(db, 'articleGroups'), id);
  await deleteDoc(docRef);
}
