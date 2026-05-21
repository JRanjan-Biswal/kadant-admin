import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ clientID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID } = await params;
        const body = await request.json();
        const { machineIDs } = body;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client-machines/link`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: JSON.stringify({ clientID, machineIDs }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to link machines to client" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Link client machines error:", error);
        return NextResponse.json(
            { error: "Failed to link machines to client" },
            { status: 500 }
        );
    }
}
