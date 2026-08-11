export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import { fetchReferenceDrilldown, fetchInventoryMachines } from "@/actions/spare-parts-inventory";
import SparePartsReferenceDrilldownClient from "./SparePartsReferenceDrilldownClient";

interface PageProps {
    params: Promise<{ clientID: string; reference: string }>;
    searchParams: Promise<{ categoryId?: string; machineId?: string }>;
}

export default async function SparePartsReferenceDrilldownPage({ params, searchParams }: PageProps) {
    const { clientID, reference } = await params;
    const { categoryId, machineId } = await searchParams;
    const decodedReference = decodeURIComponent(reference);

    const session = await getCurrentUser();
    if (!session?.accessToken) redirect("/");

    const [items, machines] = await Promise.all([
        fetchReferenceDrilldown(clientID, decodedReference, { categoryId, machineId }),
        fetchInventoryMachines(clientID),
    ]);

    return (
        <SparePartsReferenceDrilldownClient
            clientID={clientID}
            reference={decodedReference}
            items={items}
            machines={machines}
            initialCategoryId={categoryId || ""}
            initialMachineId={machineId || ""}
        />
    );
}
