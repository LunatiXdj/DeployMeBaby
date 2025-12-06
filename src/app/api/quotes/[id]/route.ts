import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import { Quote } from '@/shared/types';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id?.toString?.() ?? '';
    if (!id || id.trim() === '' || id === 'undefined' || id.includes('/')) {
      return NextResponse.json(
        { error: 'Ungültige ID', detail: 'Parameter "id" muss eine nicht-leere Zeichenfolge ohne "/" sein.' },
        { status: 400 }
      );
    }
    const db = getFirebaseAdminDb();
    const quotesCollection = db.collection('quotes');
    const doc = await quotesCollection.doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Quote nicht gefunden' }, { status: 404 });
    }
    const quote = { id: doc.id, ...doc.data() } as Quote;
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: 'Fehler beim Laden des Angebots.', detail: message }, { status: 500 });
  }
}

// Sicherstellen, dass dieser Handler im Node.js Runtime läuft (nicht Edge)
export const runtime = 'nodejs';
