export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MachineInsightsClient from "./_components/MachineInsightsClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function MachineInsights({ params }: PageProps) {
    const { clientID } = await params;
    return (
        <div className="relative mt-4">
            <MachineInsightsClient clientId={clientID} />
        </div>
    );
}