export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import { fetchAllSpareParts } from "@/actions/spare-parts-inventory";
import AssignReferencesClient from "./AssignReferencesClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function AssignReferencesPage({ params }: PageProps) {
    const { clientID } = await params;
    const session = await getCurrentUser();
    if (!session?.accessToken) redirect("/");

    const spareParts = await fetchAllSpareParts();

    return <AssignReferencesClient clientID={clientID} spareParts={spareParts} />;
}
