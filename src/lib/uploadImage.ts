// Direct-to-S3 image upload (presigned PUT).
//
// Vercel serverless functions reject request bodies over ~4.5 MB at the edge
// (FUNCTION_PAYLOAD_TOO_LARGE / 413), so a full-size "Original" can't be POSTed
// through our /api/upload/* routes. Instead we:
//   1) ask our API for a short-lived presigned S3 URL
//   2) PUT the file straight to S3 (browser → S3, no function in the middle)
//   3) attach the uploaded key to the entity via a tiny JSON call
// This lets the user upload an image of ANY size as the Original, or the small
// compressed copy — their choice — and both go through the same path.

export type EntityImageType = "category" | "machine" | "sparePart" | "part";

export interface EntityImageResult {
    imageUrl?: string;
    imageUrls?: string[];
    [key: string]: unknown;
}

async function presignImage(
    contentType: string
): Promise<{ uploadUrl: string; imageName: string }> {
    const res = await fetch("/api/upload/image-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: contentType || "image/jpeg" }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not start upload");
    }
    return res.json();
}

async function putToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    });
    if (!res.ok) {
        throw new Error("Upload to storage failed. Please try again.");
    }
}

/**
 * Upload a client-level image (business / flowsheet / stock-prep / onboarding)
 * straight to S3 and return its relative asset path (e.g. "/uploads/entity_….webp")
 * to store on the client. Any size — the file never passes through a function.
 */
export async function uploadClientImageDirect(file: File): Promise<string> {
    const { uploadUrl, imageName } = await presignImage(file.type);
    await putToS3(uploadUrl, file);
    return `/uploads/${imageName}`;
}

/** Replace (mode "replace") or append (mode "add") an entity's image. */
export async function uploadEntityImageDirect(
    type: EntityImageType,
    id: string,
    file: File,
    mode: "replace" | "add" = "replace"
): Promise<EntityImageResult> {
    const { uploadUrl, imageName } = await presignImage(file.type);
    await putToS3(uploadUrl, file);
    const res = await fetch("/api/upload/entity-image-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, imageName, mode }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not save image");
    }
    return res.json();
}

/** Append an image to a machine's gallery. */
export async function uploadMachineGalleryDirect(
    machineId: string,
    file: File
): Promise<EntityImageResult> {
    const { uploadUrl, imageName } = await presignImage(file.type);
    await putToS3(uploadUrl, file);
    const res = await fetch("/api/upload/machine-gallery-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId, imageName }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not save image");
    }
    return res.json();
}
