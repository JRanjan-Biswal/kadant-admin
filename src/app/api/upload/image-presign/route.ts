import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

/**
 * Mint a short-lived presigned S3 PUT URL via the API so the browser can upload
 * a full-size image DIRECTLY to S3 — bypassing Vercel's ~4.5 MB function-body
 * cap. The access token never leaves the server; only the scoped PUT URL does.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json().catch(() => ({}));
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/upload/image/presign`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${currentUser.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ contentType: body?.contentType }),
                cache: "no-store",
            }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.message || "Could not start upload" },
                { status: response.status }
            );
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("image-presign error:", error);
        return NextResponse.json(
            { error: "Could not start upload" },
            { status: 500 }
        );
    }
}
