import { getFirebaseStorage } from '@/client/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export const uploadSignature = async (quoteId: string, signatureDataUrl: string): Promise<string> => {
    const storage = getFirebaseStorage();
    const filePath = `signatures/${quoteId}.png`;
    const fileRef = ref(storage, filePath);

    try {
        // Upload the base64 data URL
        await uploadString(fileRef, signatureDataUrl, 'data_url');

        // Get the download URL
        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
    } catch (error) {
        console.error("Failed to upload signature", error);
        throw new Error("Signature could not be uploaded.");
    }
};
