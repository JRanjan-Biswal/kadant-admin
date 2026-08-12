'use client';

import Link from "next/link";
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
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Pencil, Upload, RefreshCw, Save, X, Loader2, Trash2 } from "lucide-react";
import {
    fetchInventoryQueue,
    fetchInventoryForMachine,
    fetchReplacementOptions,
    saveSparePart,
    saveClientSparePart,
    deleteClientSparePart,
    installRebuiltSparePart,
    type InventoryQueueItem,
    type InventoryQueueType,
    type InventoryMachine,
    type InventorySparePart,
    type MaintenanceScheduleEntry,
    type ReplacementHistoryEntry,
    type ReplacementOption,
} from "@/actions/spare-parts-inventory";
import { isValidLifetimeText, LIFETIME_HINT } from "@/lib/lifetime";
import { getStoredCategoryMachine, setStoredCategoryMachine } from "@/lib/lastCategoryMachineSelection";
import MaintenanceScheduleEditor from "./MaintenanceScheduleEditor";
import ReferenceRollupTable from "./ReferenceRollupTable";

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

type PartType = "New" | "Sent to Rebuild" | "Rebuilt" | "Retired";

// The part's lifecycle. Reads the new partType field; falls back to deriving it
// from legacy fields for rows saved before the field existed.
const partType = (part: InventorySparePart): PartType => {
    const cp = part.clientMachineSparePart;
    if (cp?.partType) return cp.partType;
    if (cp?.isSentToRebuild || cp?.rebuildStatus === "Sent to Rebuild") return "Sent to Rebuild";
    if (cp?.rebuildStatus === "Rebuilt" || cp?.rebuildStatus === "In Stock") return "Rebuilt";
    if (cp?.rotorType === "Rebuilt") return "Rebuilt";
    return "New";
};

const PART_TYPE_BADGE: Record<PartType, string> = {
    New: "bg-green-500/20 text-green-700",
    "Sent to Rebuild": "bg-amber-500/20 text-amber-700",
    Rebuilt: "bg-orange-500/20 text-orange-700",
    Retired: "bg-gray-400/30 text-gray-600",
};

