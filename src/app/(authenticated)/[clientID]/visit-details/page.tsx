import VisitDetailsPage from "@/app/components/VisitDetailsPage";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function VisitDetails({ params }: PageProps) {
    const { clientID } = await params;

    const initialData = {
        _id: "",
        lastVisitOn: "",
        engineer: {
            _id: "",
            name: "",
            designation: "",
        },
        client: {
            _id: "",
            name: "",
        },
        clientRepresentative: "",
        clientRepresentativeDesignation: "",
        visitType: [],
        nextScheduledVisit: "",
        assignedEngineer: {
            _id: "",
            name: "",
            designation: "",
        },
        auditReportUrl: "",
    };

    return (
        <VisitDetailsPage clientID={clientID} initialData={initialData} />
    );
}