export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import { fetchInventoryMachines } from "@/actions/spare-parts-inventory";
import SparePartsInventoryClient from "./SparePartsInventoryClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function SparePartsInventory({ params }: PageProps) {
    const { clientID } = await params;
    const session = await getCurrentUser();
    if (!session?.accessToken) redirect("/login");

    const machines = await fetchInventoryMachines(clientID);

    return (
        <SparePartsInventoryClient clientID={clientID} machines={machines} />
    );
}
