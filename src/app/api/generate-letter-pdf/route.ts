
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { generatePdfBase, drawFooter } from '@/server/lib/pdfUtils';
import type { Customer, Project } from '@/shared/types';
import { getCustomer } from '@/server/services/customerService.admin';
import { getProject } from '@/server/services/projectService.admin';

export async function POST(request: Request) {
  try {
    const { customerId, subject, content, projectId } = await request.json();

    if (!customerId || !subject || !content) {
      return NextResponse.json({ error: 'CustomerId, subject, and content are required.' }, { status: 400 });
    }

    const customer = await getCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }
    
    let project: Project | null = null;
    if (projectId) {
        project = await getProject(projectId);
    }

    const pdfDoc = await PDFDocument.create();
    const initialPage = pdfDoc.addPage();
    const {
      drawText,
      drawHeader,
      drawAddressBlock,
      Y_START,
      X_MARGIN,
      LINE_HEIGHT,
      settings,
      width,
      logoImage
    } = await generatePdfBase(pdfDoc, initialPage);

    // 1. Draw Header
    drawHeader(initialPage, ''); // No main title needed for a letter

    // 2. Draw Address Block and Date
    let y = Y_START - 150;
    const yAfterAddress = drawAddressBlock(initialPage, customer, project || undefined, y);
    
    drawText(new Date().toLocaleDateString('de-DE'), { 
        page: initialPage, 
        y: yAfterAddress + LINE_HEIGHT, // Position date to the right of the address block
        x: width - X_MARGIN, 
        align: 'right',
        size: 12,
    });

    y = yAfterAddress - LINE_HEIGHT * 3; // Space after address block

    // 3. Draw Subject (Bold)
    y = drawText(`Betreff: ${subject}`, { 
        page: initialPage, 
        y, 
        x: X_MARGIN, 
        size: 12, 
        font: (await pdfDoc.embedFont('Helvetica-Bold')) 
    });
    
    y -= LINE_HEIGHT * 2; // Space after subject

    // 4. Draw Content
    drawText(content, { 
        page: initialPage, 
        y, 
        x: X_MARGIN, 
        size: 12,
        maxWidth: width - (X_MARGIN * 2) // Enable word wrap for the content
    });

    // 5. Draw Footer
    await drawFooter(pdfDoc, settings, logoImage);

    // 6. Save and return PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Anschreiben_${customer.name.replace(/\s/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'PDF konnte nicht generiert werden: ' + errorMessage }, { status: 500 });
  }
}
