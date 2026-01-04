"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackToSiteVisitsProps {
    clientID: string;
}

export default function BackToSiteVisits({ clientID }: BackToSiteVisitsProps) {
    const router = useRouter();

    return (
        <Button variant="outline" className="text-base-4 cursor-pointer" onClick={() => router.push(`/${clientID}/visit-details`)}>
            <ArrowLeft className="ml-2" />
            Back
        </Button>
    );
}