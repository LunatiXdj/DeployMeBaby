
import { NextResponse } from 'next/server';
import { updateMaterialBilledStatusForProject, updateMaterialConsumptionBilledStatus } from '@/server/services/materialConsumptionService.admin';

export async function POST(request: Request) {
  try {
    const { projectId, materialIds, billed, invoiceId } = await request.json();

    if (materialIds && typeof billed === 'boolean') {
        await updateMaterialConsumptionBilledStatus(materialIds, billed, invoiceId || null);
        return NextResponse.json({ message: 'Billed status updated successfully for materials' });
    }

    if (projectId) {
        await updateMaterialBilledStatusForProject(projectId);
        return NextResponse.json({ message: 'Billed status updated successfully for project ' + projectId });
    }

    return NextResponse.json({ error: 'Invalid request body. Provide either projectId or materialIds and billed status.' }, { status: 400 });

  } catch (error) {
    console.error('Failed to update billed status:', error);
    return NextResponse.json({ error: 'Failed to update billed status' }, { status: 500 });
  }
}
