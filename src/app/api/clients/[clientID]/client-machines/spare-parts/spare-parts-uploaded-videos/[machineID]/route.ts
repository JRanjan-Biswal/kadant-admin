import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ clientID: string; machineID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID, machineID } = await params;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/spare-part-videos/${machineID}/${clientID}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching spare parts images:', error);
        return NextResponse.json(
            { error: 'Failed to fetch spare parts images' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jsonData = await request.json();

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/spare-part-videos`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return NextResponse.json({ message: 'Spare part video uploaded successfully' });
    } catch (error) {
        console.error('Error uploading spare part video:', error);
        return NextResponse.json(
            { error: 'Failed to upload spare part video' },
            { status: 500 }
        );
    }
}


