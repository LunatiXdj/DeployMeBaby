
import { NextResponse } from 'next/server';
import { getCustomer, updateCustomer, deleteCustomer } from '@/server/services/customerService.admin';

interface Params {
    id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const customer = await getCustomer(params.id);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json(customer);
    } catch (error) {
        console.error(`Error fetching customer ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Params }) {
    try {
        const customerData = await request.json();
        const updatedCustomer = await updateCustomer(params.id, customerData);
        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error(`Error updating customer ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
    try {
        await deleteCustomer(params.id);
        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error(`Error deleting customer ${params.id}:`, error);
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}
