import { db, storage } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, orderBy, where, updateDoc, QueryDocumentSnapshot, limit, writeBatch } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { Quote, Customer, Project } from '@/shared/types';
import { useProjectService } from '@/client/services/projectService';
import { useInvoiceService } from './invoiceService';

export * from "../client/services/quoteService";

/**
 * Uploads a signature image to Firebase Storage and updates the quote.
 * @param quoteId The ID of the quote to update.
 * @param signatureDataUrl The signature image as a base64 data URL.
 * @returns The download URL of the uploaded signature.
 */
export const uploadSignature = async (quoteId: string, signatureDataUrl: string): Promise<string> => {
    if (!quoteId || !signatureDataUrl) {
        throw new Error('Quote ID and signature data are required.');
    }

    const storageRef = ref(storage, `signatures/quotes/${quoteId}/signature.png`);

    // Upload the image
    const snapshot = await uploadString(storageRef, signatureDataUrl, 'data_url');

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update the quote document with the signature URL
    const quoteRef = doc(db, 'quotes', quoteId);
    await updateDoc(quoteRef, {
        signatureUrl: downloadURL,
        status: 'signed', // Optionally update the status
    });

    return downloadURL;
};
