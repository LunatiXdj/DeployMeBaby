import { use } from 'react';
import { QuoteDetail } from '@/client/components/features/quote-detail';
import { getQuotesAdmin } from '@/server/services/quoteService.admin';

export async function generateStaticParams() {
  try {
    const quotes = await getQuotesAdmin();
    return quotes
      .filter(quote => quote.id)
      .map((quote) => ({
        id: quote.id,
      }));
  } catch (error) {
    // Return empty array if Firebase is not available (e.g., during build)
    console.warn('Could not generate static params for quotes:', error);
    return [];
  }
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <QuoteDetail quoteId={id} />;
}
