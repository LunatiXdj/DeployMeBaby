# E-Mail Versand für Rechnungen

## Übersicht

Das System kann automatisch E-Mails mit Rechnungs-PDF-Anhängen versenden, wenn eine Rechnung als "versendet" markiert wird.

## Konfiguration

### Umgebungsvariablen erforderlich

Fügen Sie folgende Variablen zu Ihrer `.env.local` Datei hinzu:

```
# Email-Empfänger für Rechnungen (Standard: philliphuting4a9@finom.me)
INVOICE_RECIPIENT_EMAIL=philliphuting4a9@finom.me

# Email-Service Konfiguration (Optional - für Produktiv-Einsatz)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Next.js URL (für interne API-Aufrufe)
NEXTAUTH_URL=http://localhost:3000
```

## Funktionsweise

### Workflow beim Versand

1. **Benutzer markiert Rechnung als "versendet"**
   - Im Invoice-Formular wird der Status auf "sent" gesetzt
   - Das Formular wird abgesendet

2. **onSubmit Handler in invoice-form.tsx**
   - Speichert die Rechnung
   - Falls Status = "sent", ruft die E-Mail-API auf
   - Zeigt Toast-Benachrichtigung über Erfolg/Fehler

3. **E-Mail API (/api/invoices/send-email)**
   - Ruft die bestehende PDF-Generierungs-API auf
   - Bereitet E-Mail mit HTML-Template vor
   - Sendet E-Mail mit PDF-Anhang
   - Markiert Rechnung mit Status "sent" und "sentAt" Datum

### API Endpunkt

**POST** `/api/invoices/send-email`

**Request:**
```json
{
  "invoiceId": "dokumentNummer123"
}
```

**Response (Erfolg):**
```json
{
  "success": true,
  "message": "Rechnung RE202511-001 als versendet markiert.",
  "invoiceId": "dokumentNummer123"
}
```

**Response (Fehler):**
```json
{
  "error": "Fehler beim Versenden der Rechnung: Rechnung nicht gefunden."
}
```

## Funktionalität

### Was wird versendet

- **An:** E-Mail-Adresse aus `INVOICE_RECIPIENT_EMAIL` (Standard: philliphuting4a9@finom.me)
- **Betreff:** "Rechnung {RechnungsNr} - {KundenName}"
- **Inhalt:** HTML-formatierte E-Mail mit:
  - Rechnungsnummer
  - Rechnungsdatum
  - Fälligkeitsdatum
  - Gesamtbetrag
- **Anhang:** PDF der Rechnung mit Format `{RechnungsNr}.pdf`

### Datenbankaktualisierung

Nach erfolgreichem Versand werden folgende Felder aktualisiert:
- `status`: "sent"
- `sentAt`: Aktuelles Datum/Uhrzeit (Timestamp)

## Implementierung von echtem Email-Versand

Derzeit ist der Email-Versand als Platzhalter implementiert. Für Produktiv-Einsatz müssen Sie einen der folgenden Ansätze wählen:

### Option 1: Firebase Cloud Functions (empfohlen)

```typescript
// functions/src/sendInvoiceEmail.ts
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendInvoiceEmail = functions.https.onCall(async (data) => {
  // Implementierung
});
```

### Option 2: SendGrid

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: recipientEmail,
  from: process.env.EMAIL_USER,
  subject: emailSubject,
  html: emailHtml,
  attachments: [/* ... */],
};

await sgMail.send(msg);
```

### Option 3: Mailgun

```typescript
import mailgun from 'mailgun.js';

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

await mg.messages.create(process.env.MAILGUN_DOMAIN, {
  from: process.env.EMAIL_USER,
  to: recipientEmail,
  subject: emailSubject,
  html: emailHtml,
  attachment: [/* ... */],
});
```

## Fehlerbehebung

### "Email sending failed, but invoice status will be updated"

Die E-Mail konnte nicht versendet werden, aber die Rechnung wurde als "versendet" markiert. Dies kann passieren, wenn:
- Der E-Mail-Service nicht konfiguriert ist
- SMTP-Verbindung fehlgeschlagen ist
- Ungültige E-Mail-Adresse

**Lösung:** Überprüfen Sie die Umgebungsvariablen und die Verbindung zum E-Mail-Service.

### "PDF konnte nicht generiert werden"

Die PDF-Generierungs-API ist fehlgeschlagen.

**Lösung:** Überprüfen Sie, dass `/api/generate-invoice-pdf` funktioniert.

## Testen

```bash
# Test E-Mail-API lokal
curl -X POST http://localhost:3000/api/invoices/send-email \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "your-invoice-id"}'
```

## Zugehörige Dateien

- `src/client/components/features/invoice-form.tsx` - Formular mit E-Mail-Trigger
- `app/api/invoices/send-email/route.ts` - E-Mail API Endpoint
- `app/api/generate-invoice-pdf/route.ts` - PDF-Generierung
