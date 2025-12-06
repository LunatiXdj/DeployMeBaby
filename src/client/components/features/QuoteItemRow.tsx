import React, { useState } from 'react';
import type { Document } from '@/types';

export function QuoteItemRow({ item, onChange }: { item: Document; onChange: (item: Document) => void }) {
    const [quantity, setQuantity] = useState(item.quantity.toString().replace('.', ','));

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Erlaubt Zahlen mit Komma oder Punkt als Dezimaltrennzeichen
        let value = e.target.value.replace('.', ',');
        // Optional: Nur erlaubte Zeichen zulassen
        value = value.replace(/[^0-9,]/g, '');
        setQuantity(value);
    };

    const handleBlur = () => {
        // Wandelt die Eingabe in eine Zahl um (deutsches Format)
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
            {/* ...existing code... */}
            <td>
                {/* Preis mit Tausendertrennzeichen */}
                {item.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td>
                {/* Gesamtbetrag mit Tausendertrennzeichen */}
                {(item.unitPrice * item.quantity).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            {/* ...existing code... */}
        </tr>
    );
}