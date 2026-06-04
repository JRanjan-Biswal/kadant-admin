"use server";

import getCurrentUser from "./get-current-user";

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    designation?: string;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) return [];

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
            headers: { Authorization: `Bearer ${currentUser.accessToken}` },
            cache: "no-store",
        });

        if (!response.ok) return [];

        const data = await response.json();
        const users: AdminUser[] = Array.isArray(data) ? data : (data.users || []);
        return users.filter((u) => u.role !== "client");
    } catch {
        return [];
    }
}
