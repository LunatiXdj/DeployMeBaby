import React, { useState } from 'react';
import type { Document } from '@/types';

export function InvoiceItemRow({ item, onChange }: { item: DocumentItem; onChange: (item: DocumentItem) => void }) {
    const [quantity, setQuantity] = useState(item.quantity.toString().replace('.', ','));

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace('.', ',');
        value = value.replace(/[^0-9,]/g, '');
        setQuantity(value);
    };

    const handleBlur = () => {
        let num = parseFloat(quantity.replace(',', '.'));
        if (isNaN(num)) num = 0;
        onChange({ ...item, quantity: num });
        setQuantity(num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    };

    return (
        <tr>
            {/* ...existing code... */}
            <td>
                <input
                    type="text"
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleBlur}
                    className="w-20 text-right"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                />
            </td>
            <td>
                {item.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td>
                {(item.unitPrice * item.quantity).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            {/* ...existing code... */}
        </tr>
    );
}