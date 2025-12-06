
import QRCode from 'qrcode';

interface GirocodeParams {
    iban: string;
    bic: string;
    name: string;
    amount: number;
    reason: string;
}

export async function generateGirocode(params: GirocodeParams): Promise<Buffer> {
    const { iban, bic, name, amount, reason } = params;

    const payload = [
        'BCD',                // Service Tag
        '002',                // Version
        '1',                  // Character Set (UTF-8)
        'SCT',                // Identification
        bic,                  // BIC
        name,                 // Name
        iban,                 // IBAN
        `EUR${amount.toFixed(2)}`, // Amount
        '',                   // Purpose
        reason,               // Remittance Information
        ''                    // User Hint
    ].join('\n');

    try {
        const dataUrl = await QRCode.toDataURL(payload, { 
            errorCorrectionLevel: 'M',
            margin: 3,
        });
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        return Buffer.from(base64Data, 'base64');
    } catch (err) {
        console.error("Failed to generate Girocode QR Code:", err);
        throw new Error("Could not generate Girocode.");
    }
}
