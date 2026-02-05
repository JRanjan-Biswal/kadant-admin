import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

interface RouteContext {
    params: Promise<{
        clientID: string;
        machineID: string;
    }>;
}

// GET spare parts for a client's machine
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID, machineID } = await context.params;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}/machines/${machineID}/spare-parts`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching spare parts:", error);
        return NextResponse.json(
            { error: "Failed to fetch spare parts" },
            { status: 500 }
        );
    }
}

// PUT update spare part details
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID, machineID } = await context.params;
        const body = await request.json();
        const { sparePartID, ...updates } = body;

        if (!sparePartID) {
            return NextResponse.json(
                { error: "sparePartID is required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}/machines/${machineID}/spare-parts/${sparePartID}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(updates),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating spare part:", error);
        return NextResponse.json(
            { error: "Failed to update spare part" },
            { status: 500 }
        );
    }
}
