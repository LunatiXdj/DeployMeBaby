


import { getFirebaseAdminDb } from '@/server/lib/firebase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/client/components/ui/accordion';
import { Reference, ReferenceCategory } from '@/shared/types';

export const revalidate = 1800; // Revalidate every 30 minutes

async function getReferences(): Promise<Reference[]> {
  try {
    const db = getFirebaseAdminDb();
    const querySnapshot = await db.collection('references').get();
    return querySnapshot.docs.map(doc => doc.data() as Reference);
  } catch (err) {
    console.warn('Unable to fetch references from Firebase Admin (maybe not configured) - returning empty list.', err);
    return [];
  }
}

export default async function ReferenzenPage() {
  const references: Reference[] = await getReferences();

  const groupedReferences = references.reduce((acc, ref) => {
    if (!acc[ref.category]) {
      acc[ref.category] = [];
    }
    acc[ref.category].push(ref);
    return acc;
  }, {} as Record<ReferenceCategory, Reference[]>);

  return (
      <div className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Was wir bereits erreicht haben</h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Unsere Referenzen sprechen für sich. Hier zeigen wir Ihnen eine kleine Auswahl bereits realisierter Projekte mit PH-SERVICES.
              </p>
            </div>
          </div>
          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedReferences).map(([category, refs]: [string, Reference[]]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-2xl font-bold">{category}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {refs.map((ref: Reference, index: number) => (
                        <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                          <img src={ref.imageUrl} alt={ref.title} className="object-cover w-full h-64" />
                          <div className="p-6">
                            <h3 className="text-xl font-bold">{ref.title}</h3>
                            <p className="mt-2 text-muted-foreground">{ref.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
  )
}
