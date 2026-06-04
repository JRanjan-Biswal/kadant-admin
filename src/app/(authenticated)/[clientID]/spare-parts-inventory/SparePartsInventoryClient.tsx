'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Upload, RefreshCw, Save, X, Loader2 } from "lucide-react";
import {
    fetchInventoryForMachine,
    saveSparePart,
    saveClientSparePart,
    type InventoryMachine,
    type InventorySparePart,
    type MaintenanceScheduleEntry,
} from "@/actions/spare-parts-inventory";
import CsvImportWizard from "./CsvImportWizard";

interface Props {
    clientID: string;
    machines: InventoryMachine[];
}

const ALL_CATEGORIES = "__all__";

type StatusLabel = "In Stock" | "Low Stocks" | "Out of Stock";

const stockStatus = (
    stock: number,
    qtySelected: number
): { label: StatusLabel; bg: string; text: string } => {
    if (stock <= 0) return { label: "Out of Stock", bg: "bg-red-500/20", text: "text-red-700" };
    if (qtySelected > 0 && stock < qtySelected)
        return { label: "Low Stocks", bg: "bg-orange-500/20", text: "text-orange-700" };
    return { label: "In Stock", bg: "bg-green-500/20", text: "text-green-700" };
};

const statusStyle = (label: StatusLabel) => {
    if (label === "Out of Stock") return { bg: "bg-red-500/20", text: "text-red-700" };
    if (label === "Low Stocks") return { bg: "bg-orange-500/20", text: "text-orange-700" };
    return { bg: "bg-green-500/20", text: "text-green-700" };
};

const effectiveStatus = (part: InventorySparePart) => {
    const override = part.clientMachineSparePart?.statusOverride;
    if (override) {
        return { label: override, ...statusStyle(override) };
    }
    const stock = part.clientMachineSparePart?.stockQuantity ?? 0;
    const required = part.clientMachineSparePart?.qtySelected ?? 0;
    return stockStatus(stock, required);
};