const rebuildCount = (part: InventorySparePart): number =>
    part.clientMachineSparePart?.rebuildsPossible ?? 0;

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
    const [groupByReference, setGroupByReference] = useState(false);
    const categories = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of machines) {
            if (m.categoryId && m.categoryName && !map.has(m.categoryId)) {
                map.set(m.categoryId, m.categoryName);
            }
        }
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [machines]);

    const [selectedCategory, setSelectedCategory] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.categoryId && categories.some((c) => c.id === stored.categoryId)) {
            return stored.categoryId;
        }
        return categories[0]?.id || ALL_CATEGORIES;
    });

    const filteredMachines = useMemo(
        () =>
            selectedCategory === ALL_CATEGORIES
                ? machines
                : machines.filter((m) => m.categoryId === selectedCategory),
        [machines, selectedCategory]
    );

    const [selectedMachine, setSelectedMachine] = useState<string>(() => {
        const stored = getStoredCategoryMachine(clientID);
        if (stored.machineId && filteredMachines.some((m) => m._id === stored.machineId)) {
            return stored.machineId;
        }
        return filteredMachines[0]?._id || "";
    });
    const [trackedCategory, setTrackedCategory] = useState<string>(ALL_CATEGORIES);
    const [trackedMachine, setTrackedMachine] = useState<string>(ALL_MACHINES);

    // When category changes, pick the first machine in that category.
    useEffect(() => {
        if (selectedMachine === ALL_MACHINES) return;
        if (filteredMachines.length === 0) {
            setSelectedMachine("");
            return;
        }
        if (!filteredMachines.some((m) => m._id === selectedMachine)) {
            setSelectedMachine(filteredMachines[0]._id);
        }
    }, [filteredMachines, selectedMachine]);

    // Remember the last Category/Machine picked here so other pages (e.g.
    // Assign References) can default to the same machine instead of "All".
    useEffect(() => {
        if (!selectedMachine || selectedMachine === ALL_MACHINES) return;
        setStoredCategoryMachine(clientID, {
            categoryId: selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory,
            machineId: selectedMachine,
        });
    }, [clientID, selectedCategory, selectedMachine]);

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
    const [installTarget, setInstallTarget] = useState<InventoryQueueItem | null>(null);
    const [installSaving, setInstallSaving] = useState(false);
    const [installDate, setInstallDate] = useState("");
    const [installNotes, setInstallNotes] = useState("");
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
        partType: PartType;
        rebuildsPossible: number;
    }
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeSavingId, setActiveSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
    const [referenceDraft, setReferenceDraft] = useState("");
    const [savingReferenceId, setSavingReferenceId] = useState<string | null>(null);
    const [warningDialog, setWarningDialog] = useState<{
        title: string;
        message: string;
        onProceed: () => void;
    } | null>(null);

    const startEdit = (part: InventorySparePart) => {
        setEditingId(part._id);
        setDraft({
            lifetimeText:
                part.clientMachineSparePart?.lifetimeText ||
                part.clientMachineSparePart?.rebuildLifetimeText ||
                part.lifetimeText ||
                "",
            rotorType: partType(part) === "New" ? "New" : "Rebuilt",
            partType: partType(part),
            rebuildsPossible: rebuildCount(part),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
    };

    const startEditReference = (part: InventorySparePart) => {
        setEditingReferenceId(part._id);
        setReferenceDraft(part.reference || "");
    };

    const cancelEditReference = () => {
        setEditingReferenceId(null);
        setReferenceDraft("");
    };

    const saveReference = async (part: InventorySparePart) => {
        const value = referenceDraft.trim();
        setSavingReferenceId(part._id);
        setError(null);
        try {
            const res = await saveSparePart(part._id, { reference: value || null });
            if (!res.ok) {
                setError(res.error || "Failed to save reference");
                return;
            }
            cancelEditReference();
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save reference");
        } finally {
            setSavingReferenceId(null);
        }
    };

    const saveInline = async (part: InventorySparePart) => {
        if (!draft || !selectedMachine) return;
        if (!isValidLifetimeText(draft.lifetimeText)) {
            setError(`Lifetime "${draft.lifetimeText.trim()}" needs a unit. ${LIFETIME_HINT}`);
            return;
        }

        const draftSnapshot = { ...draft };

        const perform = async () => {
            setSaving(true);
            setError(null);
            try {
                const lifetimeText = draftSnapshot.lifetimeText.trim();
                const rotorType = draftSnapshot.partType === "New" ? "New" : "Rebuilt";
                const clientRes = await saveClientSparePart(
                    clientID,
                    selectedMachine,
                    part._id,
                    {
                        lifetimeText,
                        partType: draftSnapshot.partType,
                        rebuildsPossible: Math.max(0, draftSnapshot.rebuildsPossible),
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

        const currentType = partType(part);
        if (
            currentType === "Sent to Rebuild" &&
            draftSnapshot.partType !== "Sent to Rebuild" &&
            !part.clientMachineSparePart?.replacementDate
        ) {
            setWarningDialog({
                title: "Replacement Not Recorded",
                message: `"${part.name}" is marked as 'Sent to Rebuild' with no replacement recorded. Changing the part type may cause gaps in rebuild tracking.`,
                onProceed: () => { void perform(); },
            });
            return;
        }

        await perform();
    };

    // Delete is only offered on Retired parts (they can never be reused).
    const handleDeletePart = async (part: InventorySparePart) => {
        if (!selectedMachine) return;
        const confirmed = window.confirm(
            `Delete retired part "${part.name}" (KL ${part.klValue || "—"})? This removes it from this machine's inventory and cannot be undone.`
        );
        if (!confirmed) return;
        setDeletingId(part._id);
        setError(null);
        try {
            const res = await deleteClientSparePart(clientID, selectedMachine, part._id);
            if (!res.ok) {
                setError(res.error || "Failed to delete spare part");
                return;
            }
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete spare part");
        } finally {
            setDeletingId(null);
        }
    };

    const toggleInventoryActive = async (part: InventorySparePart, nextActive: boolean) => {
        if (!selectedMachine) return;

        const perform = async () => {
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

        if (nextActive && partType(part) === "Sent to Rebuild" && !part.clientMachineSparePart?.replacementDate) {
            setWarningDialog({
                title: "Replacement Pending",
                message: `"${part.name}" is currently sent for rebuild with no replacement recorded. Consider adding a replacement from the Rebuild tab first.`,
                onProceed: () => { void perform(); },
            });
            return;
        }

        await perform();
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
        if (!selectedMachine || selectedMachine === ALL_MACHINES) {
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
        if (!isValidLifetimeText(data.lifetimeText)) {
            setError(`Lifetime "${data.lifetimeText.trim()}" needs a unit. ${LIFETIME_HINT}`);
            return;
        }
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
                replacementPartSerialNumber: data.reference.trim() || null,
                replacementNotes: data.notes.trim() || null,
                replacementMediaUrls: data.mediaUrls,
                sparePartInstallationDate: replacementDate,
                lastServiceDate: replacementDate,
                stockQuantity: Math.max(clientPart?.stockQuantity ?? 0, 1),
                isActive: true,
                // Inventory pick: the API row-swap uses the selected part's own
                // count/cap. Manual entry: send the rebuild fields the user typed so
                // the newly created part carries its declared history.
                ...(data.replacementSparePartID
                    ? {}
                    : {
                          // Threshold is always taken from the form — a brand-new part can
                          // still be rebuildable. The "Is rebuild part?" toggle only decides
                          // whether a prior rebuild COUNT is carried; rebuildability derives
                          // from the threshold, not the toggle.
                          rebuildsPossible: Math.max(0, Number(data.rebuildsPossible) || 0),
                          isRebuildable: Math.max(0, Number(data.rebuildsPossible) || 0) > 0,
                          currentRebuildCount: data.isRebuildPart === true
                              ? Math.max(0, Number(data.currentRebuildCount) || 0)
                              : 0,
                      }),
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

    const handleInstallSave = async () => {
        if (!installTarget) return;
        setInstallSaving(true);
        setError(null);
        try {
            const res = await installRebuiltSparePart(
                clientID,
                installTarget.machine._id,
                installTarget.part._id,
                {
                    replacementDate: installDate || new Date().toISOString().slice(0, 10),
                    replacementNotes: installNotes.trim() || undefined,
                    replacementSource: "Rebuild",
                }
            );
            if (!res.ok) throw new Error(res.error || "Failed to install rebuilt spare part");
            setInstallTarget(null);
            setInstallDate("");
            setInstallNotes("");
            await Promise.all([
                reload(),
                activeQueueType ? loadQueue(activeQueueType, queuePages[activeQueueType]) : Promise.resolve(),
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to install rebuilt spare part");
        } finally {
            setInstallSaving(false);
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
                                        <SelectItem value={ALL_MACHINES}>All machines</SelectItem>
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

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] leading-[20px] text-[#6b7280] font-normal">
                                Group by reference
                            </label>
                            <div className="h-11 flex items-center">
                                <Switch checked={groupByReference} onCheckedChange={setGroupByReference} />
                            </div>
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
            {activeTab === "all" && (groupByReference || selectedMachine === ALL_MACHINES) ? (
                <ReferenceRollupTable
                    clientID={clientID}
                    categoryId={selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory}
                    machineId={selectedMachine === ALL_MACHINES ? undefined : selectedMachine}
                />
            ) : (
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
                                Maximum No<br />of Rebuilds
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Reference
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Installed
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider">
                                Running Status
                            </TableHead>
                            <TableHead className="text-gray-900 font-semibold text-xs uppercase tracking-wider text-center">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : inventory.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                                    No spare parts found for this machine.
                                </TableCell>
                            </TableRow>
                        ) : (
                            inventory.map((part) => {
                                const isEditing = editingId === part._id && draft !== null;
                                const activePartType = partType(part);
                                const activeRebuildCount = rebuildCount(part);
                                const actualRebuildsDone = part.clientMachineSparePart?.rebuildCount ?? 0;
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
                                                <select
                                                    value={draft!.partType}
                                                    onChange={(event) =>
                                                        setDraft({ ...draft!, partType: event.target.value as PartType })
                                                    }
                                                    className="h-8 rounded-md border border-[#d1d5db] bg-white px-2 text-xs font-medium text-gray-900 outline-none focus:border-[#d45815]"
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Sent to Rebuild">Sent to Rebuild</option>
                                                    <option value="Rebuilt">Rebuilt</option>
                                                    <option value="Retired">Retired</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${PART_TYPE_BADGE[activePartType]}`}
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
                                                    placeholder="0 = blocked"
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
                                                (activeRebuildCount ?? 0) === 0 ? (
                                                    <span className="font-medium text-gray-400">0</span>
                                                ) : (
                                                    <span className={`font-medium ${
                                                        actualRebuildsDone >= activeRebuildCount!
                                                            ? "text-red-600"
                                                            : "text-gray-700"
                                                    }`}>
                                                        {actualRebuildsDone}
                                                        <span className="font-normal text-gray-400">{" / "}{activeRebuildCount}</span>
                                                    </span>
                                                )
                                            )}
                                        </TableCell>

                                        <TableCell className="text-gray-700 text-sm">
                                            {editingReferenceId === part._id ? (
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        autoFocus
                                                        value={referenceDraft}
                                                        onChange={(event) => setReferenceDraft(event.target.value)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter") saveReference(part);
                                                            if (event.key === "Escape") cancelEditReference();
                                                        }}
                                                        placeholder="e.g. K-ROTOR"
                                                        className="h-8 w-28 bg-white border-[#d1d5db] text-gray-900"
                                                    />
                                                    <button
                                                        onClick={() => saveReference(part)}
                                                        disabled={savingReferenceId === part._id}
                                                        className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                                                        title="Save reference"
                                                    >
                                                        {savingReferenceId === part._id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={cancelEditReference}
                                                        disabled={savingReferenceId === part._id}
                                                        className="text-zinc-600 hover:text-zinc-800 disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : part.reference ? (
                                                <button
                                                    onClick={() => startEditReference(part)}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-[#e5e7eb] hover:bg-[#d1d5db] px-2.5 py-1 text-xs font-medium text-gray-900 transition-colors cursor-pointer"
                                                    title="Click to edit reference"
                                                >
                                                    {part.reference}
                                                    <Pencil className="h-3 w-3 opacity-50" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => startEditReference(part)}
                                                    className="inline-flex items-center rounded-full border border-dashed border-[#9ca3af] px-2.5 py-1 text-xs text-[#6b7280] hover:border-[#607797] hover:text-gray-900 transition-colors cursor-pointer"
                                                >
                                                    + Add
                                                </button>
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
                                                className={`cursor-pointer inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    active
                                                        ? "border-[#00a82d]/60 bg-[#00a82d]/20 text-[#007a22] hover:bg-[#00a82d]/30"
                                                        : "border-[#bf1e21]/60 bg-[#bf1e21]/15 text-[#9f1d20] hover:bg-[#bf1e21]/25"
                                                }`}
                                                title={active ? "Click to mark inactive" : "Click to mark active"}
                                            >
                                                {activeSaving ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        {active ? "Active" : "Inactive"}
                                                        <RefreshCw className="h-2.5 w-2.5 opacity-50" />
                                                    </>
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
                                                        {activePartType === "Retired" && (
                                                            <button
                                                                onClick={() => handleDeletePart(part)}
                                                                disabled={deletingId === part._id}
                                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                                                                title="Delete retired spare part"
                                                            >
                                                                {deletingId === part._id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                                <span className="text-xs font-medium">Delete</span>
                                                            </button>
                                                        )}
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
                        clientID={clientID}
                        items={queueItems}
                        loading={queueLoading}
                        tab={activeTab}
                        pagination={queueMeta}
                        onPageChange={handleQueuePageChange}
                        onReplacementClick={setReplacementTarget}
                        onInstallClick={(item) => {
                            setInstallTarget(item);
                            setInstallDate(new Date().toISOString().slice(0, 10));
                            setInstallNotes("");
                        }}
                    />
                )}
            </div>
            )}

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

            {installTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
                    <div className="w-full max-w-[420px] rounded-[10px] border border-[#607797]/40 bg-white shadow-xl">
                        <div className="flex items-start gap-3 border-b border-[#C5D1DC] px-5 py-4">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-[#2D3E5C]">Install Rebuilt Part</h2>
                                <p className="text-sm text-[#6b7280] mt-0.5">
                                    Installing{" "}
                                    <span className="font-semibold text-[#2D3E5C]">
                                        {installTarget.part.name}
                                        {installTarget.part.klValue ? ` (${installTarget.part.klValue})` : ""}
                                    </span>
                                    {" "}onto{" "}
                                    <span className="font-semibold text-[#2D3E5C]">{installTarget.machine.name}</span>.
                                    {installTarget.part.clientMachineSparePart?.replacementPartName ? (
                                        <>
                                            {" "}This removes{" "}
                                            <span className="font-semibold text-[#2D3E5C]">
                                                {installTarget.part.clientMachineSparePart.replacementPartName}
                                                {installTarget.part.clientMachineSparePart.replacementPartKlValue
                                                    ? ` (${installTarget.part.clientMachineSparePart.replacementPartKlValue})`
                                                    : ""}
                                            </span>
                                            , which is currently active, and moves it to inactive stock (still available for reuse).
                                        </>
                                    ) : (
                                        " The currently active part will be moved to inactive stock and stay available for reuse."
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { if (!installSaving) setInstallTarget(null); }}
                                className="rounded-md p-1 text-[#607797] hover:bg-[#DFE6EC] transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4 px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Installation Date
                                </label>
                                <Input
                                    type="date"
                                    value={installDate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setInstallDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Notes <span className="font-normal normal-case text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    value={installNotes}
                                    onChange={(e) => setInstallNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Any notes about this installation…"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-[#C5D1DC] px-5 py-4">
                            <Button
                                variant="outline"
                                onClick={() => setInstallTarget(null)}
                                disabled={installSaving}
                                className="border-[#607797] bg-[#DFE6EC] text-gray-900 hover:bg-[#d3dde8]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInstallSave}
                                disabled={installSaving}
                                className="bg-[#d45815] hover:bg-[#b83d0f] text-white"
                            >
                                {installSaving ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Installing…</>
                                ) : (
                                    "Install"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {warningDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
                    <div className="w-full max-w-[440px] rounded-[10px] border border-amber-300 bg-white shadow-xl">
                        <div className="flex items-start gap-3 border-b border-amber-200 px-5 py-4">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-[#2D3E5C]">{warningDialog.title}</h2>
                                <p className="text-sm text-[#6b7280] mt-1">{warningDialog.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWarningDialog(null)}
                                className="rounded-md p-1 text-[#607797] hover:bg-[#DFE6EC] transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-4">
                            <Button
                                variant="outline"
                                onClick={() => setWarningDialog(null)}
                                className="border-[#607797] bg-[#DFE6EC] text-gray-900 hover:bg-[#d3dde8]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    const onProceed = warningDialog.onProceed;
                                    setWarningDialog(null);
                                    onProceed();
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                            >
                                Proceed Anyway
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
    reference: string;
    lifetimeText: string;
    rotorType: "New" | "Rebuilt";
    // Manual-entry rebuild fields (a warehouse part may already be rebuilt N times).
    isRebuildPart: boolean | null;
    rebuildsPossible: number;
    currentRebuildCount: number;
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

function isRebuiltInStock(item: InventoryQueueItem): boolean {
    const cp = item.part.clientMachineSparePart;
    if (!cp) return false;
    if (item.queueType !== "rebuild") return false;            // never in Order New / Replaced tabs
    const type = cp.partType || (cp.rebuildStatus === "Rebuilt" ? "Rebuilt" : null);
    if (type !== "Rebuilt" || cp.isActive !== false) return false;
    if (cp.rebuildStatus !== "Rebuilt" && cp.rebuildStatus !== "In Stock") return false;  // displaced parts (rebuildStatus "None") are not install candidates
    return true;
}

function QueueTable({
    clientID,
    items,
    loading,
    tab,
    pagination,
    onPageChange,
    onReplacementClick,
    onInstallClick,
}: {
    clientID: string;
    items: InventoryQueueItem[];
    loading: boolean;
    tab: InventoryTab;
    pagination: { page: number; limit: number; total: number; totalPages: number };
    onPageChange: (page: number) => void;
    onReplacementClick: (item: InventoryQueueItem) => void;
    onInstallClick: (item: InventoryQueueItem) => void;
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
        <Table className="table-fixed w-full">
            <TableHeader>
                <TableRow className="border-[#607797] bg-[#e5e7eb]">
                    <TableHead className="w-[20%] text-gray-900 font-semibold text-xs uppercase tracking-wider pl-5">
                        {tab === "replaced" ? "Old Spare Part" : "Part"}
                    </TableHead>
                    <TableHead className="w-[14%] text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        Machine
                    </TableHead>
                    <TableHead className="w-[12%] text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "Source" : "Workflow"}
                    </TableHead>
                    <TableHead className="w-[8%] text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "Replaced On" : "Date"}
                    </TableHead>
                    {tab !== "replaced" && (
                    <TableHead className="w-[17%] text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        Part Details
                    </TableHead>
                    )}
                    <TableHead className="w-[16%] text-gray-900 font-semibold text-xs uppercase tracking-wider">
                        {tab === "replaced" ? "New Spare Part" : "Replacement"}
                    </TableHead>
                    <TableHead className="w-[13%] text-gray-900 font-semibold text-xs uppercase tracking-wider text-center">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={tab === "replaced" ? 6 : 7} className="text-center py-12 text-gray-500">
                            Loading tracked spare parts…
                        </TableCell>
                    </TableRow>
                ) : items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={tab === "replaced" ? 6 : 7} className="text-center py-12 text-gray-500">
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
                        // For the Rebuild / Ordered New queues, "has a replacement" must reflect the
                        // CURRENT cycle only — the part's own replacementDate. Falling back to the latest
                        // replacementHistory entry made a part that was rebuilt once and then re-sent to
                        // rebuild (a fresh cycle, no replacement chosen yet) look already-replaced
                        // ("Edit Replacement"/"Replaced"). History is only correct for the Replaced tab.
                        const replacementDate =
                            item.queueType === "replaced"
                                ? entry?.replacementDate || clientPart?.replacementDate
                                : clientPart?.replacementDate;
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
                            <TableRow key={item.id || `${item.queueType}-${item.machine._id}-${item.part._id}-${replacementDate || clientPart?._id || ""}`} className="border-[#607797]/40 hover:bg-[#96A5BA]/20">
                                <TableCell className="pl-5 overflow-hidden whitespace-normal">
                                    <div className="flex flex-col gap-0.5 w-full min-w-0">
                                        <span className="font-semibold text-gray-900 break-words">
                                            {oldPartName}
                                        </span>
                                        {oldPartKlValue && (
                                            <span className="text-xs text-gray-500 font-mono break-all">
                                                {oldPartKlValue}
                                            </span>
                                        )}
                                        {tab === "replaced" && entry?.oldSparePartInstallationDate && (
                                            <span className="text-xs text-gray-500 break-words">
                                                Installed {formatDate(entry.oldSparePartInstallationDate)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm overflow-hidden whitespace-normal">
                                    <div className="flex flex-col gap-0.5 w-full min-w-0">
                                        <span className="break-words">{item.machine.name}</span>
                                        {item.machine.serialNumber && (
                                            <span className="text-xs text-gray-500 break-all">{item.machine.serialNumber}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="overflow-hidden whitespace-normal">
                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                        <span className="text-sm font-medium text-gray-900 break-words">{workflowLabel}</span>
                                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}>
                                            {status}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm overflow-hidden">
                                    {formatDate(queueDate(item))}
                                </TableCell>
                                {tab !== "replaced" && (
                                <TableCell className="text-gray-700 text-sm overflow-hidden whitespace-normal">
                                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                                        <div className="flex items-start gap-2">
                                            <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 pt-0.5">Lifetime</span>
                                            <span className="font-medium text-gray-900 break-words min-w-0">{lifetimeDisplayText(item.part)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Type</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                clientPart?.rotorType === "Rebuilt"
                                                    ? "bg-orange-500/20 text-orange-700"
                                                    : "bg-green-500/20 text-green-700"
                                            }`}>
                                                {clientPart?.rotorType === "Rebuilt" ? "Rebuilt" : "New"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Rebuilds</span>
                                            {(() => {
                                                const done = clientPart?.rebuildCount ?? 0;
                                                const max = clientPart?.rebuildsPossible ?? 0;
                                                if (max === 0) return <span className="font-medium text-gray-400">0</span>;
                                                const isMaxed = done >= max;
                                                return (
                                                    <span className={`font-medium ${isMaxed ? "text-red-600" : "text-gray-700"}`}>
                                                        {done}
                                                        <span className="font-normal text-gray-400">{" / "}{max}</span>
                                                        {isMaxed && <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Max</span>}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </TableCell>
                                )}
                                <TableCell className="text-gray-700 text-sm overflow-hidden whitespace-normal">
                                    {tab === "replaced" ? (
                                        <div className="flex flex-col gap-0.5 w-full min-w-0">
                                            <span className="font-medium text-gray-900 break-words">
                                                {newPartName}
                                            </span>
                                            <span className="text-xs text-gray-500 break-words">
                                                {[newPartKlValue, newSerialNumber].filter(Boolean).join(" · ") || "No reference added"}
                                                {mediaCount > 0 ? ` · ${mediaCount} media` : ""}
                                            </span>
                                            {(entry?.newLifetimeText || clientPart?.replacementLifetimeText) && (
                                                <span className="text-xs text-gray-500 break-words">
                                                    Lifetime {entry?.newLifetimeText || clientPart?.replacementLifetimeText}
                                                </span>
                                            )}
                                        </div>
                                    ) : replacementDate ? (
                                        <div className="flex flex-col gap-0.5 w-full min-w-0">
                                            <span className="font-medium text-gray-900">
                                                Replaced {formatDate(replacementDate)}
                                            </span>
                                            <span className="text-xs text-gray-500 break-words">
                                                {newPartName}
                                                {mediaCount > 0 ? ` · ${mediaCount} media` : ""}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-amber-300/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
                                            Pending replacement
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center overflow-hidden whitespace-normal">
                                    {tab !== "replaced" && isRebuiltInStock(item) ? (
                                        <button
                                            type="button"
                                            onClick={() => onInstallClick(item)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-green-600/40 bg-green-600/10 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-600/20 whitespace-normal text-center w-full"
                                        >
                                            Install
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onReplacementClick(item)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#d45815]/40 bg-[#d45815]/10 px-3 py-1.5 text-xs font-semibold text-[#d45815] transition-colors hover:bg-[#d45815]/20 whitespace-normal text-center w-full"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            {tab === "replaced" ? "Edit Details" : replacementDate ? "Edit Replacement" : "Add Replacement"}
                                        </button>
                                    )}
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
        reference: "",
        lifetimeText: "",
        rotorType: "New",
        isRebuildPart: null,
        rebuildsPossible: 0,
        currentRebuildCount: 0,
        notes: "",
        mediaUrls: [],
    });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    // One source for the replacement part at a time: pick from inventory OR type manually.
    const [entryMode, setEntryMode] = useState<"inventory" | "manual">("inventory");
    const [manualKlError, setManualKlError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !target) return;
        setEntryMode("inventory");
        setManualKlError(null);
        setFormError(null);
        const clientPart = target.part.clientMachineSparePart;
        setForm({
            replacementDate: dateInputValue(clientPart?.replacementDate),
            replacementOptionID: "",
            replacementSparePartID: clientPart?.replacementSparePart || "",
            replacementSourceMachineID: "",
            partName: clientPart?.replacementPartName || "",
            klValue: clientPart?.replacementPartKlValue || "",
            serialNumber: clientPart?.replacementPartSerialNumber || "",
            lifetimeText:
                clientPart?.replacementLifetimeText ||
                clientPart?.lifetimeText ||
                target.part.lifetimeText ||
                "",
            rotorType:
                clientPart?.rotorType ||
                (target.queueType === "rebuild" ? "Rebuilt" : "New"),
            isRebuildPart: clientPart?.rebuildsPossible != null ? (clientPart.rebuildsPossible > 0) : null,
            rebuildsPossible: clientPart?.rebuildsPossible ?? 0,
            currentRebuildCount: clientPart?.rebuildCount ?? 0,
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

    const isRebuildWorkflow = workflowLabel === "rebuild";

    // Why an inventory option cannot be picked as the replacement, or null if selectable.
    const getOptionBlockLabel = (part: ReplacementOption): string | null => {
        // Cannot replace a part with itself.
        if (part.replacementSparePartID === target.part._id) return "Same part";
        // An installed (active) part cannot be pulled from inventory — only free stock.
        // The record being replaced is its own row, so exclude it from this rule.
        if (
            part.isActive &&
            !(
                part.replacementSparePartID === target.part._id &&
                part.replacementSourceMachineID === target.machine._id
            )
        ) {
            return "Currently installed";
        }
        // Retired parts have reached their rebuild cap and can never be reused.
        if (part.isRetired || part.partType === "Retired") return "Retired";
        return null;
    };

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

    // Manual entry must not duplicate a part that already exists in inventory
    // under the same KL code — except the part being replaced itself (a rebuilt
    // part legitimately comes back under its own KL). This is a best-effort
    // check against the loaded options; the API enforces it authoritatively.
    const checkManualKlDuplicate = (klValue: string): string | null => {
        const normalized = klValue.trim().toUpperCase();
        if (!normalized) return "KL code is required";
        const ownKl = (target.part.klValue || "").trim().toUpperCase();
        if (normalized === ownKl) return null;
        const duplicate = replacementOptions.find(
            (part) => (part.klValue || "").trim().toUpperCase() === normalized
        );
        return duplicate
            ? `KL code must be unique — ${normalized} already exists in inventory (${duplicate.name}); select it from inventory instead`
            : null;
    };

    const handleReplacementPartSelect = (optionID: string) => {
        const selected = replacementOptions.find((part) => part._id === optionID);
        if (selected && getOptionBlockLabel(selected)) return;
        setForm((prev) => ({
            ...prev,
            replacementOptionID: optionID,
            replacementSparePartID: selected?.replacementSparePartID || "",
            replacementSourceMachineID: selected?.replacementSourceMachineID || "",
            partName: selected?.name || prev.partName,
            klValue: selected?.klValue || "",
            lifetimeText: selected?.lifetimeText || prev.lifetimeText,
            rotorType: selected?.rotorType || prev.rotorType,
            // The selected part keeps its own rebuild cap — never copied onto this record.
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-[680px] rounded-[10px] border border-[#607797] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#C5D1DC] px-5 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-[#2D3E5C]">Replacement Details</h2>
                        <div className="text-sm text-[#6b7280]">
                            {target.machine.categoryName && <div>{target.machine.categoryName}</div>}
                            <div>{target.machine.name}</div>
                            <div>{target.part.name} · {workflowLabel}</div>
                        </div>
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
                        Installation date
                        <Input
                            type="date"
                            value={form.replacementDate}
                            onChange={(event) => setForm({ ...form, replacementDate: event.target.value })}
                        />
                    </label>
                    <div className="col-span-2 flex rounded-md border border-[#C5D1DC] p-1">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setEntryMode("inventory");
                                setManualKlError(null);
                            }}
                            className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                                entryMode === "inventory"
                                    ? "bg-[#2D3E5C] text-white"
                                    : "bg-transparent text-[#6b7280] hover:bg-[#F8FAFC]"
                            }`}
                        >
                            Select from inventory
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setEntryMode("manual");
                                setForm((prev) => {
                                    const originalImages = [
                                        target.part.imageUrl,
                                        ...(target.part.imageUrls ?? []),
                                    ].filter((url, idx, arr): url is string =>
                                        !!url && arr.indexOf(url) === idx
                                    );
                                    return {
                                        ...prev,
                                        replacementOptionID: "",
                                        replacementSparePartID: "",
                                        replacementSourceMachineID: "",
                                        mediaUrls: prev.mediaUrls.length ? prev.mediaUrls : originalImages,
                                    };
                                });
                            }}
                            className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                                entryMode === "manual"
                                    ? "bg-[#d45815] text-white"
                                    : "bg-transparent text-[#6b7280] hover:bg-[#fff7f4]"
                            }`}
                        >
                            Manual entry
                        </button>
                    </div>
                    {entryMode === "inventory" && (
                    <div className="col-span-2 grid grid-cols-2 gap-3 rounded-md border border-[#C5D1DC] bg-[#F8FAFC] p-3">
                        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Search inventory
                            <Input
                                value={search}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder="Search by name or KL code"
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
                        <div className="col-span-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#6b7280]">
                                    Spare part
                                    {replacementOptionsLoading && <span className="ml-2 text-xs text-[#d45815]">Searching…</span>}
                                    {!replacementOptionsLoading && replacementOptions.length > 0 && (
                                        <span className="ml-2 text-xs text-[#9ca3af]">{replacementOptions.length} found</span>
                                    )}
                                </span>
                                {form.replacementOptionID && (
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => setForm((prev) => ({ ...prev, replacementOptionID: "", replacementSparePartID: "", replacementSourceMachineID: "" }))}
                                        className="text-xs text-[#607797] hover:text-red-500 disabled:opacity-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="max-h-44 overflow-y-auto rounded-md border border-[#C5D1DC] bg-white">
                                {replacementOptionsLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#9ca3af]">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d45815] border-t-transparent" />
                                        Loading…
                                    </div>
                                ) : replacementOptions.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-[#9ca3af]">
                                        {search.trim() ? `No parts found for "${search.trim()}"` : "No spare parts available"}
                                    </div>
                                ) : (
                                    replacementOptions.map((part) => {
                                        const blockLabel = getOptionBlockLabel(part);
                                        const isSelected = form.replacementOptionID === part._id;
                                        const isBlocked = !!blockLabel;
                                        return (
                                            <button
                                                key={part._id}
                                                type="button"
                                                disabled={isBlocked || saving}
                                                onClick={() => !isBlocked && handleReplacementPartSelect(part._id)}
                                                className={`flex w-full flex-col gap-0.5 border-b border-[#f3f4f6] px-3 py-2.5 text-left last:border-b-0 transition-colors
                                                    ${isSelected ? "bg-[#fff7f4]" : isBlocked ? "cursor-not-allowed bg-[#f9fafb] opacity-60" : "hover:bg-[#f8fafc] cursor-pointer"}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-sm font-medium ${isSelected ? "text-[#d45815]" : "text-[#111827]"}`}>
                                                        {part.name}
                                                    </span>
                                                    {isBlocked && (
                                                        <span className="shrink-0 rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10px] font-semibold text-[#b91c1c]">
                                                            {blockLabel}
                                                        </span>
                                                    )}
                                                    {isSelected && !isBlocked && (
                                                        <span className="shrink-0 rounded-full bg-[#d45815] px-2 py-0.5 text-[10px] font-semibold text-white">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 text-[11px] text-[#6b7280]">
                                                    {part.klValue && <span>KL {part.klValue}</span>}
                                                    {part.sourceMachine?.name && <span>· {part.sourceMachine.name}</span>}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {form.replacementOptionID && (() => {
                                const sel = replacementOptions.find((p) => p._id === form.replacementOptionID);
                                if (!sel) return null;
                                return (
                                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#d45815]/30 bg-[#fff7f4] px-3 py-2 text-xs">
                                        <span className="font-medium text-[#2D3E5C]">{sel.name}</span>
                                        {sel.klValue && (
                                            <span className="rounded bg-[#d45815] px-1.5 py-0.5 font-mono font-semibold text-white">
                                                KL {sel.klValue}
                                            </span>
                                        )}
                                        {sel.sourceMachine?.name && (
                                            <span className="text-[#6b7280]">· {sel.sourceMachine.name}</span>
                                        )}
                                        {sel.sourceMachine?.serialNumber && (
                                            <span className="text-[#6b7280]">· {sel.sourceMachine.serialNumber}</span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
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
                    )}
                    {entryMode === "manual" && (
                    <div className="col-span-2 grid grid-cols-2 gap-3 rounded-md border border-dashed border-[#d45815] bg-[#fff7f4] p-3">
                        <div className="col-span-2 flex items-center gap-2">
                            <Pencil className="h-3.5 w-3.5 text-[#d45815]" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#d45815]">Manual entry</span>
                        </div>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Part name
                            <Input
                                value={form.partName}
                                onChange={(event) => setForm({ ...form, partName: event.target.value })}
                                className="bg-white"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            <span>KL code <span className="text-red-500">*</span></span>
                            <Input
                                value={form.klValue}
                                onChange={(event) => {
                                    setManualKlError(null);
                                    setForm({ ...form, klValue: event.target.value });
                                }}
                                onBlur={() => setManualKlError(checkManualKlDuplicate(form.klValue))}
                                className={`bg-white font-mono ${manualKlError ? "border-red-500" : ""}`}
                            />
                            {manualKlError
                                ? <span className="text-xs text-red-600">{manualKlError}</span>
                                : <span className="text-xs text-[#9ca3af]">(must be unique)</span>
                            }
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Reference
                            <Input
                                value={form.reference}
                                onChange={(event) => setForm({ ...form, reference: event.target.value })}
                                placeholder="e.g. VOKAS_ROTOR"
                                className="bg-white"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Lifetime for installed part
                            <Input
                                value={form.lifetimeText}
                                onChange={(event) => setForm({ ...form, lifetimeText: event.target.value })}
                                placeholder="e.g. 3 Months or 1 Year"
                                className="bg-white"
                            />
                        </label>
                        <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            <span>Part Type <span className="text-red-500">*</span></span>
                            <Select
                                value={form.isRebuildPart === null ? "" : form.isRebuildPart ? "rebuilt" : "new"}
                                onValueChange={(value) =>
                                    setForm({
                                        ...form,
                                        isRebuildPart: value === "rebuilt",
                                        currentRebuildCount: value === "rebuilt" ? form.currentRebuildCount : 0,
                                    })
                                }
                                disabled={saving}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select — New or Rebuilt" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="rebuilt">Rebuilt</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                            Rebuild threshold (max rebuilds)
                            <Input
                                type="number"
                                min={1}
                                value={form.rebuildsPossible}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        rebuildsPossible: Math.max(0, Number(event.target.value) || 0),
                                    })
                                }
                                className="bg-white"
                            />
                        </label>
                        {form.isRebuildPart && (
                            <label className="flex flex-col gap-1.5 text-sm text-[#6b7280]">
                                Current rebuild count
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.currentRebuildCount}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            currentRebuildCount: Math.max(0, Number(event.target.value) || 0),
                                        })
                                    }
                                    className="bg-white"
                                />
                            </label>
                        )}
                        <div className="col-span-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#6b7280]">
                                    Images
                                    {form.mediaUrls.length > 0 && (
                                        <span className="ml-1 text-xs text-[#9ca3af]">({form.mediaUrls.length})</span>
                                    )}
                                </span>
                                <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#607797] bg-[#DFE6EC] px-2.5 py-1.5 text-xs font-semibold text-gray-900 hover:bg-[#e5e7eb] ${(uploading || saving) ? "pointer-events-none opacity-50" : ""}`}>
                                    <Upload className="h-3.5 w-3.5" />
                                    {uploading ? "Uploading…" : "Upload"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        disabled={uploading || saving}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                            {form.mediaUrls.length === 0 ? (
                                <p className="rounded-md border border-dashed border-[#C5D1DC] py-3 text-center text-xs italic text-[#9ca3af]">
                                    No images — upload to add one.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {form.mediaUrls.map((url, index) => (
                                        <div key={`${url}-${index}`} className="relative">
                                            <img
                                                src={url}
                                                alt=""
                                                className="h-16 w-16 rounded-md border border-[#C5D1DC] object-cover"
                                            />
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        mediaUrls: prev.mediaUrls.filter((_, i) => i !== index),
                                                    }))
                                                }
                                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    )}

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
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#C5D1DC] px-5 py-4">
                    {formError && (
                        <p className="mr-auto text-sm text-red-600">{formError}</p>
                    )}
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
                        onClick={() => {
                            setFormError(null);
                            if (entryMode === "manual") {
                                const klError = checkManualKlDuplicate(form.klValue);
                                if (klError) {
                                    setManualKlError(klError);
                                    setFormError(klError);
                                    return;
                                }
                            }
                            if (entryMode === "inventory" && !form.replacementOptionID) {
                                setFormError("Select a spare part from inventory, or switch to manual entry.");
                                return;
                            }
                            if (form.isRebuildPart === null) {
                                setFormError("Please select a Part Type — New or Rebuilt.");
                                return;
                            }
                            onSave(form);
                        }}
                        className="bg-[#d45815] text-white hover:bg-[#b8480f]"
                    >
                        {saving ? "Saving..." : "Save Replacement"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
