
import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import { Article } from '@/shared/types';

export async function GET(request: Request) {
  try {
    const db = getFirebaseAdminDb();
    const articlesCollection = db.collection('articles');
    const snapshot = await articlesCollection.get();
    const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
