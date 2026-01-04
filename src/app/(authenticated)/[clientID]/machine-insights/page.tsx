export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MachineInsightSelector from "@/app/components/MachineInsightSelector";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function MachineInsights({ params }: PageProps) {
    const { clientID } = await params;
    return (
        <div className="relative mt-4">
            <MachineInsightSelector clientId={clientID} />
        </div>
    );
}