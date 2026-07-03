"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";

export default function ClientIDSync() {
    const params = useParams<{ clientID?: string }>();
    const { setActiveClientID } = useCurrency();

    useEffect(() => {
        if (params.clientID) {
            setActiveClientID(params.clientID);
        }
    }, [params.clientID, setActiveClientID]);

    return null;
}
