import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ machineID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { machineID } = await params;
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/${machineID}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to delete machine" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Delete machine error:", error);
        return NextResponse.json(
            { error: "Failed to delete machine" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ machineID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { machineID } = await params;
        const body = await request.json();
        const { name, isActive } = body;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/${machineID}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify({ name, isActive }),
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to update machine" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Update machine error:", error);
        return NextResponse.json(
            { error: "Failed to update machine" },
            { status: 500 }
        );
    }
}
