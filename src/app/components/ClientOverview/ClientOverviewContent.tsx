"use client";

import { useState, useMemo, useCallback, useEffect, Fragment, type ChangeEvent } from "react";
import { HiOutlineSearch, HiOutlineChevronRight } from "react-icons/hi";
import { FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AddCategoryMachineFlow, { type AddCategoryMachineFlowFocusTarget } from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";
import FacilityImageMapper, { type CategoryPosition } from "@/app/components/MachineHierarchy/FacilityImageMapper";
import { Map as MapIcon } from "lucide-react";
import { AddMachineFormModal } from "@/app/components/MachineHierarchy/AddEntityModals";
import { Client } from "@/types/client";
import { Machine, SparePart, ClientMachineSparePart, type ReplacementPartSnapshot } from "@/types/machine";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";
import DeleteConfirmModal from "@/app/components/Modals/DeleteConfirmModal";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2, Package, Plus, GripVertical, FileSpreadsheet, Upload } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

const getStatusColor = (status?: string) => {
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

const getStatusText = (status?: string) => {
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

const getStatusIcon = (status?: string) => {
    switch (status) {
        case "healthy":
            return <CheckCircle2 className="w-4 h-4 text-[#00a82d] shrink-0" />;
        case "warning":
            return <AlertTriangle className="w-4 h-4 text-[#ff9a00] shrink-0" />;
        case "critical":
            return <XCircle className="w-4 h-4 text-[#bf1e21] shrink-0" />;
        default:
            return <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />;
    }
};

const formatPartMoney = (price?: { value?: number; priceUnit?: string } | null) => {
    if (!price || !price.value) return null;
    return `${price.value} ${price.priceUnit || "EUR"}`;
};

const formatPartDuration = (duration?: { value?: number; unit?: string } | null) => {
    if (!duration || !duration.value) return null;
    return `${duration.value} ${duration.unit || ""}`.trim();
};
/** Status logic aligned with machine-health: totalRunningHours > lifeTime → Attention, === → Monitor, else Healthy */
function getSparePartStatusFromHours(
    totalRunningHours: number,
    lifetimeValue: number
): "healthy" | "warning" | "critical" {
    if (totalRunningHours > lifetimeValue) return "critical"; // Attention
    if (totalRunningHours === lifetimeValue) return "warning";  // Monitor
    return "healthy"; // Healthy
}

type QuoteCsvData = NonNullable<Client["quoteCsvData"]>;
type QuoteCsvSection = NonNullable<QuoteCsvData["sections"]>[number];

const FALLBACK_QUOTE_HEADERS: Record<number, string> = {
    1: "S.No.",
    2: "Equipment with Spares Description",
    3: "KL Code",
    4: "Req.Qty",
    5: "Category",
    6: "Machine",
};

const cleanCsvCell = (value: unknown) =>
    String(value ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/Â/g, "")
        .replace(/\s+/g, " ")
        .trim();

const isHiddenQuoteColumn = (header: string) => {
    const normalized = header.toLowerCase();
    return normalized.includes("contract") || normalized.includes("price");
};

const isHeaderRow = (row: string[]) => {
    const joined = row.join(" ").toLowerCase();
    return joined.includes("equipment") && joined.includes("req.qty");
};

const isSubtotalRow = (row: string[]) =>
    row.some((cell) => cell.toLowerCase() === "sub-total");

const isGrandTotalRow = (row: string[]) =>
    row.some((cell) => cell.toLowerCase().startsWith("grand total"));

const firstValue = (row: string[]) => row.find(Boolean) || "";

const lastValue = (row: string[]) => {
    for (let i = row.length - 1; i >= 0; i -= 1) {
        if (row[i]) return row[i];
    }
    return "";
};

const getSectionTitle = (row: string[]) => row[2] || row[1] || firstValue(row);

const getHeaderColumns = (row: string[]) =>
    row
        .map((header, index) => ({
            index,
            header: header || FALLBACK_QUOTE_HEADERS[index] || "",
        }))
        .filter(({ header }) => header && !isHiddenQuoteColumn(header));

const normalizeQuoteCsvRows = (rows: unknown[][], fileName: string): QuoteCsvData => {
    const cleanedRows = rows.map((row) => row.map(cleanCsvCell));
    const firstHeaderRowIndex = cleanedRows.findIndex(isHeaderRow);

    if (firstHeaderRowIndex < 0) {
        throw new Error("Could not find the CSV header row.");
    }

    const sections: QuoteCsvSection[] = [];
    const grandTotals: NonNullable<QuoteCsvData["grandTotals"]> = [];
    const summaryRows: NonNullable<QuoteCsvData["summaryRows"]> = [];
    let currentSection: QuoteCsvSection | null = null;
    let currentColumns = getHeaderColumns(cleanedRows[firstHeaderRowIndex]);
    let pendingTitle = "";
    let afterGrandTotals = false;

    const pushCurrentSection = () => {
        if (currentSection && currentSection.rows.length) {
            sections.push(currentSection);
        }
        currentSection = null;
    };

    for (let i = firstHeaderRowIndex + 1; i < cleanedRows.length; i += 1) {
        const row = cleanedRows[i];
        if (!row.some(Boolean)) continue;

        if (isGrandTotalRow(row)) {
            pushCurrentSection();
            grandTotals.push({
                label: firstValue(row),
                value: row[8] || lastValue(row),
            });
            afterGrandTotals = true;
            continue;
        }

        if (afterGrandTotals) {
            const label = row[7] || row[1] || row[2] || firstValue(row);
            const value = row[9] || row[8] || "";
            const note = row[10] || "";
            if (label) summaryRows.push({ label, value, note });
            continue;
        }

        if (isHeaderRow(row)) {
            currentColumns = getHeaderColumns(row);
            continue;
        }

        if (isSubtotalRow(row)) {
            if (currentSection) {
                currentSection.subtotal = {
                    label: "Sub-Total",
                    value: row[8] || lastValue(row),
                };
            }
            pushCurrentSection();
            pendingTitle = "";
            continue;
        }

        const serialValue = row[1];
        const isItemRow = /^\d+$/.test(serialValue);

        if (!isItemRow) {
            pendingTitle = getSectionTitle(row);
            continue;
        }

        if (!currentSection) {
            currentSection = {
                title: pendingTitle || "Quote Items",
                headers: currentColumns.map(({ header }) => header),
                rows: [],
            };
        }

        currentSection.rows.push(currentColumns.map(({ index }) => row[index] || ""));
    }

    pushCurrentSection();

    const headers = sections[0]?.headers || [];
    const flatRows = sections.flatMap((section) => section.rows);

    if (!sections.length || !flatRows.length) {
        throw new Error("No quote CSV rows were found after cleanup.");
    }

    return {
        fileName,
        uploadedAt: new Date().toISOString(),
        headers,
        rows: flatRows,
        sections,
        grandTotals,
        summaryRows,
    };
};

async function parseQuoteCsvFile(file: File): Promise<QuoteCsvData> {
    const csvText = await file.text();
    const workbook = XLSX.read(csvText, { type: "string", raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
    });
    return normalizeQuoteCsvRows(rows, file.name);
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    machines: Machine[];
    isActive?: boolean;
}

interface ClientOverviewContentProps {
    clientDetails: Client;
    allClients: Client[];
    currentClientId: string;
    categories: Category[];
    allCategories?: Category[];
}

interface SparePartWithStatus extends SparePart {
    klValue?: string;
    status?: "healthy" | "warning" | "critical";
    healthPercentage?: number;
    lastServiceDate?: string | null;
    sparePartInstallationDate?: string | null;
    customName?: string;
    clientSparePartId?: string;
    isActive?: boolean;
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    rebuildLifetime?: { value: number; unit: string };
    rebuildLifetimeText?: string | null;
    rebuildStatus?: "None" | "Sent to Rebuild" | "Rebuilt" | "In Stock";
    isSentToRebuild?: boolean;
    rebuildSentDate?: string | null;
    orderNewStatus?: "None" | "Ordered New" | "Received" | "In Stock";
    isOrderedNew?: boolean;
    orderNewRequestedDate?: string | null;
    replacementSource?: "Rebuild" | "Order New" | null;
    replacementDate?: string | null;
    replacementSparePart?: string | null;
    replacementPartSnapshot?: ReplacementPartSnapshot | null;
    replacementPartName?: string | null;
    replacementPartKlValue?: string | null;
    replacementPartSerialNumber?: string | null;
    replacementNotes?: string | null;
    replacementLifetimeText?: string | null;
    replacementMediaUrls?: string[];
}

interface MachineSpareParts {
    [machineId: string]: SparePartWithStatus[];
}

interface QuoteCsvUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: QuoteCsvData | null;
    clientId: string;
    onSaved: (data: QuoteCsvData) => void;
}

function QuoteCsvUploadModal({ open, onOpenChange, initialData, clientId, onSaved }: QuoteCsvUploadModalProps) {
    const [previewData, setPreviewData] = useState<QuoteCsvData | null>(initialData || null);
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setPreviewData(initialData || null);
            setParseError(null);
        }
    }, [initialData, open]);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setParseError("Please upload a CSV file.");
            return;
        }

        setIsParsing(true);
        setParseError(null);
        try {
            const parsed = await parseQuoteCsvFile(file);
            setPreviewData(parsed);
        } catch (error) {
            setPreviewData(null);
            setParseError(error instanceof Error ? error.message : "Failed to parse CSV file.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleSave = async () => {
        if (!previewData) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quoteCsvData: previewData }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save quote CSV data.");
            }
            onSaved(previewData);
            toast.success("Quote CSV data saved.");
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save quote CSV data.");
        } finally {
            setIsSaving(false);
        }
    };

    const previewSections = previewData?.sections?.length
        ? previewData.sections
        : previewData?.headers?.length && previewData?.rows?.length
            ? [{ title: "Quote Items", headers: previewData.headers, rows: previewData.rows }]
            : [];
    const previewRowCount = previewSections.reduce((sum, section) => sum + (section.rows?.length || 0), 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(1180px,calc(100vw-2rem))] bg-white p-0 text-[#111827]">
                <DialogHeader className="border-b border-[#d4dde8] bg-[#f8fafc] px-6 py-5">
                    <DialogTitle className="flex items-center gap-2 text-xl text-[#2D3E5C]">
                        <FileSpreadsheet className="h-5 w-5 text-[#d45815]" />
                        Add Quote CSV Data
                    </DialogTitle>
                    <DialogDescription>
                        Upload the customer quote CSV. Contract price columns are removed from the preview and saved report.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5">
                    <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#96A5BA] bg-[#f8fafc] px-4 text-center transition-colors hover:border-[#d45815] hover:bg-[#fff7ed]">
                        {isParsing ? (
                            <Loader2 className="h-6 w-6 animate-spin text-[#d45815]" />
                        ) : (
                            <Upload className="h-6 w-6 text-[#d45815]" />
                        )}
                        <span className="text-sm font-semibold text-[#1f2937]">
                            {isParsing ? "Reading CSV..." : "Choose CSV file"}
                        </span>
                        <span className="text-xs text-[#6b7280]">Only non-contract columns will be shown.</span>
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                    </label>

                    {parseError && (
                        <div className="rounded-[8px] border border-[#bf1e21]/30 bg-[#bf1e21]/10 px-4 py-3 text-sm font-medium text-[#991b1b]">
                            {parseError}
                        </div>
                    )}

                    {previewData && previewSections.length ? (
                        <div className="grid gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#96A5BA] bg-gradient-to-r from-[#DFE6EC] to-white px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-[#111827]">{previewData.fileName || "Quote CSV"}</p>
                                    <p className="text-xs font-medium text-[#607797]">{previewRowCount} rows across {previewSections.length} sections</p>
                                </div>
                                <Badge className="rounded-full border border-[#d45815]/30 bg-[#d45815]/10 px-3 py-1 text-xs font-semibold text-[#d45815]">
                                    Contract columns hidden
                                </Badge>
                            </div>

                            <div className="max-h-[460px] overflow-auto pr-1">
                                <div className="grid gap-4">
                                    {previewSections.map((section, sectionIndex) => (
                                        <div key={`${section.title}-${sectionIndex}`} className="overflow-hidden rounded-[12px] border border-[#96A5BA] bg-white">
                                            <div className="flex items-center justify-between gap-3 border-b border-[#d4dde8] bg-[#f8fafc] px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-bold text-[#111827]">{section.title}</p>
                                                    <p className="text-xs font-medium text-[#607797]">{section.rows?.length || 0} rows</p>
                                                </div>
                                                {section.subtotal?.value && (
                                                    <div className="rounded-[8px] border border-[#d45815]/20 bg-[#fff7ed] px-3 py-1.5 text-right">
                                                        <p className="text-[11px] font-bold uppercase text-[#9a3412]">{section.subtotal.label}</p>
                                                        <p className="text-sm font-bold text-[#d45815]">{section.subtotal.value}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[820px] border-collapse">
                                                    <thead className="bg-[#f9fafb]">
                                                        <tr className="border-b border-[#d4dde8]">
                                                            {(section.headers || []).map((header, index) => (
                                                                <th key={`${header}-${index}`} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#edf1f5]">
                                                        {(section.rows || []).map((row, rowIndex) => (
                                                            <tr key={rowIndex} className="bg-white hover:bg-[#f8fafc]">
                                                                {row.map((cell, cellIndex) => (
                                                                    <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-sm font-medium text-[#374151]">
                                                                        {cell || "—"}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!!previewData.grandTotals?.length && (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {previewData.grandTotals.map((total, index) => (
                                        <div key={`${total.label}-${index}`} className="rounded-[12px] border border-[#d45815]/30 bg-[#fff7ed] px-4 py-3">
                                            <p className="text-xs font-bold uppercase tracking-wide text-[#9a3412]">{total.label}</p>
                                            <p className="mt-1 text-2xl font-bold text-[#d45815]">{total.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!!previewData.summaryRows?.length && (
                                <div className="overflow-hidden rounded-[12px] border border-[#96A5BA] bg-white">
                                    <div className="border-b border-[#d4dde8] bg-[#f8fafc] px-4 py-3">
                                        <p className="text-sm font-bold text-[#111827]">Scope Summary</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] border-collapse">
                                            <tbody className="divide-y divide-[#edf1f5]">
                                                {previewData.summaryRows.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="bg-white">
                                                        <td className="px-4 py-3 text-sm font-medium text-[#374151]">{row.label}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-[#111827]">{row.value || "—"}</td>
                                                        <td className="w-20 px-4 py-3 text-right text-sm font-bold text-[#d45815]">{row.note || ""}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-[10px] border border-[#d4dde8] bg-[#f8fafc] px-4 py-8 text-center text-sm font-medium text-[#607797]">
                            No quote CSV data uploaded yet.
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-[#d4dde8] bg-[#f8fafc] px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!previewData || isSaving}
                        className="bg-[#d45815] text-white hover:bg-[#c34f12]"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save CSV Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface SortableCategoryCardProps {
    category: Category;
    isOpen: boolean;
    onToggle: () => void;
    onDeleteClick: () => void;
    clientId: string;
    onSuccess: () => void;
    focusTarget?: AddCategoryMachineFlowFocusTarget | null;
}

function SortableCategoryCard({ category, isOpen, onToggle, onDeleteClick, clientId, onSuccess, focusTarget }: SortableCategoryCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: isDragging ? ("relative" as const) : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="rounded-[10px] bg-white border border-[#96A5BA] overflow-hidden">
            <div className="w-full flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] px-6 py-4 hover:from-[#cbd6e1] transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[#9ca3af] hover:text-[#374151] shrink-0"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex items-center gap-3 text-base font-semibold text-foreground flex-1 text-left cursor-pointer"
                    >
                        <span className="transition-transform duration-200" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                            <HiOutlineChevronRight className="w-5 h-5 text-gray-900" />
                        </span>
                        {category.name}
                        <span className="bg-[#e5e7eb] rounded px-2 py-0.5 text-[#1f2937] text-sm font-semibold">
                            {category.machines?.length || 0}
                        </span>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(); }}
                    className="ml-3 h-8 w-8 p-0 flex items-center justify-center rounded text-[#374151] hover:text-[#bf1e21] hover:bg-[#bf1e21]/10 transition-colors shrink-0 cursor-pointer"
                    title="Delete category"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            {isOpen && (
                <div className="p-6">
                    <AddCategoryMachineFlow
                        compact
                        categoryIdForEdit={category._id}
                        clientID={clientId}
                        onSuccess={onSuccess}
                        focusTarget={focusTarget}
                    />
                </div>
            )}
        </div>
    );
}

export default function ClientOverviewContent({
    clientDetails,
    allClients,
    currentClientId,
    categories,
    allCategories,
}: ClientOverviewContentProps) {
    void allClients; // Reserved for region/customer filtering UI
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "upload">("overview");
    const [searchQuery, setSearchQuery] = useState("");
    // Only machine row is accordion; category shows table, machine expands to show spare parts table
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
    const [machineSpareParts, setMachineSpareParts] = useState<MachineSpareParts>({});
    const [loadingSpareParts, setLoadingSpareParts] = useState<Record<string, boolean>>({});
    const [activeSparePartSavingKey, setActiveSparePartSavingKey] = useState<string | null>(null);
    type DeleteTarget = { type: "category"; id: string; name: string } | { type: "machine"; id: string; name: string } | { type: "sparePart"; id: string; name: string } | { type: "part"; id: string; name: string };
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteTarget | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [partsModalSparePart, setPartsModalSparePart] = useState<{ sparePartId: string; sparePartName: string } | null>(null);
    const [partsList, setPartsList] = useState<{ _id: string; name: string }[]>([]);
    const [loadingParts, setLoadingParts] = useState(false);
    // Which category is expanded for inline editing in the Upload Data tab.
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    type UploadFocusTarget = AddCategoryMachineFlowFocusTarget & { categoryId: string };
    const [uploadFocusTarget, setUploadFocusTarget] = useState<UploadFocusTarget | null>(null);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [addMachineForCategoryId, setAddMachineForCategoryId] = useState<string | null>(null);
    const [quoteCsvModalOpen, setQuoteCsvModalOpen] = useState(false);
    const [quoteCsvData, setQuoteCsvData] = useState<QuoteCsvData | null>(clientDetails.quoteCsvData || null);
    const [showFacilityMapper, setShowFacilityMapper] = useState(false);
    const [facilityLayout, setFacilityLayout] = useState<CategoryPosition[]>(
        () => (clientDetails.facilityLayout || []).map((item) => ({
            category: typeof item.category === "object" ? item.category._id : item.category,
            points: item.points,
        }))
    );
    // Categories created this session, merged into the Upload Data list so a
    // brand-new (machine-less) category shows up immediately after saving.
    const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
    const uploadCategories = useMemo(
        () => [
            ...createdCategories.filter((cc) => !categories.some((c) => c._id === cc._id)),
            ...categories,
        ],
        [createdCategories, categories]
    );

    const [orderedCategories, setOrderedCategories] = useState<Category[]>(uploadCategories);
    useEffect(() => {
        setOrderedCategories(uploadCategories);
    }, [uploadCategories]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setOrderedCategories((prev) => {
            const oldIndex = prev.findIndex((c) => c._id === active.id);
            const newIndex = prev.findIndex((c) => c._id === over.id);
            const reordered = arrayMove(prev, oldIndex, newIndex);
            fetch("/api/machines/machine-categories/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryIds: reordered.map((c) => c._id) }),
            }).then((res) => {
                if (!res.ok) toast.error("Failed to save category order.");
            }).catch(() => {
                toast.error("Failed to save category order.");
            });
            return reordered;
        });
    }, []);

    const handleSaveFacilityLayout = useCallback(async (positions: CategoryPosition[]) => {
        const res = await fetch(`/api/clients/${currentClientId}/facility-layout`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facilityLayout: positions }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || "Failed to save facility layout");
        }
        setFacilityLayout(positions);
        setShowFacilityMapper(false);
        toast.success("Facility layout saved.");
    }, [currentClientId]);

    const openUploadEditor = useCallback((categoryId: string, machineId?: string, sparePartId?: string) => {
        setActiveTab("upload");
        setAddCategoryOpen(false);
        setEditingCategoryId(categoryId);
        setUploadFocusTarget((prev) => ({
            categoryId,
            machineId,
            sparePartId,
            requestId: (prev?.requestId ?? 0) + 1,
        }));
    }, []);

    // Filter categories by search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;

        const query = searchQuery.toLowerCase();
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(query) ||
            cat.machines.some((m) =>
                m.name?.toLowerCase().includes(query)
            )
        );
    }, [categories, searchQuery]);

    // Total machines count
    const totalMachines = useMemo(() => {
        return categories.reduce((sum, cat) => sum + (cat.machines?.length || 0), 0);
    }, [categories]);

    const toggleCategory = useCallback((categoryName: string) => {
        setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
        setExpandedMachine(null);
    }, []);

    // Link machines created via the inline Add-Category editor to this client.
    const handleMachinesCreated = useCallback(async (machineIDs: string[]) => {
        if (!machineIDs.length) return;
        try {
            const res = await fetch(`/api/clients/${currentClientId}/client-machines`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ machineIDs }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to link machines to client");
            }
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to link machines to client");
        }
    }, [currentClientId, router]);

    const loadSparePartsForMachine = useCallback(async (machineId: string, expand = true) => {
        setLoadingSpareParts((prev) => ({ ...prev, [machineId]: true }));
        if (expand) setExpandedMachine(machineId);
        try {
            const response = await fetch(`/api/products/${currentClientId}/spare-parts/${machineId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch spare parts');
            }

            const responseData = await response.json();
            const data = responseData.spareParts || responseData;

            const transformedSpareParts: SparePartWithStatus[] = data.map((part: SparePart & { clientMachineSparePart?: ClientMachineSparePart & { lastServiceDate?: string; sparePartInstallationDate?: string; customName?: string; isActive?: boolean } }) => {
                const clientSparePart = part.clientMachineSparePart;
                const totalRunningHours = clientSparePart?.totalRunningHours?.value ?? 0;
                const clientLifetimeValue = clientSparePart?.lifetimeOfRotor?.value;
                const rebuildLifetimeValue =
                    clientSparePart?.rotorType === "Rebuilt"
                        ? clientSparePart?.rebuildLifetime?.value
                        : 0;
                const lifetimeValue = clientLifetimeValue && clientLifetimeValue > 0
                    ? clientLifetimeValue
                    : rebuildLifetimeValue && rebuildLifetimeValue > 0
                    ? rebuildLifetimeValue
                    : part.lifeTime?.value ?? 0;
                const healthPercentage = lifetimeValue > 0
                    ? Math.max(0, Math.min(100, ((lifetimeValue - totalRunningHours) / lifetimeValue) * 100))
                    : 100;
                const status = getSparePartStatusFromHours(totalRunningHours, lifetimeValue);
                const replacementInstalled = Boolean(
                    clientSparePart?.replacementDate ||
                    clientSparePart?.replacementRecordedAt
                );
                const activeDisplayName =
                    replacementInstalled
                        ? clientSparePart?.replacementPartName ||
                          clientSparePart?.replacementPartSnapshot?.name ||
                          clientSparePart?.customName ||
                          part.name
                        : clientSparePart?.customName || part.name;

                return {
                    ...part,
                    status,
                    healthPercentage: Math.round(healthPercentage),
                    lastServiceDate: clientSparePart?.lastServiceDate || null,
                    sparePartInstallationDate: clientSparePart?.sparePartInstallationDate || null,
                    customName: activeDisplayName,
                    clientSparePartId: clientSparePart?._id || undefined,
                    isActive: clientSparePart?.isActive !== undefined ? clientSparePart.isActive : true,
                    rotorType: clientSparePart?.rotorType,
                    rebuildsPossible: clientSparePart?.rebuildsPossible ?? 0,
                    rebuildLifetime: clientSparePart?.rebuildLifetime,
                    rebuildLifetimeText: clientSparePart?.rebuildLifetimeText || null,
                    rebuildStatus: clientSparePart?.rebuildStatus,
                    isSentToRebuild: clientSparePart?.isSentToRebuild,
                    rebuildSentDate: clientSparePart?.rebuildSentDate || null,
                    orderNewStatus: clientSparePart?.orderNewStatus,
                    isOrderedNew: clientSparePart?.isOrderedNew,
                    orderNewRequestedDate: clientSparePart?.orderNewRequestedDate || null,
                    replacementSource: clientSparePart?.replacementSource || null,
                    replacementDate: clientSparePart?.replacementDate || null,
                    replacementSparePart: clientSparePart?.replacementSparePart || null,
                    replacementPartSnapshot: clientSparePart?.replacementPartSnapshot || null,
                    replacementPartName: clientSparePart?.replacementPartName || null,
                    replacementPartKlValue: clientSparePart?.replacementPartKlValue || null,
                    replacementPartSerialNumber: clientSparePart?.replacementPartSerialNumber || null,
                    replacementNotes: clientSparePart?.replacementNotes || null,
                    replacementLifetimeText: clientSparePart?.replacementLifetimeText || null,
                    replacementMediaUrls: clientSparePart?.replacementMediaUrls || [],
                };
            });

            setMachineSpareParts((prev) => ({ ...prev, [machineId]: transformedSpareParts }));
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            toast.error('Failed to fetch spare parts');
            setExpandedMachine(null);
        } finally {
            setLoadingSpareParts((prev) => ({ ...prev, [machineId]: false }));
        }
    }, [currentClientId]);

    const fetchSpareParts = useCallback(async (machineId: string) => {
        if (machineSpareParts[machineId]) {
            setExpandedMachine((prev) => (prev === machineId ? null : machineId));
            return;
        }

        await loadSparePartsForMachine(machineId);
    }, [loadSparePartsForMachine, machineSpareParts]);

    const handleToggleSparePartActive = useCallback(async (
        machineId: string,
        sparePart: SparePartWithStatus,
        nextActive: boolean
    ) => {
        const savingKey = `${machineId}:${sparePart._id}`;
        setActiveSparePartSavingKey(savingKey);
        try {
            const response = await fetch(`/api/clients/${currentClientId}/machines/${machineId}/spare-parts`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sparePartID: sparePart._id,
                    isActive: nextActive,
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update active status");
            }
            await loadSparePartsForMachine(machineId, true);
            toast.success(`Spare part marked ${nextActive ? "active" : "inactive"}.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update active status");
        } finally {
            setActiveSparePartSavingKey(null);
        }
    }, [currentClientId, loadSparePartsForMachine]);

    const toggleMachine = useCallback((machineId: string) => {
        if (expandedMachine === machineId) {
            setExpandedMachine(null);
            return;
        }
        fetchSpareParts(machineId);
    }, [fetchSpareParts, expandedMachine]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            if (deleteConfirm.type === "category") {
                const res = await fetch(`/api/machines/machine-category/${deleteConfirm.id}`, { method: "DELETE" });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to delete category");
                }
                // Also drop it from the session-created list so it doesn't linger.
                setCreatedCategories((prev) => prev.filter((c) => c._id !== deleteConfirm.id));
                toast.success("Category deleted.");
            } else if (deleteConfirm.type === "machine") {
                const res = await fetch(`/api/machines/${deleteConfirm.id}`, { method: "DELETE" });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to delete machine");
                }
                toast.success("Machine deleted.");
            } else if (deleteConfirm.type === "sparePart") {
                const res = await fetch(`/api/machines/spare-parts/${deleteConfirm.id}`, { method: "DELETE" });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to delete spare part");
                }
                setMachineSpareParts((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((mid) => {
                        next[mid] = next[mid].filter((sp) => sp._id !== deleteConfirm.id);
                    });
                    return next;
                });
                toast.success("Spare part deleted.");
            } else if (deleteConfirm.type === "part") {
                const res = await fetch(`/api/machines/spare-parts-part/${deleteConfirm.id}`, { method: "DELETE" });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to delete part");
                }
                setPartsList((prev) => prev.filter((p) => p._id !== deleteConfirm.id));
                toast.success("Part deleted.");
            }
            setDeleteConfirm(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed");
        } finally {
            setDeleteLoading(false);
        }
    }, [deleteConfirm, router]);

    const openPartsModal = useCallback(async (sparePartId: string, sparePartName: string) => {
        setPartsModalSparePart({ sparePartId, sparePartName });
        setLoadingParts(true);
        try {
            const res = await fetch(`/api/machines/spare-parts/${sparePartId}/parts`);
            if (!res.ok) throw new Error("Failed to fetch parts");
            const data = await res.json();
            setPartsList(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load parts");
            setPartsList([]);
        } finally {
            setLoadingParts(false);
        }
    }, []);

    // Get client-side owner/contact name
    const ownerName = typeof clientDetails?.loginUser === "object" && clientDetails.loginUser
        ? clientDetails.loginUser.name || "N/A"
        : typeof clientDetails?.clientOwnership === "object" &&
            clientDetails.clientOwnership &&
            "role" in clientDetails.clientOwnership &&
            clientDetails.clientOwnership.role === "client"
            ? clientDetails.clientOwnership.name || "N/A"
            : "N/A";

    // Get last update date
    const lastUpdate = clientDetails?.updatedAt
        ? format(new Date(clientDetails.updatedAt), "dd/MM/yyyy 'At' h:mma")
        : "N/A";

    return (
        <div className="min-h-screen bg-[#ffffff] p-6">
            <div className="flex flex-col gap-3">
                {/* Top-level tabs: Overview | Upload Data */}
                <div className="flex items-center gap-6 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === "overview"
                            ? "text-foreground border-b-2 border-orange"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("upload")}
                        className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === "upload"
                            ? "text-foreground border-b-2 border-orange"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Upload Data
                    </button>
                </div>

                {activeTab === "overview" && (
                <>
                {/* Header Section */}
                <div className="h-[70px] flex items-center justify-between">
                    <h1 className="text-[#2D3E5C] text-[28px] leading-[42px] font-bold">
                        Client & Machine Overview
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* Region Dropdown */}
                        {/* <Select
                            value={selectedRegion || "all"}
                            onValueChange={(value) => {
                                setSelectedRegion(value === "all" ? "" : value);
                                setSelectedCustomer("");
                            }}
                        >
                            <SelectTrigger className="bg-white border-[#d1d5db] rounded-[8px] h-[44px] px-3 text-[#4b5563] text-base hover:border-[#d1d5db] focus:border-[#d45815] w-[191px]">
                                <SelectValue placeholder="Asia" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#d1d5db]">
                                <SelectItem
                                    value="all"
                                    className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer"
                                >
                                    All Regions
                                </SelectItem>
                                {regions.map((region) => (
                                    <SelectItem
                                        key={region}
                                        value={region}
                                        className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer"
                                    >
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select> */}

                        {/* Customer Dropdown */}
                        {/* <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                            disabled={!selectedRegion}
                        >
                            <SelectTrigger className="bg-white border-[#d1d5db] rounded-[8px] h-[44px] px-3 text-[#4b5563] text-base hover:border-[#d1d5db] focus:border-[#d45815] w-[191px] disabled:opacity-50">
                                <SelectValue placeholder={selectedRegion ? "Customer" : "Select region first"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#d1d5db]">
                                {selectedRegion && (
                                    <>
                                        <SelectItem
                                            value="all"
                                            className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer"
                                        >
                                            All Customers
                                        </SelectItem>
                                        {customersByRegion.map((customer) => (
                                            <SelectItem
                                                key={customer}
                                                value={customer}
                                                className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer"
                                            >
                                                {customer}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select> */}

                        <Button
                            type="button"
                            onClick={() => setQuoteCsvModalOpen(true)}
                            className="h-10 rounded-[8px] bg-[#d45815] px-4 text-sm font-semibold text-white hover:bg-[#c34f12]"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Add Quote CSV Data
                        </Button>

                        {clientDetails.facilityImageUrl && categories.length > 0 && (
                            <Button
                                type="button"
                                onClick={() => setShowFacilityMapper(true)}
                                className="h-10 rounded-[8px] bg-[#2D3E5C] px-4 text-sm font-semibold text-white hover:bg-[#1a2744]"
                            >
                                <MapIcon className="mr-2 h-4 w-4" />
                                Facility Mapper
                            </Button>
                        )}

                        {/* Edit Details Button */}
                        <EditClientDetails client={clientDetails} machines={[]} categories={categories} />
                    </div>
                </div>

                {/* Info Cards Row */}
                <div className="flex gap-[15px]">
                    {/* Company Name */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#374151] text-sm font-medium leading-5">Company Name</p>
                        <p className="text-[#d45815] text-base font-bold leading-6">
                            {clientDetails?.name || "N/A"}
                        </p>
                    </div>

                    {/* Location */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#374151] text-sm font-medium leading-5">Location</p>
                        <p className="text-gray-900 text-base font-bold leading-6 truncate">
                            {clientDetails?.location?.address
                                ? clientDetails.location.address.length > 20
                                    ? `${clientDetails.location.address.substring(0, 20)}...`
                                    : clientDetails.location.address
                                : "N/A"}
                        </p>
                    </div>

                    {/* End Product */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] p-4 flex flex-col gap-1 w-[216px] h-[82px]">
                        <p className="text-[#374151] text-sm font-medium leading-5">End Product</p>
                        <p className="text-gray-900 text-base font-bold leading-6">
                            {clientDetails?.endProduct || "N/A"}
                        </p>
                    </div>

                    {/* Owner */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#374151] text-sm font-medium leading-5">Owner</p>
                        <p className="text-gray-900 text-base font-bold leading-6">
                            {ownerName}
                        </p>
                    </div>

                    {/* Capacity */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#374151] text-sm font-medium leading-5">Capacity</p>
                        <p className="text-gray-900 text-base font-bold leading-6">
                            {clientDetails?.capacity || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Machine Categories Section */}
                <div className="bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-[#607797] flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-gray-900 text-xl leading-7 font-semibold">Total Machines</h2>
                                <div className="bg-[rgba(255,105,0,0.2)] rounded px-2 py-0.5">
                                    <span className="text-[#d45815] text-sm font-semibold leading-5">
                                        {totalMachines} Units
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() => { setUploadFocusTarget(null); setActiveTab("upload"); setEditingCategoryId(null); setAddCategoryOpen(true); }}
                                className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] px-2 py-1 h-auto flex items-center gap-1 text-sm"
                            >
                                <FaPlus className="w-4 h-4" />
                                Add Category
                            </Button>
                        </div>
                        {/* Search Input */}
                        <div className="relative w-[256px]">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#374151]" />
                            <input
                                type="text"
                                placeholder="Search machines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-[#96A5BA] rounded-[10px] h-[42px] pl-9 pr-4 text-gray-900 text-base font-medium placeholder:text-[#6b7280] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Category List - single open accordion with smooth animation */}
                    <div className="flex flex-col">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => {
                                const isCategoryOpen = expandedCategory === category.name;
                                return (
                                    <div key={category._id || category.name}>
                                        <div className="w-full bg-[#ffffff] border-b border-[#607797] flex items-center justify-between px-6 py-3 hover:bg-[#f9fafb] transition-colors">
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(category.name)}
                                                className="flex items-center gap-2 flex-1 text-left"
                                            >
                                                <span
                                                    className="transition-transform duration-200 ease-out"
                                                    style={{ transform: isCategoryOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                                                >
                                                    <HiOutlineChevronRight className="w-4 h-4 text-gray-900" />
                                                </span>
                                                <span className="text-gray-900 text-[16px] font-semibold font-lato leading-[24px]">
                                                    {category.name}
                                                </span>
                                                <div className="bg-[#e5e7eb] rounded px-2 py-0.5">
                                                    <span className="text-[#1f2937] text-sm font-semibold leading-5">
                                                        {category.machines?.length || 0}
                                                    </span>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => { e.stopPropagation(); setUploadFocusTarget(null); setActiveTab("upload"); setEditingCategoryId(category._id); }}
                                                    className="h-8 w-8 p-0 text-[#374151] hover:text-[#d45815] hover:bg-[#d45815]/10"
                                                    title="Edit category"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "category", id: category._id, name: category.name }); }}
                                                    className="h-8 w-8 p-0 text-[#374151] hover:text-[#bf1e21] hover:bg-[#bf1e21]/10"
                                                    title="Delete category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Animated Category content - Machine List */}
                                        <div
                                            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            style={{ gridTemplateRows: isCategoryOpen ? "1fr" : "0fr" }}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                {(category.machines?.length ?? 0) === 0 ? (
                                                    <div className="bg-[#f9fafb] border-b border-[#607797] px-6 py-8 flex flex-col items-center gap-3">
                                                        <Package className="w-8 h-8 text-[#9ca3af]" />
                                                        <p className="text-sm text-[#6b7280]">No machines added yet</p>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); setAddMachineForCategoryId(category._id); }}
                                                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] flex items-center gap-1.5"
                                                        >
                                                            <Plus className="w-4 h-4" /> Add Machine
                                                        </Button>
                                                    </div>
                                                ) : (
                                                <div className="bg-[#f9fafb] border-b border-[#607797] overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead className="bg-[#ffffff]">
                                                            <tr className="border-b border-[#607797]">
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider w-16">Sr.No.</th>
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider">Machine Name</th>
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider">Current Status</th>
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider">Installation Date</th>
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider w-24">Edit Detail</th>
                                                                <th className="text-left py-3 px-4 text-[#1f2937] text-xs font-bold uppercase tracking-wider w-20">Delete</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-[#DFE6EC]">
                                                            {(category.machines ?? []).map((machine, index) => {
                                                                const isMachineOpen = expandedMachine === machine._id;
                                                                const spareParts = machineSpareParts[machine._id] ?? [];
                                                                const isLoading = loadingSpareParts[machine._id];
                                                                return (
                                                                    <Fragment key={machine._id}>
                                                                        <tr
                                                                            onClick={() => toggleMachine(machine._id)}
                                                                            className="border-b border-[#607797] bg-[#DFE6EC] hover:bg-[#DFE6EC] transition-colors cursor-pointer"
                                                                        >
                                                                            <td className="py-3 px-4 text-gray-900 text-sm font-semibold">{index + 1}</td>
                                                                            <td className="py-3 px-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="transition-transform duration-200 ease-out shrink-0" style={{ transform: isMachineOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                                                                                        <HiOutlineChevronRight className="w-4 h-4 text-gray-900" />
                                                                                    </span>
                                                                                    <span className="text-gray-900 text-[16px] font-semibold">{machine.name || "N/A"}</span>
                                                                                    {isLoading && <Loader2 className="w-4 h-4 text-gray-900 animate-spin shrink-0" />}
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-3 px-4">
                                                                                <div className="flex flex-col gap-1.5">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        {/* {getStatusIcon(machine.status)} */}
                                                                                        <Badge className={`${getStatusColor(machine.status)} text-xs border font-medium rounded-2xl`}>
                                                                                            {getStatusText(machine.status)}
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <Badge className={`text-xs border w-fit ${machine.isActive !== false ? "bg-[#00a82d]/20 text-[#00a82d] border-[#00a82d]/40" : "bg-[#bf1e21]/20 text-[#bf1e21] border-[#bf1e21]/40"}`}>
                                                                                        {machine.isActive !== false ? "Active" : "Inactive"}
                                                                                    </Badge>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-3 px-4 text-[#374151] text-sm font-medium">{machine.installationDate ? format(new Date(machine.installationDate), "dd MMM yyyy") : "—"}</td>
                                                                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                                                <Button size="sm" variant="ghost" onClick={() => openUploadEditor(category._id, machine._id)} className="h-8 w-8 p-0 text-[#374151] hover:text-[#d45815] hover:bg-[#d45815]/10" title="Edit machine">
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </Button>
                                                                            </td>
                                                                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "machine", id: machine._id, name: machine.name || "N/A" })} className="h-8 w-8 p-0 text-[#374151] hover:text-[#bf1e21] hover:bg-[#bf1e21]/10" title="Delete machine">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                        {isMachineOpen && (
                                                                            <tr className="bg-[#ffffff]">
                                                                                <td colSpan={6} className="p-0 border-b border-[#607797]">
                                                                                    <div className="bg-[#f8fafc] px-5 py-4">
                                                                                        <div className="overflow-hidden rounded-[12px] border border-[#b8c6d8] bg-white shadow-sm">
                                                                                            <div className="flex items-center justify-between gap-4 border-b border-[#d4dde8] bg-gradient-to-r from-[#f4f7fb] to-white px-4 py-3">
                                                                                                <div className="min-w-0">
                                                                                                    <h3 className="text-[15px] font-semibold text-[#111827]">Spare parts</h3>
                                                                                                </div>
                                                                                                <Badge className="shrink-0 rounded-full border border-[#d45815]/30 bg-[#d45815]/10 px-3 py-1 text-xs font-semibold text-[#d45815]">
                                                                                                    {isLoading ? "Loading..." : `${spareParts.length} items`}
                                                                                                </Badge>
                                                                                            </div>

                                                                                            {isLoading ? (
                                                                                                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium text-[#607797]">
                                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                                    Loading spare parts...
                                                                                                </div>
                                                                                            ) : spareParts.length > 0 ? (
                                                                                                <div className="overflow-x-auto">
                                                                                                    <table className="w-full min-w-[920px] table-fixed border-collapse">
                                                                                                        <thead>
                                                                                                            <tr className="border-b border-[#d4dde8] bg-[#f9fafb]">
                                                                                                                <th className="w-14 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">#</th>
                                                                                                                <th className="w-[220px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">Spare Part</th>
                                                                                                                <th className="w-[120px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">Health</th>
                                                                                                                <th className="w-[140px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">Installed On</th>
                                                                                                                <th className="w-[150px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">Last Service On</th>
                                                                                                                <th className="w-[120px] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#607797]">Status</th>
                                                                                                                <th className="w-[148px] px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[#607797]">Actions</th>
                                                                                                            </tr>
                                                                                                        </thead>
                                                                                                        <tbody className="divide-y divide-[#edf1f5]">
                                                                                                            {spareParts.map((sparePart, spIndex) => {
                                                                                                                const replacementSnapshot = sparePart.replacementPartSnapshot || null;
                                                                                                                const replacementName = sparePart.replacementPartName || replacementSnapshot?.name || null;
                                                                                                                const replacementKl = sparePart.replacementPartKlValue || replacementSnapshot?.klValue || null;
                                                                                                                const replacementLifetime = sparePart.replacementLifetimeText || replacementSnapshot?.lifetimeText || null;
                                                                                                                const replacementMeta = [
                                                                                                                    sparePart.replacementSource ? `Source: ${sparePart.replacementSource}` : null,
                                                                                                                    replacementKl ? `KL: ${replacementKl}` : null,
                                                                                                                    sparePart.replacementPartSerialNumber ? `Ref: ${sparePart.replacementPartSerialNumber}` : null,
                                                                                                                    replacementLifetime ? `Lifetime: ${replacementLifetime}` : null,
                                                                                                                    replacementSnapshot?.itemOnSpareSketch ? `Drawing: ${replacementSnapshot.itemOnSpareSketch}` : null,
                                                                                                                ].filter(Boolean);
                                                                                                                const replacementCommercial = [
                                                                                                                    formatPartDuration(replacementSnapshot?.deliveryTime)
                                                                                                                        ? `Delivery: ${formatPartDuration(replacementSnapshot?.deliveryTime)}`
                                                                                                                        : null,
                                                                                                                    formatPartMoney(replacementSnapshot?.unitPriceNew)
                                                                                                                        ? `New: ${formatPartMoney(replacementSnapshot?.unitPriceNew)}`
                                                                                                                        : null,
                                                                                                                    formatPartMoney(replacementSnapshot?.priceRepairPerPc)
                                                                                                                        ? `Repair: ${formatPartMoney(replacementSnapshot?.priceRepairPerPc)}`
                                                                                                                        : null,
                                                                                                                ].filter(Boolean);
                                                                                                                const activeSavingKey = `${machine._id}:${sparePart._id}`;
                                                                                                                const activeSaving = activeSparePartSavingKey === activeSavingKey;
                                                                                                                const isSparePartActive = sparePart.isActive !== false;
                                                                                                                return (
                                                                                                                    <tr key={sparePart._id} className="bg-white hover:bg-[#f8fafc]">
                                                                                                                        <td className="px-4 py-3 text-sm font-semibold text-[#374151]">{spIndex + 1}</td>
                                                                                                                        <td className="px-4 py-3">
                                                                                                                            <div className="flex min-w-0 flex-col gap-0.5">
                                                                                                                                <span className="whitespace-normal break-words text-sm font-semibold leading-5 text-[#111827]">{sparePart.customName || sparePart.name}</span>
                                                                                                                                {sparePart.klValue && (
                                                                                                                                    <span className="text-xs font-medium text-[#6b7280]">KL: {sparePart.klValue}</span>
                                                                                                                                )}
                                                                                                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                                                                                                    <Badge className="w-fit rounded-full border border-[#64748b]/30 bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#334155]">
                                                                                                                                        Type: {sparePart.rotorType === "Rebuilt" ? "Rebuilt" : "New"}
                                                                                                                                    </Badge>
                                                                                                                                    <Badge className="w-fit rounded-full border border-[#64748b]/30 bg-[#f8fafc] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                                                                                                                                        Rebuilds: {sparePart.rebuildsPossible ?? 0}
                                                                                                                                    </Badge>
                                                                                                                                    {(sparePart.isSentToRebuild || (sparePart.rebuildStatus && sparePart.rebuildStatus !== "None")) && (
                                                                                                                                        <Badge className="w-fit rounded-full border border-[#fb923c]/40 bg-[#fed7aa] px-2 py-0.5 text-[10px] font-semibold text-[#c2410c]">
                                                                                                                                            Rebuild: {sparePart.rebuildStatus || "Sent"}
                                                                                                                                        </Badge>
                                                                                                                                    )}
                                                                                                                                    {(sparePart.isOrderedNew || (sparePart.orderNewStatus && sparePart.orderNewStatus !== "None")) && (
                                                                                                                                        <Badge className="w-fit rounded-full border border-[#2563eb]/30 bg-[#dbeafe] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
                                                                                                                                            Ordered New: {sparePart.orderNewStatus || "Ordered"}
                                                                                                                                        </Badge>
                                                                                                                                    )}
	                                                                                                                                    {sparePart.replacementDate && (
	                                                                                                                                        <Badge className="w-fit rounded-full border border-[#16a34a]/30 bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
	                                                                                                                                            Replaced {format(new Date(sparePart.replacementDate), "dd MMM yyyy")}
	                                                                                                                                        </Badge>
	                                                                                                                                    )}
	                                                                                                                                </div>
                                                                                                                                {sparePart.replacementDate && (replacementName || replacementMeta.length > 0) && (
                                                                                                                                    <div className="mt-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-1.5 text-[11px] leading-4 text-[#166534]">
                                                                                                                                        <div className="font-semibold text-[#14532d]">
                                                                                                                                            Replacement: {replacementName || "Manual entry"}
                                                                                                                                        </div>
                                                                                                                                        {replacementMeta.length > 0 && (
                                                                                                                                            <div className="mt-0.5 text-[#15803d]">
                                                                                                                                                {replacementMeta.join(" · ")}
                                                                                                                                            </div>
                                                                                                                                        )}
                                                                                                                                        {replacementCommercial.length > 0 && (
                                                                                                                                            <div className="mt-0.5 text-[#15803d]">
                                                                                                                                                {replacementCommercial.join(" · ")}
                                                                                                                                            </div>
                                                                                                                                        )}
                                                                                                                                        {(sparePart.replacementMediaUrls?.length || sparePart.replacementNotes) && (
                                                                                                                                            <div className="mt-0.5 text-[#4d7c0f]">
                                                                                                                                                {[
                                                                                                                                                    sparePart.replacementMediaUrls?.length
                                                                                                                                                        ? `${sparePart.replacementMediaUrls.length} media`
                                                                                                                                                        : null,
                                                                                                                                                    sparePart.replacementNotes || null,
                                                                                                                                                ].filter(Boolean).join(" · ")}
                                                                                                                                            </div>
                                                                                                                                        )}
                                                                                                                                    </div>
                                                                                                                                )}
	                                                                                                                            </div>
	                                                                                                                        </td>
                                                                                                                        <td className="px-4 py-3">
                                                                                                                            <div className="flex items-center">
                                                                                                                                <Badge className={`${getStatusColor(sparePart.status)} rounded-full border text-xs font-medium`}>
                                                                                                                                    {getStatusText(sparePart.status)}
                                                                                                                                </Badge>
                                                                                                                            </div>
                                                                                                                        </td>
                                                                                                                        <td className="px-4 py-3 text-sm font-medium text-[#374151]">
                                                                                                                            {sparePart.sparePartInstallationDate
                                                                                                                                ? format(new Date(sparePart.sparePartInstallationDate), "dd MMM yyyy")
                                                                                                                                : "—"}
                                                                                                                        </td>
                                                                                                                        <td className="px-4 py-3 text-sm font-medium text-[#374151]">
                                                                                                                            {sparePart.lastServiceDate
                                                                                                                                ? format(new Date(sparePart.lastServiceDate), "dd MMM yyyy")
                                                                                                                                : "—"}
                                                                                                                        </td>
                                                                                                                        <td className="px-4 py-3">
                                                                                                                            <button
                                                                                                                                type="button"
                                                                                                                                disabled={activeSaving}
                                                                                                                                onClick={(e) => {
                                                                                                                                    e.stopPropagation();
                                                                                                                                    void handleToggleSparePartActive(machine._id, sparePart, !isSparePartActive);
                                                                                                                                }}
                                                                                                                                className={`inline-flex min-w-[82px] items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                                                                                    isSparePartActive
                                                                                                                                        ? "border-[#00a82d]/40 bg-[#00a82d]/20 text-[#007a22] hover:bg-[#00a82d]/30"
                                                                                                                                        : "border-[#bf1e21]/40 bg-[#bf1e21]/15 text-[#9f1d20] hover:bg-[#bf1e21]/25"
                                                                                                                                }`}
                                                                                                                                title={isSparePartActive ? "Mark inactive" : "Mark active"}
                                                                                                                            >
                                                                                                                                {activeSaving ? (
                                                                                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                                                                                ) : isSparePartActive ? (
                                                                                                                                    "Active"
                                                                                                                                ) : (
                                                                                                                                    "Inactive"
                                                                                                                                )}
                                                                                                                            </button>
                                                                                                                        </td>
                                                                                                                        <td className="px-4 py-3">
                                                                                                                            <div className="flex items-center justify-end gap-1">
                                                                                                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openUploadEditor(category._id, machine._id, sparePart._id); }} className="h-8 w-8 p-0 text-[#374151] hover:bg-[#d45815]/10 hover:text-[#d45815]" title="Edit spare part">
                                                                                                                                    <Pencil className="w-4 h-4" />
                                                                                                                                </Button>
                                                                                                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openPartsModal(sparePart._id, sparePart.customName || sparePart.name); }} className="h-8 w-8 p-0 text-[#374151] hover:bg-[#d45815]/10 hover:text-[#d45815]" title="Manage parts">
                                                                                                                                    <Package className="w-4 h-4" />
                                                                                                                                </Button>
                                                                                                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "sparePart", id: sparePart._id, name: sparePart.customName || sparePart.name }); }} className="h-8 w-8 p-0 text-[#374151] hover:bg-[#bf1e21]/10 hover:text-[#bf1e21]" title="Delete spare part">
                                                                                                                                    <Trash2 className="w-4 h-4" />
                                                                                                                                </Button>
                                                                                                                            </div>
                                                                                                                        </td>
                                                                                                                    </tr>
                                                                                                                );
                                                                                                            })}
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                                                                                                    <Package className="h-8 w-8 text-[#9ca3af]" />
                                                                                                    <p className="text-sm font-semibold text-[#374151]">No spare parts found</p>
                                                                                                    <p className="text-xs text-[#6b7280]">Add spare parts from Edit Machine Data.</p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </Fragment>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <p className="text-[#374151] text-sm font-medium">No machines found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Last Update */}
                    <div className="bg-[#ffffff] border-t border-[#607797] flex items-center justify-end px-6 py-2">
                        <p className="text-[#374151] text-sm font-semibold leading-6">
                            Last Update On - {lastUpdate}
                        </p>
                    </div>
                </div>
                </>
                )}

                {activeTab === "upload" && (
                    <div className="flex flex-col gap-4">
                        {/* Page header */}
                        <div>
                            <h2 className="text-[#2D3E5C] text-xl font-bold">Edit Machine Data</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add and manage categories, machines, spare parts &amp; parts for this client.
                            </p>
                        </div>

                        {/* Add Category card */}
                        <div className="rounded-[10px] bg-white border border-[#96A5BA] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => { setUploadFocusTarget(null); setEditingCategoryId(null); setAddCategoryOpen((v) => !v); }}
                                className="w-full flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] px-6 py-4 hover:from-[#cbd6e1] transition-colors"
                            >
                                <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                                    <FaPlus className="w-4 h-4 text-orange" /> Add Category
                                </span>
                                <span className="transition-transform duration-200" style={{ transform: addCategoryOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                                    <HiOutlineChevronRight className="w-5 h-5 text-gray-900" />
                                </span>
                            </button>
                            {addCategoryOpen && (
                                <div className="p-6">
                                    <AddCategoryMachineFlow
                                        compact
                                        clientID={currentClientId}
                                        onMachinesCreated={handleMachinesCreated}
                                        onCategoryCreated={(c) =>
                                            setCreatedCategories((prev) =>
                                                prev.some((x) => x._id === c._id)
                                                    ? prev
                                                    : [{ _id: c._id, name: c.name, slug: "", machines: [] }, ...prev]
                                            )
                                        }
                                        onSuccess={() => router.refresh()}
                                        onComplete={() => setAddCategoryOpen(false)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* One card per category – expand to edit the full hierarchy inline */}
                        {orderedCategories.length > 0 ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={orderedCategories.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                                    {orderedCategories.map((category) => (
                                        <SortableCategoryCard
                                            key={category._id}
                                            category={category}
                                            isOpen={editingCategoryId === category._id}
                                            onToggle={() => { setUploadFocusTarget(null); setEditingCategoryId((prev) => (prev === category._id ? null : category._id)); }}
                                            onDeleteClick={() => setDeleteConfirm({ type: "category", id: category._id, name: category.name })}
                                            clientId={currentClientId}
                                            onSuccess={() => router.refresh()}
                                            focusTarget={uploadFocusTarget?.categoryId === category._id ? uploadFocusTarget : null}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="rounded-[10px] bg-white border border-[#96A5BA] px-6 py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No categories yet. Use &ldquo;Add Category&rdquo; above to create one.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <QuoteCsvUploadModal
                open={quoteCsvModalOpen}
                onOpenChange={setQuoteCsvModalOpen}
                initialData={quoteCsvData}
                clientId={currentClientId}
                onSaved={setQuoteCsvData}
            />

            {/* Add Machine modal (triggered from Overview tab empty-state) */}
            {addMachineForCategoryId && (
                <AddMachineFormModal
                    open
                    onClose={() => setAddMachineForCategoryId(null)}
                    categoryId={addMachineForCategoryId}
                    clientId={currentClientId}
                    onCreated={() => { setAddMachineForCategoryId(null); router.refresh(); }}
                />
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <DeleteConfirmModal
                    open={!!deleteConfirm}
                    onOpenChange={(open) => !open && setDeleteConfirm(null)}
                    title={
                        deleteConfirm.type === "category"
                            ? "Delete category?"
                            : deleteConfirm.type === "machine"
                                ? "Delete machine?"
                                : deleteConfirm.type === "sparePart"
                                    ? "Delete spare part?"
                                    : "Delete part?"
                    }
                    message={
                        deleteConfirm.type === "category"
                            ? `Are you sure you want to delete the category "${deleteConfirm.name}"? This will delete all machines, spare parts and parts under it.`
                            : deleteConfirm.type === "machine"
                                ? `Are you sure you want to delete the machine "${deleteConfirm.name}"? This will delete all spare parts and parts under it.`
                                : deleteConfirm.type === "sparePart"
                                    ? `Are you sure you want to delete the spare part "${deleteConfirm.name}"? This will delete all parts under it.`
                                    : `Are you sure you want to delete the part "${deleteConfirm.name}"?`
                    }
                    onConfirm={handleDeleteConfirm}
                    isLoading={deleteLoading}
                />
            )}

            {/* Parts list modal (for a spare part) */}
            {showFacilityMapper && clientDetails.facilityImageUrl && (
                <FacilityImageMapper
                    facilityImageUrl={clientDetails.facilityImageUrl}
                    categories={categories.map((c) => ({ id: c._id, name: c.name }))}
                    initialPositions={facilityLayout}
                    onSave={handleSaveFacilityLayout}
                    onClose={() => setShowFacilityMapper(false)}
                />
            )}

            {partsModalSparePart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPartsModalSparePart(null)} role="dialog" aria-modal="true" aria-labelledby="parts-modal-title">
                    <div className="bg-white border border-[#96A5BA] rounded-[14px] shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-[#607797] px-6 py-4 flex items-center justify-between">
                            <h3 id="parts-modal-title" className="text-gray-900 text-lg font-semibold">Parts under &quot;{partsModalSparePart.sparePartName}&quot;</h3>
                            <Button size="sm" variant="ghost" onClick={() => setPartsModalSparePart(null)} className="text-[#374151] font-medium hover:text-gray-900">Close</Button>
                        </div>
                        <div className="p-4 overflow-auto flex-1">
                            {loadingParts ? (
                                <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#374151]" /></div>
                            ) : partsList.length === 0 ? (
                                <p className="text-[#374151] text-sm font-medium py-4">No parts</p>
                            ) : (
                                <ul className="space-y-2">
                                    {partsList.map((part) => (
                                        <li key={part._id} className="flex items-center justify-between gap-2 py-2 border-b border-[#607797] last:border-0">
                                            <span className="text-gray-900 text-sm font-medium truncate">{part.name}</span>
                                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "part", id: part._id, name: part.name })} className="h-8 w-8 p-0 text-[#374151] hover:text-[#bf1e21] hover:bg-[#bf1e21]/10 shrink-0" title="Delete part">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
