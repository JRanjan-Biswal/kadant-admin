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

    const machineHealthMap = new Map<
        string,
        { status: "healthy" | "warning" | "critical"; healthPercentage: number }
    >();

    ((clientDetails as { machines?: Array<{ machine?: { _id?: string }, status?: "healthy" | "warning" | "critical", healthPercentage?: number }> }).machines || [])
        .forEach((clientMachine) => {
            const machineId = clientMachine?.machine?._id;
            if (!machineId) return;
            machineHealthMap.set(machineId.toString(), {
                status: clientMachine?.status || "healthy",
                healthPercentage:
                    typeof clientMachine?.healthPercentage === "number"
                        ? clientMachine.healthPercentage
                        : 100,
            });
        });

    const categoriesWithMachineHealth = (categories || []).map((category: { machines?: Array<{ _id: string }> }) => ({
        ...category,
        machines: (category.machines || []).map((machine: { _id: string }) => {
            const health = machineHealthMap.get(machine._id?.toString());
            return {
                ...machine,
                status: health?.status || "healthy",
                healthPercentage: health?.healthPercentage ?? 100,
            };
        }),
    }));

    return (
        <ClientOverviewContent 
            clientDetails={clientDetails}
            allClients={allClients}
            currentClientId={clientID}
            categories={categoriesWithMachineHealth}
        />
    );
}
