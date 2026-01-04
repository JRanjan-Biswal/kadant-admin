"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ClientSelectorProps } from "@/types/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientSelector({ clients }: ClientSelectorProps) {
    const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined);
    const router = useRouter();

    const handleSelectClient = () => {
        if (selectedClient) {
            router.push(`/${selectedClient}/client-overview`);
        }
    }

    return (
        <div>
            <Dialog open={true}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Select Client</DialogTitle>
                        <DialogDescription>
                            Choose a client from the list below.
                        </DialogDescription>
                    </DialogHeader>
                    <Select onValueChange={setSelectedClient} value={selectedClient}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button disabled={!selectedClient} className="w-full cursor-pointer" onClick={handleSelectClient}>Select</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}