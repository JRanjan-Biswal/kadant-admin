'use client';

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SparePart {
    id: string;
    partName: string;
    partNumber: string;
    installedDate: string;
    currentStock: number;
    requiredStock: number;
    deliveryTime: string;
    frequency: string;
    type: "Change" | "Check";
    instructions: string;
    status: "Low Stocks" | "In Stock" | "Out of Stock";
}

interface Machine {
    id: string;
    name: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const MACHINES: Machine[] = [
    { id: "m1", name: "Hydrapulper 11DR" },
    { id: "m2", name: "Hydrapulper 22XL" },
    { id: "m3", name: "Fiber Classifier" },
];

const SPARE_PARTS: SparePart[] = [
    {
        id: "sp-1",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Change",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
    {
        id: "sp-2",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Change",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
    {
        id: "sp-3",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Change",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
    {
        id: "sp-4",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Check",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
    {
        id: "sp-5",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Change",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
    {
        id: "sp-6",
        partName: 'Vorto Rotor 86.4"',
        partNumber: "KL-5000-RBA",
        installedDate: "2024-11-15",
        currentStock: 1,
        requiredStock: 2,
        deliveryTime: "7-10 days",
        frequency: "Every 9 weeks",
        type: "Change",
        instructions: "Critical component - Order before stock runs out",
        status: "Low Stocks",
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
    Change: { bg: "bg-orange-500/20", text: "text-orange-400" },
    Check: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    "Low Stocks": { bg: "bg-orange-500/20", text: "text-orange-400" },
    "In Stock": { bg: "bg-green-500/20", text: "text-green-400" },
    "Out of Stock": { bg: "bg-red-500/20", text: "text-red-400" },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface SparePartsInventoryClientProps {
    clientID: string;
}

export default function SparePartsInventoryClient({ clientID }: SparePartsInventoryClientProps) {
    const [selectedMachine, setSelectedMachine] = useState<string>(MACHINES[0].id);

    // Future: Replace with API call using clientID and selectedMachine
    const spareParts = useMemo(() => {
        // In production, this would be fetched from API:
        // GET /api/clients/${clientID}/machines/${selectedMachine}/spare-parts
        return SPARE_PARTS;
    }, [selectedMachine]);

    // Suppress unused variable warning — clientID will be used for API calls
    void clientID;

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div>
                <h1 className="text-[28px] leading-[42px] font-lato font-normal text-[#fff]">
                    Spare Parts Inventory
                </h1>
                <p className="text-[16px] leading-[24px] font-lato font-normal text-[#A1A1A1] mt-1">
                    Complete spare parts control and order management
                </p>
            </div>

            {/* ── Machine Selector ── */}
            <div className="flex flex-col gap-2">
                <label className="text-[14px] leading-[21px] text-[#99A1AF] font-normal">
                    Select Machine
                </label>
                <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                    <SelectTrigger className="w-full max-w-[260px] h-11 bg-[#171717] border-[#262626]">
                        <SelectValue placeholder="Select a machine" />
                    </SelectTrigger>
                    <SelectContent>
                        {MACHINES.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>
                                {machine.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ── Spare Parts Table ── */}
            <div className="rounded-[10px] border border-[#262626] bg-[#0D0D0D] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#262626] bg-[#171717]">
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider pl-5">
                                Part Name
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Stock Levels
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Delivery Time
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Frequency
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Type
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Instructions
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Status
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {spareParts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    No spare parts found for this machine.
                                </TableCell>
                            </TableRow>
                        ) : (
                            spareParts.map((part) => {
                                const typeStyle = TYPE_STYLES[part.type] ?? {
                                    bg: "bg-gray-500/20",
                                    text: "text-gray-400",
                                };
                                const statusStyle = STATUS_STYLES[part.status] ?? {
                                    bg: "bg-gray-500/20",
                                    text: "text-gray-400",
                                };

                                return (
                                    <TableRow
                                        key={part.id}
                                        className="border-border transition-colors hover:bg-muted/40"
                                    >
                                        {/* Part Name */}
                                        <TableCell className="pl-5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-foreground">
                                                    {part.partName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {part.partNumber}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Installed: {part.installedDate}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Stock Levels */}
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm text-foreground font-medium">
                                                    Current - {part.currentStock}
                                                </span>
                                                <span className="text-sm text-foreground font-medium">
                                                    Required - {part.requiredStock}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Delivery Time */}
                                        <TableCell className="text-muted-foreground">
                                            {part.deliveryTime}
                                        </TableCell>

                                        {/* Frequency */}
                                        <TableCell className="text-muted-foreground">
                                            {part.frequency}
                                        </TableCell>

                                        {/* Type */}
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}
                                            >
                                                {part.type}
                                            </span>
                                        </TableCell>

                                        {/* Instructions */}
                                        <TableCell className="text-muted-foreground text-sm max-w-[180px]">
                                            <span className="line-clamp-2 break-words leading-snug">{part.instructions}</span>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                                            >
                                                {part.status}
                                            </span>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center">
                                            <button
                                                className="inline-flex items-center gap-1.5 text-orange hover:text-orange-light transition-colors cursor-pointer"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span className="text-sm font-medium">Edit</span>
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
