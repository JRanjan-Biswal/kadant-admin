"use server";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./get-current-user";

export interface AccessAdmin {
    _id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    designation?: string;
    image?: string;
    role: "admin" | "superadmin";
    isActive: boolean;
    fullAccess?: boolean;
    isBlocked?: boolean;
    assignedRegions?: string[];
    assignedClients?: { _id: string; name: string }[];
    lastLoginAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AccessStats {
    totalAdmin: number;
    activeAdmins: number;
    totalRegions: number;
    regionsAssigned: number;
}

export interface AccessOption {
    _id: string;
    label: string;
}

interface ActionResult<T = undefined> {
    success: boolean;
    error?: string;
    data?: T;
}

const apiBase = () => process.env.NEXT_PUBLIC_API_URL;

const authHeaders = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

const handle = async <T,>(
    fn: (token: string) => Promise<Response>,
    pickKey?: string
): Promise<ActionResult<T>> => {
    const currentUser = await getCurrentUser();
    if (!currentUser?.accessToken) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const response = await fn(currentUser.accessToken);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || errorData.error || "Request failed",
            };
        }
        const data = await response.json().catch(() => ({}));
        revalidatePath("/access-control");
        return {
            success: true,
            data: pickKey ? (data[pickKey] as T) : (data as T),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unexpected error",
        };
    }
};

export interface UpdateSuperAdminPayload {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
}

export async function updateSuperAdminCredentials(
    payload: UpdateSuperAdminPayload
): Promise<ActionResult<AccessAdmin>> {
    return handle<AccessAdmin>(
        (token) =>
            fetch(`${apiBase()}/access-control/super-admin`, {
                method: "PATCH",
                headers: authHeaders(token),
                body: JSON.stringify(payload),
                cache: "no-store",
            }),
        "superAdmin"
    );
}

export interface CreateAdminPayload {
    name: string;
    email: string;
    username?: string;
    password: string;
    passwordConfirmation: string;
    phone?: string;
    designation?: string;
    isActive?: boolean;
    fullAccess?: boolean;
    assignedRegions?: string[];
    assignedClients?: string[];
}

export async function createAdmin(
    payload: CreateAdminPayload
): Promise<ActionResult<AccessAdmin>> {
    return handle<AccessAdmin>(
        (token) =>
            fetch(`${apiBase()}/access-control/admins`, {
                method: "POST",
                headers: authHeaders(token),
                body: JSON.stringify(payload),
                cache: "no-store",
            }),
        "admin"
    );
}

export interface UpdateAdminPayload {
    name?: string;
    email?: string;
    username?: string;
    phone?: string;
    designation?: string;
    password?: string;
    isActive?: boolean;
    fullAccess?: boolean;
    assignedRegions?: string[];
    assignedClients?: string[];
}

export async function updateAdmin(
    id: string,
    payload: UpdateAdminPayload
): Promise<ActionResult<AccessAdmin>> {
    return handle<AccessAdmin>(
        (token) =>
            fetch(`${apiBase()}/access-control/admins/${id}`, {
                method: "PATCH",
                headers: authHeaders(token),
                body: JSON.stringify(payload),
                cache: "no-store",
            }),
        "admin"
    );
}

export interface AssignAccessPayload {
    assignedRegions: string[];
    assignedClients: string[];
}

export async function assignAdminAccess(
    id: string,
    payload: AssignAccessPayload
): Promise<ActionResult<AccessAdmin>> {
    return handle<AccessAdmin>(
        (token) =>
            fetch(`${apiBase()}/access-control/admins/${id}/access`, {
                method: "PATCH",
                headers: authHeaders(token),
                body: JSON.stringify(payload),
                cache: "no-store",
            }),
        "admin"
    );
}

export async function toggleAdminStatus(
    id: string,
    isActive: boolean
): Promise<ActionResult<AccessAdmin>> {
    return handle<AccessAdmin>(
        (token) =>
            fetch(`${apiBase()}/access-control/admins/${id}/status`, {
                method: "PATCH",
                headers: authHeaders(token),
                body: JSON.stringify({ isActive }),
                cache: "no-store",
            }),
        "admin"
    );
}

export async function deleteAdmin(id: string): Promise<ActionResult> {
    return handle(
        (token) =>
            fetch(`${apiBase()}/access-control/admins/${id}`, {
                method: "DELETE",
                headers: authHeaders(token),
                cache: "no-store",
            })
    );
}
