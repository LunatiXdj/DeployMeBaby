import { getFirebaseDb } from '@/client/lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, addDoc, serverTimestamp, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import type { Transaction } from '@/shared/types';

function getTransactionsCollection() {
  const db = getFirebaseDb();
  return collection(db, 'transactions');
}

function transactionFromDoc(doc: any): Transaction {
  const data = doc.data();
  return { id: doc.id, ...data } as Transaction;
}

// Get all transactions, ordered by date
export async function getTransactions(): Promise<Transaction[]> {
  const q = query(getTransactionsCollection(), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(transactionFromDoc);
}

// Save (create or update) a transaction
export async function saveTransaction(transaction: Partial<Omit<Transaction, 'id'>> & { id?: string }): Promise<Transaction> {
  const { id, ...transData } = transaction;
  if (id) {
    const docRef = doc(getTransactionsCollection(), id);
    await setDoc(docRef, transData, { merge: true });
    const updatedDoc = await getDoc(docRef);
    return transactionFromDoc(updatedDoc);
  } else {
    const docRef = await addDoc(getTransactionsCollection(), { ...transData, createdAt: serverTimestamp() });
    const newDoc = await getDoc(docRef);
    return transactionFromDoc(newDoc);
  }
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(getTransactionsCollection(), id));
}