
'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const references = [
    {
      title: "Modernes Familienbad in Rees",
      description: "Komplettsanierung eines Badezimmers mit bodengleicher Dusche, freistehender Badewanne und modernen Armaturen.",
      hint: "modern bathroom"
    },
    {
      title: "Effiziente Wärmepumpe für Neubau",
      description: "Installation einer Luft-Wasser-Wärmepumpe in einem Einfamilienhaus zur nachhaltigen Beheizung und Warmwasserbereitung.",
      hint: "heat pump"
    },
    {
      title: "Klimatisierung einer Arztpraxis",
      description: "Einbau einer Multi-Split-Klimaanlage zur Temperierung von Behandlungs- und Warteräumen für optimalen Patientenkomfort.",
      hint: "air conditioning"
    },
     {
      title: "Barrierefreies Bad für Senioren",
      description: "Umbau eines bestehenden Badezimmers zu einem altersgerechten Raum mit Haltegriffen, unterfahrbarem Waschtisch und ebenerdiger Dusche.",
      hint: "accessible bathroom"
    },
    {
      title: "Heizungsmodernisierung im Altbau",
      description: "Austausch einer alten Ölheizung gegen eine moderne Gas-Brennwerttherme inklusive hydraulischem Abgleich für maximale Effizienz.",
      hint: "boiler room"
    },
    {
      title: "Wasseraufbereitung für Gewerbe",
      description: "Installation einer Enthärtungsanlage in einem Mehrfamilienhaus zur Reduzierung von Kalkablagerungen und zum Schutz der Installation.",
      hint: "water treatment"
    },
  ];

export default function ReferenceList() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const storage = getStorage();
      const storageRef = ref(storage, 'references');
      const result = await listAll(storageRef);
      const urls = await Promise.all(result.items.map((itemRef) => getDownloadURL(itemRef)));
      setImageUrls(urls);
    };

    fetchImages();
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {references.map((ref, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="p-0">
            {imageUrls[index] ? (
              <Image
                src={imageUrls[index]}
                alt={ref.title}
                width={600}
                height={400}
                className="aspect-video object-cover"
                data-ai-hint={ref.hint}
              />
            ) : (
              <div className="w-[600px] h-[400px] bg-gray-200 animate-pulse" />
            )}
          </CardHeader>
          <CardContent className="p-6">
            <CardTitle className="mb-2 text-lg">{ref.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{ref.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
