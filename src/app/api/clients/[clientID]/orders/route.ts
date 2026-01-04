import { NextResponse } from 'next/server';
import { Order } from '@/types/order';
import getCurrentUser from '@/actions/get-current-user';

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export async function POST(request: Request, { params }: PageProps) {
    const { clientID } = await params;
    const currentUser = await getCurrentUser();

    try {
        const orderData: Order = await request.json();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser?.accessToken}`,
            },
            body: JSON.stringify({
                ...orderData,
                clientId: clientID,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: 'External API error', details: errorData },
                { status: response.status }
            );
        }

        const result = await response.json();

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error processing order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, { params }: PageProps) {
    const { clientID } = await params;
    const currentUser = await getCurrentUser();

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${clientID}`, {
            method: 'GET',
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

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
