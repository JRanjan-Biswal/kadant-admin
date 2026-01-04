import VisitDetailsClient from "@/app/components/VisitDetailsClient";

interface PageProps {
    params: Promise<{ clientID: string, visitID: string }>;
}

export default async function VisitDetails({ params }: PageProps) {
    const { clientID, visitID } = await params;
    return (
        <VisitDetailsClient clientID={clientID} visitID={visitID} />
    );
}