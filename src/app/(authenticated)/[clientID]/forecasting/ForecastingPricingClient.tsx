"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Pencil, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
    fetchInventoryForMachine,
    saveClientSparePart,
    type InventoryMachine,
    type InventorySparePart,
} from "@/actions/spare-parts-inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Props {
    clientID: string;
    machines: InventoryMachine[];
}

interface PricingRow {
    key: string;
    machine: InventoryMachine;
    part: InventorySparePart;
}

interface PricingDraft {
    nbNew: number;
    nbRepair: number;
    unitPriceNew: number;
    priceRepairPerPc: number;
}

type ForecastingClientPart = NonNullable<InventorySparePart["clientMachineSparePart"]> & {
    unitPriceNew?: { value?: number; priceUnit?: string };
    priceRepairPerPc?: { value?: number; priceUnit?: string };
};

const ALL_CATEGORIES = "__all__";
const ALL_MACHINES = "__all_machines__";
const PRICE_UNIT = "EUR";

const toNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const positivePrice = (
    clientPrice?: { value?: number } | null,
    catalogPrice?: { value?: number } | null
) => {
    const clientValue = toNumber(clientPrice?.value);
    if (clientValue > 0) return clientValue;
    return toNumber(catalogPrice?.value);
};

const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: PRICE_UNIT,
        maximumFractionDigits: 0,
    }).format(toNumber(value));

const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(toNumber(value));

const rowMath = (part: InventorySparePart) => {
    const clientPart = part.clientMachineSparePart as ForecastingClientPart | null | undefined;
    const nbNew = toNumber(clientPart?.nbNew);
    const nbRepair = toNumber(clientPart?.nbRepair);
    const unitPriceNew = positivePrice(clientPart?.unitPriceNew, part.unitPriceNew);
    const priceRepairPerPc = positivePrice(clientPart?.priceRepairPerPc, part.priceRepairPerPc);
    const newCost = nbNew * unitPriceNew;
    const repairCost = nbRepair * priceRepairPerPc;

    return {
        nbNew,
        nbRepair,
        unitPriceNew,
        priceRepairPerPc,
        newCost,
        repairCost,
        totalCost: newCost + repairCost,
        usesClientNewPrice: toNumber(clientPart?.unitPriceNew?.value) > 0,
        usesClientRepairPrice: toNumber(clientPart?.priceRepairPerPc?.value) > 0,
    };
};

const updatePricingRow = (row: PricingRow, draft: PricingDraft): PricingRow => {
    const clientPart = (row.part.clientMachineSparePart || {}) as ForecastingClientPart;
    const nextClientPart = {
        ...clientPart,
        nbNew: draft.nbNew,
        nbRepair: draft.nbRepair,
        unitPriceNew: { value: draft.unitPriceNew, priceUnit: PRICE_UNIT },
        priceRepairPerPc: { value: draft.priceRepairPerPc, priceUnit: PRICE_UNIT },
        updatedAt: new Date().toISOString(),
    } as ForecastingClientPart;

    return {
        ...row,
        part: {
            ...row.part,
            clientMachineSparePart:
                nextClientPart as InventorySparePart["clientMachineSparePart"],
        },
    };
};

