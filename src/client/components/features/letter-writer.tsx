
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/client/components/ui/button';
import { Textarea } from '@/client/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card';
import { useToast } from '@/client/hooks/use-toast';
import { getCustomers } from '@/client/services/customerService';
import { Customer } from '@/shared/types';
import SignaturePad from 'react-signature-canvas';
import { LetterTemplateSelection } from './letter-template-selection';

export function LetterWriter() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState('');
  const [template, setTemplate] = useState<'customer' | 'announcement' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sigPad = useRef<SignaturePad>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Kunden konnten nicht geladen werden.';
        toast({
          title: 'Fehler',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
    if (template === 'customer') {
      fetchCustomers();
    }
  }, [template, toast]);

  const handleGeneratePdf = async () => {
    if (!letterContent.trim()) {
      toast({
        title: 'Fehler',
        description: 'Der Briefinhalt darf nicht leer sein.',
        variant: 'destructive',
      });
      return;
    }

    if (template === 'customer' && !selectedCustomerId) {
        toast({
            title: 'Fehler',
            description: 'Bitte wählen Sie einen Kunden aus.',
            variant: 'destructive',
        });
        return;
    }
    
    if (sigPad.current && !sigPad.current.isEmpty()) {
        setSignature(sigPad.current.toDataURL('image/png'));
    } else {
        setSignature(null);
    }


    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-letter-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          content: letterContent,
          signature: signature,
          template: template,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des PDFs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brief-${template === 'customer' ? selectedCustomerId : 'mitteilung'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Erfolg',
        description: 'Ihr Anschreiben wurde erfolgreich erstellt. Der Download startet in Kürze.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF konnte nicht erstellt werden.';
      toast({
        title: 'Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSignature = () => {
    sigPad.current?.clear();
    setSignature(null);
  };
  
  const handleSelectTemplate = (selectedTemplate: 'customer' | 'announcement') => {
    setTemplate(selectedTemplate);
    setSelectedCustomerId(null);
    setLetterContent('');
    setSignature(null);
    sigPad.current?.clear();
  };

  if (!template) {
    return <LetterTemplateSelection onSelectTemplate={handleSelectTemplate} />;
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>
                        {template === 'customer' ? 'Brief an Kunden' : 'Mitteilung / Ankündigung'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Verfassen und erstellen Sie hier Ihr Schreiben.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setTemplate(null)}>
                    Vorlage wechseln
                </Button>
            </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {template === 'customer' && (
          <div className="space-y-2">
            <label htmlFor="customer-select" className="text-sm font-medium">
              Kunde auswählen
            </label>
            <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId || ''}>
              <SelectTrigger id="customer-select">
                <SelectValue placeholder="Wählen Sie einen Kunden" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.address})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="letter-content" className="text-sm font-medium">
            Briefinhalt
          </label>
          <Textarea
            id="letter-content"
            value={letterContent}
            onChange={(e) => setLetterContent(e.target.value)}
            placeholder="Geben Sie hier den Inhalt Ihres Briefes ein..."
            rows={15}
          />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Unterschrift</label>
            <div className="border rounded-md bg-white">
                <SignaturePad
                    ref={sigPad}
                    canvasProps={{ className: 'w-full h-40' }}
                    onEnd={() => {
                        if (sigPad.current) {
                           setSignature(sigPad.current.toDataURL('image/png'));
                        }
                    }}
                />
            </div>
            <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                    Unterschrift löschen
                </Button>
            </div>
        </div>


        <div className="flex justify-end">
          <Button onClick={handleGeneratePdf} disabled={isLoading}>
            {isLoading ? 'PDF wird erstellt...' : 'PDF generieren'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
