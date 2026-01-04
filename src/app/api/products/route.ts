import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentUser.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
