import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { type, id, imageName } = body;

        if (!type || !id || !imageName) {
            return NextResponse.json(
                { error: "Missing type, id, or imageName" },
                { status: 400 }
            );
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/entity-image-remove`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ type, id, imageName }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to remove entity image" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Entity image remove error:", error);
        return NextResponse.json(
            { error: "Failed to remove entity image" },
            { status: 500 }
        );
    }
}
