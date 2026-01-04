import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { ...sparePartData } = body;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client-machines/spare-parts/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            },
            body: JSON.stringify(sparePartData)
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
