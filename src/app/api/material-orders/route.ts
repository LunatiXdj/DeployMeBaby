
import { NextResponse } from 'next/server';
import { getMaterialOrdersForProject, createMaterialOrder } from '@/server/services/materialService.admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    try {
        const orders = await getMaterialOrdersForProject(projectId);
        return NextResponse.json(orders);
    } catch (error) {
        console.error(`Error fetching material orders for project ${projectId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch material orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const orderData = await request.json();
        // projectId should be part of orderData from the client
        if (!orderData.projectId) {
            return NextResponse.json({ error: 'Project ID is missing in order data' }, { status: 400 });
        }
        const newOrder = await createMaterialOrder(orderData);
        return NextResponse.json(newOrder);
    } catch (error) {
        console.error('Error creating material order:', error);
        return NextResponse.json({ error: 'Failed to create material order' }, { status: 500 });
    }
}
