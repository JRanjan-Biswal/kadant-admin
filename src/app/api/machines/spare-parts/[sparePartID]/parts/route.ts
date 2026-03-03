import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET(
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
            `${process.env.NEXT_PUBLIC_API_URL}/machines/spare-parts/${sparePartID}/parts`,
            {
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to fetch parts" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Fetch parts error:", error);
        return NextResponse.json(
            { error: "Failed to fetch parts" },
            { status: 500 }
        );
    }
}
