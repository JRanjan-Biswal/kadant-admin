import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

/**
 * Attach an already-uploaded S3 object (by `imageName`) to a machine's gallery.
 * Tiny JSON body — the file itself went straight to S3 via a presigned PUT.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json().catch(() => ({}));
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/upload/machine-gallery/by-key`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${currentUser.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                cache: "no-store",
            }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.message || "Could not save image" },
                { status: response.status }
            );
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("machine-gallery-key error:", error);
        return NextResponse.json(
            { error: "Could not save image" },
            { status: 500 }
        );
    }
}
