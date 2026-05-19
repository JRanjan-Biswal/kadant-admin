import { NextResponse } from 'next/server';
import getCurrentUser from '@/actions/get-current-user';

interface PageProps {
    params: Promise<{ clientID: string; orderID: string }>;
}

export async function PUT(request: Request, { params }: PageProps) {
    const { clientID, orderID } = await params;
    const currentUser = await getCurrentUser();

    try {
        const updates = await request.json();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${clientID}/${orderID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser?.accessToken}`,
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: 'External API error', details: errorData },
                { status: response.status }
            );
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: PageProps) {
    const { clientID, orderID } = await params;
    const currentUser = await getCurrentUser();

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${clientID}/${orderID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser?.accessToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: 'External API error', details: errorData },
                { status: response.status }
            );
        }

        return NextResponse.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
