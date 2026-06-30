import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidRiseSessionToken, RISE_UPLOAD_COOKIE } from "@/lib/rise-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getRiseUploadApiSecret() {
    const secret = process.env.RISE_UPLOAD_API_SECRET;
    if (secret) return secret;

    if (process.env.NODE_ENV !== "production") {
        return "rise-upload-local-development-secret";
    }

    throw new Error("RISE_UPLOAD_API_SECRET is not configured");
}

async function requireRiseSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(RISE_UPLOAD_COOKIE)?.value;
    return isValidRiseSessionToken(token);
}

function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getApiBaseUrl() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }
    return apiUrl.replace(/\/$/, "");
}

async function proxyRiseImages(method: string, body?: unknown) {
    const response = await fetch(`${getApiBaseUrl()}/upload/rise/images`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-rise-upload-secret": getRiseUploadApiSecret(),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
}

async function guardedProxy(method: string, request?: Request) {
    if (!(await requireRiseSession())) return unauthorized();

    try {
        const body = request ? await request.json().catch(() => ({})) : undefined;
        return proxyRiseImages(method, body);
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Rise upload request failed",
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return guardedProxy("GET");
}

export async function POST(request: Request) {
    return guardedProxy("POST", request);
}

export async function PATCH(request: Request) {
    return guardedProxy("PATCH", request);
}

export async function DELETE(request: Request) {
    return guardedProxy("DELETE", request);
}
