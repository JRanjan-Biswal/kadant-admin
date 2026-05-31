export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import getCurrentUser from "@/actions/get-current-user";

/**
 * Compresses an uploaded image at a chosen output quality using sharp and
 * returns the compressed bytes (WebP). Used by the image-upload modal so the
 * user can preview "original vs compressed" and drag a quality slider before
 * deciding which to save. Pure transform — nothing is persisted here.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const image = formData.get("image") as File | null;
        if (!image) {
            return NextResponse.json({ error: "Missing image" }, { status: 400 });
        }

        let quality = parseInt(String(formData.get("quality") ?? "70"), 10);
        if (Number.isNaN(quality)) quality = 70;
        quality = Math.min(100, Math.max(1, quality));

        const inputBuffer = Buffer.from(await image.arrayBuffer());
        const outputBuffer = await sharp(inputBuffer, { limitInputPixels: 268402689 * 4 })
            .rotate() // respect EXIF orientation
            .resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true }) // bound output
            .webp({ quality })
            .toBuffer();

        return new NextResponse(new Uint8Array(outputBuffer), {
            status: 200,
            headers: {
                "Content-Type": "image/webp",
                "Content-Length": String(outputBuffer.length),
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("compress-image error:", error);
        // Surface the real reason (e.g. "Input image exceeds pixel limit",
        // "unsupported image format") instead of a generic message so the
        // modal can show something actionable.
        const message = error instanceof Error ? error.message : "Compression failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
