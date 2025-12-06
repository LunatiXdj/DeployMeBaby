import { getFirebaseDb } from '@/client/lib/firebase';
import type { Employee } from '@/shared/types';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, updateDoc, QueryDocumentSnapshot, query, where } from 'firebase/firestore';

function getEmployeesCollection() {
    const db = getFirebaseDb();
    return collection(db, 'employees');
}

function employeeFromDoc(doc: QueryDocumentSnapshot): Employee {
    const data = doc.data();
    return { id: doc.id, ...data } as Employee;
}

export async function getEmployees(): Promise<Employee[]> {
    const snapshot = await getDocs(getEmployeesCollection());
    return snapshot.docs.map(employeeFromDoc);
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const docRef = doc(getEmployeesCollection(), id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? employeeFromDoc(docSnap as QueryDocumentSnapshot) : null;
}

export async function saveEmployee(employee: Partial<Omit<Employee, 'id'>> & { id?: string }): Promise<Employee> {
    const { id, ...employeeData } = employee;
    if (id) {
        const docRef = doc(getEmployeesCollection(), id);
        await setDoc(docRef, employeeData, { merge: true });
        const updatedDoc = await getDoc(docRef);
        return employeeFromDoc(updatedDoc as QueryDocumentSnapshot);
    } else {
        const docRef = await addDoc(getEmployeesCollection(), { ...employeeData, createdAt: new Date().toISOString() });
        const newDoc = await getDoc(docRef);
        return employeeFromDoc(newDoc as QueryDocumentSnapshot);
    }
}

export async function deleteEmployee(id: string): Promise<void> {
    await deleteDoc(doc(getEmployeesCollection(), id));
}
