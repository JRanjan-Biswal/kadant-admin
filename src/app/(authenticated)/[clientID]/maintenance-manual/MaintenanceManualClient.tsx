'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Download, Upload, Loader2, Search, X, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiCategory {
    _id: string;
    name: string;
    slug: string;
    machines?: ApiMachine[];
}

interface ApiMachine {
    _id: string;
    name: string;
    modelNumber?: string | null;
    imageUrl?: string | null;
    description?: string | null;
}

interface ApiManual {
    _id: string;
    machine: {
        _id: string;
        name: string;
        modelNumber?: string | null;
        imageUrl?: string | null;
        category?: string;
    } | null;
    sparePart?: { _id: string; name: string; klValue?: string } | null;
    fileName: string;
    originalName: string;
    fileUrl: string;
    createdAt: string;
}

interface SearchResult {
    type: "machine" | "sparePart";
    _id: string;
    machineId: string;
    label: string;
    modelNumber?: string;
    klValue?: string;
    categoryName?: string;
    machineName?: string;
    imageUrl?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MaintenanceManualClientProps {
    clientID: string;
}

export default function MaintenanceManualClient({ clientID }: MaintenanceManualClientProps) {
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [manuals, setManuals] = useState<ApiManual[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingManuals, setLoadingManuals] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);

    void clientID;

    // ── Fetch categories ──
    useEffect(() => {
        let cancelled = false;
        setLoadingCategories(true);
        fetch("/api/products/categories/with-machines")
            .then((r) => {
                if (!r.ok) throw new Error("Failed to fetch categories");
                return r.json();
            })
            .then((data: ApiCategory[]) => {
                if (cancelled) return;
                setCategories(data);
                if (data.length > 0) setSelectedCategoryId(data[0]._id);
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load categories");
            })
            .finally(() => {
                if (!cancelled) setLoadingCategories(false);
            });
        return () => { cancelled = true; };
    }, []);

    // ── Fetch manuals ──
    const fetchManuals = useCallback(() => {
        setLoadingManuals(true);
        fetch("/api/machines/maintenance-manuals")
            .then((r) => {
                if (!r.ok) throw new Error("Failed");
                return r.json();
            })
            .then((data: ApiManual[]) => setManuals(data))
            .catch(() => toast.error("Failed to load manuals"))
            .finally(() => setLoadingManuals(false));
    }, []);

    useEffect(() => {
        fetchManuals();
    }, [fetchManuals]);

    // ── Derived data ──
    const selectedCategory = categories.find((c) => c._id === selectedCategoryId);
    const machinesInCategory = selectedCategory?.machines ?? [];

    const categoryMachineIds = new Set(machinesInCategory.map((m) => m._id));
    const machineMap = Object.fromEntries(machinesInCategory.map((m) => [m._id, m]));
    const manualsInCategory = manuals.filter((m) => m.machine?._id && categoryMachineIds.has(m.machine._id));

