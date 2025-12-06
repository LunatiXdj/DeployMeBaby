
import { NextResponse } from 'next/server';
import { getCompanySettings, saveCompanySettings } from '@/server/services/settingsService';
import { CompanySettings } from '@/shared/types';

export async function GET() {
    try {
        const settings = await getCompanySettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Failed to fetch company settings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data: CompanySettings = await request.json();
        await saveCompanySettings(data);
        return NextResponse.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error("Failed to save company settings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
