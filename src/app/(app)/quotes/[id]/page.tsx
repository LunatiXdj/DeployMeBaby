import { use } from 'react';
import { QuoteDetail } from '@/client/components/features/quote-detail';
import { getQuotesAdmin } from '@/server/services/quoteService.admin';

export async function generateStaticParams() {
  const quotes = await getQuotesAdmin();
  return quotes
    .filter(quote => quote.id)
    .map((quote) => ({
      id: quote.id,
    }));
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <QuoteDetail quoteId={id} />;
}
