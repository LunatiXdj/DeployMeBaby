
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/client/components/ui/button';
import { FileText, Megaphone } from 'lucide-react';

interface LetterTemplateSelectionProps {
  onSelectTemplate: (template: 'customer' | 'announcement') => void;
}

export function LetterTemplateSelection({ onSelectTemplate }: LetterTemplateSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wählen Sie eine Briefvorlage</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center text-center"
          onClick={() => onSelectTemplate('customer')}
        >
          <FileText className="w-12 h-12 mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Anschreiben an Kunden</h3>
          <p className="text-sm text-muted-foreground">
            Erstellen Sie einen personalisierten Brief an einen bestimmten Kunden aus Ihrer Datenbank.
          </p>
          <Button className="mt-4">Vorlage auswählen</Button>
        </div>
        <div
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center text-center"
          onClick={() => onSelectTemplate('announcement')}
        >
          <Megaphone className="w-12 h-12 mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Mitteilung / Ankündigung</h3>
          <p className="text-sm text-muted-foreground">
            Verfassen Sie eine allgemeine Mitteilung oder Ankündigung ohne spezifischen Empfänger.
          </p>
          <Button className="mt-4">Vorlage auswählen</Button>
        </div>
      </CardContent>
    </Card>
  );
}
