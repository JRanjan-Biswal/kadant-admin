"use server";

import getCurrentUser from "./get-current-user";
import { Client } from "@/types/client";

export interface SearchClientsResult {
    clients: Client[];
    total: number;
}

export async function searchClients(
    q: string,
    region: string,
    customer: string
): Promise<SearchClientsResult> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.accessToken) return { clients: [], total: 0 };

        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (region) params.set("region", region);
        if (customer) params.set("customer", customer);
        params.set("limit", "100");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/search?${params.toString()}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentUser.accessToken}`,
                },
                cache: "no-store",
            }
        );

        if (!response.ok) return { clients: [], total: 0 };

        const data = await response.json();
        return {
            clients: Array.isArray(data) ? data : data.clients || [],
            total: data.total || 0,
        };
    } catch {
        return { clients: [], total: 0 };
    }
}
