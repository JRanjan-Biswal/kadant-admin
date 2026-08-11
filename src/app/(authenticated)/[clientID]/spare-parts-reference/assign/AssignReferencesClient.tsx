"use client";

import { useState, useMemo, useTransition } from "react";
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
import { ChevronLeft, Search, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { saveSparePart, type SparePartCatalogItem } from "@/actions/spare-parts-inventory";
import { getStoredCategoryMachine } from "@/lib/lastCategoryMachineSelection";

interface Props {
    clientID: string;
    spareParts: SparePartCatalogItem[];
}

interface RowState {
    value: string;
    saved: boolean;
    saving: boolean;
}

const ALL_CATEGORIES = "__all__";
const ALL_MACHINES = "__all_machines__";

const buildCategories = (spareParts: SparePartCatalogItem[]) => {
    const map = new Map<string, string>();
    for (const sp of spareParts) {
        for (const m of sp.machines) {
            if (m.categoryId && m.categoryName && !map.has(m.categoryId)) {
                map.set(m.categoryId, m.categoryName);
            }
        }
    }
    return Array.from(map.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

const buildMachinesForCategory = (spareParts: SparePartCatalogItem[], categoryId: string) => {
    const map = new Map<string, string>();
    for (const sp of spareParts) {
        for (const m of sp.machines) {
            if (categoryId !== ALL_CATEGORIES && m.categoryId !== categoryId) continue;
            if (!map.has(m._id)) map.set(m._id, m.name);
        }
    }
    return Array.from(map.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

export default function AssignReferencesClient({ clientID, spareParts }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");

    // Derived once from the already-fetched spareParts list — no extra requests.
    const categories = useMemo(() => buildCategories(spareParts), [spareParts]);

    // Default to the same Category/Machine last picked on the Inventory
    // Management "All Machines" tab, rather than "All" (which shows the
    // full unfiltered catalog and is the slow case we want to avoid by default).
    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.categoryId && categories.some((c) => c.id === stored.categoryId)) {
            return stored.categoryId;
        }
        return categories[0]?.id || ALL_CATEGORIES;
    });

    const machinesInCategory = useMemo(
        () => buildMachinesForCategory(spareParts, selectedCategory),
        [spareParts, selectedCategory]
    );

    const [selectedMachine, setSelectedMachine] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.machineId && machinesInCategory.some((m) => m.id === stored.machineId)) {
            return stored.machineId;
        }
        return machinesInCategory[0]?.id || ALL_MACHINES;
    });

    const [, startTransition] = useTransition();

    const [rows, setRows] = useState<Record<string, RowState>>(() => {
        const init: Record<string, RowState> = {};
        for (const sp of spareParts) {
            init[sp._id] = { value: sp.reference ?? "", saved: false, saving: false };
        }
        return init;
    });

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        const machinesForNewCategory = buildMachinesForCategory(spareParts, value);
        setSelectedMachine(machinesForNewCategory[0]?.id || ALL_MACHINES);
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return spareParts.filter((sp) => {
            if (q) {
                const matchesText =
                    sp.name.toLowerCase().includes(q) ||
                    sp.klValue.toLowerCase().includes(q) ||
                    (sp.reference ?? "").toLowerCase().includes(q);
                if (!matchesText) return false;
            }
            if (selectedMachine !== ALL_MACHINES) {
                if (!sp.machines.some((m) => m._id === selectedMachine)) return false;
            } else if (selectedCategory !== ALL_CATEGORIES) {
                if (!sp.machines.some((m) => m.categoryId === selectedCategory)) return false;
            }
            return true;
        });
    }, [spareParts, search, selectedCategory, selectedMachine]);

    const setRow = (id: string, patch: Partial<RowState>) =>
        setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    const handleSave = async (sp: SparePartCatalogItem) => {
        const current = rows[sp._id];
        if (!current) return;
        const newRef = current.value.trim().toUpperCase() || null;
        setRow(sp._id, { saving: true, saved: false });
        const res = await saveSparePart(sp._id, { reference: newRef });
        if (res.ok) {
            setRow(sp._id, { saving: false, saved: true, value: newRef ?? "" });
            startTransition(() => router.refresh());
        } else {
            setRow(sp._id, { saving: false });
            toast.error(res.error ?? "Failed to save reference");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, sp: SparePartCatalogItem) => {
        if (e.key === "Enter") handleSave(sp);
    };

    const changed = (sp: SparePartCatalogItem) => {
        const original = (sp.reference ?? "").toUpperCase();
        const current = (rows[sp._id]?.value ?? "").toUpperCase();
        return original !== current;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Back */}
            <Link
                href={`/${clientID}/spare-parts-reference`}
                className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-gray-900 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Reference Overview
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Assign References</h1>
                <p className="text-sm text-[#6b7280] mt-1">
                    Set or update the Reference field on any spare part. Parts sharing the same
                    reference will be grouped together in the overview.
                </p>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, KL code or reference…"
                        className="pl-9 bg-white border-[#d1d5db] text-gray-900"
                    />
                </div>

                <div className="flex flex-col gap-2 min-w-[220px]">
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                        Category
                    </label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-9 bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="Select a category" />
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
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                        Machine
                    </label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                        <SelectTrigger className="h-9 bg-white border-[#d1d5db] text-gray-900">
                            <SelectValue placeholder="Select a machine" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
                            {machinesInCategory.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-[#6b7280]">
                Type a reference value and press Enter or click Save. Leave blank to clear.
                Reference is stored in uppercase (e.g.&nbsp;<span className="font-mono">VOCAS_ROTOR</span>).
            </p>

            {/* Table */}
            <div className="border border-[#d1d5db] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#f9fafb] border-b border-[#d1d5db]">
                            <th className="text-left px-4 py-3 font-semibold text-[#374151] w-[26%]">Spare Part Name</th>
                            <th className="text-left px-4 py-3 font-semibold text-[#374151] w-[13%]">KL Code</th>
                            <th className="text-left px-4 py-3 font-semibold text-[#374151] w-[16%]">Category</th>
                            <th className="text-left px-4 py-3 font-semibold text-[#374151] w-[16%]">Machine</th>
                            <th className="text-left px-4 py-3 font-semibold text-[#374151]">Reference</th>
                            <th className="px-4 py-3 w-[80px]" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-[#6b7280]">
                                    No spare parts match your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((sp, idx) => {
                                const row = rows[sp._id];
                                const isDirty = changed(sp);
                                return (
                                    <tr
                                        key={sp._id}
                                        className={`border-b border-[#e5e7eb] ${idx % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"}`}
                                    >
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{sp.name}</td>
                                        <td className="px-4 py-2.5">
                                            <span className="font-mono text-xs bg-[#f3f4f6] border border-[#e5e7eb] rounded px-2 py-0.5">
                                                {sp.klValue}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#374151] truncate max-w-0">
                                            {Array.from(
                                                new Set(sp.machines.map((m) => m.categoryName).filter(Boolean))
                                            ).join(", ") || "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-[#374151] truncate max-w-0">
                                            {sp.machines.map((m) => m.name).join(", ") || "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Input
                                                value={row?.value ?? ""}
                                                onChange={(e) =>
                                                    setRow(sp._id, { value: e.target.value, saved: false })
                                                }
                                                onKeyDown={(e) => handleKeyDown(e, sp)}
                                                placeholder="e.g. VOCAS_ROTOR"
                                                className={`h-8 text-xs font-mono bg-white border-[#d1d5db] text-gray-900 uppercase placeholder:normal-case placeholder:text-[#9ca3af] max-w-[260px] ${
                                                    isDirty ? "border-[#d45815] ring-1 ring-[#d45815]/30" : ""
                                                }`}
                                                disabled={row?.saving}
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {row?.saved && !isDirty ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!isDirty || row?.saving}
                                                    onClick={() => handleSave(sp)}
                                                    className="h-7 px-2 text-xs text-[#d45815] hover:bg-[#d45815]/10 disabled:opacity-30"
                                                >
                                                    {row?.saving ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <><Save className="h-3.5 w-3.5 mr-1" />Save</>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-[#9ca3af]">
                Showing {filtered.length} of {spareParts.length} spare parts
            </p>
        </div>
    );
}
