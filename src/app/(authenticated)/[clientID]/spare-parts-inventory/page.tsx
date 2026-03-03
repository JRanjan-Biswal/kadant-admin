import SparePartsInventoryClient from "./SparePartsInventoryClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function SparePartsInventory({ params }: PageProps) {
    const { clientID } = await params;

    return (
        <SparePartsInventoryClient clientID={clientID} />
    );
}
