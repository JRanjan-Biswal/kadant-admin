import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/machine-gallery`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to remove gallery image" },
                { status: response.status }
            );
        }

        return NextResponse.json(await response.json());
    } catch (error) {
        console.error("Machine gallery delete error:", error);
        return NextResponse.json({ error: "Failed to remove gallery image" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const image = formData.get("image") as File | null;
        const machineId = formData.get("machineId") as string | null;

        if (!image || !machineId) {
            return NextResponse.json(
                { error: "Missing image or machineId" },
                { status: 400 }
            );
        }

        const externalFormData = new FormData();
        externalFormData.append("image", image);
        externalFormData.append("machineId", machineId);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/machine-gallery`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: externalFormData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.error || err.message || "Failed to add gallery image" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Machine gallery upload error:", error);
        return NextResponse.json(
            { error: "Failed to add gallery image" },
            { status: 500 }
        );
    }
}
