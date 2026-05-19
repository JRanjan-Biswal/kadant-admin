export const dynamic = "force-dynamic";
export const revalidate = 0;

import getCurrentUser from "@/actions/get-current-user";
import TeamManagementPage from "@/app/components/TeamManagement/TeamManagementPage";

interface TeamMember {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    image?: string;
    createdAt?: string;
}

const fetchTeamMembers = async (accessToken: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                `Failed to fetch team members: ${response.status} ${response.statusText}`
            );
            return { teamMembers: [] as TeamMember[], total: 0 };
        }

        const data = await response.json();
        return {
            teamMembers: (data.teamMembers || []) as TeamMember[],
            total: data.total || 0,
        };
    } catch (error) {
        console.error("Error fetching team members:", error);
        return { teamMembers: [] as TeamMember[], total: 0 };
    }
};

export default async function TeamManagement() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return <div>Unauthorized</div>;
    }

    const { teamMembers, total } = await fetchTeamMembers(currentUser.accessToken);
    return <TeamManagementPage teamMembers={teamMembers} total={total} />;
}
