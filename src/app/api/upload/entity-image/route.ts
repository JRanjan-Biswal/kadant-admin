import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const image = formData.get("image") as File | null;
        const type = formData.get("type") as string | null;
        const id = formData.get("id") as string | null;

        if (!image || !type || !id) {
            return NextResponse.json(
                { error: "Missing image, type, or id (category|machine|sparePart|part)" },
                { status: 400 }
            );
        }

        const externalFormData = new FormData();
        externalFormData.append("image", image);
        externalFormData.append("type", type);
        externalFormData.append("id", id);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/entity-image`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: externalFormData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to upload entity image" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Entity image upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload entity image" },
            { status: 500 }
        );
    }
}
