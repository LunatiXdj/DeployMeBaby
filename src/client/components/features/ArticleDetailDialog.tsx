import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/client/components/ui/dialog';
import { Button } from '@/client/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/components/ui/tabs';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Article, Supplier } from '@/shared/types';

interface ArticleDetailDialogProps {
  article: Article | null;
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

// Mock data for price history chart
const priceHistoryData = [
  { date: 'Jan 23', price: 120.50 },
  { date: 'Jul 23', price: 125.00 },
  { date: 'Jan 24', price: 128.90 },
  { date: 'Jul 24', price: 130.25 },
];

export function ArticleDetailDialog({ article, supplier, isOpen, onClose, onEdit }: ArticleDetailDialogProps) {
  if (!article) return null;

  const handleAiSearch = () => {
    // This would trigger a call to a backend service
    alert('KI-Preissuche gestartet! (Funktion ist simuliert)');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{article.name}</DialogTitle>
          <DialogDescription>Alle Details zum Artikel im Überblick</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {/* Left Column: Image and Stock */}
                  <div className='md:col-span-1 flex flex-col items-center'>
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                <Image
                  src={(article as any).imageUrl || '/placeholder.svg'}
                  alt={article.name}
                  width={250}
                  height={250}
                  className="object-cover rounded-lg"
                />
            </div>
            <div className='w-full text-center p-4 bg-secondary rounded-lg'>
                <h3 className='text-lg font-headline'>Lagerbestand</h3>
                <p className='text-3xl font-bold text-primary'>{(article as any).stock ?? 0} Stk.</p>
            </div>
          </div>

          {/* Right Column: Tabs with Details */}
          <div className="md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className='mb-4'>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="price-history">Preisverlauf</TabsTrigger>
                <TabsTrigger value="ai-tools">KI-Tools</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                  <h3 className='text-lg font-headline mb-2'>Artikeldaten</h3>
                  <p>{article.description}</p>
                  <div className='grid grid-cols-2 gap-4 mt-4'>
                    <div><span className='font-semibold'>Artikelnummer:</span> {article.articleNumber}</div>
                    <div><span className='font-semibold'>Kategorie:</span> {(article as any).category || (article as any).group || ''}</div>
                    {/* Show gross purchase (EK) and gross sales (VK) prices */}
                    <div><span className='font-semibold'>EK-Preis (brutto):</span> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.grossPurchasePrice)}</div>
                    <div><span className='font-semibold'>VK-Preis (brutto):</span> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.grossSalesPrice)}</div>
                    {/* Calculate included tax (19% contained in grossPurchasePrice) */}
                    <div>
                      <span className='font-semibold'>Enthaltene Steuer (19%):</span>{' '}
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                        // includedTax = gross - net = gross - (gross / 1.19)
                        Number((article.grossPurchasePrice - article.grossPurchasePrice / 1.19).toFixed(2))
                      )}
                    </div>
                    <div>
                      <span className='font-semibold'>Nettopreis (EK):</span>{' '}
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number((article.grossPurchasePrice / 1.19).toFixed(2)))}
                    </div>
                  </div>

                  {supplier && (
                    <>
                        <h3 className='text-lg font-headline mt-6 mb-2'>Lieferanteninformationen</h3>
                        <p className='font-semibold text-primary'>{supplier.name}</p>
                        <p>{supplier.contactPerson}</p>
                        <p>{supplier.email}</p>
                    </>
                  )}
              </TabsContent>

              <TabsContent value="price-history">
                <h3 className='text-lg font-headline mb-2'>Preisentwicklung</h3>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <LineChart data={priceHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="price" name="Preis (€)" stroke="var(--chart-1)" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="ai-tools">
                  <h3 className='text-lg font-headline mb-2'>KI-gestützte Preissuche</h3>
                  <p className='text-muted-foreground mb-4'>Starten Sie eine automatisierte Suche, um die aktuellen Online-Marktpreise für diesen Artikel zu finden.</p>
                  <Button onClick={handleAiSearch}>
                    Online-Preise suchen
                  </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Schließen</Button>
            <Button variant="outline" onClick={() => { onEdit?.(); onClose(); }}>Artikel bearbeiten</Button>
            <Button>Nachbestellen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