    const handleDeleteManual = async (manualId: string) => {
        if (!confirm("Delete this manual?")) return;
        try {
            const res = await fetch(`/api/machines/maintenance-manual/${manualId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Manual deleted");
            fetchManuals();
        } catch {
            toast.error("Failed to delete manual");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-[28px] leading-[42px] font-lato font-normal text-[#F3F4F6]">
                        Maintenance Manual
                    </h1>
                    <p className="text-[16px] leading-[24px] font-lato font-normal text-[#A1A1A1] mt-1">
                        Access and download maintenance manuals for all equipment
                    </p>
                </div>
                <Button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-orange hover:bg-orange-light text-white rounded-[10px] flex items-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    Upload Manual
                </Button>
            </div>

            {/* ── Category Selector ── */}
            <div className="flex flex-col gap-2">
                <label className="text-[16px] leading-[24px] font-lato font-normal text-[#99A1AF]">
                    Select Category
                </label>
                {loadingCategories ? (
                    <div className="flex items-center gap-2 text-[#A1A1A1]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading categories...
                    </div>
                ) : (
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-full max-w-[300px] h-11 bg-[#171717] border-[#262626]">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat._id} value={cat._id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* ── Manual Count ── */}
            <p className="text-[16px] leading-[24px] font-lato font-normal text-[#A1A1A1]">
                Showing{" "}
                <span className="text-orange font-normal">
                    {manualsInCategory.length} Manual{manualsInCategory.length !== 1 ? "s" : ""}
                </span>{" "}
                in {selectedCategory?.name ?? "—"}
            </p>

            {/* ── Manual Cards Grid ── */}
            {loadingManuals && manuals.length === 0 ? (
                <div className="flex items-center gap-2 text-[#A1A1A1] py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading manuals...
                </div>
            ) : manualsInCategory.length === 0 ? (
                <p className="text-[#525252] text-sm py-8">No manuals found in this category.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {manualsInCategory.map((manual) => {
                        const machine = machineMap[manual.machine!._id];
                        const machineImage = machine?.imageUrl ?? manual.machine?.imageUrl ?? null;
                        const machineName = machine?.name ?? manual.machine?.name ?? "Unknown";
                        const modelNumber = machine?.modelNumber ?? manual.machine?.modelNumber ?? null;

                        return (
                            <div
                                key={manual._id}
                                className="group rounded-xl border border-[#262626] bg-[#171717] overflow-hidden transition-all duration-200 hover:border-orange/50 hover:shadow-lg hover:shadow-orange/5"
                            >
                                {/* Machine Image */}
                                <div className="relative w-full aspect-[4/3] bg-[#262626] overflow-hidden">
                                    {machineImage ? (
                                        <Image
                                            src={machineImage}
                                            alt={`${machineName}${modelNumber ? ` - ${modelNumber}` : ""}`}
                                            fill
                                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-[#525252] text-sm">
                                            No image
                                        </div>
                                    )}
                                </div>

                                {/* Card Info */}
                                <div className="p-4 flex flex-col gap-3">
                                    <div>
                                        <h3 className="text-[18px] leading-[28px] font-normal text-[#FFFFFF]">
                                            {machineName}
                                        </h3>
                                        {modelNumber && (
                                            <p className="text-[14px] leading-[21px] font-normal text-[#A1A1A1]">
                                                Model: {modelNumber}
                                            </p>
                                        )}
                                        {manual.sparePart?.name && (
                                            <p className="text-[13px] leading-[20px] font-normal text-[#737373]">
                                                Spare Part: {manual.sparePart.name}
                                                {manual.sparePart.klValue && ` (${manual.sparePart.klValue})`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Download + Delete */}
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={manual.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-orange hover:bg-orange-light text-white text-sm font-medium transition-colors duration-200 cursor-pointer flex-1 min-w-0"
                                        >
                                            <Download className="w-4 h-4 shrink-0" />
                                            <span className="truncate">Download Manual</span>
                                        </a>
                                        <button
                                            onClick={() => handleDeleteManual(manual._id)}
                                            className="p-2.5 rounded-[10px] text-[#737373] hover:text-red-400 hover:bg-red-400/10 shrink-0 transition-colors"
                                            title="Delete manual"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-[12px] text-[#525252] truncate" title={manual.originalName}>
                                        {manual.originalName}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Upload Modal ── */}
            <UploadManualModal
                open={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    setShowUploadModal(false);
                    fetchManuals();
                }}
            />
        </div>
    );
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadManualModal({
    open,
    onClose,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedItem(null);
        setFile(null);
        setUploading(false);
        setSearching(false);
    }, []);

    useEffect(() => {
        if (!open) resetState();
    }, [open, resetState]);

    // ── Debounced search ──
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = searchQuery.trim();
        if (!q || q.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        debounceRef.current = setTimeout(() => {
            fetch(`/api/machines/maintenance-manuals/search?q=${encodeURIComponent(q)}`)
                .then((r) => r.json())
                .then((data: SearchResult[]) => {
                    setSearchResults(Array.isArray(data) ? data : []);
                })
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false));
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    const handleSelect = (item: SearchResult) => {
        setSelectedItem(item);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleUpload = async () => {
        if (!selectedItem || !file) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("manual", file);
            fd.append("machineId", selectedItem.machineId);
            if (selectedItem.type === "sparePart") {
                fd.append("sparePartId", selectedItem._id);
            }

            const res = await fetch("/api/machines/maintenance-manual", {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Upload failed");
            }

            toast.success("Manual uploaded successfully");
            onSuccess();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-[#171717] border-[#262626] text-white sm:max-w-lg lg:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">Upload Maintenance Manual</DialogTitle>
                    <DialogDescription className="text-[#A1A1A1]">
                        Search by machine model number or spare part KL value, then upload a PDF or DOC file.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 pt-2">
                    {/* ── Search or selected ── */}
                    {selectedItem ? (
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#A1A1A1] text-sm">Selected</Label>
                            <div className="flex items-center gap-3 bg-[#262626] border border-[#404040] rounded-[10px] p-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{selectedItem.label}</p>
                                    <p className="text-[#A1A1A1] text-xs truncate">
                                        {selectedItem.type === "machine"
                                            ? `Model: ${selectedItem.modelNumber || "—"}`
                                            : `KL Value: ${selectedItem.klValue || "—"}`}
                                        {selectedItem.type === "sparePart" && selectedItem.machineName && (
                                            <span> · Machine: {selectedItem.machineName}</span>
                                        )}
                                        {selectedItem.type === "machine" && selectedItem.categoryName && (
                                            <span> · {selectedItem.categoryName}</span>
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1.5 rounded-lg text-[#737373] hover:text-white hover:bg-[#404040] shrink-0"
                                    title="Change selection"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#A1A1A1] text-sm">
                                Search by Model Number or KL Value
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Type model number or KL value..."
                                    className="bg-[#262626] border-[#404040] h-11 rounded-[10px] pl-10 pr-4 text-white placeholder:text-[#525252]"
                                    autoFocus
                                />
                                {searching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#525252]" />
                                )}
                            </div>

                            {/* ── Search Results ── */}
                            {searchResults.length > 0 && (
                                <div className="bg-[#262626] border border-[#404040] rounded-[10px] max-h-[240px] overflow-y-auto divide-y divide-[#404040]">
                                    {searchResults.map((item) => (
                                        <button
                                            key={`${item.type}-${item._id}`}
                                            onClick={() => handleSelect(item)}
                                            className="w-full text-left px-4 py-3 hover:bg-[#363636] transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-[#404040] flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-[#A1A1A1]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{item.label}</p>
                                                <p className="text-[#737373] text-xs truncate">
                                                    {item.type === "machine"
                                                        ? `Machine · Model: ${item.modelNumber || "—"}`
                                                        : `Spare Part · KL: ${item.klValue || "—"}`}
                                                    {item.type === "machine" && item.categoryName && ` · ${item.categoryName}`}
                                                    {item.type === "sparePart" && item.machineName && ` · ${item.machineName}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                                <p className="text-[#525252] text-sm px-1">No results found.</p>
                            )}
                        </div>
                    )}

                    {/* ── File Upload ── */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-[#A1A1A1] text-sm">Manual File (PDF, DOC, DOCX)</Label>
                        {file ? (
                            <div className="flex items-center gap-3 bg-[#262626] border border-[#404040] rounded-[10px] p-3">
                                <FileText className="w-5 h-5 text-orange shrink-0" />
                                <span className="text-white text-sm truncate flex-1">{file.name}</span>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="p-1 rounded text-[#737373] hover:text-white hover:bg-[#404040] shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-[#404040] rounded-[10px] flex flex-col items-center justify-center py-8 px-4 bg-[#1f1f1f] cursor-pointer hover:border-[#505050] transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) setFile(f);
                                    }}
                                />
                                <Upload className="w-8 h-8 text-[#525252] mb-2" />
                                <span className="text-[#A1A1A1] text-sm">Click to select file (PDF, DOC, max 20MB)</span>
                            </label>
                        )}
                    </div>

                    {/* ── Upload Button ── */}
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedItem || !file || uploading}
                        className="bg-orange hover:bg-orange-light text-white rounded-[10px] h-11 w-full"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Manual
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
