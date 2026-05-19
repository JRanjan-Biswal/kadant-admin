import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

/**
 * GET /api/machines/machine-category/[id]/full
 * Returns one machine category with full hierarchy: machines -> spare parts -> parts (protected).
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/machine-category/${id}/full`,
            {
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            }
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Failed to load category" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Get category full error:", error);
        return NextResponse.json(
            { error: "Failed to load category" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/machines/machine-category/[id]/full
 * Bulk-update a category subtree (category + machines + spare parts + parts)
 * in a single request. Diffing happens server-side; the response reports
 * which entities actually changed.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }
        const body = await request.json();
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/machine-category/${id}/full`,
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
                { error: err.message || "Failed to update category" },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Bulk update category error:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}
