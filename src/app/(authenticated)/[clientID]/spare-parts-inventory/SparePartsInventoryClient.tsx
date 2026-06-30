'use client';

import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from "react";
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
import { Switch } from "@/components/ui/switch";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Upload, RefreshCw, Save, X, Loader2 } from "lucide-react";
import {
    fetchInventoryQueue,
    fetchInventoryForMachine,
    fetchReplacementOptions,
    saveSparePart,
    saveClientSparePart,
    type InventoryQueueItem,
    type InventoryQueueType,
    type InventoryMachine,
    type InventorySparePart,
    type MaintenanceScheduleEntry,
    type ReplacementHistoryEntry,
    type ReplacementOption,
} from "@/actions/spare-parts-inventory";
import MaintenanceScheduleEditor from "./MaintenanceScheduleEditor";

interface Props {
    clientID: string;
    machines: InventoryMachine[];
}

const ALL_CATEGORIES = "__all__";
const ALL_MACHINES = "__all_machines__";
const QUEUE_PAGE_SIZE = 10;
const REPLACEMENT_OPTION_PAGE_SIZE = 10;

type InventoryTab = "all" | InventoryQueueType;

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

const installedAtText = (part: InventorySparePart, machineInstallDate?: string | null) => {
    const d =
        part.clientMachineSparePart?.sparePartInstallationDate ||
        machineInstallDate ||
        null;
    return formatDate(d);
};

const dateInputValue = (iso?: string | null) => {
    if (!iso) return new Date().toISOString().slice(0, 10);
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
};

const partType = (part: InventorySparePart): "New" | "Rebuilt" =>
    part.clientMachineSparePart?.rotorType === "Rebuilt" ? "Rebuilt" : "New";

const rebuildCount = (part: InventorySparePart): number =>
    Math.max(0, Number(part.clientMachineSparePart?.rebuildsPossible) || 0);

const isActivePart = (part: InventorySparePart): boolean =>
    part.clientMachineSparePart?.isActive !== false;

