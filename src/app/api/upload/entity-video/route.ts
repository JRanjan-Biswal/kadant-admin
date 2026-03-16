import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const video = formData.get("video") as File | null;
        const type = formData.get("type") as string | null;
        const id = formData.get("id") as string | null;

        if (!video || !type || !id) {
            return NextResponse.json(
                { error: "Missing video, type, or id (sparePart|part)" },
                { status: 400 }
            );
        }

        const externalFormData = new FormData();
        externalFormData.append("video", video);
        externalFormData.append("type", type);
        externalFormData.append("id", id);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/entity-video`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: externalFormData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to upload entity video" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Entity video upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload entity video" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { type, id } = body;

        if (!type || !id) {
            return NextResponse.json(
                { error: "Missing type or id (sparePart|part)" },
                { status: 400 }
            );
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/entity-video`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ type, id }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to delete entity video" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Entity video delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete entity video" },
            { status: 500 }
        );
    }
}
