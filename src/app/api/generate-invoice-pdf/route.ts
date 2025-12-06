
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { getFirebaseAdminStorage } from '@/server/lib/firebase';
import { getInvoice } from '@/server/services/invoiceService';
import { generatePdfBase, drawFooter } from '@/server/lib/pdfUtils';
import { generateGirocode } from '@/server/lib/girocode';
import { DocumentItem } from '@/shared/types';

const VAT_RATE = 0.19;
const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;

const safeNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;



export async function POST(request: NextRequest) {
  const { invoiceId } = await request.json();
  if (!invoiceId) {
    return NextResponse.json({ error: 'Rechnungs-ID fehlt.' }, { status: 400 });
  }

  try {
    const invoiceData = await getInvoice(invoiceId);
    if (!invoiceData) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden.' }, { status: 404 });
    }

    if (invoiceData) {
      const { invoiceNumber, date, dueDate, items, totalAmount, customer, project } = invoiceData;
      if (!customer) throw new Error("Kundendaten fehlen.");

      const pdfDoc = await PDFDocument.create();
      const initialPage = pdfDoc.addPage();
      const {
        drawText,
        drawHeader,
        drawTable,
        drawAddressBlock,
        Y_START,
        X_MARGIN,
        LINE_HEIGHT,
        settings,
        width,
        fontRegular,
        fontBold,
        logoImage
      } = await generatePdfBase(pdfDoc, initialPage);

      drawHeader(initialPage, 'RECHNUNG');

      let y = Y_START - 174;

      const yAfterAddressBlock = drawAddressBlock(initialPage, customer, project, y);

      let yInvoiceDetails = y;
      const invoiceDetailsX = width - X_MARGIN;

      drawText(`Rechnungsnr.: ${invoiceNumber}`, { page: initialPage, y: yInvoiceDetails, size: 11, x: invoiceDetailsX, font: fontRegular, align: 'right' });
      yInvoiceDetails -= LINE_HEIGHT;
      drawText(`Datum: ${new Date(date).toLocaleDateString('de-DE')}`, { page: initialPage, y: yInvoiceDetails, size: 11, x: invoiceDetailsX, font: fontRegular, align: 'right' });
      yInvoiceDetails -= LINE_HEIGHT;
      drawText(`Fällig am: ${new Date(dueDate).toLocaleDateString('de-DE')}`, { page: initialPage, y: yInvoiceDetails, size: 11, x: invoiceDetailsX, font: fontRegular, align: 'right' });

      y = Math.min(yAfterAddressBlock, yInvoiceDetails) - (LINE_HEIGHT * 2);

      const tableHeaders = ['Beschreibung', 'Menge', 'Einzelpreis (€)', 'Gesamt (€)'];
      const tableColWidths = [300, 70, 80, 80];
      const tableData = items.map((item: DocumentItem) => [
        item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        (item.quantity * item.unitPrice).toFixed(2)
      ]);

      const { finalPage, yAfterTable } = await drawTable(
        pdfDoc,
        initialPage,
        y,
        tableHeaders,
        tableData,
        tableColWidths
      );

      const netAmount = totalAmount / 1.19;
      const vatAmount = totalAmount - netAmount;
      const grossAmount = totalAmount;

      const totalsLabelX = width - X_MARGIN - 170;
      const totalsValueX = width - X_MARGIN;

      let yTotals = yAfterTable - (LINE_HEIGHT * 2);

      drawText('Nettobetrag', { page: finalPage, y: yTotals, size: 12, x: 300, font: fontRegular });
      drawText(netAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: finalPage, y: yTotals, size: 12, x: totalsValueX, align: 'right', font: fontRegular });
      yTotals -= LINE_HEIGHT;

      drawText('MwSt. 19%', { page: finalPage, y: yTotals, size: 12, x: 300, font: fontRegular });
      drawText(vatAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: finalPage, y: yTotals, size: 12, x: totalsValueX, align: 'right', font: fontRegular });
      yTotals -= LINE_HEIGHT;

      drawText('Gesamtbetrag Brutto', { page: finalPage, y: yTotals, size: 12, x: 300, font: fontBold });
      drawText(grossAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: finalPage, y: yTotals, size: 12, x: totalsValueX, align: 'right', font: fontBold });

      yTotals -= (LINE_HEIGHT * 3);

      const footerText =
        'Vielen Dank für Ihren Auftrag! Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf das unten genannte Konto. Wir weisen darauf hin, dass für Privatpersonen gemäß §14b Abs. 1 Satz 5 des Umsatzsteuergesetzes eine Aufbewahrungspflicht von zwei Jahren für Handwerkerrechnungen gilt. Bitte beachten Sie, dass die Frist erst zum Ende des Jahres beginnt, in dem die Rechnung ausgestellt wurde. Vermieter unterliegen einer zehnjährigen Aufbewahrungspflicht.';
      drawText(footerText, { page: finalPage, y: yTotals, x: X_MARGIN, size: 10, font: fontRegular, maxWidth: width - (X_MARGIN * 2) });

      if (settings?.iban && settings?.bic && settings?.ownerName) {
        const girocodeBuffer = await generateGirocode({
          iban: settings.iban,
          bic: settings.bic,
          name: settings.ownerName,
          amount: grossAmount,
          reason: `Rechnung ${invoiceNumber}`
        });
        const girocodeImage = await pdfDoc.embedPng(girocodeBuffer);
        const qrCodeSize = 80;
        const footerHeight = 60;
        const qrCodePadding = 10;
        const qrCodeBottomY = footerHeight + qrCodePadding;

        const qrCodeX = width - X_MARGIN - qrCodeSize;
        drawText('Überweisung mit QR-Code', { page: finalPage, y: qrCodeBottomY + qrCodeSize + LINE_HEIGHT, size: 8, x: qrCodeX + qrCodeSize / 2, align: 'center', font: fontRegular });
        finalPage.drawImage(girocodeImage, {
          x: qrCodeX,
          y: qrCodeBottomY,
          width: qrCodeSize,
          height: qrCodeSize
        });
      }

      await drawFooter(pdfDoc, settings, logoImage);
      const pdfBytes = await pdfDoc.save();

      try {
        const storage = getFirebaseAdminStorage();
        const bucket = storage.bucket();
        const filePath = `/Rechnungen/Ausgangsrechnungen/Rechnung_${invoiceNumber}.pdf`;
        await bucket.file(filePath).save(Buffer.from(pdfBytes), {
          metadata: { contentType: 'application/pdf' }
        });
      } catch (uploadError) {
        console.error(
          '!!! UPLOAD TO FIREBASE STORAGE FAILED (but PDF is being returned to user) !!!',
          uploadError
        );
      }

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Rechnung_${invoiceNumber}.pdf"`
        }
      });
    } else {
      return NextResponse.json({ error: 'Rechnung nicht gefunden.' }, { status: 404 });
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'PDF konnte nicht generiert werden: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
