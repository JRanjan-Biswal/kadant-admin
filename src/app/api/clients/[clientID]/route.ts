import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function PUT(request: Request, { params }: { params: Promise<{ clientID: string }> }) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID } = await params;
        const body = await request.json();
        const { ...updateData } = body;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ clientID: string }> }) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID } = await params;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.accessToken}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching site visits:', error);
        return NextResponse.json(
            { error: 'Failed to fetch site visits' },
            { status: 500 }
        );
    }
}