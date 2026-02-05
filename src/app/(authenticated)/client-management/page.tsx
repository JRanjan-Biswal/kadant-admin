export const dynamic = 'force-dynamic';
export const revalidate = 0;

import getCurrentUser from "@/actions/get-current-user";
import ClientManagementPage from "@/app/components/ClientManagement/ClientManagementPage";

const fetchClients = async (accessToken: string) => {
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
        return data;
    } catch (error) {
        console.error("Error fetching clients:", error);
        return { clients: [], total: 0 };
    }
};

export default async function ClientManagement() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return <div>Unauthorized</div>;
    }

    const clientsData = await fetchClients(currentUser.accessToken);

    return (
        <ClientManagementPage 
            clients={clientsData.clients || []} 
            total={clientsData.total || 0} 
        />
    );
}
