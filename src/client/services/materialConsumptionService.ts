
'use client';

import type { MaterialConsumption } from '@/shared/types';

/**
 * Fetches material consumption records for a given project.
 * Can filter for billed or unbilled records.
 */
export async function getMaterialConsumption(projectId: string, billed?: boolean): Promise<MaterialConsumption[]> {
    let url = `/api/material-consumption?projectId=${projectId}`;
    if (typeof billed === 'boolean') {
        url += `&billed=${billed}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch material consumption');
    }
    return response.json();
}

export async function getUnbilledMaterialConsumption(projectId: string): Promise<MaterialConsumption[]> {
    return getMaterialConsumption(projectId, false);
}


/**
 * Updates the billed status of multiple material consumption records.
 */
export async function updateMaterialConsumptionBilledStatus(materialIds: string[], billed: boolean, invoiceId: string | null): Promise<void> {
    const response = await fetch('/api/material-consumption/update-billed-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ materialIds, billed, invoiceId }),
    });

    if (!response.ok) {
        throw new Error('Failed to update material consumption billed status');
    }
}

export async function updateMaterialBilledStatus(projectId: string): Promise<void> {
    const response = await fetch('/api/material-consumption/update-billed-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
        throw new Error('Failed to update billed status');
    }
}
