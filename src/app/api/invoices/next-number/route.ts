
import { NextResponse } from 'next/server';
import { getNextInvoiceNumber } from '@/server/services/invoiceService.admin';

export async function GET() {
  try {
    const nextInvoiceNumber = await getNextInvoiceNumber();
    return NextResponse.json({ nextInvoiceNumber });
  } catch (error) {
    console.error('Failed to get next invoice number:', error);
    return NextResponse.json({ error: 'Failed to generate next invoice number' }, { status: 500 });
  }
}
