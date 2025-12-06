
import { ProductDetails } from '@/client/components/website/shop/product-details';
import { Suspense } from 'react';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<p>Lade Produktdetails...</p>}>
        <ProductDetails productId={params.id} />
      </Suspense>
    </div>
  );
}