export default function ForecastingPricingClient({ clientID, machines }: Props) {
    const [rows, setRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
    const [selectedMachine, setSelectedMachine] = useState(ALL_MACHINES);
    const [search, setSearch] = useState("");
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [draft, setDraft] = useState<PricingDraft | null>(null);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const categories = useMemo(() => {
        const map = new Map<string, string>();
        for (const machine of machines) {
            if (machine.categoryId && machine.categoryName && !map.has(machine.categoryId)) {
                map.set(machine.categoryId, machine.categoryName);
            }
        }
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [machines]);

    const filterMachines = useMemo(
        () =>
            selectedCategory === ALL_CATEGORIES
                ? machines
                : machines.filter((machine) => machine.categoryId === selectedCategory),
        [machines, selectedCategory]
    );

    useEffect(() => {
        if (
            selectedMachine !== ALL_MACHINES &&
            !filterMachines.some((machine) => machine._id === selectedMachine)
        ) {
            setSelectedMachine(ALL_MACHINES);
        }
    }, [filterMachines, selectedMachine]);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allRows = await Promise.all(
                machines.map(async (machine) => {
                    const parts = await fetchInventoryForMachine(clientID, machine._id);
                    return parts.map((part) => ({
                        key: `${machine._id}:${part._id}`,
                        machine,
                        part,
                    }));
                })
            );
            setRows(allRows.flat());
        } catch (err) {
            setRows([]);
            setError(err instanceof Error ? err.message : "Failed to load forecasting pricing");
        } finally {
            setLoading(false);
        }
    }, [clientID, machines]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const visibleRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return rows.filter(({ machine, part }) => {
            if (selectedCategory !== ALL_CATEGORIES && machine.categoryId !== selectedCategory) return false;
            if (selectedMachine !== ALL_MACHINES && machine._id !== selectedMachine) return false;
            if (!query) return true;
            return [
                machine.name,
                machine.serialNumber,
                machine.categoryName,
                part.name,
                part.klValue,
                part.itemOnSpareSketch,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [rows, search, selectedCategory, selectedMachine]);

    const totals = useMemo(() => {
        return visibleRows.reduce(
            (acc, row) => {
                const math = rowMath(row.part);
                acc.nbNew += math.nbNew;
                acc.nbRepair += math.nbRepair;
                acc.newCost += math.newCost;
                acc.repairCost += math.repairCost;
                acc.totalCost += math.totalCost;
                const hasPlannedQty = math.nbNew > 0 || math.nbRepair > 0;
                if (
                    hasPlannedQty &&
                    ((math.nbNew > 0 && math.unitPriceNew <= 0) ||
                        (math.nbRepair > 0 && math.priceRepairPerPc <= 0))
                ) {
                    acc.missingPriceRows += 1;
                }
                return acc;
            },
            {
                nbNew: 0,
                nbRepair: 0,
                newCost: 0,
                repairCost: 0,
                totalCost: 0,
                missingPriceRows: 0,
            }
        );
    }, [visibleRows]);

    const startEdit = (row: PricingRow) => {
        const math = rowMath(row.part);
        setEditingKey(row.key);
        setDraft({
            nbNew: math.nbNew,
            nbRepair: math.nbRepair,
            unitPriceNew: math.unitPriceNew,
            priceRepairPerPc: math.priceRepairPerPc,
        });
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setDraft(null);
    };

    const savePricing = async (row: PricingRow) => {
        if (!draft) return;
        setSavingKey(row.key);
        setError(null);
        const nextDraft = {
            nbNew: Math.max(0, toNumber(draft.nbNew)),
            nbRepair: Math.max(0, toNumber(draft.nbRepair)),
            unitPriceNew: Math.max(0, toNumber(draft.unitPriceNew)),
            priceRepairPerPc: Math.max(0, toNumber(draft.priceRepairPerPc)),
        };

        try {
            const res = await saveClientSparePart(clientID, row.machine._id, row.part._id, {
                nbNew: nextDraft.nbNew,
                nbRepair: nextDraft.nbRepair,
                unitPriceNew: { value: nextDraft.unitPriceNew, priceUnit: PRICE_UNIT },
                priceRepairPerPc: { value: nextDraft.priceRepairPerPc, priceUnit: PRICE_UNIT },
            });
            if (!res.ok) {
                throw new Error(res.error || "Failed to save forecasting pricing");
            }

            setRows((prev) =>
                prev.map((item) =>
                    item.key === row.key ? updatePricingRow(item, nextDraft) : item
                )
            );
            cancelEdit();
            toast.success("Forecasting pricing saved.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save forecasting pricing");
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            <div>
                <h1 className="text-[28px] leading-[42px] font-lato font-bold text-[#2D3E5C]">
                    Forecasting
                </h1>
                <p className="mt-1 text-[16px] leading-[24px] font-lato font-normal text-[#6b7280]">
                    Manage spare-part forecast quantities and pricing
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                <StatCard label="New Qty" value={formatNumber(totals.nbNew)} />
                <StatCard label="Repair Qty" value={formatNumber(totals.nbRepair)} />
                <StatCard label="Forecast Total" value={formatMoney(totals.totalCost)} accent />
                <StatCard
                    label="Missing Prices"
                    value={formatNumber(totals.missingPriceRows)}
                    warning={totals.missingPriceRows > 0}
                />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex min-w-[240px] flex-col gap-2">
                        <label className="text-[13px] leading-[20px] text-[#6b7280]">
                            Category
                        </label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(value) => {
                                setSelectedCategory(value);
                                setSelectedMachine(ALL_MACHINES);
                            }}
                        >
                            <SelectTrigger className="h-11 rounded-[8px] border-[#C5D1DC] bg-[#DFE6EC] text-[#2D3E5C]">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex min-w-[260px] flex-col gap-2">
                        <label className="text-[13px] leading-[20px] text-[#6b7280]">
                            Machine
                        </label>
                        <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                            <SelectTrigger className="h-11 rounded-[8px] border-[#C5D1DC] bg-[#DFE6EC] text-[#2D3E5C]">
                                <SelectValue placeholder="Select a machine" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
                                {filterMachines.map((machine) => (
                                    <SelectItem key={machine._id} value={machine._id}>
                                        {[machine.name, machine.serialNumber].filter(Boolean).join(" - ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex min-w-[260px] flex-col gap-2">
                        <label className="text-[13px] leading-[20px] text-[#6b7280]">
                            Search
                        </label>
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Part, KL code, machine"
                            className="h-11 rounded-[8px] border-[#C5D1DC] bg-[#DFE6EC] text-[#2D3E5C]"
                        />
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => void reload()}
                    disabled={loading}
                    className="border-[#607797] bg-[#DFE6EC] text-gray-900 hover:bg-[#e5e7eb]"
                >
                    <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            {totals.missingPriceRows > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-[#d45815]/30 bg-[#fff7ed] px-3 py-2 text-sm font-medium text-[#9a3412]">
                    <AlertTriangle className="h-4 w-4" />
                    {totals.missingPriceRows} planned row{totals.missingPriceRows === 1 ? "" : "s"} need pricing.
                </div>
            )}

            <div className="overflow-hidden rounded-[10px] border border-[#607797] bg-[#DFE6EC]">
                <Table containerClassName="max-h-[65vh] overflow-y-auto">
                    <TableHeader className="sticky top-0 z-10 bg-[#e5e7eb]">
                        <TableRow className="border-[#607797] bg-[#e5e7eb] hover:bg-[#e5e7eb]">
                            <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Component
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Machine
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Nb New
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Nb Repair
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Unit Price New
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Repair Price / Pc
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Subtotal
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-gray-900">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#d45815]" />
                                    Loading forecasting pricing...
                                </TableCell>
                            </TableRow>
                        ) : visibleRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                                    No spare parts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRows.map((row) => {
                                const math = rowMath(row.part);
                                const activeDraft = editingKey === row.key ? draft : null;
                                const isEditing = activeDraft !== null;
                                const isSaving = savingKey === row.key;

                                return (
                                    <TableRow
                                        key={row.key}
                                        className="border-[#607797]/40 transition-colors hover:bg-[#96A5BA]/20"
                                    >
                                        <TableCell className="max-w-[260px] min-w-[200px] pl-5 whitespace-normal">
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <span
                                                    className="block truncate font-semibold text-gray-900"
                                                    title={row.part.name}
                                                >
                                                    {row.part.name}
                                                </span>
                                                <span className="block truncate text-xs font-mono text-gray-500">
                                                    {row.part.klValue || "No KL code"}
                                                </span>
                                                {row.part.itemOnSpareSketch && (
                                                    <span className="block truncate text-xs text-gray-500">
                                                        {row.part.itemOnSpareSketch}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[220px] min-w-[160px] text-sm text-gray-700 whitespace-normal">
                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                <span className="block truncate" title={row.machine.name}>
                                                    {row.machine.name}
                                                </span>
                                                <span className="block truncate text-xs text-gray-500">
                                                    {[row.machine.categoryName, row.machine.serialNumber]
                                                        .filter(Boolean)
                                                        .join(" - ") || "No category"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <NumberInput
                                                    value={activeDraft.nbNew}
                                                    onChange={(value) => setDraft({ ...activeDraft, nbNew: value })}
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-900">{math.nbNew}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <NumberInput
                                                    value={activeDraft.nbRepair}
                                                    onChange={(value) => setDraft({ ...activeDraft, nbRepair: value })}
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-900">{math.nbRepair}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <NumberInput
                                                    value={activeDraft.unitPriceNew}
                                                    onChange={(value) => setDraft({ ...activeDraft, unitPriceNew: value })}
                                                    align="right"
                                                />
                                            ) : (
                                                <PriceCell
                                                    value={math.unitPriceNew}
                                                    clientOverride={math.usesClientNewPrice}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <NumberInput
                                                    value={activeDraft.priceRepairPerPc}
                                                    onChange={(value) =>
                                                        setDraft({ ...activeDraft, priceRepairPerPc: value })
                                                    }
                                                    align="right"
                                                />
                                            ) : (
                                                <PriceCell
                                                    value={math.priceRepairPerPc}
                                                    clientOverride={math.usesClientRepairPrice}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-[#2D3E5C]">
                                            {formatMoney(
                                                isEditing
                                                    ? activeDraft.nbNew * activeDraft.unitPriceNew +
                                                          activeDraft.nbRepair * activeDraft.priceRepairPerPc
                                                    : math.totalCost
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => void savePricing(row)}
                                                            disabled={isSaving}
                                                            className="inline-flex items-center gap-1 text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Save className="h-4 w-4" />
                                                            )}
                                                            <span className="text-xs font-medium">Save</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            disabled={isSaving}
                                                            className="inline-flex items-center gap-1 text-zinc-600 transition-colors hover:text-zinc-800 disabled:opacity-50"
                                                            title="Cancel"
                                                        >
                                                            <X className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Cancel</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(row)}
                                                        className="inline-flex items-center gap-1 text-[#d45815] transition-colors hover:text-[#b8480f]"
                                                        title="Edit pricing"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="text-xs font-medium">Edit</span>
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {visibleRows.length > 0 && (
                    <div className="flex flex-wrap items-center justify-end gap-6 border-t border-[#607797]/40 bg-[#e5e7eb] px-5 py-4 text-sm">
                        <TotalLabel label="New subtotal" value={formatMoney(totals.newCost)} />
                        <TotalLabel label="Repair subtotal" value={formatMoney(totals.repairCost)} />
                        <TotalLabel label="Total" value={formatMoney(totals.totalCost)} strong />
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    accent = false,
    warning = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
    warning?: boolean;
}) {
    return (
        <div
            className={`rounded-[10px] border px-4 py-3 ${
                warning
                    ? "border-[#d45815]/30 bg-[#fff7ed]"
                    : accent
                    ? "border-[#d45815]/30 bg-[#d45815]/10"
                    : "border-[#96A5BA] bg-white"
            }`}
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#607797]">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${warning || accent ? "text-[#d45815]" : "text-[#2D3E5C]"}`}>
                {value}
            </p>
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    align = "center",
}: {
    value: number;
    onChange: (value: number) => void;
    align?: "center" | "right";
}) {
    return (
        <Input
            type="number"
            min={0}
            value={value}
            onChange={(event) => onChange(Math.max(0, toNumber(event.target.value)))}
            className={`h-8 w-[110px] border-[#d1d5db] bg-white text-gray-900 ${
                align === "right" ? "text-right" : "text-center"
            }`}
        />
    );
}

function PriceCell({ value, clientOverride }: { value: number; clientOverride: boolean }) {
    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="font-medium text-gray-900">{formatMoney(value)}</span>
            <span className="text-[11px] font-medium text-gray-500">
                {clientOverride ? "Client" : "Catalog"}
            </span>
        </div>
    );
}

function TotalLabel({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#607797]">{label}</p>
            <p className={`${strong ? "text-xl" : "text-base"} font-bold text-[#2D3E5C]`}>{value}</p>
        </div>
    );
}
