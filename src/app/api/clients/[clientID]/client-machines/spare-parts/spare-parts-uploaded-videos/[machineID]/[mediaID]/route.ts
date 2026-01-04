import { NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ clientID: string; machineID: string; mediaID: string }> }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { clientID, machineID, mediaID } = await params;

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/spare-part-videos/${machineID}/${clientID}/media/${mediaID}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return NextResponse.json({ message: 'Spare part video deleted successfully' });
    } catch (error) {
        console.error('Error deleting spare part video:', error);
        return NextResponse.json(
            { error: 'Failed to delete spare part video' },
            { status: 500 }
        );
    }
}
