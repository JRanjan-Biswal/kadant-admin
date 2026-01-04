import OrderHistoryClient from "./OrderHistoryClient";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function OrderHistory({ params }: PageProps) {
    const { clientID } = await params;

    return (
        <OrderHistoryClient clientID={clientID} />
    );
}