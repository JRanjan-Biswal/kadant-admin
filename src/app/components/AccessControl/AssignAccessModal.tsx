"use client";

import { useEffect, useState } from "react";
import { MapPin, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { assignAdminAccess, type AccessAdmin } from "@/actions/access-control";
import MultiSelectChips from "./MultiSelectChips";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AccessAdmin | null;
    regions: { _id: string; region: string }[];
    clients: { _id: string; name: string }[];
}

export default function AssignAccessModal({
    open,
    onOpenChange,
    admin,
    regions,
    clients,
}: Props) {
    const router = useRouter();
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (admin) {
            setSelectedRegions((admin.assignedRegions || []).map((r) => r._id));
            setSelectedClients((admin.assignedClients || []).map((c) => c._id));
        }
    }, [admin]);

    if (!admin) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const res = await assignAdminAccess(admin._id, {
            assignedRegions: selectedRegions,
            assignedClients: selectedClients,
        });
        setSubmitting(false);
        if (!res.success) {
            toast.error(res.error || "Failed to assign access");
            return;
        }
        toast.success("Access updated");
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-[16px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-[18px] font-semibold text-gray-900">
                        Assign Access - {admin.name}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="px-6 pt-4 pb-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#d45815] flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Assign Regions
                        </Label>
                        <MultiSelectChips
                            options={regions.map((r) => ({ _id: r._id, label: r.region }))}
                            value={selectedRegions}
                            onChange={setSelectedRegions}
                            placeholder="Select regions"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#d45815] flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Assign Clients
                        </Label>
                        <MultiSelectChips
                            options={clients.map((c) => ({ _id: c._id, label: c.name }))}
                            value={selectedClients}
                            onChange={setSelectedClients}
                            placeholder="Select clients"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="rounded-[10px] h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#2D3E5C] hover:bg-[#1f2c44] text-white rounded-[10px] h-10 px-5"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {submitting ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
