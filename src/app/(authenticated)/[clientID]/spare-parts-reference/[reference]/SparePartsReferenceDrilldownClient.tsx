"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Layers, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchReferenceDrilldown } from "@/actions/spare-parts-inventory";
import type { ReferenceDrilldownItem, InventoryMachine } from "@/actions/spare-parts-inventory";

const ALL_CATEGORIES = "__all__";
const ALL_MACHINES = "__all_machines__";

interface Props {
    clientID: string;
    reference: string;
    items: ReferenceDrilldownItem[];
    machines: InventoryMachine[];
    initialCategoryId: string;
    initialMachineId: string;
}

type StatusKey = "In Use" | "Rebuilding" | "Retired" | "Inactive" | "Not Assigned";

const getStatus = (item: ReferenceDrilldownItem): StatusKey => {
    const cmsp = item.clientMachineSparePart;
    if (!cmsp) return "Not Assigned";
    if (cmsp.partType === "Retired") return "Retired";
    if (cmsp.isSentToRebuild || cmsp.partType === "Sent to Rebuild") return "Rebuilding";
    if ((cmsp.partType === "New" || cmsp.partType === "Rebuilt") && cmsp.isActive !== false) return "In Use";
    return "Inactive";
};

const STATUS_STYLE: Record<StatusKey, string> = {
    "In Use":       "bg-green-100 text-green-700 border-green-200",
    "Rebuilding":   "bg-orange-100 text-orange-700 border-orange-200",
    "Retired":      "bg-red-100 text-red-700 border-red-200",
    "Inactive":     "bg-gray-100 text-gray-500 border-gray-200",
    "Not Assigned": "bg-gray-100 text-gray-400 border-gray-100",
};

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={`rounded-lg border px-4 py-3 text-center ${color}`}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs mt-0.5 font-medium">{label}</div>
    </div>
);

export default function SparePartsReferenceDrilldownClient({
    clientID,
    reference,
    items: initialItems,
    machines,
    initialCategoryId,
    initialMachineId,
}: Props) {
    const categories = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of machines) {
            if (m.categoryId && m.categoryName && !map.has(m.categoryId)) {
                map.set(m.categoryId, m.categoryName);
            }
        }
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [machines]);

    const [selectedCategory, setSelectedCategory] = useState(initialCategoryId || ALL_CATEGORIES);
    const [selectedMachine, setSelectedMachine] = useState(initialMachineId || ALL_MACHINES);
    const [items, setItems] = useState<ReferenceDrilldownItem[]>(initialItems);
    const [loading, setLoading] = useState(false);

    const filteredMachines = useMemo(
        () =>
            selectedCategory === ALL_CATEGORIES
                ? machines
                : machines.filter((m) => m.categoryId === selectedCategory),
        [machines, selectedCategory]
    );

    useEffect(() => {
        if (selectedMachine !== ALL_MACHINES && !filteredMachines.some((m) => m._id === selectedMachine)) {
            setSelectedMachine(ALL_MACHINES);
        }
    }, [filteredMachines, selectedMachine]);

    const refetch = useCallback(async (categoryId: string, machineId: string) => {
        setLoading(true);
        try {
            const data = await fetchReferenceDrilldown(clientID, reference, {
                categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
                machineId: machineId === ALL_MACHINES ? undefined : machineId,
            });
            setItems(data);
        } finally {
            setLoading(false);
        }
    }, [clientID, reference]);

    const isInitial = useRef(true);
    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        refetch(selectedCategory, selectedMachine);
    }, [selectedCategory, selectedMachine, refetch]);

    const counts = items.reduce(
        (acc, item) => {
            const s = getStatus(item);
            acc.total++;
            if (s === "In Use")       acc.inUse++;
            if (s === "Rebuilding")   acc.rebuilding++;
            if (s === "Inactive")     acc.inactive++;
            if (s === "Retired")      acc.retired++;
            const cmsp = item.clientMachineSparePart;
            if (cmsp && cmsp.isActive !== false) acc.active++;
            return acc;
        },
        { total: 0, inUse: 0, rebuilding: 0, active: 0, inactive: 0, retired: 0 }
    );

    return (
        <div className="p-6 space-y-6">
            {/* Back link */}
            <Link
                href={`/${clientID}/spare-parts-inventory`}
                className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-gray-900 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Inventory Management
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3">
                <Layers className="h-6 w-6 text-[#d45815]" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{reference}</h1>
                    <p className="text-sm text-[#6b7280] mt-0.5">
                        All KL codes grouped under this reference for this client
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2 min-w-[220px]">
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-11 bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 min-w-[220px]">
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">Machine</label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="h-11 bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="All machines" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
                            {filteredMachines.map((machine) => (
                                <SelectItem key={machine._id} value={machine._id}>
                                    {machine.name}
                                    {machine.serialNumber ? ` — ${machine.serialNumber}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {loading && <Loader2 className="h-4 w-4 animate-spin text-[#9ca3af] mb-3" />}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <SummaryCard label="Total"      value={counts.total}     color="border-[#d1d5db] text-gray-900" />
                <SummaryCard label="In Use"     value={counts.inUse}     color="border-green-200 text-green-700 bg-green-50" />
                <SummaryCard label="Rebuilding" value={counts.rebuilding} color="border-orange-200 text-orange-700 bg-orange-50" />
                <SummaryCard label="Active"     value={counts.active}    color="border-green-200 text-green-700 bg-green-50" />
                <SummaryCard label="Inactive"   value={counts.inactive}  color="border-gray-200 text-gray-500 bg-gray-50" />
                <SummaryCard label="Retired"    value={counts.retired}   color="border-red-200 text-red-700 bg-red-50" />
            </div>

            {/* Table */}
            {items.length === 0 && !loading ? (
                <div className="py-16 text-center text-[#6b7280]">
                    No spare parts found for reference &ldquo;{reference}&rdquo; with the current filters.
                </div>
            ) : (
                <div className="border border-[#d1d5db] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f9fafb] border-b border-[#d1d5db]">
                                <th className="text-left px-4 py-3 font-semibold text-[#374151]">Spare Part Name</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#374151]">KL Code</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Part Type</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Active</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#374151]">Machine</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                const cmsp = item.clientMachineSparePart;
                                const status = getStatus(item);
                                return (
                                    <tr
                                        key={String(item._id)}
                                        className={`border-b border-[#e5e7eb] ${
                                            idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs bg-[#f3f4f6] border border-[#e5e7eb] rounded px-2 py-0.5">
                                                {item.klValue}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-[#374151]">
                                            {cmsp?.partType ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {cmsp == null ? (
                                                <span className="text-[#9ca3af]">—</span>
                                            ) : cmsp.isActive !== false ? (
                                                <span className="text-green-600 font-medium">Yes</span>
                                            ) : (
                                                <span className="text-[#6b7280]">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[#374151]">
                                            {item.machineName ?? <span className="text-[#9ca3af]">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
