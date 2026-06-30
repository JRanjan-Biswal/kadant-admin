import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    createRiseSessionToken,
    isValidRiseCredentials,
    isValidRiseSessionToken,
    RISE_UPLOAD_COOKIE,
    RISE_UPLOAD_USERNAME,
} from "@/lib/rise-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: "strict" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 8 * 60 * 60,
    };
}

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get(RISE_UPLOAD_COOKIE)?.value;

    return NextResponse.json({
        authenticated: isValidRiseSessionToken(token),
        username: RISE_UPLOAD_USERNAME,
    });
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "");
    const password = String(body?.password || "");

    if (!isValidRiseCredentials(username, password)) {
        return NextResponse.json(
            { error: "Invalid username or password" },
            { status: 401 }
        );
    }

    const response = NextResponse.json({
        authenticated: true,
        username: RISE_UPLOAD_USERNAME,
    });

    response.cookies.set(
        RISE_UPLOAD_COOKIE,
        createRiseSessionToken(),
        cookieOptions()
    );

    return response;
}

export async function DELETE() {
    const response = NextResponse.json({ authenticated: false });
    response.cookies.set(RISE_UPLOAD_COOKIE, "", {
        ...cookieOptions(),
        maxAge: 0,
    });
    return response;
}
