import MaintenanceManualClient from "./MaintenanceManualClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function MaintenanceManual({ params }: PageProps) {
    const { clientID } = await params;

    return (
        <MaintenanceManualClient clientID={clientID} />
    );
}
