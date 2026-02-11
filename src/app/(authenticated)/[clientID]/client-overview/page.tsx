export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import ClientOverviewContent from "@/app/components/ClientOverview/ClientOverviewContent";

const fetchClientDetails = async (clientID: string, accessToken: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error('NEXT_PUBLIC_API_URL is not configured');
            return null;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Failed to fetch client details: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching client details:", error);
        return null;
    }
}

const fetchCategories = async (accessToken: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error('NEXT_PUBLIC_API_URL is not configured');
            return [];
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines/machine-category-with-products`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

const fetchAllClients = async (accessToken: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error('NEXT_PUBLIC_API_URL is not configured');
            return [];
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Failed to fetch clients: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data.clients || [];
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function ClientOverview({ params }: PageProps) {
    const { clientID } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.accessToken) {
        redirect('/login');
    }

    const [clientDetails, allClients, categories] = await Promise.all([
        fetchClientDetails(clientID, currentUser.accessToken),
        fetchAllClients(currentUser.accessToken),
        fetchCategories(currentUser.accessToken)
    ]);

    if (!clientDetails) {
        redirect('/client-management');
    }

    return (
        <ClientOverviewContent 
            clientDetails={clientDetails}
            allClients={allClients}
            currentClientId={clientID}
            categories={categories}
        />
    );
}
