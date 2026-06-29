export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import { fetchInventoryMachines } from "@/actions/spare-parts-inventory";
import ForecastingPricingClient from "./ForecastingPricingClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function ForecastingPage({ params }: PageProps) {
    const { clientID } = await params;
    const session = await getCurrentUser();
    if (!session?.accessToken) redirect("/login");

    const machines = await fetchInventoryMachines(clientID);

    return <ForecastingPricingClient clientID={clientID} machines={machines} />;
}
