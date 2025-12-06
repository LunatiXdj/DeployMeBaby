
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Dummy product data - replace with your actual data fetching logic
const getProductById = async (id: string) => {
    // In a real app, you would fetch this from a database or API
    const products = [
        { id: '1', name: 'Produkt A', price: 29.99, description: 'Dies ist eine Beschreibung für Produkt A.', imageUrl: 'https://placehold.co/600x400' },
        { id: '2', name: 'Produkt B', price: 49.99, description: 'Dies ist eine Beschreibung für Produkt B.', imageUrl: 'https://placehold.co/600x400' },
    ];
    return products.find(p => p.id === id) || null;
}

export function ProductDetails({ productId }: { productId: string }) {
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const productData = await getProductById(productId);
            setProduct(productData);
            setLoading(false);
        };
        fetchProduct();
    }, [productId]);

    if (loading) {
        return <ProductSkeleton />;
    }

    if (!product) {
        return <p>Produkt nicht gefunden.</p>;
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.name} className="rounded-lg object-cover w-full h-full" />
                </div>
                <div className="flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle className="text-3xl">{product.name}</CardTitle>
                        <CardDescription className="text-xl text-primary font-semibold">{product.price.toFixed(2)} €</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>{product.description}</p>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full">In den Warenkorb</Button>
                    </CardFooter>
                </div>
            </div>
        </Card>
    );
}

function ProductSkeleton() {
    return (
        <Card className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="h-[400px] w-full" />
                <div className="flex flex-col justify-center space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </Card>
    );
}
