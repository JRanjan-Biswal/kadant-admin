export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import ClientOverviewContent from "@/app/components/ClientOverview/ClientOverviewContent";

const fetchClientDetails = async (clientID: string, accessToken: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        cache: 'no-store'
    });
    const data = await response.json();
    return data;
}

const fetchAllClients = async (accessToken: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            cache: 'no-store'
        });
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

    const [clientDetails, allClients] = await Promise.all([
        fetchClientDetails(clientID, currentUser.accessToken),
        fetchAllClients(currentUser.accessToken)
    ]);

    return (
        <ClientOverviewContent 
            clientDetails={clientDetails}
            allClients={allClients}
            currentClientId={clientID}
        />
    );
}
