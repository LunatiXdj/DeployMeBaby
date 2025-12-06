import { getFirebaseDb } from '@/client/lib/firebase';
import type { Article } from '@/shared/types';
import { useFirebase } from '@/client/hooks/useFirebase';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

function articleFromDocSnapshot(docSnap: any): Article {
    const data = docSnap.data();
    const createdAtRaw = data.createdAt;
    const createdAt = createdAtRaw instanceof Date || (createdAtRaw && createdAtRaw.toDate)
        ? (createdAtRaw.toDate ? createdAtRaw.toDate().toISOString() : new Date(createdAtRaw).toISOString())
        : (typeof createdAtRaw === 'string' ? createdAtRaw : new Date().toISOString());

    return {
        id: docSnap.id,
        name: data.name || '',
        articleNumber: data.articleNumber || '',
        group: data.group || 'Sonstiges',
        grossPurchasePrice: data.grossPurchasePrice ?? data.purchasePrice ?? 0,
        grossSalesPrice: data.grossSalesPrice ?? data.price ?? 0,
        // legacy aliases for older components that still reference `price`/`purchasePrice`
        price: data.grossSalesPrice ?? data.price ?? 0,
        purchasePrice: data.grossPurchasePrice ?? data.purchasePrice ?? 0,
        unit: data.unit || 'Stk',
        description: data.description || '',
        longText: data.longText || '',
        procurementLink: data.procurementLink || '',
        createdAt: createdAt,
        supplierId: data.supplierId || null,
        imageUrl: data.imageUrl || null,
        stock: data.stock ?? 0,
        category: data.category || '',
        type: data.type || 'article',
        containsArticles: data.containsArticles || [],
        netPurchasePrice: data.netPurchasePrice,
        includedTax: data.includedTax,
    } as Article;
}

// Direct exports for server/client components
export async function getArticles(): Promise<Article[]> {
    const db = getFirebaseDb();
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, 'articles'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(articleFromDocSnapshot);
}

export async function getArticle(id: string): Promise<Article | null> {
    const db = getFirebaseDb();
    if (!db) throw new Error("Firestore not initialized");
    const docRef = doc(collection(db, 'articles'), id);
    const docSnap = await getDoc(docRef);
    if (docSnap && docSnap.exists && docSnap.exists()) {
        return articleFromDocSnapshot(docSnap);
    }
    return null;
}

export async function saveArticle(id: string | null, data: Partial<Omit<Article, 'id' | 'createdAt'>>): Promise<Article> {
    const db = getFirebaseDb();
    if (!db) throw new Error("Firestore not initialized");

    const saveData = { ...data } as any;
    delete saveData.id;

    const grossPurchase = Number(saveData.grossPurchasePrice || 0);
    const netPurchase = Number((grossPurchase / 1.19).toFixed(2));
    const includedTax = Number((grossPurchase - netPurchase).toFixed(2));
    saveData.netPurchasePrice = netPurchase;
    saveData.includedTax = includedTax;

    const articlesCollection = collection(db, 'articles');

    if (id) {
        const articleRef = doc(articlesCollection, id);
        await setDoc(articleRef, saveData, { merge: true });
        const updatedDoc = await getDoc(articleRef);
        return articleFromDocSnapshot(updatedDoc);
    } else {
        const newArticleData = {
            ...saveData,
            createdAt: new Date(),
        } as any;
        const docRef = await addDoc(articlesCollection, newArticleData);
        const newDoc = await getDoc(docRef);
        return articleFromDocSnapshot(newDoc);
    }
}

export async function deleteArticle(id: string): Promise<void> {
    const db = getFirebaseDb();
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(collection(db, 'articles'), id));
}

// Hook for component use
export function useArticleService() {
    const firebase = useFirebase();
    const db = firebase?.db;

    async function withFirestore() {
        if (!db) throw new Error("Firestore not initialized");
        const mod = await import('firebase/firestore');
        const { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, Timestamp } = mod as any;
        return { db, collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, Timestamp };
    }

    async function hookGetArticles(): Promise<Article[]> {
        const { collection, getDocs, query, orderBy, db } = await withFirestore();
        const q = query(collection(db, 'articles'), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(articleFromDocSnapshot);
    }

    async function hookGetArticle(id: string): Promise<Article | null> {
        const { collection, doc, getDoc, db } = await withFirestore();
        const docRef = doc(collection(db, 'articles'), id);
        const docSnap = await getDoc(docRef);
        if (docSnap && docSnap.exists && docSnap.exists()) {
            return articleFromDocSnapshot(docSnap);
        }
        return null;
    }

    async function hookSaveArticle(id: string | null, data: Partial<Omit<Article, 'id' | 'createdAt'>>): Promise<Article> {
        const { db, collection, doc, setDoc, getDoc, addDoc } = await withFirestore();

        const saveData = { ...data } as any;
        delete saveData.id;

        const grossPurchase = Number(saveData.grossPurchasePrice || 0);
        const netPurchase = Number((grossPurchase / 1.19).toFixed(2));
        const includedTax = Number((grossPurchase - netPurchase).toFixed(2));
        saveData.netPurchasePrice = netPurchase;
        saveData.includedTax = includedTax;

        const articlesCollection = collection(db, 'articles');

        if (id) {
            const articleRef = doc(articlesCollection, id);
            await setDoc(articleRef, saveData, { merge: true });
            const updatedDoc = await getDoc(articleRef);
            return articleFromDocSnapshot(updatedDoc);
        } else {
            const newArticleData = {
                ...saveData,
                createdAt: new Date(),
            } as any;
            const docRef = await addDoc(articlesCollection, newArticleData);
            const newDoc = await getDoc(docRef);
            return articleFromDocSnapshot(newDoc);
        }
    }

    async function hookDeleteArticle(id: string): Promise<void> {
        const { db, collection, doc, deleteDoc } = await withFirestore();
        await deleteDoc(doc(collection(db, 'articles'), id));
    }

    return {
        getArticles: hookGetArticles,
        getArticle: hookGetArticle,
        saveArticle: hookSaveArticle,
        deleteArticle: hookDeleteArticle,
    };
}
