'use client';

import { useState, useEffect, useCallback, useRef } from "react";
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

    const [clientMachineIds, setClientMachineIds] = useState<Set<string>>(new Set());

    const [uploadPrefill, setUploadPrefill] = useState<SearchResult | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoadingCategories(true);

        Promise.all([
            fetch("/api/products/categories/with-machines").then((r) => {
                if (!r.ok) throw new Error("Failed to fetch categories");
                return r.json() as Promise<ApiCategory[]>;
            }),
            fetch(`/api/clients/${clientID}`).then((r) => {
                if (!r.ok) throw new Error("Failed to fetch client");
                return r.json();
            }),
        ])
            .then(([allCategories, client]) => {
                if (cancelled) return;

                const catIds = new Set<string>();
                const machIds = new Set<string>();
                const clientMachines = (client?.machines ?? []) as Array<{
                    machine?: { _id?: string; category?: { _id?: string } | string | null };
                }>;
                for (const cm of clientMachines) {
                    const mid = cm.machine?._id;
                    if (mid) machIds.add(String(mid));
                    const cat = cm.machine?.category;
                    const cid = typeof cat === "string" ? cat : cat?._id;
                    if (cid) catIds.add(String(cid));
                }

                setClientMachineIds(machIds);

                const filtered = allCategories.filter((c) => catIds.has(c._id));
                setCategories(filtered);
                if (filtered.length > 0) setSelectedCategoryId(filtered[0]._id);
                else setSelectedCategoryId("");
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load categories");
            })
            .finally(() => {
                if (!cancelled) setLoadingCategories(false);
            });
        return () => { cancelled = true; };
    }, [clientID]);

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

    const selectedCategory = categories.find((c) => c._id === selectedCategoryId);
    const machinesInCategory = (selectedCategory?.machines ?? []).filter((m) =>
        clientMachineIds.has(m._id)
    );

    // Map machineId -> first manual for that machine (machine-level manuals only, no sparePart)
    const manualByMachineId = new Map<string, ApiManual>();
    for (const m of manuals) {
        if (!m.machine?._id) continue;
        if (m.sparePart) continue;
        if (!manualByMachineId.has(m.machine._id)) {
            manualByMachineId.set(m.machine._id, m);
        }
    }

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

    const openUploadFor = (machine: ApiMachine) => {
        setUploadPrefill({
            type: "machine",
            _id: machine._id,
            machineId: machine._id,
            label: machine.name,
            modelNumber: machine.modelNumber ?? undefined,
            categoryName: selectedCategory?.name,
        });
        setShowUploadModal(true);
    };

    const machineCount = machinesInCategory.length;

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div>
                <h1 className="text-[28px] leading-[42px] font-lato font-bold text-[#2D3E5C]">
                    Maintenance Manual
                </h1>
                <p className="text-[16px] leading-[24px] font-lato font-normal text-[#6b7280] mt-1">
                    Access and download maintenance manuals for all equipment
                </p>
            </div>

            {/* ── Category Selector ── */}
            <div className="flex flex-col gap-2">
                <label className="text-[14px] leading-[21px] font-lato font-normal text-[#6b7280]">
                    Select Category
                </label>
                {loadingCategories ? (
                    <div className="flex items-center gap-2 text-[#6b7280]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading categories...
                    </div>
                ) : (
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-full max-w-[280px] h-10 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
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

            {/* ── Count ── */}
            <p className="text-[15px] leading-[22px] font-lato font-normal text-[#6b7280]">
                Showing{" "}
                <span className="text-orange font-medium">
                    {machineCount} Machine{machineCount !== 1 ? "s" : ""}
                </span>{" "}
                in {selectedCategory?.name ?? "—"}
            </p>

            {/* ── Machine Rows ── */}
            {loadingManuals && manuals.length === 0 ? (
                <div className="flex items-center gap-2 text-[#6b7280] py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                </div>
            ) : machineCount === 0 ? (
                <p className="text-[#4b5563] text-sm py-8">No machines in this category.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {machinesInCategory.map((machine, idx) => {
                        const manual = manualByMachineId.get(machine._id);
                        const hasManual = !!manual;

                        return (
                            <div
                                key={machine._id}
                                className="flex items-center justify-between gap-4 rounded-[12px] border border-[#C5D1DC] bg-white px-5 py-4 transition-colors hover:border-orange/40"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[16px] leading-[24px] font-lato font-semibold text-[#2D3E5C] shrink-0">
                                        {idx + 1}.
                                    </span>
                                    <span className="text-[16px] leading-[24px] font-lato font-semibold text-[#2D3E5C] truncate">
                                        {machine.name}
                                    </span>
                                    {machine.modelNumber && (
                                        <span className="text-[15px] leading-[22px] font-lato font-normal text-[#6b7280] shrink-0">
                                            ( {machine.modelNumber} )
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {hasManual ? (
                                        <>
                                            <a
                                                href={manual!.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#C5D1DC] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#2D3E5C] text-[14px] leading-[21px] font-lato font-medium transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                                Get Manual
                                            </a>
                                            <button
                                                onClick={() => handleDeleteManual(manual!._id)}
                                                className="p-2 rounded-[8px] text-[#6b7280] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete manual"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => openUploadFor(machine)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-dashed border-[#C5D1DC] bg-white hover:bg-[#F1F5F9] text-[#6b7280] hover:text-orange text-[14px] leading-[21px] font-lato font-medium transition-colors"
                                            title="No manual yet — upload"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Manual
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Upload Modal ── */}
            <UploadManualModal
                open={showUploadModal}
                prefill={uploadPrefill}
                onClose={() => {
                    setShowUploadModal(false);
                    setUploadPrefill(null);
                }}
                onSuccess={() => {
                    setShowUploadModal(false);
                    setUploadPrefill(null);
                    fetchManuals();
                }}
            />
        </div>
    );
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadManualModal({
    open,
    prefill,
    onClose,
    onSuccess,
}: {
    open: boolean;
    prefill: SearchResult | null;
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
        if (!open) {
            resetState();
        } else if (prefill) {
            setSelectedItem(prefill);
        }
    }, [open, prefill, resetState]);

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
            <DialogContent className="bg-white border-[#d1d5db] text-gray-900 sm:max-w-lg lg:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 text-lg">Upload Maintenance Manual</DialogTitle>
                    <DialogDescription className="text-[#6b7280]">
                        Search by machine model number or spare part KL value, then upload a PDF or DOC file.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 pt-2">
                    {selectedItem ? (
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#6b7280] text-sm">Selected</Label>
                            <div className="flex items-center gap-3 bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] p-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 text-sm font-medium truncate">{selectedItem.label}</p>
                                    <p className="text-[#6b7280] text-xs truncate">
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
                                    className="p-1.5 rounded-lg text-[#6b7280] hover:text-gray-900 hover:bg-[#d1d5db] shrink-0"
                                    title="Change selection"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#6b7280] text-sm">
                                Search by Model Number or KL Value
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Type model number or KL value..."
                                    className="bg-[#e5e7eb] border-[#d1d5db] h-11 rounded-[10px] pl-10 pr-4 text-gray-900 placeholder:text-[#4b5563]"
                                    autoFocus
                                />
                                {searching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#4b5563]" />
                                )}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] max-h-[240px] overflow-y-auto divide-y divide-[#d1d5db]">
                                    {searchResults.map((item) => (
                                        <button
                                            key={`${item.type}-${item._id}`}
                                            onClick={() => handleSelect(item)}
                                            className="w-full text-left px-4 py-3 hover:bg-[#d1d5db] transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-[#d1d5db] flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-[#6b7280]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 text-sm font-medium truncate">{item.label}</p>
                                                <p className="text-[#6b7280] text-xs truncate">
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
                                <p className="text-[#4b5563] text-sm px-1">No results found.</p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label className="text-[#6b7280] text-sm">Manual File (PDF, DOC, DOCX)</Label>
                        {file ? (
                            <div className="flex items-center gap-3 bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] p-3">
                                <FileText className="w-5 h-5 text-orange shrink-0" />
                                <span className="text-gray-900 text-sm truncate flex-1">{file.name}</span>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="p-1 rounded text-[#6b7280] hover:text-gray-900 hover:bg-[#d1d5db] shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-[#d1d5db] rounded-[10px] flex flex-col items-center justify-center py-8 px-4 bg-[#ffffff] cursor-pointer hover:border-[#505050] transition-colors">
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
                                <Upload className="w-8 h-8 text-[#4b5563] mb-2" />
                                <span className="text-[#6b7280] text-sm">Click to select file (PDF, DOC, max 20MB)</span>
                            </label>
                        )}
                    </div>

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
