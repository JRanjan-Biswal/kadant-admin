import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const machineId = request.nextUrl.searchParams.get("machineId") || "";
        const qs = machineId ? `?machineId=${encodeURIComponent(machineId)}` : "";

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/maintenance-manuals${qs}`,
            {
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to fetch manuals" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Fetch manuals error:", error);
        return NextResponse.json({ error: "Failed to fetch manuals" }, { status: 500 });
    }
}
