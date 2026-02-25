"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface SparePart {
    _id: string;
    name: string;
    originalName: string;
    status: "healthy" | "warning" | "critical";
    healthPercentage: number;
    lifetimeOfRotor: { value: number; unit: string };
    totalRunningHours: { value: number; unit: string };
    lastServiceDate: string | null;
    sparePartInstallationDate: string | null;
    machineInstallationDate: string | null;
    clientSparePartId: string | null;
    isActive?: boolean;
}

interface EditSparePartModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sparePart: SparePart;
    onSave: (updates: {
        customName?: string;
        lastServiceDate?: string;
        sparePartInstallationDate?: string;
        isActive?: boolean;
    }) => void;
}

export default function EditSparePartModal({
    open,
    onOpenChange,
    sparePart,
    onSave,
}: EditSparePartModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [customName, setCustomName] = useState(sparePart.name || "");
    const [lastServiceDate, setLastServiceDate] = useState(
        sparePart.lastServiceDate
            ? format(new Date(sparePart.lastServiceDate), "yyyy-MM-dd")
            : ""
    );
    const [installationDate, setInstallationDate] = useState(
        sparePart.sparePartInstallationDate
            ? format(new Date(sparePart.sparePartInstallationDate), "yyyy-MM-dd")
            : sparePart.machineInstallationDate
            ? format(new Date(sparePart.machineInstallationDate), "yyyy-MM-dd")
            : ""
    );
    const [isActive, setIsActive] = useState(sparePart.isActive !== false);

    useEffect(() => {
        setCustomName(sparePart.name || "");
        setLastServiceDate(
            sparePart.lastServiceDate
                ? format(new Date(sparePart.lastServiceDate), "yyyy-MM-dd")
                : ""
        );
        setInstallationDate(
            sparePart.sparePartInstallationDate
                ? format(new Date(sparePart.sparePartInstallationDate), "yyyy-MM-dd")
                : sparePart.machineInstallationDate
                ? format(new Date(sparePart.machineInstallationDate), "yyyy-MM-dd")
                : ""
        );
        setIsActive(sparePart.isActive !== false);
    }, [sparePart._id, sparePart.name, sparePart.lastServiceDate, sparePart.sparePartInstallationDate, sparePart.machineInstallationDate, sparePart.isActive]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
                return "bg-[#00a82d]/20 text-[#00a82d] border-[#00a82d]/40";
            case "warning":
                return "bg-[#ff9a00]/20 text-[#ff9a00] border-[#ff9a00]/40";
            case "critical":
                return "bg-[#bf1e21]/20 text-[#bf1e21] border-[#bf1e21]/40";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "healthy":
                return "Healthy";
            case "warning":
                return "Monitor";
            case "critical":
                return "Attention";
            default:
                return "Unknown";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle2 className="w-4 h-4 text-[#00a82d]" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-[#ff9a00]" />;
            case "critical":
                return <XCircle className="w-4 h-4 text-[#bf1e21]" />;
            default:
                return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updates: {
                customName?: string;
                lastServiceDate?: string;
                sparePartInstallationDate?: string;
                isActive?: boolean;
            } = {};

            if (customName !== sparePart.name) {
                updates.customName = customName;
            }
            if (lastServiceDate) {
                updates.lastServiceDate = new Date(lastServiceDate).toISOString();
            }
            if (installationDate) {
                updates.sparePartInstallationDate = new Date(installationDate).toISOString();
            }
            if (isActive !== (sparePart.isActive !== false)) {
                updates.isActive = isActive;
            }

            await onSave(updates);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-3">
                        Edit Spare Part Details
                        {getStatusIcon(sparePart.status)}
                        <Badge
                            variant="outline"
                            className={`${getStatusColor(sparePart.status)} font-medium text-xs`}
                        >
                            {getStatusText(sparePart.status)}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Status Info */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Health Percentage:</span>
                            <span className="text-foreground font-medium">
                                {sparePart.healthPercentage}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Lifetime of Rotor:</span>
                            <span className="text-foreground font-medium">
                                {sparePart.lifetimeOfRotor?.value || 0} {sparePart.lifetimeOfRotor?.unit || "Hrs"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Running Hours:</span>
                            <span className="text-foreground font-medium">
                                {sparePart.totalRunningHours?.value || 0} {sparePart.totalRunningHours?.unit || "Hrs"}
                            </span>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customName" className="text-foreground">
                                Spare Part Name
                            </Label>
                            <Input
                                id="customName"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="bg-background border-border text-foreground"
                                placeholder={sparePart.originalName}
                            />
                            {customName !== sparePart.originalName && (
                                <p className="text-xs text-muted-foreground">
                                    Original name: {sparePart.originalName}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastServiceDate" className="text-foreground">
                                Last Service Date
                            </Label>
                            <Input
                                id="lastServiceDate"
                                type="date"
                                value={lastServiceDate}
                                onChange={(e) => setLastServiceDate(e.target.value)}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="installationDate" className="text-foreground">
                                Installation Date
                            </Label>
                            <Input
                                id="installationDate"
                                type="date"
                                value={installationDate}
                                onChange={(e) => setInstallationDate(e.target.value)}
                                className="bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                            <Label htmlFor="isActive" className="text-foreground cursor-pointer">
                                Current Status
                            </Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-border text-foreground hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-orange text-white hover:bg-orange/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
