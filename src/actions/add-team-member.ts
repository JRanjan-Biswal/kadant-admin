"use server";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./get-current-user";

export interface AddTeamMemberFormData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    designation?: string;
    image?: string;
}

export interface AddTeamMemberResult {
    success: boolean;
    error?: string;
    user?: { _id: string; name: string; email: string; role: string };
}

export async function addTeamMember(
    formData: AddTeamMemberFormData
): Promise<AddTeamMemberResult> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) {
            return { success: false, error: "Unauthorized" };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentUser.accessToken}`,
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ message: "Failed to add team member" }));
            return {
                success: false,
                error: errorData.message || "Failed to add team member",
            };
        }

        const data = await response.json();
        revalidatePath("/team-management");
        return { success: true, user: data.user };
    } catch (error) {
        console.error("Error adding team member:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred",
        };
    }
}
