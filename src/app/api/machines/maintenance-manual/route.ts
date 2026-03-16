import { NextRequest, NextResponse } from "next/server";
import getCurrentUser from "@/actions/get-current-user";

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();

        const externalFormData = new FormData();
        const manual = formData.get("manual");
        const machineId = formData.get("machineId");
        const sparePartId = formData.get("sparePartId");

        if (!manual || !machineId) {
            return NextResponse.json(
                { error: "manual file and machineId are required" },
                { status: 400 }
            );
        }

        externalFormData.append("manual", manual);
        externalFormData.append("machineId", machineId);
        if (sparePartId) {
            externalFormData.append("sparePartId", sparePartId as string);
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/machines/maintenance-manual`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${currentUser.accessToken}` },
                body: externalFormData,
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: err.message || "Upload failed" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Upload manual error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
