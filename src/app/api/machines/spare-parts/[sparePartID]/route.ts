import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ sparePartID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { sparePartID } = await params;
        const body = await request.json();
        const { name, lifeTime } = body;
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/spare-parts/${sparePartID}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify({ name, lifeTime }),
            }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to update spare part" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Update spare part error:", error);
        return NextResponse.json(
            { error: "Failed to update spare part" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ sparePartID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { sparePartID } = await params;
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/spare-parts/${sparePartID}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to delete spare part" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Delete spare part error:", error);
        return NextResponse.json(
            { error: "Failed to delete spare part" },
            { status: 500 }
        );
    }
}
