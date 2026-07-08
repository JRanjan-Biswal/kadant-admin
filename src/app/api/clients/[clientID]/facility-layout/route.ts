import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function PUT(
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

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}/facility-layout`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: (err as { message?: string }).message || "Failed to update facility layout" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Update facility layout error:", error);
        return NextResponse.json(
            { error: "Failed to update facility layout" },
            { status: 500 }
        );
    }
}
