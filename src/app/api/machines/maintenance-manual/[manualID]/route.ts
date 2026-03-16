import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ manualID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { manualID } = await params;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/maintenance-manual/${manualID}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Delete failed" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Delete manual error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
