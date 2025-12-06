
import { NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/server/lib/firebaseAdmin';
import type { Project } from '@/shared/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const db = getFirebaseAdminDb();

        // 1. Prepare customer name
        const customerName = data.salutation === 'Firma' ? data.lastName : `${data.firstName} ${data.lastName}`;

        // 2. Create Customer
        const customerRef = await db.collection('customers').add({
            salutation: data.salutation,
            name: customerName,
            address: data.address,
            zip: data.zipCode,
            city: data.city,
            phone: data.phone,
            mobilePhone: data.mobilePhone,
            email: data.email,
            contactPerson: data.salutation !== 'Firma' ? `${data.firstName} ${data.lastName}` : '',
            status: 'Kundenportal NEU',
            isPrivate: data.salutation !== 'Firma',
            createdAt: FieldValue.serverTimestamp(),
            notes: '', // Keep customer notes separate
            projectIds: [],
            openBalance: 0,
            dunningLevel: 0,
            dunningLevelReached: false,
            usePaypal: false
        });

        // 3. Prepare project description
        const projectDescription = `
KUNDENANFRAGE:
${data.projectDescription}

BUDGET:
${data.budget || 'Nicht angegeben'}

GEPLANTE AUSFÜHRUNG:
${data.executionDate || 'Nicht angegeben'}
        `.trim();

        // 4. Create Project with correct name and description
        const projectData = {
            projectName: `Anfrage von ${customerName}`,
            customerId: customerRef.id,
            status: 'Kundenportal NEU',
            createdAt: FieldValue.serverTimestamp(),
            notes: projectDescription, // Store description in project notes
            projectNumber: '',
            startDate: null,
            endDate: null,
        };

        const projectRef = await db.collection('projects').add(projectData);
        
        // 5. Update customer with the new project ID
        await customerRef.update({ 
            projectIds: FieldValue.arrayUnion(projectRef.id) 
        });
        // Email notification logic
        try {
            // Dynamically import nodemailer (works in Next.js runtime)
            const nodemailerModule = await import('nodemailer');
            const nodemailer = nodemailerModule?.default ?? nodemailerModule;

            const smtpHost = process.env.SMTP_HOST;
            const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
            const smtpUser = process.env.SMTP_USER;
            const smtpPass = process.env.SMTP_PASS;
            const smtpFrom = process.env.SMTP_FROM || 'no-reply@ph-services.works';

            if (!smtpHost || !smtpPort) {
                console.warn('SMTP not configured — skipping email notification.');
            } else {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
                });

                const contactPerson = data.salutation !== 'Firma' ? `${data.firstName} ${data.lastName}` : '';
                const budget = data.budget || 'Nicht angegeben';
                const execution = data.executionDate || 'Nicht angegeben';

                const plainText = `
        Neue Anfrage über Anfrageportal

        Kunde: ${customerName}
        Anrede: ${data.salutation}
        Kontaktperson: ${contactPerson}
        E-Mail: ${data.email || '—'}
        Telefon: ${data.phone || '—'}
        Mobil: ${data.mobilePhone || '—'}
        Adresse: ${data.address || '—'}
        PLZ / Ort: ${data.zipCode || '—'} ${data.city || '—'}

        Projekt:
        Projektname: Anfrage von ${customerName}
        Beschreibung:
        ${data.projectDescription || '—'}

        Budget: ${budget}
        Geplante Ausführung: ${execution}

        Interne IDs:
        CustomerId: ${customerRef.id}
        ProjectId: ${projectRef.id}
        `.trim();

                const htmlBody = `
                    <h2>Neue Anfrage über Anfrageportal</h2>
                    <h3>Kunde</h3>
                    <ul>
                        <li><strong>Anrede:</strong> ${data.salutation}</li>
                        <li><strong>Name / Kontaktperson:</strong> ${customerName}${contactPerson ? ` (${contactPerson})` : ''}</li>
                        <li><strong>E‑Mail:</strong> ${data.email || '—'}</li>
                        <li><strong>Telefon:</strong> ${data.phone || '—'}</li>
                        <li><strong>Mobil:</strong> ${data.mobilePhone || '—'}</li>
                        <li><strong>Adresse:</strong> ${data.address || '—'}</li>
                        <li><strong>PLZ / Ort:</strong> ${data.zipCode || '—'} ${data.city || '—'}</li>
                    </ul>
                    <h3>Projekt</h3>
                    <p><strong>Projektname:</strong> Anfrage von ${customerName}</p>
                    <p><strong>Beschreibung:</strong><br/><pre style="white-space:pre-wrap;">${(data.projectDescription || '—')}</pre></p>
                    <p><strong>Budget:</strong> ${budget}<br/><strong>Geplante Ausführung:</strong> ${execution}</p>
                    <h4>Interne IDs</h4>
                    <ul>
                        <li><strong>CustomerId:</strong> ${customerRef.id}</li>
                        <li><strong>ProjectId:</strong> ${projectRef.id}</li>
                    </ul>
                `;

                await transporter.sendMail({
                    from: smtpFrom,
                    to: 'p.hueting@ph-services.works',
                    subject: 'Neue Anfrage über Anfrageportal',
                    text: plainText,
                    html: htmlBody,
                });
            }
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
        }// Email notification logic could be added here

        return NextResponse.json({ success: true, customerId: customerRef.id, projectId: projectRef.id });

    } catch (error) {
        console.error("Error in portal-request API:", error);
        let errorMessage = "Anfrage konnte nicht verarbeitet werden.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