const lifetimeDisplayText = (part: InventorySparePart): string => {
    const clientPart = part.clientMachineSparePart;
    const text =
        clientPart?.replacementLifetimeText ||
        clientPart?.lifetimeText ||
        (clientPart?.rotorType === "Rebuilt" ? clientPart?.rebuildLifetimeText : null) ||
        part.lifetimeText;
    if (text?.trim()) return text.trim();

    const activeLifetime =
        clientPart?.lifetimeOfRotor?.value && clientPart.lifetimeOfRotor.value > 0
            ? clientPart.lifetimeOfRotor
            : clientPart?.rotorType === "Rebuilt" && clientPart?.rebuildLifetime?.value
            ? clientPart.rebuildLifetime
            : part.lifeTime;
    return metricText(activeLifetime) || "—";
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
    const [activeTab, setActiveTab] = useState<InventoryTab>("all");
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
    const [trackedCategory, setTrackedCategory] = useState<string>(ALL_CATEGORIES);
    const [trackedMachine, setTrackedMachine] = useState<string>(ALL_MACHINES);

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
    const trackedMachines = useMemo(
        () =>
            trackedCategory === ALL_CATEGORIES
                ? machines
                : machines.filter((m) => m.categoryId === trackedCategory),
        [machines, trackedCategory]
    );
    const [inventory, setInventory] = useState<InventorySparePart[]>([]);
    const [queueItems, setQueueItems] = useState<InventoryQueueItem[]>([]);
    const [queuePages, setQueuePages] = useState<Record<InventoryQueueType, number>>({
        rebuild: 1,
        orderedNew: 1,
        replaced: 1,
    });
    const [queueMeta, setQueueMeta] = useState({
        page: 1,
        limit: QUEUE_PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });
    const [queueLoading, setQueueLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replacementTarget, setReplacementTarget] = useState<InventoryQueueItem | null>(null);
    const [replacementSaving, setReplacementSaving] = useState(false);
    const [replacementOptions, setReplacementOptions] = useState<ReplacementOption[]>([]);
    const [replacementOptionsLoading, setReplacementOptionsLoading] = useState(false);
    const [replacementOptionsPage, setReplacementOptionsPage] = useState(1);
    const [replacementOptionsMeta, setReplacementOptionsMeta] = useState({
        page: 1,
        limit: REPLACEMENT_OPTION_PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });
    const [replacementSearch, setReplacementSearch] = useState("");
    const [replacementCategoryFilter, setReplacementCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [replacementMachineFilter, setReplacementMachineFilter] = useState<string>(ALL_MACHINES);
    const replacementFilterMachines = useMemo(
        () =>
            replacementCategoryFilter === ALL_CATEGORIES
                ? machines
                : machines.filter((m) => m.categoryId === replacementCategoryFilter),
        [machines, replacementCategoryFilter]
    );

    const [schedulePart, setSchedulePart] = useState<InventorySparePart | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    // Inline edit state for the fields that drive part lifetime calculations.
    interface DraftRow {
        lifetimeText: string;
        rotorType: "New" | "Rebuilt";
        rebuildsPossible: number;
    }
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeSavingId, setActiveSavingId] = useState<string | null>(null);

    const startEdit = (part: InventorySparePart) => {
        setEditingId(part._id);
        setDraft({
            lifetimeText:
                part.clientMachineSparePart?.lifetimeText ||
                part.clientMachineSparePart?.rebuildLifetimeText ||
                part.lifetimeText ||
                "",
            rotorType: partType(part),
            rebuildsPossible: rebuildCount(part),
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
            const lifetimeText = draft.lifetimeText.trim();
            const rotorType = draft.rotorType === "Rebuilt" ? "Rebuilt" : "New";
            const clientRes = await saveClientSparePart(
                clientID,
                selectedMachine,
                part._id,
                {
                    lifetimeText,
                    rotorType,
                    rebuildsPossible: Math.max(0, Number(draft.rebuildsPossible) || 0),
                    rebuildLifetimeText: rotorType === "Rebuilt" ? lifetimeText : null,
                }
            );
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

    const toggleInventoryActive = async (part: InventorySparePart, nextActive: boolean) => {
        if (!selectedMachine) return;
        setActiveSavingId(part._id);
        setError(null);
        try {
            const res = await saveClientSparePart(clientID, selectedMachine, part._id, {
                isActive: nextActive,
            });
            if (!res.ok) {
                setError(res.error || "Failed to update active status");
                return;
            }
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update active status");
        } finally {
            setActiveSavingId(null);
        }
    };

    const openScheduleEditor = (part: InventorySparePart) => {
        setSchedulePart(part);
        setScheduleOpen(true);
    };

    const handleScheduleOpenChange = (open: boolean) => {
        setScheduleOpen(open);
        if (!open) setSchedulePart(null);
    };

    const saveSchedule = async (schedule: MaintenanceScheduleEntry[]) => {
        if (!schedulePart) return;
        setError(null);
        const res = await saveSparePart(schedulePart._id, { maintenanceSchedule: schedule });
        if (!res.ok) {
            throw new Error(res.error || "Failed to save maintenance schedule");
        }
        await reload();
    };

    const activeQueueType: InventoryQueueType | null = activeTab === "all" ? null : activeTab;
    const activeQueuePage = activeQueueType ? queuePages[activeQueueType] : 1;

    useEffect(() => {
        if (
            trackedMachine !== ALL_MACHINES &&
            !trackedMachines.some((machine) => machine._id === trackedMachine)
        ) {
            setTrackedMachine(ALL_MACHINES);
        }
    }, [trackedMachine, trackedMachines]);

    useEffect(() => {
        if (!activeQueueType) return;
        setQueuePages((prev) =>
            prev[activeQueueType] === 1
                ? prev
                : { ...prev, [activeQueueType]: 1 }
        );
    }, [activeQueueType, trackedCategory, trackedMachine]);

    const loadQueue = useCallback(async (queueType: InventoryQueueType, page: number) => {
        setQueueLoading(true);
        setError(null);
        try {
            const data = await fetchInventoryQueue(clientID, queueType, page, QUEUE_PAGE_SIZE, {
                categoryID: trackedCategory === ALL_CATEGORIES ? undefined : trackedCategory,
                machineID: trackedMachine === ALL_MACHINES ? undefined : trackedMachine,
            });
            setQueueItems(data.items);
            setQueueMeta({
                page: data.page,
                limit: data.limit,
                total: data.total,
                totalPages: data.totalPages,
            });
            if (data.page !== page) {
                setQueuePages((prev) => ({ ...prev, [queueType]: data.page }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tracked inventory");
            setQueueItems([]);
            setQueueMeta({ page: 1, limit: QUEUE_PAGE_SIZE, total: 0, totalPages: 0 });
        } finally {
            setQueueLoading(false);
        }
    }, [clientID, trackedCategory, trackedMachine]);

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

    const isRefreshing = activeQueueType ? queueLoading : loading;
    const handleRefresh = useCallback(() => {
        if (activeQueueType) {
            void loadQueue(activeQueueType, activeQueuePage);
            return;
        }
        void reload();
    }, [activeQueuePage, activeQueueType, loadQueue, reload]);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        if (!replacementTarget) return;
        setReplacementCategoryFilter(replacementTarget.machine.categoryId || ALL_CATEGORIES);
        setReplacementMachineFilter(replacementTarget.machine._id || ALL_MACHINES);
        setReplacementSearch("");
        setReplacementOptionsPage(1);
    }, [replacementTarget?.machine._id, replacementTarget?.machine.categoryId]);

    useEffect(() => {
        if (
            replacementMachineFilter !== ALL_MACHINES &&
            !replacementFilterMachines.some((machine) => machine._id === replacementMachineFilter)
        ) {
            setReplacementMachineFilter(ALL_MACHINES);
            setReplacementOptionsPage(1);
        }
    }, [replacementFilterMachines, replacementMachineFilter]);

    useEffect(() => {
        let cancelled = false;
        if (!replacementTarget) {
            setReplacementOptions([]);
            setReplacementOptionsLoading(false);
            setReplacementOptionsMeta({
                page: 1,
                limit: REPLACEMENT_OPTION_PAGE_SIZE,
                total: 0,
                totalPages: 0,
            });
            return;
        }

        setReplacementOptionsLoading(true);
        fetchReplacementOptions(clientID, {
            page: replacementOptionsPage,
            limit: REPLACEMENT_OPTION_PAGE_SIZE,
            categoryID:
                replacementCategoryFilter === ALL_CATEGORIES
                    ? undefined
                    : replacementCategoryFilter,
            machineID:
                replacementMachineFilter === ALL_MACHINES
                    ? undefined
                    : replacementMachineFilter,
            search: replacementSearch.trim() || undefined,
        })
            .then((data) => {
                if (cancelled) return;
                setReplacementOptions(data.items);
                setReplacementOptionsMeta({
                    page: data.page,
                    limit: data.limit,
                    total: data.total,
                    totalPages: data.totalPages,
                });
                if (data.page !== replacementOptionsPage) {
                    setReplacementOptionsPage(data.page);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setReplacementOptions([]);
                setReplacementOptionsMeta({
                    page: 1,
                    limit: REPLACEMENT_OPTION_PAGE_SIZE,
                    total: 0,
                    totalPages: 0,
                });
                setError(err instanceof Error ? err.message : "Failed to load replacement options");
            })
            .finally(() => {
                if (!cancelled) setReplacementOptionsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        clientID,
        replacementCategoryFilter,
        replacementMachineFilter,
        replacementOptionsPage,
        replacementSearch,
        replacementTarget,
    ]);

    useEffect(() => {
        if (activeQueueType) {
            loadQueue(activeQueueType, activeQueuePage);
        }
    }, [activeQueueType, activeQueuePage, loadQueue]);

    const handleQueuePageChange = useCallback((page: number) => {
        if (!activeQueueType) return;
        setQueuePages((prev) => ({ ...prev, [activeQueueType]: page }));
    }, [activeQueueType]);

    const handleReplacementSave = async (data: ReplacementFormData) => {
        if (!replacementTarget) return;
        setReplacementSaving(true);
        setError(null);
        try {
            const clientPart = replacementTarget.part.clientMachineSparePart;
            const selectedReplacementPart = replacementOptions.find(
                (part) => part._id === data.replacementOptionID
            );
            const replacementDate = data.replacementDate || new Date().toISOString().slice(0, 10);
            const replacementLifetimeText =
                data.lifetimeText.trim() ||
                selectedReplacementPart?.lifetimeText ||
                "";
            const replacementSource =
                replacementTarget.queueType === "rebuild"
                    ? "Rebuild"
                    : replacementTarget.queueType === "orderedNew"
                    ? "Order New"
                    : clientPart?.replacementSource || "Rebuild";
            const updates: Record<string, unknown> = {
                replacementSource,
                replacementDate,
                replacementRecordedAt: clientPart?.replacementRecordedAt || new Date().toISOString(),
                replacementSparePart: data.replacementSparePartID || null,
                replacementSourceMachine: data.replacementSourceMachineID || undefined,
                replacementPartSnapshot: data.replacementSparePartID ? undefined : null,
                replacementPartName:
                    data.partName.trim() ||
                    selectedReplacementPart?.name ||
                    replacementTarget.part.name,
                replacementPartKlValue:
                    data.klValue.trim() ||
                    selectedReplacementPart?.klValue ||
                    replacementTarget.part.klValue ||
                    null,
                replacementPartSerialNumber: data.serialNumber.trim() || null,
                replacementNotes: data.notes.trim() || null,
                replacementMediaUrls: data.mediaUrls,
                sparePartInstallationDate: replacementDate,
                lastServiceDate: replacementDate,
                stockQuantity: Math.max(clientPart?.stockQuantity ?? 0, 1),
                isActive: true,
                rebuildsPossible: Math.max(0, Number(data.rebuildsPossible) || 0),
                rotorType: data.rotorType,
                totalRunningHours: { value: 0, unit: clientPart?.totalRunningHours?.unit || "Hrs" },
                exceededLife: { value: 0, unit: "Hrs" },
                statusOverride: null,
            };
            if (replacementLifetimeText) {
                updates.replacementLifetimeText = replacementLifetimeText;
                updates.lifetimeText = replacementLifetimeText;
            }

            if (replacementSource === "Rebuild") {
                updates.rebuildStatus = "In Stock";
                updates.isSentToRebuild = false;
            } else {
                updates.orderNewStatus = "In Stock";
                updates.isOrderedNew = false;
            }
            if (data.rotorType === "Rebuilt" && replacementLifetimeText) {
                updates.rebuildLifetimeText = replacementLifetimeText;
            }

            const res = await saveClientSparePart(
                clientID,
                replacementTarget.machine._id,
                replacementTarget.part._id,
                updates
            );
            if (!res.ok) {
                throw new Error(res.error || "Failed to save replacement details");
            }
            setReplacementTarget(null);
            await Promise.all([
                reload(),
                activeQueueType
                    ? loadQueue(activeQueueType, queuePages[activeQueueType])
                    : Promise.resolve(),
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save replacement details");
        } finally {
            setReplacementSaving(false);
        }
    };

    const lastUpdate = lastUpdateAcross(inventory);

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div>
                <div>
                    <h1 className="text-[28px] leading-[42px] font-lato font-bold text-[#2D3E5C]">
                        Inventory Management
                    </h1>
                    <p className="text-[16px] leading-[24px] font-lato font-normal text-[#6b7280] mt-1">
                        Manage inventory, categories, machines, spare parts, and order workflows
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-[#C5D1DC]">
                {[
                    { id: "all" as InventoryTab, label: "All Machines" },
                    { id: "rebuild" as InventoryTab, label: "Rebuild" },
                    { id: "orderedNew" as InventoryTab, label: "Ordered New" },
                    { id: "replaced" as InventoryTab, label: "Replaced Inventory" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? "border-[#d45815] text-[#d45815]"
                                : "border-transparent text-[#607797] hover:text-[#2D3E5C]"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Filters + Actions ── */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                {activeTab === "all" ? (
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-2 min-w-[260px]">
                            <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                                Category
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
                                Machine
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
                ) : (
                    <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-2 min-w-[260px]">
                        <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                            Category
                        </label>
                        {categories.length === 0 ? (
                            <p className="text-sm text-[#6b7280]">No categories.</p>
                        ) : (
                            <Select
                                value={trackedCategory}
                                onValueChange={(value) => {
                                    setTrackedCategory(value);
                                    setTrackedMachine(ALL_MACHINES);
                                }}
                            >
                                <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                    <SelectValue placeholder="Filter by category" />
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
                        )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[260px]">
                        <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                            Machine
                        </label>
                        {trackedMachines.length === 0 ? (
                            <p className="text-sm text-[#6b7280]">
                                No machines in this category.
                            </p>
                        ) : (
                            <Select value={trackedMachine} onValueChange={setTrackedMachine}>
                                <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                    <SelectValue placeholder="Filter by machine" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
                                    {trackedMachines.map((machine) => (
                                        <SelectItem key={machine._id} value={machine._id}>
                                            {machine.name}
                                            {machine.serialNumber ? ` - ${machine.serialNumber}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
                )}

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="border-[#607797] bg-[#DFE6EC] hover:bg-[#e5e7eb] text-gray-900"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-700 text-sm rounded-md p-2">
                    {error}
                </div>
            )}

            {/* ── Inventory Table ── */}
            <div className="rounded-[10px] border border-[#607797] bg-[#DFE6EC] overflow-hidden">
                {activeTab === "all" ? (
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#607797] bg-[#e5e7eb]">
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider pl-5">
                                Part Name
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                KL Code
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Lifetime
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Part Type
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Rebuilds Possible
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Installed
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Active
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
                                const isEditing = editingId === part._id && draft !== null;
                                const activePartType = partType(part);
                                const activeRebuildCount = rebuildCount(part);
                                const active = isActivePart(part);
                                const activeSaving = activeSavingId === part._id;

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
                                                <span className="text-xs text-gray-500">
                                                    {part.itemOnSpareSketch || "Spare part"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-gray-700 text-sm font-mono">
                                            {part.klValue || "—"}
                                        </TableCell>

                                        <TableCell className="text-gray-700 text-sm">
                                            {isEditing ? (
                                                <Input
                                                    value={draft!.lifetimeText}
                                                    onChange={(event) =>
                                                        setDraft({ ...draft!, lifetimeText: event.target.value })
                                                    }
                                                    placeholder="e.g. 3 Months or 1 Year"
                                                    className="h-8 min-w-[170px] bg-white border-[#d1d5db] text-gray-900"
                                                />
                                            ) : (
                                                lifetimeDisplayText(part)
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={draft!.rotorType === "Rebuilt"}
                                                        onCheckedChange={(checked) =>
                                                            setDraft({ ...draft!, rotorType: checked ? "Rebuilt" : "New" })
                                                        }
                                                    />
                                                    <span className="text-sm text-gray-900">
                                                        {draft!.rotorType === "Rebuilt" ? "Rebuilt" : "New"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                        activePartType === "Rebuilt"
                                                            ? "bg-orange-500/20 text-orange-700"
                                                            : "bg-green-500/20 text-green-700"
                                                    }`}
                                                >
                                                    {activePartType}
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-gray-700 text-sm">
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={draft!.rebuildsPossible}
                                                    onChange={(event) =>
                                                        setDraft({
                                                            ...draft!,
                                                            rebuildsPossible: Math.max(0, Number(event.target.value) || 0),
                                                        })
                                                    }
                                                    className="h-8 w-24 bg-white border-[#d1d5db] text-gray-900"
                                                />
                                            ) : (
                                                activeRebuildCount
                                            )}
                                        </TableCell>

                                        <TableCell className="text-gray-700 text-sm">
                                            {installedAtText(part, machineInstallDate)}
                                        </TableCell>

                                        <TableCell>
                                            <button
                                                type="button"
                                                disabled={activeSaving}
                                                onClick={() => toggleInventoryActive(part, !active)}
                                                className={`inline-flex min-w-[82px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    active
                                                        ? "border-[#00a82d]/40 bg-[#00a82d]/20 text-[#007a22] hover:bg-[#00a82d]/30"
                                                        : "border-[#bf1e21]/40 bg-[#bf1e21]/15 text-[#9f1d20] hover:bg-[#bf1e21]/25"
                                                }`}
                                                title={active ? "Mark inactive" : "Mark active"}
                                            >
                                                {activeSaving ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : active ? (
                                                    "Active"
                                                ) : (
                                                    "Inactive"
                                                )}
                                            </button>
                                        </TableCell>

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
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(part)}
                                                            className="inline-flex items-center gap-1 text-orange hover:text-orange-light transition-colors cursor-pointer"
                                                            title="Edit inventory fields"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openScheduleEditor(part)}
                                                            className="inline-flex items-center gap-1 text-[#2D3E5C] hover:text-[#607797] transition-colors cursor-pointer"
                                                            title="Edit maintenance schedule"
                                                        >
                                                            <CalendarDays className="w-4 h-4" />
                                                            <span className="text-xs font-medium">Schedule</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                ) : (
                    <QueueTable
                        items={queueItems}
                        loading={queueLoading}
                        tab={activeTab}
                        pagination={queueMeta}
                        onPageChange={handleQueuePageChange}
                        onReplacementClick={setReplacementTarget}
                    />
                )}
            </div>

            {/* ── Footer: Last Update ── */}
            {activeTab === "all" && !loading && inventory.length > 0 && (
                <div className="flex justify-end text-[13px] text-[#6b7280]">
                    Last Update On - {formatLastUpdate(lastUpdate)}
                </div>
            )}

            {schedulePart && (
                <MaintenanceScheduleEditor
                    open={scheduleOpen}
                    onOpenChange={handleScheduleOpenChange}
                    sparePartName={schedulePart.name}
                    initialSchedule={schedulePart.maintenanceSchedule || []}
                    onSave={saveSchedule}
                />
            )}
            <ReplacementModal
                target={replacementTarget}
                replacementOptions={replacementOptions}
                replacementOptionsLoading={replacementOptionsLoading}
                replacementOptionsMeta={replacementOptionsMeta}
                categories={categories}
                machines={replacementFilterMachines}
                categoryFilter={replacementCategoryFilter}
                machineFilter={replacementMachineFilter}
                search={replacementSearch}
                open={Boolean(replacementTarget)}
                saving={replacementSaving}
                onCategoryFilterChange={(value) => {
                    setReplacementCategoryFilter(value);
                    setReplacementMachineFilter(ALL_MACHINES);
                    setReplacementOptionsPage(1);
                }}
                onMachineFilterChange={(value) => {
                    setReplacementMachineFilter(value);
                    setReplacementOptionsPage(1);
                }}
                onSearchChange={(value) => {
                    setReplacementSearch(value);
                    setReplacementOptionsPage(1);
                }}
                onOptionsPageChange={setReplacementOptionsPage}
                onOpenChange={(open) => {
                    if (!open && !replacementSaving) setReplacementTarget(null);
                }}
                onSave={handleReplacementSave}
            />
        </div>
    );
}

interface ReplacementFormData {
    replacementDate: string;
    replacementOptionID: string;
    replacementSparePartID: string;
    replacementSourceMachineID: string;
    partName: string;
    klValue: string;
    serialNumber: string;
    lifetimeText: string;
    rotorType: "New" | "Rebuilt";
    rebuildsPossible: number;
    notes: string;
    mediaUrls: string[];
}

function queueStatus(item: InventoryQueueItem) {
    const clientPart = item.part.clientMachineSparePart;
    if (item.queueType === "replaced") {
        return "Replaced";
    }
    if (item.queueType === "rebuild") {
        return clientPart?.rebuildStatus || (clientPart?.isSentToRebuild ? "Sent to Rebuild" : "Planned");
    }
    return clientPart?.orderNewStatus || (clientPart?.isOrderedNew ? "Ordered New" : "Planned");
}

function queueDate(item: InventoryQueueItem) {
    const clientPart = item.part.clientMachineSparePart;
    if (item.queueType === "replaced") {
        return (
            clientPart?.replacementHistoryEntry?.replacementDate ||
            clientPart?.replacementDate
        );
    }
    return item.queueType === "rebuild"
        ? clientPart?.rebuildSentDate
        : clientPart?.orderNewRequestedDate;
}

function replacementEntry(item: InventoryQueueItem): ReplacementHistoryEntry | null {
    const clientPart = item.part.clientMachineSparePart;
    return clientPart?.replacementHistoryEntry || null;
}

function queueWorkflowLabel(item: InventoryQueueItem) {
    if (item.queueType === "rebuild") return "Rebuild";
    if (item.queueType === "orderedNew") return "Ordered New";
    return replacementEntry(item)?.source || item.part.clientMachineSparePart?.replacementSource || "Replacement";
}

function metricText(metric?: { value: number; unit: string } | null) {
    if (!metric || metric.value === undefined || metric.value === null) return null;
    return `${metric.value} ${metric.unit || ""}`.trim();
}

function QueueTable({
    items,
    loading,
    tab,
    pagination,
    onPageChange,
    onReplacementClick,
}: {
    items: InventoryQueueItem[];
    loading: boolean;
    tab: InventoryTab;
    pagination: { page: number; limit: number; total: number; totalPages: number };
    onPageChange: (page: number) => void;
    onReplacementClick: (item: InventoryQueueItem) => void;
}) {
    const emptyText =
        tab === "replaced"
            ? "No replaced spare parts found for the selected filters."
            : tab === "rebuild"
            ? "No spare parts are currently tracked for rebuild."
            : "No spare parts are currently tracked as ordered new.";
    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    const canGoPrevious = pagination.page > 1 && !loading;
    const canGoNext = pagination.totalPages > 0 && pagination.page < pagination.totalPages && !loading;

    return (
        <div className="flex flex-col">
        <Table>
            <TableHeader>
                <TableRow className="border-[#607797] bg-[#e5e7eb]">
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider pl-5">
                        {tab === "replaced" ? "Old Spare Part" : "Part"}
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        Machine
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "Source" : "Workflow"}
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "Replaced On" : "Date"}
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "Old Usage" : "Part Details"}
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "New Spare Part" : "Replacement"}
                    </TableHead>
                    <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider text-center">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            Loading tracked spare parts…
                        </TableCell>
                    </TableRow>
                ) : items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            {emptyText}
                        </TableCell>
                    </TableRow>
                ) : (
                    items.map((item) => {
                        const clientPart = item.part.clientMachineSparePart;
                        const entry = replacementEntry(item);
                        const status = queueStatus(item);
                        const mediaUrls =
                            entry?.mediaUrls && entry.mediaUrls.length > 0
                                ? entry.mediaUrls
                                : clientPart?.replacementMediaUrls || [];
                        const mediaCount = mediaUrls.length;
                        const replacementDate = entry?.replacementDate || clientPart?.replacementDate;
                        const workflowLabel = queueWorkflowLabel(item);
                        const oldPartName = tab === "replaced" ? entry?.oldPartName || item.part.name : item.part.name;
                        const oldPartKlValue = tab === "replaced" ? entry?.oldPartKlValue || item.part.klValue : item.part.klValue;
                        const oldRunningHours = metricText(entry?.oldTotalRunningHours);
                        const oldLifetime = metricText(entry?.oldLifetimeOfRotor);
                        const newPartName =
                            entry?.newPartName ||
                            clientPart?.replacementPartName ||
                            item.part.name;
                        const newPartKlValue =
                            entry?.newPartKlValue || clientPart?.replacementPartKlValue || null;
                        const newSerialNumber =
                            entry?.newPartSerialNumber ||
                            clientPart?.replacementPartSerialNumber ||
                            null;
                        const statusClasses =
                            status === "In Stock" || status === "Replaced"
                                ? "bg-green-500/20 text-green-700"
                                : item.queueType === "rebuild"
                                ? "bg-orange-500/20 text-orange-700"
                                : "bg-blue-500/20 text-blue-700";

                        return (
                            <TableRow key={`${item.queueType}-${item.machine._id}-${item.part._id}-${replacementDate || clientPart?._id || ""}`} className="border-[#607797]/40 hover:bg-[#96A5BA]/20">
                                <TableCell className="pl-5 max-w-[220px]">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-gray-900 whitespace-normal break-words">
                                            {oldPartName}
                                        </span>
                                        {oldPartKlValue && (
                                            <span className="text-xs text-gray-500 font-mono">
                                                {oldPartKlValue}
                                            </span>
                                        )}
                                        {tab === "replaced" && entry?.oldSparePartInstallationDate && (
                                            <span className="text-xs text-gray-500">
                                                Installed {formatDate(entry.oldSparePartInstallationDate)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{item.machine.name}</span>
                                        {item.machine.serialNumber && (
                                            <span className="text-xs text-gray-500">{item.machine.serialNumber}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-medium text-gray-900">{workflowLabel}</span>
                                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}>
                                            {status}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm">
                                    {formatDate(queueDate(item))}
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm">
                                    {tab === "replaced" ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span>Running - {oldRunningHours || "—"}</span>
                                            <span className="text-gray-500">Lifetime - {oldLifetime || "—"}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-0.5">
                                            <span>Lifetime - {lifetimeDisplayText(item.part)}</span>
                                            <span className="text-gray-500">
                                                Type - {clientPart?.rotorType === "Rebuilt" ? "Rebuilt" : "New"}
                                            </span>
                                            <span className="text-gray-500">
                                                Rebuilds - {Math.max(0, Number(clientPart?.rebuildsPossible) || 0)}
                                            </span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm max-w-[260px]">
                                    {tab === "replaced" ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-gray-900">
                                                {newPartName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {[newPartKlValue, newSerialNumber].filter(Boolean).join(" · ") || "No reference added"}
                                                {mediaCount > 0 ? ` · ${mediaCount} media` : ""}
                                            </span>
                                            {(entry?.newLifetimeText || clientPart?.replacementLifetimeText) && (
                                                <span className="text-xs text-gray-500">
                                                    Lifetime {entry?.newLifetimeText || clientPart?.replacementLifetimeText}
                                                </span>
                                            )}
                                        </div>
                                    ) : replacementDate ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium text-gray-900">
                                                Replaced {formatDate(replacementDate)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {newPartName}
                                                {mediaCount > 0 ? ` · ${mediaCount} media` : ""}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Pending replacement</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => onReplacementClick(item)}
                                        className="inline-flex items-center gap-1 text-[#d45815] hover:text-[#b8480f] text-xs font-semibold"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        {tab === "replaced" ? "Edit Details" : replacementDate ? "Edit Replacement" : "Add Replacement"}
                                    </button>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
            {pagination.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#607797]/40 bg-[#e5e7eb] px-5 py-3">
                    <span className="text-sm text-[#6b7280]">
                        Showing {start}-{end} of {pagination.total}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#2D3E5C]">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canGoPrevious}
                                onClick={() => onPageChange(pagination.page - 1)}
                                className="border-[#607797] bg-[#DFE6EC] text-gray-900 hover:bg-[#d3dde8]"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canGoNext}
                                onClick={() => onPageChange(pagination.page + 1)}
                                className="border-[#607797] bg-[#DFE6EC] text-gray-900 hover:bg-[#d3dde8]"
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReplacementModal({
    target,
    replacementOptions,
    replacementOptionsLoading,
    replacementOptionsMeta,
    categories,
    machines,
    categoryFilter,
    machineFilter,
    search,
    open,
    saving,
    onCategoryFilterChange,
    onMachineFilterChange,
    onSearchChange,
    onOptionsPageChange,
    onOpenChange,
    onSave,
}: {
    target: InventoryQueueItem | null;
    replacementOptions: ReplacementOption[];
    replacementOptionsLoading: boolean;
    replacementOptionsMeta: { page: number; limit: number; total: number; totalPages: number };
    categories: Array<{ id: string; name: string }>;
    machines: InventoryMachine[];
    categoryFilter: string;
    machineFilter: string;
    search: string;
    open: boolean;
    saving: boolean;
    onCategoryFilterChange: (value: string) => void;
    onMachineFilterChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onOptionsPageChange: (page: number) => void;
    onOpenChange: (open: boolean) => void;
    onSave: (data: ReplacementFormData) => Promise<void>;
}) {
    const [form, setForm] = useState<ReplacementFormData>({
        replacementDate: dateInputValue(),
        replacementOptionID: "",
        replacementSparePartID: "",
        replacementSourceMachineID: "",
        partName: "",
        klValue: "",
        serialNumber: "",
        lifetimeText: "",
        rotorType: "New",
        rebuildsPossible: 0,
        notes: "",
        mediaUrls: [],
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !target) return;
        const clientPart = target.part.clientMachineSparePart;
        setForm({
            replacementDate: dateInputValue(clientPart?.replacementDate),
            replacementOptionID: "",
            replacementSparePartID: clientPart?.replacementSparePart || "",
            replacementSourceMachineID: "",
            partName: clientPart?.replacementPartName || target.part.name || "",
            klValue: clientPart?.replacementPartKlValue || target.part.klValue || "",
            serialNumber: clientPart?.replacementPartSerialNumber || "",
            lifetimeText:
                clientPart?.replacementLifetimeText ||
                clientPart?.lifetimeText ||
                target.part.lifetimeText ||
                "",
            rotorType:
                clientPart?.rotorType ||
                (target.queueType === "rebuild" ? "Rebuilt" : "New"),
            rebuildsPossible: Math.max(0, Number(clientPart?.rebuildsPossible) || 0),
            notes: clientPart?.replacementNotes || "",
            mediaUrls: clientPart?.replacementMediaUrls || [],
        });
        setUploadError(null);
    }, [open, target]);

    if (!open || !target) return null;

    const workflowLabel =
        target.queueType === "rebuild"
            ? "rebuild"
            : target.queueType === "orderedNew"
            ? "ordered new"
            : "replacement history";

    const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const payload = new FormData();
            payload.append("file", file);
            const response = await fetch("/api/upload", { method: "POST", body: payload });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || "Upload failed");
            }
            const body = await response.json();
            if (!body?.url) throw new Error("Upload response did not include a URL");
            setForm((prev) => ({ ...prev, mediaUrls: [...prev.mediaUrls, body.url] }));
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleReplacementPartSelect = (optionID: string) => {
        const selected = replacementOptions.find((part) => part._id === optionID);
        setForm((prev) => ({
            ...prev,
            replacementOptionID: optionID,
            replacementSparePartID: selected?.replacementSparePartID || "",
            replacementSourceMachineID: selected?.replacementSourceMachineID || "",
            partName: selected?.name || prev.partName,
            klValue: selected?.klValue || "",
            lifetimeText: selected?.lifetimeText || prev.lifetimeText,
            rotorType: selected?.rotorType || prev.rotorType,
            rebuildsPossible: Math.max(0, Number(selected?.rebuildsPossible ?? prev.rebuildsPossible) || 0),
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-[680px] rounded-[10px] border border-[#607797] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#C5D1DC] px-5 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-[#2D3E5C]">Replacement Details</h2>
                        <p className="text-sm text-[#6b7280]">
                            {target.part.name} · {target.machine.name} · {workflowLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                        className="rounded-md p-2 text-[#607797] hover:bg-[#DFE6EC] disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid max-h-[68vh] grid-cols-2 gap-4 overflow-y-auto px-5 py-4">
                    <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Replacement date
                        <Input
                            type="date"
                            value={form.replacementDate}
                            onChange={(event) => setForm({ ...form, replacementDate: event.target.value })}
                        />
                    </label>
                    <div className="col-span-2 grid grid-cols-2 gap-3 rounded-md border border-[#C5D1DC] bg-[#F8FAFC] p-3">
                        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Search inventory
                            <Input
                                value={search}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder="Search by name, KL code, or drawing"
                                disabled={saving}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Category
                            <select
                                value={categoryFilter}
                                onChange={(event) => onCategoryFilterChange(event.target.value)}
                                disabled={saving}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#d45815] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value={ALL_CATEGORIES}>All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Machine
                            <select
                                value={machineFilter}
                                onChange={(event) => onMachineFilterChange(event.target.value)}
                                disabled={saving}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#d45815] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value={ALL_MACHINES}>All machines</option>
                                {machines.map((machine) => (
                                    <option key={machine._id} value={machine._id}>
                                        {[machine.name, machine.serialNumber].filter(Boolean).join(" - ")}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Spare part
                            <select
                                value={form.replacementOptionID}
                                onChange={(event) => handleReplacementPartSelect(event.target.value)}
                                disabled={saving || replacementOptionsLoading}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#d45815] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value="">
                                    {replacementOptionsLoading ? "Loading spare parts..." : "Manual entry"}
                                </option>
                                {replacementOptions.map((part) => (
                                    <option key={part._id} value={part._id}>
                                        {[
                                            part.name,
                                            part.klValue ? `KL ${part.klValue}` : null,
                                            part.sourceMachine?.name,
                                        ].filter(Boolean).join(" - ")}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
                            <span>
                                {replacementOptionsMeta.total > 0
                                    ? `Showing ${(replacementOptionsMeta.page - 1) * replacementOptionsMeta.limit + 1}-${Math.min(replacementOptionsMeta.page * replacementOptionsMeta.limit, replacementOptionsMeta.total)} of ${replacementOptionsMeta.total}`
                                    : replacementOptionsLoading
                                    ? "Loading options"
                                    : "No matching inventory parts"}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={saving || replacementOptionsLoading || replacementOptionsMeta.page <= 1}
                                    onClick={() => onOptionsPageChange(replacementOptionsMeta.page - 1)}
                                    className="h-8 border-[#607797] bg-white text-[#2D3E5C]"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="font-medium text-[#2D3E5C]">
                                    {replacementOptionsMeta.totalPages > 0
                                        ? `${replacementOptionsMeta.page}/${replacementOptionsMeta.totalPages}`
                                        : "0/0"}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        saving ||
                                        replacementOptionsLoading ||
                                        replacementOptionsMeta.totalPages === 0 ||
                                        replacementOptionsMeta.page >= replacementOptionsMeta.totalPages
                                    }
                                    onClick={() => onOptionsPageChange(replacementOptionsMeta.page + 1)}
                                    className="h-8 border-[#607797] bg-white text-[#2D3E5C]"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Part name
                        <Input
                            value={form.partName}
                            onChange={(event) => setForm({ ...form, partName: event.target.value })}
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        KL code
                        <Input
                            value={form.klValue}
                            onChange={(event) => setForm({ ...form, klValue: event.target.value })}
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Serial / reference
                        <Input
                            value={form.serialNumber}
                            onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
                            placeholder="Optional"
                        />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Lifetime for installed part
                        <Input
                            value={form.lifetimeText}
                            onChange={(event) => setForm({ ...form, lifetimeText: event.target.value })}
                            placeholder="e.g. 3 Months or 1 Year"
                        />
                    </label>
                    <div className="col-span-2 flex items-center justify-between rounded-md border border-[#C5D1DC] px-3 py-2">
                        <span className="text-sm font-medium text-[#2D3E5C]">Rebuilt part</span>
                        <Switch
                            checked={form.rotorType === "Rebuilt"}
                            onCheckedChange={(checked) =>
                                setForm({ ...form, rotorType: checked ? "Rebuilt" : "New" })
                            }
                            disabled={saving}
                        />
                    </div>
                    <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Rebuilds possible
                        <Input
                            type="number"
                            min={0}
                            value={form.rebuildsPossible}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    rebuildsPossible: Math.max(0, Number(event.target.value) || 0),
                                })
                            }
                        />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                        Notes
                        <textarea
                            value={form.notes}
                            onChange={(event) => setForm({ ...form, notes: event.target.value })}
                            rows={3}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#d45815]"
                            placeholder="Add installation notes, rebuild notes, or order reference details."
                        />
                    </label>
                    <div className="col-span-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-[#6b7280]">Replacement media</span>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#607797] bg-[#DFE6EC] px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-[#e5e7eb]">
                                <Upload className="h-4 w-4" />
                                {uploading ? "Uploading..." : "Upload"}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleUpload}
                                    disabled={uploading || saving}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                        {form.mediaUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {form.mediaUrls.map((url, index) => (
                                    <div key={`${url}-${index}`} className="flex max-w-[200px] items-center gap-2 rounded-md border border-[#C5D1DC] bg-[#F8FAFC] px-2 py-1 text-xs text-gray-700">
                                        <span className="truncate">{url.split("/").pop() || `Media ${index + 1}`}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    mediaUrls: prev.mediaUrls.filter((_, i) => i !== index),
                                                }))
                                            }
                                            className="text-[#bf1e21]"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-md border border-dashed border-[#C5D1DC] px-3 py-4 text-center text-sm text-[#6b7280]">
                                No replacement media added yet.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#C5D1DC] px-5 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={saving || uploading}
                        onClick={() => onSave(form)}
                        className="bg-[#d45815] text-white hover:bg-[#b8480f]"
                    >
                        {saving ? "Saving..." : "Save Replacement"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
