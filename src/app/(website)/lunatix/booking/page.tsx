'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function BookingPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to a server
    console.log('Booking submitted:', formData);
    toast({
      title: 'Buchungsanfrage gesendet',
      description: 'Vielen Dank! Wir werden uns in Kürze bei Ihnen melden.',
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventDate: '',
      message: '',
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Booking-Anfrage für LunatiX</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventDate">Veranstaltungsdatum</Label>
            <Input id="eventDate" type="date" value={formData.eventDate} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea id="message" value={formData.message} onChange={handleChange} required rows={5} />
          </div>
          <Button type="submit" className="w-full">Anfrage senden</Button>
        </form>
      </div>
    </div>
  );
}
