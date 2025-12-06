import { getInvoice } from '@/server/services/invoiceService';
import { InvoiceForm } from '@/client/components/features/invoice-form';

export default async function EditInvoicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return <div className="text-center text-red-500">Rechnung nicht gefunden.</div>;
  }

  const invoice = await getInvoice(id);

  if (!invoice) {
    return <div className="text-center text-red-500">Rechnung nicht gefunden.</div>;
  }

  return (
    <div className="w-full h-full">
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
