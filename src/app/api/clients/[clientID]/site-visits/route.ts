import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: Request, { params }: { params: Promise<{ clientID: string }> }) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID } = await params;
        const body = await request.json();
        const { ...siteVisitData } = body;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-visit/${clientID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            },
            body: JSON.stringify(siteVisitData)
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-visit/${clientID}`, {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ clientID: string }> }) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID } = await params;
        const { searchParams } = new URL(request.url);
        const visitID = searchParams.get('visitID');

        if (!visitID) {
            return NextResponse.json({ error: "Visit ID is required" }, { status: 400 });
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/site-visit/${clientID}/${visitID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.accessToken}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return NextResponse.json({ message: "Site visit deleted successfully" });

    } catch (error) {
        console.error('Error deleting site visit:', error);
        return NextResponse.json(
            { error: 'Failed to delete site visit' },
            { status: 500 }
        );
    }
}
