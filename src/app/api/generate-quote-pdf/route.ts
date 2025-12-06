
import { NextResponse } from 'next/server';
import { PDFDocument, PDFPage } from 'pdf-lib';
import { generatePdfBase, drawFooter } from '@/server/lib/pdfUtils';
import { getFirebaseAdminDb, getFirebaseAdminStorage } from '@/server/lib/firebase';
import type { Quote, Customer, Project } from '@/shared/types';

async function getQuoteDataForPdf(quoteId: string): Promise<Quote | null> {
    const db = getFirebaseAdminDb();
    const quoteRef = db.collection('quotes').doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) return null;

    const quoteData = quoteDoc.data() as Omit<Quote, 'id'>;
    let customer = quoteData.customer || null;
    let project: Project | null = null;

    if (quoteData.projectId) {
        const projectDoc = await db.collection('projects').doc(quoteData.projectId).get();
        if (projectDoc.exists) {
            project = { id: projectDoc.id, ...projectDoc.data() } as Project;
            if (!customer && project.customerId) {
                const customerDoc = await db.collection('customers').doc(project.customerId).get();
                if (customerDoc.exists) customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;
            }
        }
    }
    
    const createdAt = quoteData.createdAt;
    return {
        id: quoteDoc.id, ...quoteData,
        createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate().toISOString(),
        customer, project,
    };
}

export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json(); 
    if (!quoteId) return NextResponse.json({ error: 'Angebots-ID fehlt.' }, { status: 400 });

    const quoteData = await getQuoteDataForPdf(quoteId); 
    if (!quoteData) return NextResponse.json({ error: 'Angebot nicht gefunden.' }, { status: 404 });

    const { quoteNumber, date, items, totalAmount, customer, project } = quoteData;
    if (!customer) throw new Error("Kundendaten fehlen.");

    const pdfDoc = await PDFDocument.create();
    let currentPage: PDFPage = pdfDoc.addPage();
    const { drawText, drawHeader, drawTable, Y_START, X_MARGIN, LINE_HEIGHT, Y_FOOTER, settings, width, logoImage } = await generatePdfBase(pdfDoc, currentPage);
    
    drawHeader(currentPage, 'ANGEBOT / KOSTENVORANSCHLAG');
    let y = Y_START - 150;

    const infoBlockYStart = y;
    const infoTable = [
      ['Angebots-Nr.:', quoteNumber],
      ['Datum:', new Date(date).toLocaleDateString('de-DE')],
      ...(project ? [['Projekt:', `${project.projectNumber} - ${project.projectName}`]] : []),
    ];
    infoTable.forEach(row => {
      if(row[1]) {
        y = drawText(`${row[0]} ${row[1]}`, { page: currentPage, y, size: 10, x: 350 });
      }
    });
    
    let yAddress = infoBlockYStart;
    yAddress = drawText(customer.name, { page: currentPage, x: X_MARGIN, y: yAddress, size: 10 });

    (customer.address || '').split('\n').forEach(line => {
        yAddress = drawText(line, { page: currentPage, x: X_MARGIN, y: yAddress, size: 10 });
    });

    y = Math.min(y, yAddress) - 40;

    const tableHeaders = ['Pos.', 'Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'Gesamtpreis'];
    const tableRows = items.map((item: any, index: number) => [
        (index + 1).toString(), item.description, item.quantity.toString(), item.unit.replace('Quadratmeter', 'm²').replace('quadratmeter', 'm²'),
        Number(item.unitPrice).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
        (item.quantity * item.unitPrice).toLocaleString('de-DE', { style: 'currency', 'currency': 'EUR' })
    ]);
    
    let { yAfterTable, finalPage } = await drawTable(pdfDoc, currentPage, y, tableHeaders, tableRows, [30, 230, 50, 40, 75, 75], { wrappableColumnIndex: 1, rightAlignColumns: [2] });
    currentPage = finalPage;

    const totalsBlockHeight = 120;
    const minYForTotals = Y_FOOTER + 70; 
    if (yAfterTable - totalsBlockHeight < minYForTotals) {
        currentPage = pdfDoc.addPage();
        drawHeader(currentPage, "Fortsetzung");
        yAfterTable = Y_START - 150;
    }

    yAfterTable -= 20;

    const vatAmount = totalAmount * 0.19;
    const grossAmount = totalAmount + vatAmount;

    const totalsX = width - X_MARGIN - 200;
    const valuesX = width - X_MARGIN;
    
    yAfterTable = drawText(`Gesamtbetrag Netto`, { page: currentPage, y: yAfterTable, size: 10, x: totalsX });
    drawText(totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: currentPage, y: yAfterTable, size: 10, x: valuesX, align: 'right' });

    yAfterTable -= 5;
    yAfterTable = drawText(`zzgl. 19% MwSt.`, { page: currentPage, y: yAfterTable, size: 10, x: totalsX });
    drawText(vatAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: currentPage, y: yAfterTable, size: 10, x: valuesX, align: 'right' });

    yAfterTable -= 5;
    yAfterTable = drawText(`Gesamtbetrag Brutto`, { page: currentPage, y: yAfterTable, size: 12, x: totalsX });
    drawText(grossAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), { page: currentPage, y: yAfterTable, size: 12, x: valuesX, align: 'right' });
    
    yAfterTable -= 50;
    
    const footerText = 'Wir danken für Ihr Interesse und hoffen, dass Ihnen unser Angebot zusagt. Bei Fragen stehen wir Ihnen gerne zur Verfügung.\nBitte beachten Sie, dass das Angebot freibleibend ist. Wenn Ihnen das Angebot zusagt, unterschreiben Sie bitte auf der letzten Seite. Mit Unterschrift erteilen Sie den Auftrag und es werden 60% des Brutto-Gesamtbetrages zur Deckung der Materialkosten fällig. Zahlbar innerhalb von 7 Tagen ohne Abzug.';
    const footerResult = drawText(footerText, { 
        page: currentPage, 
        y: yAfterTable, 
        x: X_MARGIN, 
        size: 10, 
        maxWidth: width - (X_MARGIN * 2), 
        checkPageBreak: true, 
        pdfDoc: pdfDoc 
    });
    currentPage = footerResult.finalPage;

    await drawFooter(pdfDoc, settings, logoImage);
    const pdfBytes = await pdfDoc.save();
    
    try {
        const storage = getFirebaseAdminStorage();
        const bucket = storage.bucket();
        const filePath = `Angebote/angebot_${quoteNumber}.pdf`;
        await bucket.file(filePath).save(Buffer.from(pdfBytes), { metadata: { contentType: 'application/pdf' } });
    } catch (uploadError) {
        console.error("!!! UPLOAD TO FIREBASE STORAGE FAILED (but PDF is being returned to user) !!!", uploadError);
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="angebot_${quoteNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: 'PDF konnte nicht generiert werden: ' + (error as Error).message }, { status: 500 });
  }
}
