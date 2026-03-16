import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const q = request.nextUrl.searchParams.get("q") || "";
        if (!q.trim()) {
            return NextResponse.json([]);
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/maintenance-manuals/search?q=${encodeURIComponent(q)}`,
            {
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Search failed" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
