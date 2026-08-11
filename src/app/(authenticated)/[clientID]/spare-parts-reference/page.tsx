export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import { fetchReferenceOverview, fetchInventoryMachines } from "@/actions/spare-parts-inventory";
import SparePartsReferenceClient from "./SparePartsReferenceClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function SparePartsReferencePage({ params }: PageProps) {
    const { clientID } = await params;
    const session = await getCurrentUser();
    if (!session?.accessToken) redirect("/");

    const [overview, machines] = await Promise.all([
        fetchReferenceOverview(clientID),
        fetchInventoryMachines(clientID),
    ]);

    return <SparePartsReferenceClient clientID={clientID} overview={overview} machines={machines} />;
}
