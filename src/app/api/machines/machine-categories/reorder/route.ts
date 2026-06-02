import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function PUT(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { categoryIds } = body;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines/machine-categories/reorder`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: JSON.stringify({ categoryIds }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to reorder categories" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Category reorder error:", error);
        return NextResponse.json(
            { error: "Failed to reorder categories" },
            { status: 500 }
        );
    }
}