const formatDate = (iso?: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const formatLastUpdate = (iso?: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    let hr = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = hr >= 12 ? "pm" : "am";
    hr = hr % 12 || 12;
    return `${day}/${month}/${year} at ${hr}:${min}${ampm}`;
};

const deliveryText = (sp: InventorySparePart): string => {
    if (sp.deliveryTime?.value) return `${sp.deliveryTime.value} ${sp.deliveryTime.unit || "weeks"}`;
    return "—";
};

// Frequency = gap between the first two scheduled checks (e.g. weeks 4 and 12 → "Every 8 weeks").
// Falls back to "—" if there aren't enough check entries to compute a gap.
const frequencyText = (schedule: MaintenanceScheduleEntry[]): string => {
    if (!schedule || schedule.length === 0) return "—";
    const checks = schedule
        .filter((e) => /check/i.test(e.action))
        .map((e) => e.week)
        .sort((a, b) => a - b);
    if (checks.length >= 2) return `Every ${checks[1] - checks[0]} weeks`;
    if (schedule.length >= 2) {
        const wks = schedule.map((e) => e.week).sort((a, b) => a - b);
        return `Every ${wks[1] - wks[0]} weeks`;
    }
    return "—";
};

// Dominant action: "Change" wins over "Check" if any change is scheduled —
// matches how the maintenance CSV labels rows.
const dominantAction = (schedule: MaintenanceScheduleEntry[]): "Change" | "Check" | "—" => {
    if (!schedule || schedule.length === 0) return "—";
    if (schedule.some((e) => /change/i.test(e.action))) return "Change";
    if (schedule.some((e) => /check/i.test(e.action))) return "Check";
    return "—";
};

const actionPill = (action: string) => {
    if (action === "Change") return "bg-orange-500/20 text-orange-700";
    if (action === "Check") return "bg-emerald-500/20 text-emerald-700";
    return "bg-zinc-200 text-zinc-700";
};

const instructionText = (
    part: InventorySparePart,
    statusLabel: string
): string => {
    if (statusLabel === "Out of Stock" || statusLabel === "Low Stocks") {
        return "Critical component. Order before stock runs out.";
    }
    const firstWithDesc = part.maintenanceSchedule?.find((e) => e.description?.trim());
    if (firstWithDesc) return firstWithDesc.description;
    return "Routine inspection scheduled.";
};

const installedAtText = (part: InventorySparePart, machineInstallDate?: string | null) => {
    const d =
        part.clientMachineSparePart?.sparePartInstallationDate ||
        machineInstallDate ||
        null;
    return formatDate(d);
};

const lastUpdateAcross = (inventory: InventorySparePart[]): string | null => {
    let latest: number | null = null;
    for (const sp of inventory) {
        for (const ts of [sp.updatedAt, sp.clientMachineSparePart?.updatedAt]) {
            if (!ts) continue;
            const t = new Date(ts).getTime();
            if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t;
        }
    }
    return latest === null ? null : new Date(latest).toISOString();
};

export default function SparePartsInventoryClient({ clientID, machines }: Props) {
    const categories = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of machines) {
            if (m.categoryId && m.categoryName && !map.has(m.categoryId)) {
                map.set(m.categoryId, m.categoryName);
            }
        }
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [machines]);

    const [selectedCategory, setSelectedCategory] = useState<string>(
        categories[0]?.id || ALL_CATEGORIES
    );

    const filteredMachines = useMemo(
        () =>
            selectedCategory === ALL_CATEGORIES
                ? machines
                : machines.filter((m) => m.categoryId === selectedCategory),
        [machines, selectedCategory]
    );

    const [selectedMachine, setSelectedMachine] = useState<string>(
        filteredMachines[0]?._id || ""
    );

    // When category changes, pick the first machine in that category.
    useEffect(() => {
        if (filteredMachines.length === 0) {
            setSelectedMachine("");
            return;
        }
        if (!filteredMachines.some((m) => m._id === selectedMachine)) {
            setSelectedMachine(filteredMachines[0]._id);
        }
    }, [filteredMachines, selectedMachine]);

    const machineInstallDate = useMemo(
        () => machines.find((m) => m._id === selectedMachine)?.installationDate ?? null,
        [machines, selectedMachine]
    );

    const [inventory, setInventory] = useState<InventorySparePart[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [importOpen, setImportOpen] = useState(false);

    // Inline edit state — replaces the old modal-driven flow.
    interface DraftRow {
        current: number;
        required: number;
        deliveryWeeks: number;
        frequencyWeeks: number;
        type: "Check" | "Change";
        instructions: string;
        status: StatusLabel | "auto";
    }
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRow | null>(null);
    const [saving, setSaving] = useState(false);

    const startEdit = (part: InventorySparePart, statusLabel: string) => {
        const stock = part.clientMachineSparePart?.stockQuantity ?? 0;
        const required = part.clientMachineSparePart?.qtySelected ?? 0;
        const action = dominantAction(part.maintenanceSchedule);
        const freqMatch = frequencyText(part.maintenanceSchedule).match(/(\d+)/);
        const override = part.clientMachineSparePart?.statusOverride ?? null;
        setEditingId(part._id);
        setDraft({
            current: stock,
            required,
            deliveryWeeks: part.deliveryTime?.value || 0,
            frequencyWeeks: freqMatch ? parseInt(freqMatch[1], 10) : 0,
            type: action === "Change" ? "Change" : "Check",
            instructions: instructionText(part, statusLabel),
            status: override ?? "auto",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
    };

    const saveInline = async (part: InventorySparePart) => {
        if (!draft || !selectedMachine) return;
        setSaving(true);
        setError(null);
        try {
            // Rewrite the maintenance schedule from frequency + type so the
            // page can re-derive Frequency / Type / Instructions next render.
            const f = Math.max(0, Math.floor(draft.frequencyWeeks));
            const newSchedule: MaintenanceScheduleEntry[] = [];
            if (f > 0) {
                for (let w = f; w <= 52; w += f) {
                    newSchedule.push({ week: w, action: draft.type, description: draft.instructions });
                }
            }

            const catalogRes = await saveSparePart(part._id, {
                deliveryTime: { value: draft.deliveryWeeks, unit: "weeks" },
                maintenanceSchedule: newSchedule,
            });
            if (!catalogRes.ok) {
                setError(catalogRes.error || "Failed to save catalog fields");
                return;
            }

            const clientRes = await saveClientSparePart(clientID, selectedMachine, part._id, {
                stockQuantity: draft.current,
                qtySelected: draft.required,
                statusOverride: draft.status === "auto" ? null : draft.status,
            });
            if (!clientRes.ok) {
                setError(clientRes.error || "Failed to save inventory row");
                return;
            }

            cancelEdit();
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const reload = useCallback(async () => {
        if (!selectedMachine) {
            setInventory([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchInventoryForMachine(clientID, selectedMachine);
            setInventory(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load inventory");
        } finally {
            setLoading(false);
        }
    }, [clientID, selectedMachine]);

    useEffect(() => {
        reload();
    }, [reload]);

    const lastUpdate = lastUpdateAcross(inventory);

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-[28px] leading-[42px] font-lato font-bold text-[#2D3E5C]">
                        Spare Parts Inventory
                    </h1>
                    <p className="text-[16px] leading-[24px] font-lato font-normal text-[#6b7280] mt-1">
                        Complete spare parts control and order management
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={reload}
                        disabled={loading}
                        className="border-[#607797] bg-[#DFE6EC] hover:bg-[#e5e7eb] text-gray-900"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Category + Machine Selectors ── */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2 min-w-[260px]">
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                        Select Category
                    </label>
                    {categories.length === 0 ? (
                        <p className="text-sm text-[#6b7280]">No categories.</p>
                    ) : (
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
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
                    )}
                </div>

                <div className="flex flex-col gap-2 min-w-[260px]">
                    <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                        Select Machine
                    </label>
                    {filteredMachines.length === 0 ? (
                        <p className="text-sm text-[#6b7280]">
                            No machines in this category.
                        </p>
                    ) : (
                        <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                            <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                <SelectValue placeholder="Select a machine" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredMachines.map((machine) => (
                                    <SelectItem key={machine._id} value={machine._id}>
                                        {machine.name}
                                        {machine.serialNumber ? ` — ${machine.serialNumber}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-700 text-sm rounded-md p-2">
                    {error}
                </div>
            )}

            {/* ── Inventory Table ── */}
            <div className="rounded-[10px] border border-[#607797] bg-[#DFE6EC] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#607797] bg-[#e5e7eb]">
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider pl-5">
                                Part Name
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Stock Levels
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Delivery Time
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Frequency
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Type
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Instructions
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Status
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider text-center">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : inventory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                    No spare parts found for this machine.
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventory.map((part) => {
                                const stock = part.clientMachineSparePart?.stockQuantity ?? 0;
                                const required = part.clientMachineSparePart?.qtySelected ?? 0;
                                const status = effectiveStatus(part);
                                const action = dominantAction(part.maintenanceSchedule);
                                const isEditing = editingId === part._id && draft !== null;
                                // While editing, show the picked override; if user chose "auto"
                                // fall back to the live derivation from current/required.
                                const editStatusLabel: StatusLabel = isEditing
                                    ? draft!.status === "auto"
                                        ? stockStatus(draft!.current, draft!.required).label
                                        : draft!.status
                                    : status.label;
                                const editStatus = { label: editStatusLabel, ...statusStyle(editStatusLabel) };

                                return (
                                    <TableRow
                                        key={part._id}
                                        className="border-[#607797]/40 transition-colors hover:bg-[#96A5BA]/20"
                                    >
                                        <TableCell className="pl-5 max-w-[200px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-gray-900 block max-w-[200px] whitespace-normal break-words">
                                                    {part.name}
                                                </span>
                                                {part.klValue && (
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {part.klValue}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    Installed: {installedAtText(part, machineInstallDate)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Stock Levels */}
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1.5 text-sm">
                                                    <label className="flex items-center gap-2">
                                                        <span className="text-gray-900 w-[60px]">Current</span>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={draft!.current}
                                                            onChange={(e) =>
                                                                setDraft({ ...draft!, current: Math.max(0, parseInt(e.target.value || "0", 10)) })
                                                            }
                                                            className="h-8 w-20 bg-white border-[#d1d5db] text-gray-900"
                                                        />
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <span className="text-gray-600 w-[60px]">Required</span>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={draft!.required}
                                                            onChange={(e) =>
                                                                setDraft({ ...draft!, required: Math.max(0, parseInt(e.target.value || "0", 10)) })
                                                            }
                                                            className="h-8 w-20 bg-white border-[#d1d5db] text-gray-900"
                                                        />
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-0.5 text-sm">
                                                    <span className="text-gray-900">Current - {stock}</span>
                                                    <span className="text-gray-600">Required - {required}</span>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Delivery Time */}
                                        <TableCell className="text-gray-700 text-sm">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={draft!.deliveryWeeks}
                                                        onChange={(e) =>
                                                            setDraft({ ...draft!, deliveryWeeks: Math.max(0, parseInt(e.target.value || "0", 10)) })
                                                        }
                                                        className="h-8 w-20 bg-white border-[#d1d5db] text-gray-900"
                                                    />
                                                    <span>Weeks</span>
                                                </div>
                                            ) : (
                                                deliveryText(part)
                                            )}
                                        </TableCell>

                                        {/* Frequency */}
                                        <TableCell className="text-gray-700 text-sm">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <span>Every</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={draft!.frequencyWeeks}
                                                        onChange={(e) =>
                                                            setDraft({ ...draft!, frequencyWeeks: Math.max(0, parseInt(e.target.value || "0", 10)) })
                                                        }
                                                        className="h-8 w-20 bg-white border-[#d1d5db] text-gray-900"
                                                    />
                                                    <span>weeks</span>
                                                </div>
                                            ) : (
                                                frequencyText(part.maintenanceSchedule)
                                            )}
                                        </TableCell>

                                        {/* Type */}
                                        <TableCell>
                                            {isEditing ? (
                                                <Select
                                                    value={draft!.type}
                                                    onValueChange={(v) =>
                                                        setDraft({ ...draft!, type: v as "Check" | "Change" })
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-[110px] bg-[#96A5BA] border-[#607797]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Check">Check</SelectItem>
                                                        <SelectItem value="Change">Change</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${actionPill(action)}`}
                                                >
                                                    {action}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Instructions */}
                                        <TableCell className="text-gray-700 text-xs max-w-[220px]">
                                            {isEditing ? (
                                                <textarea
                                                    rows={2}
                                                    value={draft!.instructions}
                                                    onChange={(e) =>
                                                        setDraft({ ...draft!, instructions: e.target.value })
                                                    }
                                                    className="w-full text-xs bg-white border border-[#96A5BA] rounded px-2 py-1 text-gray-900"
                                                />
                                            ) : (
                                                <span className="block leading-snug max-w-[220px] whitespace-normal break-words">
                                                    {instructionText(part, status.label)}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Status — editable in place; "Auto" defers to current/required */}
                                        <TableCell>
                                            {isEditing ? (
                                                <Select
                                                    value={draft!.status}
                                                    onValueChange={(v) =>
                                                        setDraft({
                                                            ...draft!,
                                                            status: v as StatusLabel | "auto",
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-[140px] bg-[#96A5BA] border-[#607797]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="auto">Auto</SelectItem>
                                                        <SelectItem value="In Stock">In Stock</SelectItem>
                                                        <SelectItem value="Low Stocks">Low Stocks</SelectItem>
                                                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${editStatus.bg} ${editStatus.text}`}
                                                >
                                                    {editStatus.label}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveInline(part)}
                                                            disabled={saving}
                                                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                                                            title="Save"
                                                        >
                                                            {saving ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                            <span className="text-xs font-medium">Save</span>
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            disabled={saving}
                                                            className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Cancel</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => startEdit(part, status.label)}
                                                        className="inline-flex items-center gap-1 text-orange hover:text-orange-light transition-colors cursor-pointer"
                                                        title="Edit fields"
                                                    >
                                                        <Pencil className="w-4 h-4" />
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
            </div>

            {/* ── Footer: Last Update ── */}
            {!loading && inventory.length > 0 && (
                <div className="flex justify-end text-[13px] text-[#6b7280]">
                    Last Update On - {formatLastUpdate(lastUpdate)}
                </div>
            )}

            <CsvImportWizard
                open={importOpen}
                onOpenChange={setImportOpen}
                clientID={clientID}
                onImported={reload}
            />
        </div>
    );
}
