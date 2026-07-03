"use server";

import getCurrentUser from "./get-current-user";

const API = process.env.NEXT_PUBLIC_API_URL;

const requireToken = async () => {
    const session = await getCurrentUser();
    if (!session?.accessToken) throw new Error("Not authenticated");
    return session.accessToken;
};

export interface ClientCurrency {
    selectedCurrency: "EURO" | "INR";
    exchangeRate: number;
}

export async function getClientCurrency(clientID: string): Promise<ClientCurrency> {
    const token = await requireToken();
    const res = await fetch(`${API}/client/${clientID}/currency`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) {
        throw new Error("Failed to fetch currency");
    }
    return res.json();
}

export async function updateClientCurrency(
    clientID: string,
    selectedCurrency: "EURO" | "INR",
    exchangeRate: number
): Promise<ClientCurrency> {
    const token = await requireToken();
    const res = await fetch(`${API}/client/${clientID}/currency`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedCurrency, exchangeRate }),
    });
    if (!res.ok) {
        throw new Error("Failed to update currency");
    }
    return res.json();
}
