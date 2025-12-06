
'use client';

import type { MaterialOrder, EnrichedMaterialOrder } from '@/shared/types';

/**
 * Fetches material orders for a specific project.
 */
export async function getMaterialOrdersForProject(projectId: string): Promise<MaterialOrder[]> {
    const response = await fetch(`/api/material-orders?projectId=${projectId}`);
    if (!response.ok) {
        console.error('Failed to fetch material orders');
        return [];
    }
    return response.json();
}

/**
 * Saves a new or updated material order.
 */
export async function saveMaterialOrder(orderId: string | null, orderData: Partial<Omit<MaterialOrder, 'id'>>, employeeId: string): Promise<MaterialOrder> {
    const url = orderId ? `/api/material-orders/${orderId}` : '/api/material-orders';
    const method = orderId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, employeeId }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to save material order: ${errorBody}`);
    }
    return response.json();
}

export async function getSubmittedMaterialOrders(): Promise<EnrichedMaterialOrder[]> {
    const response = await fetch('/api/material-orders/submitted');
    if (!response.ok) {
        throw new Error('Failed to fetch submitted material orders');
    }
    return response.json();
}

export async function updateMaterialOrderStatus(orderId: string, status: 'ordered' | 'completed'): Promise<void> {
    const response = await fetch(`/api/material-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        throw new Error('Failed to update material order status');
    }
}
