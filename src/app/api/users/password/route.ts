import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function PUT(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { oldPassword, newPassword, confirmPassword } = body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentUser.accessToken}`
            },
            body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
