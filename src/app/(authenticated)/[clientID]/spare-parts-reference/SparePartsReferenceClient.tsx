"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Layers, ChevronRight, Tag, Loader2 } from "lucide-react";
import { fetchReferenceOverview } from "@/actions/spare-parts-inventory";
import type { ReferenceOverviewItem, InventoryMachine } from "@/actions/spare-parts-inventory";
import { getStoredCategoryMachine, setStoredCategoryMachine } from "@/lib/lastCategoryMachineSelection";

const ALL = "__all__";
const ALL_MACHINES = "__all_machines__";

interface Props {
    clientID: string;
    overview: ReferenceOverviewItem[];
    machines: InventoryMachine[];
}

const StatBadge = ({ value, color }: { value: number; color: string }) => (
    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        {value}
    </span>
);

export default function SparePartsReferenceClient({ clientID, overview: initialOverview, machines }: Props) {
    const router = useRouter();

    const categories = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of machines) {
            if (m.categoryId && m.categoryName && !map.has(m.categoryId)) {
                map.set(m.categoryId, m.categoryName);
            }
        }
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [machines]);

    const [search, setSearch] = useState("");

    // Default to the same Category/Machine last picked on the Inventory
    // Management "All Machines" tab, rather than "All" (which is the
    // unfiltered — and slowest — case, so it should never be the default).
    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.categoryId && categories.some((c) => c.id === stored.categoryId)) {
            return stored.categoryId;
        }
        return categories[0]?.id || ALL;
    });

    const filteredMachines = useMemo(
        () =>
            selectedCategory === ALL
                ? machines
                : machines.filter((m) => m.categoryId === selectedCategory),
        [machines, selectedCategory]
    );

    const [selectedMachine, setSelectedMachine] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.machineId && filteredMachines.some((m) => m._id === stored.machineId)) {
            return stored.machineId;
        }
        return filteredMachines[0]?._id || ALL_MACHINES;
    });

    const [overview, setOverview] = useState<ReferenceOverviewItem[]>(initialOverview);
    const [loading, setLoading] = useState(false);

    const refetch = useCallback(async (categoryId: string, machineId: string) => {
        setLoading(true);
        try {
            const data = await fetchReferenceOverview(clientID, {
                categoryId: categoryId === ALL ? undefined : categoryId,
                machineId: machineId === ALL_MACHINES ? undefined : machineId,
            });
            setOverview(data);
        } finally {
            setLoading(false);
        }
    }, [clientID]);

    useEffect(() => {
        if (selectedCategory === ALL && selectedMachine === ALL_MACHINES) {
            setOverview(initialOverview);
            return;
        }
        refetch(selectedCategory, selectedMachine);
    }, [selectedCategory, selectedMachine, refetch, initialOverview]);

    // When category changes, reset the machine filter if it's no longer in scope.
    useEffect(() => {
        if (selectedMachine === ALL_MACHINES) return;
        if (!filteredMachines.some((m) => m._id === selectedMachine)) {
            setSelectedMachine(filteredMachines[0]?._id || ALL_MACHINES);
        }
    }, [filteredMachines, selectedMachine]);

    // Keep the cross-page "last selected" store in sync so Inventory
    // Management picks up changes made here too.
    useEffect(() => {
        if (selectedMachine === ALL_MACHINES) return;
        setStoredCategoryMachine(clientID, {
            categoryId: selectedCategory === ALL ? undefined : selectedCategory,
            machineId: selectedMachine,
        });
    }, [clientID, selectedCategory, selectedMachine]);

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
    };

    const filtered = overview.filter((item) =>
        item.reference.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Part Reference Overview</h1>
                    <p className="text-sm text-[#6b7280] mt-1">
                        Inventory grouped by reference tag across all spare part types for this client.
                    </p>
                </div>
                <Link href={`/${clientID}/spare-parts-reference/assign`}>
                    <Button className="bg-[#d45815] hover:bg-[#b84a12] text-white shrink-0">
                        <Tag className="h-4 w-4 mr-2" />
                        Assign References
                    </Button>
                </Link>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reference..."
                        className="pl-9 bg-white border-[#d1d5db] text-gray-900"
                    />
                </div>

                {categories.length > 0 && (
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-[200px] bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {filteredMachines.length > 0 && (
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="w-[200px] bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="All machines" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
                            {filteredMachines.map((m) => (
                                <SelectItem key={m._id} value={m._id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#9ca3af]" />
                )}

                {(selectedCategory !== ALL || selectedMachine !== ALL_MACHINES) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#6b7280] hover:text-gray-900"
                        onClick={() => {
                            setSelectedCategory(ALL);
                            setSelectedMachine(ALL_MACHINES);
                        }}
                    >
                        Clear filter
                    </Button>
                )}
            </div>

            {/* Active filter pill */}
            {(selectedCategory !== ALL || selectedMachine !== ALL_MACHINES) && (
                <div className="flex flex-wrap gap-2">
                    {selectedCategory !== ALL && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] px-3 py-1 text-xs text-[#374151]">
                            Category: {categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}
                        </span>
                    )}
                    {selectedMachine !== ALL_MACHINES && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] px-3 py-1 text-xs text-[#374151]">
                            Machine: {filteredMachines.find((m) => m._id === selectedMachine)?.name ?? selectedMachine}
                        </span>
                    )}
                </div>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Layers className="h-12 w-12 text-[#d1d5db] mb-4" />
                    <p className="text-gray-900 font-medium">
                        {overview.length === 0
                            ? "No references match the current filters"
                            : "No results for that search"}
                    </p>
                    <p className="text-sm text-[#6b7280] mt-1 max-w-sm">
                        {overview.length === 0
                            ? "Try adjusting the category filter."
                            : "Try a different search term."}
                    </p>
                </div>
            )}

            {/* Table */}
            {filtered.length > 0 && (
                <div className="border border-[#d1d5db] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f9fafb] border-b border-[#d1d5db]">
                                <th className="text-left px-4 py-3 font-semibold text-[#374151]">Reference</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Total</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">In Use</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Rebuilding</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Active</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Inactive</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#374151]">Retired</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item, idx) => (
                                <tr
                                    key={item.reference}
                                    onClick={() =>
                                        router.push(`/${clientID}/spare-parts-reference/${encodeURIComponent(item.reference)}`)
                                    }
                                    className={`cursor-pointer border-b border-[#e5e7eb] transition-colors hover:bg-[#f0f4ff] ${
                                        idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-[#d45815] shrink-0" />
                                            <span className="font-semibold text-gray-900">{item.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-bold text-gray-900">{item.total}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatBadge value={item.inUse} color="bg-green-100 text-green-700" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatBadge value={item.sentForRebuild} color="bg-orange-100 text-orange-700" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-green-700 font-medium">{item.active}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-[#6b7280]">{item.inactive}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-red-600">{item.retired}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight className="h-4 w-4 text-[#9ca3af] ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
