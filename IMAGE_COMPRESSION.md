# Bildkompression im PH-Services

## Überblick

Um die Dateigröße in Firebase Storage zu minimieren und Upload-Geschwindigkeit zu verbessern, wurde eine automatische Bildkompressierung implementiert.

## Komprimierungsoptionen

### Standard-Kompression (500 KB max)
- **Maximale Dateigröße**: 500 KB
- **Qualität**: 0.8 (80%)
- **Maximale Dimensionen**: 1920x1440 Pixel

Diese Einstellung ist ideal für:
- ✅ Referenzen-Fotos
- ✅ Baustellendokumentation
- ✅ Medienverwaltung

## Implementierte Upload-Stellen

### 1. **Referenzen-Management** (`src/client/components/features/reference-management.tsx`)
```typescript
const compressedBlob = await compressImage(image, 500, 0.8);
```
- Komprimiert Bilder vor Upload
- Zeigt Komprimierungsrate in der Konsole
- Speichert komprimierte Version in Firebase Storage

### 2. **Medien-Management** (`src/client/components/features/media-management.tsx`)
```typescript
const compressedBlob = await compressImage(file, 500, 0.8);
```
- Komprimiert beim Upload automatisch
- Zeigt Ersparnis in der Toast-Benachrichtigung
- Unterstützt Dateigrößen-Anzeige

### 3. **Baustellendokumentation** (`src/client/services/siteLogService.ts`)
```typescript
export async function uploadFilesWithCompression(
  projectId, logId, files, onProgress
)
```
- Batch-Upload mit Fortschrittsanzeige
- Individuelle Kompression für jede Datei
- Fehlerbehandlung pro Datei

## API-Funktionen

### `compressImage(file, maxSizeKB, quality)`
**Parameter:**
- `file: File` - Originaldatei
- `maxSizeKB: number` - Maximale Größe in KB (default: 500)
- `quality: number` - Komprimierungsqualität 0-1 (default: 0.8)

**Rückgabe:** `Promise<Blob>`

**Beispiel:**
```typescript
import { compressImage, blobToFile } from '@/client/lib/imageCompression';

const file = event.target.files[0];
const compressedBlob = await compressImage(file, 500, 0.8);
const compressedFile = blobToFile(compressedBlob, file.name);
```

### `blobToFile(blob, fileName)`
Konvertiert komprimiertes Blob zu File-Objekt

### `formatFileSize(bytes)`
Formatiert Dateigröße für Anzeige (z.B. "2.5 MB")

## Speicherersparnis

### Typische Komprimierungsraten:
- **High-Resolution Fotos (6 MB)** → ~400-600 KB (85-90% Ersparnis)
- **Smartphone-Fotos (3 MB)** → ~300-400 KB (85-90% Ersparnis)
- **Screenshots (1 MB)** → ~150-250 KB (75-85% Ersparnis)

### Firebase Storage Kostenreduktion:
Mit durchschnittlich 5 Bildern pro Baustelleneintrag und 100 Einträgen pro Projekt:

- **Ohne Kompression**: 500 × 5 = 2500 Bilder × 2 MB = **5 TB**
- **Mit Kompression**: 500 × 5 = 2500 Bilder × 0.5 MB = **1.25 TB**
- **Ersparnis**: ~75% 💰

## Konfiguration anpassen

Um die Komprimierungsqualität anzupassen, editieren Sie die jeweilige Upload-Stelle:

```typescript
// Höhere Qualität (mehr Speicher):
const compressedBlob = await compressImage(file, 1000, 0.9);

// Niedrigere Qualität (weniger Speicher):
const compressedBlob = await compressImage(file, 300, 0.7);
```

## Browser-Kompatibilität

Die Kompression funktioniert mit:
- ✅ Chrome/Edge (alle Versionen)
- ✅ Firefox (ab v80)
- ✅ Safari (ab v14.1)
- ✅ Mobile Browser (iOS Safari, Chrome Mobile)

## Monitoring

Komprimierungsergebnisse werden in der Browser-Konsole geloggt:
```
Bild komprimiert: 2.4 MB → 0.42 MB (82% Ersparnis)
```

## Zu Beachten

- ⚠️ Canvas-Operationen erfordern CORS bei externen Bildern
- ⚠️ Große Batches (>30 Bilder) können RAM-Spitzen verursachen
- ⚠️ Mobile Geräte mit kleinerem RAM sollten weniger Bilder gleichzeitig komprimieren
