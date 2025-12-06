
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await req.json();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'info@ph-services.works',
      subject: 'Neue Kontaktanfrage von der Webseite',
      html: `
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Ihre E-Mail konnte leider nicht versendet werden. Es wurde ein Logeintrag erstellt und PH-SERVICES wird sich alsbald um die Behebung des Fehlers kümmern.' }, { status: 500 });
  }
}
