import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/profile-picture`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${currentUser.accessToken}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        return NextResponse.json({ error: "Failed to upload profile picture" }, { status: 500 });
    }
}
