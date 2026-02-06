import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

/**
 * GET handler to fetch the latest user profile picture
 * Protected route that requires authentication
 * Returns the full URL of the user's profile picture
 */
export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the latest user data from backend
        // The backend /user/me endpoint returns the current authenticated user
        // with the profile picture URL already constructed
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentUser.accessToken}`,
            },
            // Use cache with revalidation for optimization
            next: { revalidate: 60 } // Revalidate every 60 seconds
        });

        if (!response.ok) {
            if (response.status === 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();

        // Return the profile picture URL (already a full URL from backend)
        return NextResponse.json(
            { 
                profilePictureUrl: userData.image || null 
            },
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
                }
            }
        );
    } catch (error) {
        console.error("Error fetching profile picture:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile picture" }, 
            { status: 500 }
        );
    }
}

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
