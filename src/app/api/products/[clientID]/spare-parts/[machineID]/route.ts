import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET(request: Request, { params }: { params: Promise<{ machineID: string, clientID: string }> }) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { machineID, clientID } = await params;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines/${machineID}/spare-parts/${clientID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching spare parts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch spare parts' },
            { status: 500 }
        );
    }
}
