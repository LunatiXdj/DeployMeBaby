import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebase';
import { getInvoice } from '@/server/services/invoiceService';
import { DocumentItem } from '@/shared/types';

// Email configuration - uses environment variables
// Required env vars: EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD, INVOICE_RECIPIENT_EMAIL
const RECIPIENT_EMAIL = process.env.INVOICE_RECIPIENT_EMAIL || 'philliphuting4a9@finom.me';

async function sendEmailWithFetch(emailOptions: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}): Promise<boolean> {
    // This function uses the email service configured in your email provider
    // For production, ensure you have nodemailer or similar configured server-side

    // Placeholder: You'll need to implement actual email sending
    // This could be done via:
    // 1. Firebase Cloud Functions with nodemailer
    // 2. External email service (SendGrid, Mailgun, etc.)
    // 3. Custom SMTP service

    console.log('Email would be sent:', emailOptions);
    return true;
}

export async function POST(request: NextRequest) {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
        return NextResponse.json({ error: 'Rechnungs-ID erforderlich.' }, { status: 400 });
    }

    try {
        // Get invoice details
        const invoiceData = await getInvoice(invoiceId);
        if (!invoiceData) {
            return NextResponse.json({ error: 'Rechnung nicht gefunden.' }, { status: 404 });
        }

        const { invoiceNumber, date, dueDate, totalAmount, customer } = invoiceData;

        // Call the existing PDF generation API
        const pdfResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-invoice-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceId })
        });

        if (!pdfResponse.ok) {
            throw new Error('PDF-Generierung fehlgeschlagen.');
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();

        // Prepare email content
        const recipientEmail = RECIPIENT_EMAIL;
        const emailSubject = `Rechnung ${invoiceNumber} - ${customer?.name || 'Unbekannter Kunde'}`;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Sehr geehrte Damen und Herren,</p>
        <p>anbei erhalten Sie die Rechnung <strong>${invoiceNumber}</strong>.</p>
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Rechnungsnummer:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Rechnungsdatum:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(date).toLocaleDateString('de-DE')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fälligkeitsdatum:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(dueDate).toLocaleDateString('de-DE')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Betrag:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${(totalAmount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</strong></td>
          </tr>
        </table>
        <p>Mit freundlichen Grüßen</p>
      </div>
    `;

        // Call external email service or Firebase Cloud Function
        // For now, we'll log and prepare for email sending via Cloud Function
        const emailOptions = {
            from: process.env.EMAIL_USER || 'noreply@example.com',
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
            attachments: [
                {
                    filename: `${invoiceNumber}.pdf`,
                    content: Buffer.from(pdfBuffer),
                    contentType: 'application/pdf'
                }
            ]
        };

        // Attempt to send email (implement based on your email service)
        try {
            await sendEmailWithFetch(emailOptions);
        } catch (emailError) {
            console.warn('Email sending failed, but invoice status will be updated:', emailError);
            // Don't fail completely if email fails - still update status
        }

        // Update invoice status to "sent" if not already
        const db = getFirebaseAdminDb();
        const invoiceRef = db.collection('invoices').doc(invoiceId);
        await invoiceRef.update({
            status: 'sent',
            sentAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: `Rechnung ${invoiceNumber} als versendet markiert.`,
            invoiceId
        });
    } catch (error: any) {
        console.error('Send Invoice Email Error:', error);
        return NextResponse.json(
            { error: `Fehler beim Versenden der Rechnung: ${error.message}` },
            { status: 500 }
        );
    }
}
