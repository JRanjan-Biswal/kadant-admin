import getCurrentUser from "@/actions/get-current-user";
import ClientSelector from "@/app/components/Modals/ClientSelector";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
    const currentUser = await getCurrentUser();

    const fetchClients = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser?.accessToken}`,
                },
                cache: 'no-store'
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching clients:", error);
            return [];
        }
    };

    try {
        const clientsData = await fetchClients();
        return (
            <div>
                <ClientSelector clients={clientsData.clients} open={true} />
            </div>
        );
    } catch (error) {
        console.error("Error in Dashboard component:", error);
        return <div>Error loading dashboard data</div>;
    }
}