
import { NextResponse } from 'next/server';
import { getMaterialConsumption } from '@/server/services/materialConsumptionService.admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const billedParam = searchParams.get('billed');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let billed: boolean | undefined = undefined;
    if (billedParam) {
        billed = billedParam === 'true';
    }

    try {
        const consumptions = await getMaterialConsumption(projectId, billed);
        return NextResponse.json(consumptions);
    } catch (error) {
        console.error(`Error fetching material consumption for project ${projectId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch material consumption' }, { status: 500 });
    }
}
