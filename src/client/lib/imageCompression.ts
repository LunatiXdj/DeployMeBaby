'use client';

/**
 * Komprimiert ein Bild auf eine maximale Dateigröße
 * @param file Originaldatei
 * @param maxSizeKB Maximale Größe in KB (default: 500)
 * @param quality Komprimierungsqualität 0-1 (default: 0.8)
 * @returns Komprimiertes Bild als Blob
 */
export const compressImage = async (
    file: File,
    maxSizeKB: number = 500,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Maximale Dimensionen um Speicher zu sparen
                const maxWidth = 1920;
                const maxHeight = 1440;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context nicht verfügbar'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Iterative Kompression wenn nötig
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Blob konnte nicht erstellt werden'));
                            return;
                        }

                        // Wenn noch zu groß, weiter komprimieren
                        if (blob.size > maxSizeKB * 1024 && quality > 0.3) {
                            compressImage(
                                new File([blob], file.name),
                                maxSizeKB,
                                quality - 0.1
                            )
                                .then(resolve)
                                .catch(reject);
                        } else {
                            resolve(blob);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsDataURL(file);
    });
};

/**
 * Konvertiert komprimiertes Blob zu File
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
};

/**
 * Formatiert Dateigröße für Anzeige
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
