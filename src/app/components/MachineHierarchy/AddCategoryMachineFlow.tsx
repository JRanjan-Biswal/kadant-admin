"use client";

import { useState, useCallback, useEffect, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Plus, Loader2, X, Pencil, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import MachineImageMapper, { type MachinePosition } from "./MachineImageMapper";

/** Stable component: file preview or upload placeholder with optional remove (X) overlay. */
const PartImageUpload = memo(function PartImageUpload({
    file,
    onFileChange,
    existingUrl,
    onClearExisting,
}: {
    file: File | null;
    onFileChange: (f: File | null) => void;
    existingUrl?: string | null;
    onClearExisting?: () => void;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    const showPreview = !!previewUrl || (!!existingUrl && !file);
    const previewSrc = previewUrl || existingUrl || null;
    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (file) onFileChange(null);
        else if (existingUrl && onClearExisting) onClearExisting();
    };
    return (
        <label className="border border-dashed border-[#d1d5db] rounded-[8px] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#505050] min-w-[80px] min-h-[80px] w-[80px] h-[80px] shrink-0 relative group">
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            {showPreview && previewSrc ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                        title="Remove image"
                    >
                        <X className="w-4 h-4 text-gray-900" />
                    </button>
                </>
            ) : (
                <Upload className="w-5 h-5 text-[#4b5563]" />
            )}
        </label>
    );
});

/** Image upload with optional existing URL, compact mode, and remove (X) overlay. */
const ImageUploadBox = memo(function ImageUploadBox({
    file,
    onFileChange,
    label,
    compact,
    existingUrl,
    onClearExisting,
}: {
    file: File | null;
    onFileChange: (f: File | null) => void;
    label: string;
    compact?: boolean;
    existingUrl?: string | null;
    onClearExisting?: () => void;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const showPreview = !!previewUrl || (!!existingUrl && !file);
    const previewSrc = previewUrl || existingUrl || null;
    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (file) onFileChange(null);
        else if (existingUrl && onClearExisting) onClearExisting();
    };

    if (compact) {
        return (
            <div className="flex flex-col gap-1.5">
                <Label className="text-[#6b7280] text-[12px]">{label}</Label>
                <label className="border border-dashed border-[#d1d5db] rounded-[8px] flex items-center justify-center overflow-hidden bg-white cursor-pointer hover:border-[#505050] min-h-[120px] relative group">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    {showPreview && previewSrc ? (
                        <div className="relative w-full h-full min-h-[120px] flex flex-col items-center justify-center p-2">
                            <span className="text-[#6b7280] text-[10px] uppercase tracking-wide mb-1">Preview</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewSrc} alt="Preview" className="max-w-full max-h-[140px] object-contain rounded flex-1" />
                            {file && (
                                <span className="text-gray-900 text-[10px] truncate max-w-full mt-1 bg-black/60 px-1.5 py-0.5 rounded">{file.name}</span>
                            )}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                title="Remove image"
                            >
                                <X className="w-5 h-5 text-gray-900" />
                            </button>
                        </div>
                    ) : (
                        <span className="text-[#6b7280] text-[12px] flex items-center gap-2 py-4">
                            <Upload className="w-4 h-4" /> Upload
                        </span>
                    )}
                </label>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[#6b7280] text-[14px]">{label}</Label>
            <label className="border-2 border-dashed border-[#d1d5db] rounded-[10px] flex flex-col items-center justify-center min-h-[140px] py-4 px-4 bg-white cursor-pointer hover:border-[#96A5BA] transition-colors overflow-hidden relative group">
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
                {showPreview && previewSrc ? (
                    <>
                        <span className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">Image preview</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewSrc} alt="Preview" className="max-w-full max-h-[220px] object-contain rounded mb-1" />
                        {file ? (
                            <span className="text-gray-900 text-sm truncate max-w-full">{file.name}</span>
                        ) : null}
                        <span className="text-[#6b7280] text-xs mt-0.5">Click to replace</span>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-[#6b7280] mb-1" />
                        <span className="text-gray-900 text-[14px]">Upload image (PNG, JPG, WebP, max 5MB)</span>
                    </>
                )}
            </label>
        </div>
    );
});

/** Video upload with optional existing URL, compact layout, and remove/replace overlay. */
const VideoUploadBox = memo(function VideoUploadBox({
    file,
    onFileChange,
    label,
    existingUrl,
    onDelete,
    isDeleting,
}: {
    file: File | null;
    onFileChange: (f: File | null) => void;
    label: string;
    existingUrl?: string | null;
    onDelete?: () => void;
    isDeleting?: boolean;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const showPreview = !!previewUrl || (!!existingUrl && !file);
    const previewSrc = previewUrl || existingUrl || null;
    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (file) {
            onFileChange(null);
        } else if (existingUrl && onDelete) {
            onDelete();
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-[#6b7280] text-[12px]">{label}</Label>
            {showPreview && previewSrc ? (
                <div className="border border-[#d1d5db] rounded-[8px] overflow-hidden bg-white relative group">
                    <video
                        src={previewSrc}
                        controls
                        className="w-full max-h-[160px] object-contain"
                        preload="metadata"
                    />
                    {file && (
                        <span className="text-gray-900 text-[10px] truncate max-w-full block px-2 py-1 bg-black/60">
                            {file.name}
                        </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                inputRef.current?.click();
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-gray-900"
                            title="Replace video"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isDeleting}
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-[#bf1e21] text-white disabled:opacity-50"
                            title="Remove video"
                        >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        </button>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                </div>
            ) : (
                <label className="border border-dashed border-[#d1d5db] rounded-[8px] flex items-center justify-center overflow-hidden bg-white cursor-pointer hover:border-[#505050] min-h-[80px]">
                    <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    <span className="text-[#6b7280] text-[12px] flex items-center gap-2 py-4">
                        <Video className="w-4 h-4" /> Upload Video (MP4, WebM, max 50MB)
                    </span>
                </label>
            )}
        </div>
    );
});

export interface AddCategoryMachineFlowProps {
    onSuccess?: () => void;
    onComplete?: () => void;
    /** When true, show as compact section (e.g. inside Add Customer form); when false, show as full modal content */
    compact?: boolean;
    /** Pre-loaded full category hierarchy. When set, form is in edit mode. */
    initialData?: CategoryFullPayload | null;
    /** When set, fetch full category and pre-populate form for editing. Ignored if initialData is set. */
    categoryIdForEdit?: string | null;
    /** Called whenever the "can close" status changes. Parent should use this to guard close actions. */
    onCloseGuardChange?: (blocked: boolean) => void;
    /** Called after machines are persisted so a parent (e.g. onboarding form) can link them to a client. */
    onMachinesCreated?: (machineIds: string[]) => void;
}

interface MachineGalleryImage {
    id: string;
    file: File | null;
    imageUrl?: string | null;
}

interface MachineRow {
    id: string;
    name: string;
    modelNumber: string;
    installationDate: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
    description: string;
    galleryImages: MachineGalleryImage[];
    spareParts: SparePartRow[];
}

interface SparePartRow {
    id: string;
    name: string;
    klValue: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
    imageUrls: string[];
    pendingImageFiles: File[];
    optimalStateVideoFile: File | null;
    optimalStateVideoUrl?: string | null;
    parts: PartRow[];
}

interface PartRow {
    id: string;
    name: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
    optimalStateVideoFile: File | null;
    optimalStateVideoUrl?: string | null;
}

/** Full category hierarchy from API (GET machine-category/:id/full). */
export interface CategoryFullPayload {
    _id: string;
    name: string;
    imageUrl?: string | null;
    machinePositions?: Array<{ machine: string; left: number; top: number; width: number }>;
    machines?: Array<{
        _id: string;
        name: string;
        modelNumber?: string | null;
        installationDate?: string | null;
        imageUrl?: string | null;
        description?: string | null;
        galleryWithUrls?: Array<{ imageName?: string; version?: number; imageUrl?: string }>;
        spareParts?: Array<{
            _id: string;
            name: string;
            klValue?: string;
            lifeTime?: { value?: number; unit?: string };
            imageUrl?: string | null;
            optimalStateVideoUrl?: string | null;
            parts?: Array<{ _id: string; name: string; imageUrl?: string | null; optimalStateVideoUrl?: string | null }>;
        }>;
    }>;
}

function mapCategoryFullToState(payload: CategoryFullPayload): {
    categoryName: string;
    categoryImageUrl: string | null;
    categoryId: string;
    machines: MachineRow[];
    machinePositions: MachinePosition[];
} {
    const machinesList = payload.machines ?? [];
    const machines: MachineRow[] = machinesList.map((m) => ({
        id: m._id,
        name: m.name ?? "",
        modelNumber: m.modelNumber ?? "",
        installationDate: m.installationDate ? new Date(m.installationDate).toISOString().slice(0, 10) : "",
        imageFile: null,
        createdId: m._id,
        imageUrl: m.imageUrl ?? null,
        description: (m as { description?: string }).description ?? "",
        galleryImages: ((m as { galleryWithUrls?: Array<{ imageUrl?: string }> }).galleryWithUrls ?? []).map((g, i) => ({
            id: `gi_${m._id}_${i}`,
            file: null,
            imageUrl: g.imageUrl ?? null,
        })),
        spareParts: (m.spareParts ?? []).map((sp) => ({
            id: sp._id,
            name: sp.name ?? "",
            klValue: sp.klValue ?? "",
            imageFile: null,
            createdId: sp._id,
            imageUrl: sp.imageUrl ?? null,
            imageUrls: (sp as { imageUrls?: string[] }).imageUrls ?? [],
            pendingImageFiles: [],
            optimalStateVideoFile: null,
            optimalStateVideoUrl: sp.optimalStateVideoUrl ?? null,
            parts: (sp.parts ?? []).map((p) => ({
                id: p._id,
                name: p.name ?? "",
                imageFile: null,
                createdId: p._id,
                imageUrl: p.imageUrl ?? null,
                optimalStateVideoFile: null,
                optimalStateVideoUrl: p.optimalStateVideoUrl ?? null,
            })),
        })),
    }));
    const machinePositions: MachinePosition[] = (payload.machinePositions ?? []).map((mp) => ({
        machine: typeof mp.machine === "object" ? (mp.machine as { _id?: string })._id ?? String(mp.machine) : String(mp.machine),
        left: mp.left,
        top: mp.top,
        width: mp.width,
    }));

    return {
        categoryName: payload.name ?? "",
        categoryImageUrl: payload.imageUrl ?? null,
        categoryId: payload._id,
        machines: machines.length ? machines : [
            {
                id: "m1",
                name: "",
                modelNumber: "",
                installationDate: "",
                imageFile: null,
                description: "",
                galleryImages: [],
                spareParts: [
                    { id: "sp1", name: "", klValue: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: "p1", name: "", imageFile: null, optimalStateVideoFile: null }] },
                ],
            },
        ],
        machinePositions,
    };
}

const defaultMachineRow = (): MachineRow => ({
    id: `m_${Date.now()}`,
    name: "",
    modelNumber: "",
    installationDate: "",
    imageFile: null,
    description: "",
    galleryImages: [],
    spareParts: [
        { id: `sp_${Date.now()}`, name: "", klValue: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null, optimalStateVideoFile: null }] },
    ],
});

export default function AddCategoryMachineFlow({
    onSuccess,
    onComplete,
    compact = false,
    initialData,
    categoryIdForEdit,
    onCloseGuardChange,
    onMachinesCreated,
}: AddCategoryMachineFlowProps) {
    const [categoryName, setCategoryName] = useState("");
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState(false);
    const [categoryEditName, setCategoryEditName] = useState("");
    const [categoryEditImage, setCategoryEditImage] = useState<File | null>(null);
    const [machines, setMachines] = useState<MachineRow[]>([
        {
            id: "m1",
            name: "",
            modelNumber: "",
            installationDate: "",
            imageFile: null,
            description: "",
            galleryImages: [],
            spareParts: [
                { id: "sp1", name: "", klValue: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: "p1", name: "", imageFile: null, optimalStateVideoFile: null }] },
            ],
        },
    ]);
    const [loading, setLoading] = useState<string | null>(null);
    const [editDataLoaded, setEditDataLoaded] = useState(false);
    const machinesSectionRef = useRef<HTMLDivElement>(null);
    const isEditMode = editDataLoaded && (!!categoryIdForEdit || !!initialData);

    // Snapshot of the persisted row state when the modal first loads edit data.
    // Used by handleSaveAllEdits to skip PUT calls for rows whose text fields
    // are unchanged and whose user hasn't picked a new image/video, so a
    // single image upload doesn't fan out into N spare-part PUTs.
    type BaselineMachine = { name: string; modelNumber: string; description: string; installationDate: string };
    type BaselineSparePart = { name: string; klValue: string };
    type BaselinePart = { name: string };
    const machineBaselineRef = useRef<Map<string, BaselineMachine>>(new Map());
    const sparePartBaselineRef = useRef<Map<string, BaselineSparePart>>(new Map());
    const partBaselineRef = useRef<Map<string, BaselinePart>>(new Map());
    const categoryBaselineRef = useRef<{ name: string; imageUrl: string | null }>({ name: "", imageUrl: null });

    const captureBaseline = useCallback((rows: MachineRow[], catName: string, catImageUrl: string | null) => {
        categoryBaselineRef.current = { name: catName, imageUrl: catImageUrl };
        machineBaselineRef.current.clear();
        sparePartBaselineRef.current.clear();
        partBaselineRef.current.clear();
        for (const m of rows) {
            if (m.createdId) {
                machineBaselineRef.current.set(m.createdId, {
                    name: m.name || "",
                    modelNumber: m.modelNumber || "",
                    description: m.description || "",
                    installationDate: m.installationDate || "",
                });
            }
            for (const sp of m.spareParts) {
                if (sp.createdId) {
                    sparePartBaselineRef.current.set(sp.createdId, {
                        name: sp.name || "",
                        klValue: sp.klValue || "",
                    });
                }
                for (const pt of sp.parts) {
                    if (pt.createdId) {
                        partBaselineRef.current.set(pt.createdId, { name: pt.name || "" });
                    }
                }
            }
        }
    }, []);

    const isMachineDirty = useCallback((m: MachineRow): boolean => {
        if (!m.createdId) return true;
        if (m.imageFile) return true;
        if (m.galleryImages.some((g) => g.file)) return true;
        const b = machineBaselineRef.current.get(m.createdId);
        if (!b) return true;
        return (
            (m.name || "") !== b.name ||
            (m.modelNumber || "") !== b.modelNumber ||
            (m.description || "") !== b.description ||
            (m.installationDate || "") !== b.installationDate
        );
    }, []);

    const isSparePartDirty = useCallback((sp: SparePartRow): boolean => {
        if (!sp.createdId) return true;
        if (sp.imageFile) return true;
        if (sp.optimalStateVideoFile) return true;
        const b = sparePartBaselineRef.current.get(sp.createdId);
        if (!b) return true;
        return (sp.name || "") !== b.name || (sp.klValue || "") !== b.klValue;
    }, []);

    const isPartDirty = useCallback((pt: PartRow): boolean => {
        if (!pt.createdId) return true;
        if (pt.imageFile) return true;
        if (pt.optimalStateVideoFile) return true;
        const b = partBaselineRef.current.get(pt.createdId);
        if (!b) return true;
        return (pt.name || "") !== b.name;
    }, []);

    const isCategoryDirty = useCallback((): boolean => {
        if (categoryEditImage || categoryImage) return true;
        const b = categoryBaselineRef.current;
        return (
            (categoryEditName || "").trim() !== b.name ||
            (categoryImageUrl || null) !== b.imageUrl
        );
    }, [categoryEditImage, categoryEditName, categoryImage, categoryImageUrl]);

    const [machinePositions, setMachinePositions] = useState<MachinePosition[]>([]);
    const [showImageMapper, setShowImageMapper] = useState(false);

    const savedMachines = machines.filter((m) => m.createdId);
    const hasCategoryImage = !!(categoryImageUrl || categoryImage);
    const positionsRequired = hasCategoryImage && savedMachines.length > 0;
    const allPositionsMapped = positionsRequired && savedMachines.every((m) =>
        machinePositions.some((p) => p.machine === m.createdId)
    );

    const closeBlocked = positionsRequired && !allPositionsMapped;

    useEffect(() => {
        onCloseGuardChange?.(closeBlocked);
    }, [closeBlocked, onCloseGuardChange]);

    const handleAttemptClose = useCallback(() => {
        if (closeBlocked) {
            toast.error("Please map all machine positions on the category image before closing.");
            return;
        }
        onComplete?.();
    }, [closeBlocked, onComplete]);

    useEffect(() => {
        if (editDataLoaded) return;
        if (initialData) {
            const mapped = mapCategoryFullToState(initialData);
            setCategoryName(mapped.categoryName);
            setCategoryImageUrl(mapped.categoryImageUrl);
            setCategoryId(mapped.categoryId);
            setMachines(mapped.machines);
            setMachinePositions(mapped.machinePositions);
            captureBaseline(mapped.machines, mapped.categoryName, mapped.categoryImageUrl);
            setEditDataLoaded(true);
            return;
        }
        if (!categoryIdForEdit?.trim()) return;
        let cancelled = false;
        setLoading("edit-load");
        fetch(`/api/machines/machine-category/${encodeURIComponent(categoryIdForEdit)}/full`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load category");
                return res.json();
            })
            .then((payload: CategoryFullPayload) => {
                if (cancelled) return;
                const mapped = mapCategoryFullToState(payload);
                setCategoryName(mapped.categoryName);
                setCategoryImageUrl(mapped.categoryImageUrl);
                setCategoryId(mapped.categoryId);
                setMachines(mapped.machines);
                setMachinePositions(mapped.machinePositions);
                captureBaseline(mapped.machines, mapped.categoryName, mapped.categoryImageUrl);
                setEditDataLoaded(true);
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load category for editing");
            })
            .finally(() => {
                if (!cancelled) setLoading(null);
            });
        return () => { cancelled = true; };
    }, [initialData, categoryIdForEdit, editDataLoaded, captureBaseline]);

    // When edit data has just loaded, scroll machines section into view so pre-populated content is visible
    useEffect(() => {
        if (!editDataLoaded || (!categoryIdForEdit && !initialData)) return;
        const t = setTimeout(() => {
            machinesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return () => clearTimeout(t);
    }, [editDataLoaded, categoryIdForEdit, initialData]);

    const uploadEntityImage = useCallback(async (type: "category" | "machine" | "sparePart" | "part", id: string, file: File) => {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("type", type);
        fd.append("id", id);
        const res = await fetch("/api/upload/entity-image", { method: "POST", body: fd });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Image upload failed");
        }
        const data = await res.json();
        return data as { imageUrl?: string };
    }, []);

    const uploadEntityImageAdd = useCallback(async (type: "sparePart" | "part", id: string, file: File) => {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("type", type);
        fd.append("id", id);
        const res = await fetch("/api/upload/entity-image-add", { method: "POST", body: fd });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Image upload failed");
        }
        return res.json() as Promise<{ imageUrls?: string[] }>;
    }, []);

    const removeEntityImage = useCallback(async (type: "sparePart" | "part", id: string, imageName: string) => {
        const res = await fetch("/api/upload/entity-image-remove", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, id, imageName }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Image removal failed");
        }
        return res.json() as Promise<{ imageUrls?: string[] }>;
    }, []);

    const uploadEntityVideo = useCallback(async (type: "sparePart" | "part", id: string, file: File) => {
        const fd = new FormData();
        fd.append("video", file);
        fd.append("type", type);
        fd.append("id", id);
        const res = await fetch("/api/upload/entity-video", { method: "POST", body: fd });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Video upload failed");
        }
        const data = await res.json();
        return data as { optimalStateVideoUrl?: string };
    }, []);

    const deleteEntityVideo = useCallback(async (type: "sparePart" | "part", id: string) => {
        const res = await fetch("/api/upload/entity-video", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, id }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Video delete failed");
        }
    }, []);

    /**
     * POSTs a single new part for an already-persisted spare part, then uploads
     * its image / optimal-state video. Throws on failure (no toast / no state
     * change) so callers can decide how to surface success or errors. Used both
     * by the per-row "Create" button and the edit-mode bulk save.
     */
    const persistNewPart = useCallback(
        async (
            machineCreatedId: string,
            sparePartCreatedId: string,
            pt: PartRow
        ): Promise<{ id: string; imageUrl: string | null }> => {
            const name = pt.name.trim();
            const partRes = await fetch("/api/machines/spare-parts-part", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, machineID: machineCreatedId, sparePartID: sparePartCreatedId }),
            });
            if (!partRes.ok) {
                const err = await partRes.json().catch(() => ({}));
                throw new Error(err.error || "Failed to add part");
            }
            const partData = await partRes.json();
            let imageUrl: string | null = partData.imageUrl ?? null;
            if (pt.imageFile) {
                const imgResult = await uploadEntityImage("part", partData._id, pt.imageFile);
                imageUrl = imgResult?.imageUrl ?? imageUrl;
            }
            if (pt.optimalStateVideoFile) {
                await uploadEntityVideo("part", partData._id, pt.optimalStateVideoFile);
            }
            return { id: partData._id as string, imageUrl };
        },
        [uploadEntityImage, uploadEntityVideo]
    );

    const handleAddCategory = useCallback(async () => {
        const name = categoryName.trim();
        if (!name) {
            toast.error("Enter a machine category name");
            return;
        }
        if (!categoryImage) {
            toast.error("Upload a category image to continue");
            return;
        }
        setLoading("category");
        try {
            const res = await fetch("/api/machines/machine-category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to add category");
            }
            const data = await res.json();
            setCategoryId(data._id);
            const uploaded = await uploadEntityImage("category", data._id, categoryImage);
            if (uploaded?.imageUrl) setCategoryImageUrl(uploaded.imageUrl);
            toast.success("Category added. Now add the machine.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add category");
        } finally {
            setLoading(null);
        }
    }, [categoryName, categoryImage, uploadEntityImage, onSuccess]);

    const handleSaveCategoryEdit = useCallback(async () => {
        if (!categoryId) return;
        const name = (categoryEditName || categoryName).trim();
        if (!name) {
            toast.error("Category name is required");
            return;
        }
        if (!categoryEditImage && !categoryImage && !categoryImageUrl) {
            toast.error("Category image is required");
            return;
        }
        setLoading("category-edit");
        try {
            const res = await fetch(`/api/machines/machine-category/${categoryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update category");
            }
            const fileToUpload = categoryEditImage || categoryImage;
            if (fileToUpload) {
                const uploaded = await uploadEntityImage("category", categoryId, fileToUpload);
                if (uploaded?.imageUrl) setCategoryImageUrl(uploaded.imageUrl);
            }
            setCategoryName(name);
            setEditingCategory(false);
            setCategoryEditName("");
            setCategoryEditImage(null);
            toast.success("Category updated.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update category");
        } finally {
            setLoading(null);
        }
    }, [categoryId, categoryName, categoryEditName, categoryEditImage, categoryImage, categoryImageUrl, uploadEntityImage, onSuccess]);

    const handleSaveCategoryNameOnly = useCallback(async () => {
        if (!categoryId) return;
        const name = categoryName.trim();
        if (!name) {
            toast.error("Category name is required");
            return;
        }
        setLoading("category-name");
        try {
            const res = await fetch(`/api/machines/machine-category/${categoryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update category");
            }
            toast.success("Category name updated.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update category");
        } finally {
            setLoading(null);
        }
    }, [categoryId, categoryName, onSuccess]);

    const uploadMachineGalleryImage = useCallback(async (machineId: string, file: File) => {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("machineId", machineId);
        const res = await fetch("/api/upload/machine-gallery", { method: "POST", body: fd });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Gallery image upload failed");
        }
        return res.json();
    }, []);

    const handleUpdateMachine = useCallback(async (machineRowId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        if (!machine?.createdId) return;
        const name = machine.name.trim();
        if (!name) {
            toast.error("Machine name is required");
            return;
        }
        setLoading(`machine-update-${machineRowId}`);
        try {
            const res = await fetch(`/api/machines/${machine.createdId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: machine.description ?? "",
                    installationDate: machine.installationDate || null,
                    modelNumber: machine.modelNumber ?? "",
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update machine");
            }
            if (machine.imageFile) {
                const uploaded = await uploadEntityImage("machine", machine.createdId, machine.imageFile);
                if (uploaded?.imageUrl) {
                    setMachines((prev) =>
                        prev.map((m) => (m.id === machineRowId ? { ...m, imageUrl: uploaded.imageUrl, imageFile: null } : m))
                    );
                }
            } else {
                setMachines((prev) => prev.map((m) => (m.id === machineRowId ? { ...m, imageFile: null } : m)));
            }
            for (const gi of machine.galleryImages) {
                if (gi.file) {
                    await uploadMachineGalleryImage(machine.createdId, gi.file);
                    setMachines((prev) =>
                        prev.map((m) =>
                            m.id === machineRowId
                                ? {
                                      ...m,
                                      galleryImages: m.galleryImages.map((g) => (g.id === gi.id ? { ...g, file: null } : g)),
                                  }
                                : m
                        )
                    );
                }
            }
            toast.success("Machine updated.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update machine");
        } finally {
            setLoading(null);
        }
    }, [machines, uploadEntityImage, uploadMachineGalleryImage, onSuccess]);

    const addMachine = useCallback(() => {
        setMachines((prev) => [...prev, defaultMachineRow()]);
    }, []);

    const removeMachine = useCallback((id: string) => {
        setMachines((prev) => {
            const next = prev.filter((m) => m.id !== id);
            return next.length === 0 ? [defaultMachineRow()] : next;
        });
    }, []);

    const handleDeleteMachine = useCallback(async (machineRowId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        if (!machine?.createdId) return;
        if (!confirm(`Delete machine "${machine.name}"? This will delete all its spare parts and parts.`)) return;
        setLoading(`delete-machine-${machineRowId}`);
        try {
            const res = await fetch(`/api/machines/${machine.createdId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete machine");
            }
            removeMachine(machineRowId);
            toast.success("Machine deleted.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete machine");
        } finally {
            setLoading(null);
        }
    }, [machines, removeMachine, onSuccess]);

    const updateMachine = useCallback((id: string, field: keyof MachineRow, value: string | File | null | undefined | MachineGalleryImage[]) => {
        setMachines((prev) =>
            prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
        );
    }, []);

    const addMachineGalleryImage = useCallback((machineRowId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? { ...m, galleryImages: [...m.galleryImages, { id: `gi_${Date.now()}`, file: null, imageUrl: null }] }
                    : m
            )
        );
    }, []);

    const removeMachineGalleryImage = useCallback((machineRowId: string, imageId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? { ...m, galleryImages: m.galleryImages.filter((gi) => gi.id !== imageId) }
                    : m
            )
        );
    }, []);

    const setMachineGalleryImageFile = useCallback((machineRowId: string, imageId: string, file: File | null) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          galleryImages: m.galleryImages.map((gi) => (gi.id === imageId ? { ...gi, file } : gi)),
                      }
                    : m
            )
        );
    }, []);

    const handleSaveMachines = useCallback(async () => {
        if (!categoryId) {
            toast.error("Add a category first");
            return;
        }
        const toCreate = machines.filter((m) => m.name.trim() && m.imageFile && !m.createdId);
        if (toCreate.length === 0) {
            toast.error("Add at least one machine with name and image to save");
            return;
        }
        setLoading("machine");
        try {
            const createdIds: string[] = [];
            for (const m of toCreate) {
                const name = m.name.trim();
                const res = await fetch("/api/machines/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        category: categoryId,
                        isActive: true,
                        description: (m.description ?? "").trim(),
                        installationDate: m.installationDate || null,
                        modelNumber: (m.modelNumber ?? "").trim() || null,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add machine");
                }
                const data = await res.json();
                const machineId: string = data._id;
                createdIds.push(machineId);
                await uploadEntityImage("machine", machineId, m.imageFile!);
                for (const gi of m.galleryImages) {
                    if (gi.file) {
                        await uploadMachineGalleryImage(machineId, gi.file);
                    }
                }
                setMachines((prev) =>
                    prev.map((x) =>
                        x.id === m.id
                            ? {
                                  ...x,
                                  createdId: machineId,
                                  imageUrl: undefined,
                                  imageFile: null,
                                  galleryImages: x.galleryImages.map((g) => ({ ...g, file: null })),
                              }
                            : x
                    )
                );
            }
            toast.success(
                toCreate.length === 1
                    ? "Machine added. Add spare parts and parts below."
                    : `${toCreate.length} machines added. Add spare parts for each machine below.`
            );
            const previouslyCreated = machines
                .map((m) => m.createdId)
                .filter((id): id is string => Boolean(id));
            const allMachineIds = Array.from(new Set([...previouslyCreated, ...createdIds]));
            onMachinesCreated?.(allMachineIds);
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save machines");
        } finally {
            setLoading(null);
        }
    }, [categoryId, machines, uploadEntityImage, uploadMachineGalleryImage, onSuccess, onMachinesCreated]);

    const addSparePart = useCallback((machineRowId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          spareParts: [
                            ...m.spareParts,
                            {
                                id: `sp_${Date.now()}`,
                                name: "",
                                klValue: "",
                                imageFile: null,
                                imageUrls: [],
                                pendingImageFiles: [],
                                optimalStateVideoFile: null,
                                parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null, optimalStateVideoFile: null }],
                            },
                          ],
                      }
                    : m
            )
        );
    }, []);

    const removeSparePart = useCallback((machineRowId: string, sparePartId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? { ...m, spareParts: m.spareParts.filter((s) => s.id !== sparePartId) }
                    : m
            )
        );
    }, []);

    const updateSparePart = useCallback((machineRowId: string, sparePartId: string, field: keyof SparePartRow, value: string | File | null | PartRow[]) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          spareParts: m.spareParts.map((s) =>
                              s.id === sparePartId ? { ...s, [field]: value } : s
                          ),
                      }
                    : m
            )
        );
    }, []);

    const addPart = useCallback((machineRowId: string, sparePartId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          spareParts: m.spareParts.map((s) =>
                              s.id === sparePartId
                                  ? { ...s, parts: [...s.parts, { id: `p_${Date.now()}`, name: "", imageFile: null, optimalStateVideoFile: null }] }
                                                  : s
                          ),
                      }
                    : m
            )
        );
    }, []);

    const removePart = useCallback((machineRowId: string, sparePartId: string, partId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          spareParts: m.spareParts.map((s) =>
                              s.id === sparePartId ? { ...s, parts: s.parts.filter((p) => p.id !== partId) } : s
                          ),
                      }
                    : m
            )
        );
    }, []);

    const updatePart = useCallback((machineRowId: string, sparePartId: string, partId: string, field: keyof PartRow, value: string | File | null) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? {
                          ...m,
                          spareParts: m.spareParts.map((s) =>
                              s.id === sparePartId
                                  ? {
                                        ...s,
                                        parts: s.parts.map((p) => (p.id === partId ? { ...p, [field]: value } : p)),
                                    }
                                  : s
                          ),
                      }
                    : m
            )
        );
    }, []);

    const isDuplicateKlValue = useCallback((klValue: string, currentSparePartId?: string) => {
        const normalized = klValue.trim().toLowerCase();
        if (!normalized) return false;
        const matches = machines.flatMap((m) => m.spareParts).filter((sp) => {
            if (currentSparePartId && sp.id === currentSparePartId) return false;
            return (sp.klValue || "").trim().toLowerCase() === normalized;
        });
        return matches.length > 0;
    }, [machines]);

    const handleDeleteSparePart = useCallback(async (machineRowId: string, sparePartId: string) => {
        const sp = machines.find((m) => m.id === machineRowId)?.spareParts.find((s) => s.id === sparePartId);
        if (!sp?.createdId) return;
        if (!confirm(`Delete spare part "${sp.name}"? This will delete all its parts.`)) return;
        setLoading(`delete-spare-${sparePartId}`);
        try {
            const res = await fetch(`/api/machines/spare-parts/${sp.createdId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete spare part");
            }
            removeSparePart(machineRowId, sparePartId);
            toast.success("Spare part deleted.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete spare part");
        } finally {
            setLoading(null);
        }
    }, [machines, removeSparePart, onSuccess]);

    const handleDeletePart = useCallback(async (machineRowId: string, sparePartId: string, partId: string) => {
        const pt = machines.find((m) => m.id === machineRowId)?.spareParts.find((s) => s.id === sparePartId)?.parts.find((p) => p.id === partId);
        if (!pt?.createdId) return;
        if (!confirm(`Delete part "${pt.name}"?`)) return;
        setLoading(`delete-part-${partId}`);
        try {
            const res = await fetch(`/api/machines/spare-parts-part/${pt.createdId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete part");
            }
            removePart(machineRowId, sparePartId, partId);
            toast.success("Part deleted.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete part");
        } finally {
            setLoading(null);
        }
    }, [machines, removePart, onSuccess]);

    const handleUpdateSparePart = useCallback(async (machineRowId: string, sparePartId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        const sp = machine?.spareParts.find((s) => s.id === sparePartId);
        if (!sp?.createdId) return;
        const name = sp.name.trim();
        const klValue = sp.klValue.trim();
        if (!name) {
            toast.error("Spare part name is required");
            return;
        }
        if (!klValue) {
            toast.error("KL Value is required");
            return;
        }
        if (isDuplicateKlValue(klValue, sp.id)) {
            toast.error("KL Value must be unique");
            return;
        }
        setLoading(`spare-update-${sparePartId}`);
        try {
            const res = await fetch(`/api/machines/spare-parts/${sp.createdId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, klValue }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update spare part");
            }
            if (sp.imageFile) {
                await uploadEntityImage("sparePart", sp.createdId, sp.imageFile);
            }
            if (sp.optimalStateVideoFile) {
                const vidResult = await uploadEntityVideo("sparePart", sp.createdId, sp.optimalStateVideoFile);
                setMachines((prev) =>
                    prev.map((m) =>
                        m.id === machineRowId
                            ? {
                                  ...m,
                                  spareParts: m.spareParts.map((s) =>
                                      s.id === sparePartId ? { ...s, imageUrl: undefined, imageFile: null, optimalStateVideoFile: null, optimalStateVideoUrl: vidResult?.optimalStateVideoUrl ?? s.optimalStateVideoUrl } : s
                                  ),
                              }
                            : m
                    )
                );
            } else {
                setMachines((prev) =>
                    prev.map((m) =>
                        m.id === machineRowId
                            ? {
                                  ...m,
                                  spareParts: m.spareParts.map((s) => (s.id === sparePartId ? { ...s, imageFile: null, optimalStateVideoFile: null } : s)),
                              }
                            : m
                    )
                );
            }
            toast.success("Spare part updated.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update spare part");
        } finally {
            setLoading(null);
        }
    }, [machines, isDuplicateKlValue, uploadEntityImage, uploadEntityVideo, onSuccess]);

    const handleUpdatePart = useCallback(async (machineRowId: string, sparePartId: string, partId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        const sparePart = machine?.spareParts.find((s) => s.id === sparePartId);
        const pt = sparePart?.parts.find((p) => p.id === partId);
        if (!pt?.createdId) return;
        const name = pt.name.trim();
        if (!name) {
            toast.error("Part name is required");
            return;
        }
        setLoading(`part-update-${partId}`);
        try {
            const res = await fetch(`/api/machines/spare-parts-part/${pt.createdId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update part");
            }
            // Keep the existing image visible after a save; only swap it when a
            // new file was actually uploaded. (Previously this reset imageUrl to
            // undefined, wiping the preview whenever a part was updated.)
            let nextImageUrl: string | null | undefined = pt.imageUrl;
            if (pt.imageFile) {
                const imgResult = await uploadEntityImage("part", pt.createdId, pt.imageFile);
                nextImageUrl = imgResult?.imageUrl ?? nextImageUrl;
            }
            if (pt.optimalStateVideoFile) {
                const vidResult = await uploadEntityVideo("part", pt.createdId, pt.optimalStateVideoFile);
                setMachines((prev) =>
                    prev.map((m) =>
                        m.id === machineRowId
                            ? {
                                  ...m,
                                  spareParts: m.spareParts.map((s) =>
                                      s.id === sparePartId
                                          ? {
                                                ...s,
                                                parts: s.parts.map((p) =>
                                                    p.id === partId ? { ...p, imageUrl: nextImageUrl, imageFile: null, optimalStateVideoFile: null, optimalStateVideoUrl: vidResult?.optimalStateVideoUrl ?? p.optimalStateVideoUrl } : p
                                                ),
                                            }
                                          : s
                                  ),
                              }
                            : m
                    )
                );
            } else {
                setMachines((prev) =>
                    prev.map((m) =>
                        m.id === machineRowId
                            ? {
                                  ...m,
                                  spareParts: m.spareParts.map((s) =>
                                      s.id === sparePartId
                                          ? {
                                                ...s,
                                                parts: s.parts.map((p) => (p.id === partId ? { ...p, imageUrl: nextImageUrl, imageFile: null, optimalStateVideoFile: null } : p)),
                                            }
                                          : s
                                  ),
                              }
                            : m
                    )
                );
            }
            toast.success("Part updated.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update part");
        } finally {
            setLoading(null);
        }
    }, [machines, uploadEntityImage, uploadEntityVideo, onSuccess]);

    /**
     * Creates a NEW part on an already-saved spare part. The "Save Spare Parts
     * & Parts" / bulk-edit flows only persist parts for brand-new spare parts,
     * so parts added via "Add Part" on an existing spare part need this path —
     * without it the new part row is never uploaded.
     */
    const handleCreatePart = useCallback(async (machineRowId: string, sparePartId: string, partId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        const sp = machine?.spareParts.find((s) => s.id === sparePartId);
        const pt = sp?.parts.find((p) => p.id === partId);
        if (!machine?.createdId || !sp?.createdId || !pt) return;
        if (!pt.name.trim()) {
            toast.error("Part name is required");
            return;
        }
        if (!pt.imageFile) {
            toast.error("Part image is required");
            return;
        }
        setLoading(`part-create-${partId}`);
        try {
            const { id: createdId, imageUrl } = await persistNewPart(machine.createdId, sp.createdId, pt);
            setMachines((prev) =>
                prev.map((m) =>
                    m.id === machineRowId
                        ? {
                              ...m,
                              spareParts: m.spareParts.map((s) =>
                                  s.id === sparePartId
                                      ? {
                                            ...s,
                                            parts: s.parts.map((p) =>
                                                p.id === partId
                                                    ? { ...p, createdId, imageUrl, imageFile: null, optimalStateVideoFile: null }
                                                    : p
                                            ),
                                        }
                                      : s
                              ),
                          }
                        : m
                )
            );
            toast.success("Part added.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add part");
        } finally {
            setLoading(null);
        }
    }, [machines, persistNewPart, onSuccess]);

    const handleSaveSparePartsAndParts = useCallback(async (machineRowId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        if (!machine?.createdId) {
            toast.error("Save the machine first");
            return;
        }
        const validSpareParts = machine.spareParts.filter(
            (sp) => sp.name.trim() && sp.klValue.trim() && sp.imageFile && !sp.createdId
        );
        if (validSpareParts.length === 0) {
            toast.error("Add at least one spare part with name and image to save");
            return;
        }
        setLoading(`spare-${machineRowId}`);
        try {
            for (const sp of validSpareParts) {
                const name = sp.name.trim();
                const klValue = sp.klValue.trim();
                if (isDuplicateKlValue(klValue, sp.id)) {
                    throw new Error(`KL Value "${klValue}" must be unique`);
                }
                const res = await fetch("/api/machines/spare-parts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, klValue, machineID: machine.createdId }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add spare part");
                }
                const spData = await res.json();
                await uploadEntityImage("sparePart", spData._id, sp.imageFile!);
                for (const f of sp.pendingImageFiles) {
                    await uploadEntityImageAdd("sparePart", spData._id, f);
                }
                if (sp.optimalStateVideoFile) {
                    await uploadEntityVideo("sparePart", spData._id, sp.optimalStateVideoFile);
                }
                const validParts = sp.parts.filter((pt) => pt.name.trim() && pt.imageFile);
                for (const pt of validParts) {
                    const partName = pt.name.trim();
                    const partRes = await fetch("/api/machines/spare-parts-part", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: partName,
                            machineID: machine.createdId,
                            sparePartID: spData._id,
                        }),
                    });
                    if (!partRes.ok) {
                        const err = await partRes.json().catch(() => ({}));
                        throw new Error(err.error || "Failed to add part");
                    }
                    const partData = await partRes.json();
                    await uploadEntityImage("part", partData._id, pt.imageFile!);
                    if (pt.optimalStateVideoFile) {
                        await uploadEntityVideo("part", partData._id, pt.optimalStateVideoFile);
                    }
                }
            }
            setMachines((prev) =>
                prev.map((x) =>
                    x.id === machineRowId
                        ? {
                              ...x,
                              spareParts: [
                                  {
                                      id: `sp_${Date.now()}`,
                                      name: "",
                                      klValue: "",
                                      imageFile: null,
                                      imageUrls: [],
                                      pendingImageFiles: [],
                                      optimalStateVideoFile: null,
                                      parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null, optimalStateVideoFile: null }],
                                  },
                              ],
                          }
                        : x
                )
            );
            toast.success("Spare parts and parts saved.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save spare parts");
        } finally {
            setLoading(null);
        }
    }, [machines, isDuplicateKlValue, uploadEntityImage, uploadEntityVideo, onSuccess]);

    const handleDeleteSparePartVideo = useCallback(async (machineRowId: string, sparePartId: string) => {
        const sp = machines.find((m) => m.id === machineRowId)?.spareParts.find((s) => s.id === sparePartId);
        if (!sp?.createdId || !sp.optimalStateVideoUrl) return;
        setLoading(`delete-sp-video-${sparePartId}`);
        try {
            await deleteEntityVideo("sparePart", sp.createdId);
            setMachines((prev) =>
                prev.map((m) =>
                    m.id === machineRowId
                        ? {
                              ...m,
                              spareParts: m.spareParts.map((s) =>
                                  s.id === sparePartId ? { ...s, optimalStateVideoUrl: null, optimalStateVideoFile: null } : s
                              ),
                          }
                        : m
                )
            );
            toast.success("Spare part video deleted.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete video");
        } finally {
            setLoading(null);
        }
    }, [machines, deleteEntityVideo]);

    const handleDeletePartVideo = useCallback(async (machineRowId: string, sparePartId: string, partId: string) => {
        const pt = machines.find((m) => m.id === machineRowId)?.spareParts.find((s) => s.id === sparePartId)?.parts.find((p) => p.id === partId);
        if (!pt?.createdId || !pt.optimalStateVideoUrl) return;
        setLoading(`delete-pt-video-${partId}`);
        try {
            await deleteEntityVideo("part", pt.createdId);
            setMachines((prev) =>
                prev.map((m) =>
                    m.id === machineRowId
                        ? {
                              ...m,
                              spareParts: m.spareParts.map((s) =>
                                  s.id === sparePartId
                                      ? {
                                            ...s,
                                            parts: s.parts.map((p) =>
                                                p.id === partId ? { ...p, optimalStateVideoUrl: null, optimalStateVideoFile: null } : p
                                            ),
                                        }
                                      : s
                              ),
                          }
                        : m
                )
            );
            toast.success("Part video deleted.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete video");
        } finally {
            setLoading(null);
        }
    }, [machines, deleteEntityVideo]);

    /**
     * Drives a single "Save Changes" footer in edit mode. Runs entity-level
     * handlers in dependency order and reports a single summary toast at the
     * end. Per-row Update buttons are hidden in edit mode in favor of this.
     */
    const handleSaveAllEdits = useCallback(async () => {
        if (!categoryId) {
            toast.error("No category selected");
            return;
        }
        const errors: string[] = [];

        setLoading("save-all");
        try {
            // ── Step 1: insert any NEW rows the user added in edit mode.
            // (New machines and new spare parts still need their original POST
            // flow because they don't have createdId yet — the bulk endpoint
            // only updates existing rows.)
            const hasUnsavedMachines = machines.some(
                (m) => !m.createdId && m.name.trim() && m.imageFile
            );
            if (hasUnsavedMachines) {
                try { await handleSaveMachines(); } catch (e) {
                    errors.push(`New machines: ${e instanceof Error ? e.message : "failed"}`);
                }
            }
            for (const m of machines) {
                if (!m.createdId) continue;
                const hasNewSP = m.spareParts.some(
                    (sp) => !sp.createdId && sp.name.trim() && sp.klValue.trim() && sp.imageFile
                );
                if (hasNewSP) {
                    try { await handleSaveSparePartsAndParts(m.id); } catch (e) {
                        errors.push(`Spare parts for ${m.name || m.id}: ${e instanceof Error ? e.message : "failed"}`);
                    }
                }
            }

            // ── Step 1b: create NEW parts added to EXISTING spare parts.
            // handleSaveSparePartsAndParts only persists parts for brand-new
            // spare parts, so parts added via "Add Part" on an already-saved
            // spare part need their own POST here.
            const createdParts: Array<{
                machineId: string;
                sparePartId: string;
                partId: string;
                createdId: string;
                imageUrl: string | null;
            }> = [];
            for (const m of machines) {
                if (!m.createdId) continue;
                for (const sp of m.spareParts) {
                    if (!sp.createdId) continue;
                    const newParts = sp.parts.filter(
                        (pt) => !pt.createdId && pt.name.trim() && pt.imageFile
                    );
                    for (const pt of newParts) {
                        try {
                            const { id: createdId, imageUrl } = await persistNewPart(m.createdId, sp.createdId, pt);
                            createdParts.push({ machineId: m.id, sparePartId: sp.id, partId: pt.id, createdId, imageUrl });
                        } catch (e) {
                            errors.push(`New part for ${sp.name || sp.id}: ${e instanceof Error ? e.message : "failed"}`);
                        }
                    }
                }
            }
            if (createdParts.length > 0) {
                setMachines((prev) =>
                    prev.map((m) => {
                        const forMachine = createdParts.filter((c) => c.machineId === m.id);
                        if (forMachine.length === 0) return m;
                        return {
                            ...m,
                            spareParts: m.spareParts.map((s) => {
                                const forSP = forMachine.filter((c) => c.sparePartId === s.id);
                                if (forSP.length === 0) return s;
                                return {
                                    ...s,
                                    parts: s.parts.map((p) => {
                                        const hit = forSP.find((c) => c.partId === p.id);
                                        return hit
                                            ? {
                                                  ...p,
                                                  createdId: hit.createdId,
                                                  imageUrl: hit.imageUrl,
                                                  imageFile: null,
                                                  optimalStateVideoFile: null,
                                              }
                                            : p;
                                    }),
                                };
                            }),
                        };
                    })
                );
            }

            // ── Step 2: single bulk PUT for all text-field edits on existing
            // rows. Server diffs vs DB and only writes what's actually
            // different, so this replaces what used to be N+M+P sequential
            // PUTs and N+M+P "X updated" toasts.
            const dirtyMachines = machines
                .filter((m) => m.createdId)
                .map((m) => {
                    const machineDirty = isMachineDirty(m);
                    const dirtySpareParts = (m.spareParts || [])
                        .filter((sp) => sp.createdId)
                        .map((sp) => {
                            const spDirty = isSparePartDirty(sp);
                            const dirtyParts = (sp.parts || [])
                                .filter((pt) => pt.createdId && isPartDirty(pt))
                                .map((pt) => ({ _id: pt.createdId, name: pt.name.trim() }));
                            if (!spDirty && dirtyParts.length === 0) return null;
                            return {
                                _id: sp.createdId,
                                ...(spDirty ? { name: sp.name.trim(), klValue: sp.klValue.trim() } : {}),
                                parts: dirtyParts,
                            };
                        })
                        .filter((sp): sp is NonNullable<typeof sp> => !!sp);
                    if (!machineDirty && dirtySpareParts.length === 0) return null;
                    return {
                        _id: m.createdId,
                        ...(machineDirty
                            ? {
                                  name: m.name.trim(),
                                  modelNumber: m.modelNumber ?? "",
                                  description: m.description ?? "",
                                  installationDate: m.installationDate || null,
                              }
                            : {}),
                        spareParts: dirtySpareParts,
                    };
                })
                .filter((m): m is NonNullable<typeof m> => !!m);

            const bulkBody: {
                name?: string;
                machines: typeof dirtyMachines;
            } = { machines: dirtyMachines };
            const newCatName = (categoryEditName || categoryName).trim();
            if (isCategoryDirty() && newCatName) {
                bulkBody.name = newCatName;
            }

            if (bulkBody.name !== undefined || dirtyMachines.length > 0) {
                try {
                    const res = await fetch(
                        `/api/machines/machine-category/${categoryId}/full`,
                        {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(bulkBody),
                        }
                    );
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || "Bulk update failed");
                    }
                } catch (e) {
                    errors.push(`Text fields: ${e instanceof Error ? e.message : "failed"}`);
                }
            }

            // ── Step 3: image / video uploads. These have to be separate
            // multipart requests, but we only hit the upload endpoints for
            // entities where the user actually picked a new file.
            const uploadCategoryImage = categoryEditImage || categoryImage;
            if (uploadCategoryImage) {
                try {
                    const uploaded = await uploadEntityImage("category", categoryId, uploadCategoryImage);
                    if (uploaded?.imageUrl) setCategoryImageUrl(uploaded.imageUrl);
                    setCategoryEditImage(null);
                } catch (e) {
                    errors.push(`Category image: ${e instanceof Error ? e.message : "failed"}`);
                }
            }

            for (const m of machines) {
                if (!m.createdId) continue;
                if (m.imageFile) {
                    try {
                        const uploaded = await uploadEntityImage("machine", m.createdId, m.imageFile);
                        if (uploaded?.imageUrl) {
                            setMachines((prev) =>
                                prev.map((x) =>
                                    x.id === m.id ? { ...x, imageUrl: uploaded.imageUrl, imageFile: null } : x
                                )
                            );
                        } else {
                            setMachines((prev) => prev.map((x) => (x.id === m.id ? { ...x, imageFile: null } : x)));
                        }
                    } catch (e) {
                        errors.push(`Machine ${m.name || m.id} image: ${e instanceof Error ? e.message : "failed"}`);
                    }
                }
                for (const gi of m.galleryImages) {
                    if (!gi.file) continue;
                    try {
                        await uploadMachineGalleryImage(m.createdId, gi.file);
                        setMachines((prev) =>
                            prev.map((x) =>
                                x.id === m.id
                                    ? {
                                          ...x,
                                          galleryImages: x.galleryImages.map((g) =>
                                              g.id === gi.id ? { ...g, file: null } : g
                                          ),
                                      }
                                    : x
                            )
                        );
                    } catch (e) {
                        errors.push(`Gallery image: ${e instanceof Error ? e.message : "failed"}`);
                    }
                }
                for (const sp of m.spareParts) {
                    if (!sp.createdId) continue;
                    if (sp.imageFile) {
                        try {
                            await uploadEntityImage("sparePart", sp.createdId, sp.imageFile);
                            setMachines((prev) =>
                                prev.map((x) =>
                                    x.id === m.id
                                        ? {
                                              ...x,
                                              spareParts: x.spareParts.map((s) =>
                                                  s.id === sp.id ? { ...s, imageFile: null } : s
                                              ),
                                          }
                                        : x
                                )
                            );
                        } catch (e) {
                            errors.push(`Spare part ${sp.name || sp.id} image: ${e instanceof Error ? e.message : "failed"}`);
                        }
                    }
                    if (sp.optimalStateVideoFile) {
                        try {
                            const vidResult = await uploadEntityVideo("sparePart", sp.createdId, sp.optimalStateVideoFile);
                            setMachines((prev) =>
                                prev.map((x) =>
                                    x.id === m.id
                                        ? {
                                              ...x,
                                              spareParts: x.spareParts.map((s) =>
                                                  s.id === sp.id
                                                      ? {
                                                            ...s,
                                                            optimalStateVideoFile: null,
                                                            optimalStateVideoUrl:
                                                                vidResult?.optimalStateVideoUrl ?? s.optimalStateVideoUrl,
                                                        }
                                                      : s
                                              ),
                                          }
                                        : x
                                )
                            );
                        } catch (e) {
                            errors.push(`Spare part ${sp.name || sp.id} video: ${e instanceof Error ? e.message : "failed"}`);
                        }
                    }
                    for (const pt of sp.parts) {
                        if (!pt.createdId) continue;
                        if (pt.imageFile) {
                            try {
                                const imgResult = await uploadEntityImage("part", pt.createdId, pt.imageFile);
                                setMachines((prev) =>
                                    prev.map((x) =>
                                        x.id === m.id
                                            ? {
                                                  ...x,
                                                  spareParts: x.spareParts.map((s) =>
                                                      s.id === sp.id
                                                          ? {
                                                                ...s,
                                                                parts: s.parts.map((p) =>
                                                                    p.id === pt.id
                                                                        ? { ...p, imageFile: null, imageUrl: imgResult?.imageUrl ?? p.imageUrl }
                                                                        : p
                                                                ),
                                                            }
                                                          : s
                                                  ),
                                              }
                                            : x
                                    )
                                );
                            } catch (e) {
                                errors.push(`Part ${pt.name || pt.id} image: ${e instanceof Error ? e.message : "failed"}`);
                            }
                        }
                        if (pt.optimalStateVideoFile) {
                            try {
                                const vidResult = await uploadEntityVideo("part", pt.createdId, pt.optimalStateVideoFile);
                                setMachines((prev) =>
                                    prev.map((x) =>
                                        x.id === m.id
                                            ? {
                                                  ...x,
                                                  spareParts: x.spareParts.map((s) =>
                                                      s.id === sp.id
                                                          ? {
                                                                ...s,
                                                                parts: s.parts.map((p) =>
                                                                    p.id === pt.id
                                                                        ? { ...p, optimalStateVideoFile: null, optimalStateVideoUrl: vidResult?.optimalStateVideoUrl ?? p.optimalStateVideoUrl }
                                                                        : p
                                                                ),
                                                            }
                                                          : s
                                                  ),
                                              }
                                            : x
                                    )
                                );
                            } catch (e) {
                                errors.push(`Part ${pt.name || pt.id} video: ${e instanceof Error ? e.message : "failed"}`);
                            }
                        }
                    }
                }
            }

            // ── Step 4: refresh baseline so a second click with no changes
            // is a no-op, and emit a single toast.
            captureBaseline(machines, newCatName, categoryImageUrl);
            if (errors.length === 0) {
                toast.success("All changes saved.");
            } else {
                toast.error(`Saved with ${errors.length} error${errors.length === 1 ? "" : "s"}: ${errors[0]}`);
                console.warn("Bulk save errors:", errors);
            }
            onSuccess?.();
        } finally {
            setLoading(null);
        }
    }, [
        categoryId,
        categoryName,
        categoryEditName,
        categoryEditImage,
        categoryImage,
        categoryImageUrl,
        machines,
        handleSaveMachines,
        handleSaveSparePartsAndParts,
        persistNewPart,
        onSuccess,
        isCategoryDirty,
        isMachineDirty,
        isSparePartDirty,
        isPartDirty,
        captureBaseline,
        uploadEntityImage,
        uploadEntityVideo,
        uploadMachineGalleryImage,
    ]);

    const handleSavePositions = useCallback(async (positions: MachinePosition[]) => {
        if (!categoryId) return;
        const res = await fetch(`/api/machines/machine-category/${categoryId}/positions`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ machinePositions: positions }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to save positions");
        }
        setMachinePositions(positions);
        setShowImageMapper(false);
        toast.success("Machine positions saved successfully.");
        onSuccess?.();
    }, [categoryId, onSuccess]);

    const containerClass = compact
        ? "flex flex-col gap-5"
        : "bg-white border border-[#96A5BA] rounded-[10px] p-6 flex flex-col gap-5";

    if (loading === "edit-load") {
        return (
            <div className={containerClass}>
                <div className="flex items-center gap-2 text-[#6b7280]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading category...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass}>
            {/* 1. Category */}
            <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 text-base font-medium">1. Machine Category</h3>
                <div className="flex flex-col gap-2">
                    <Label className="text-[#6b7280] text-[14px]">Category Name</Label>
                    <Input
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Pulping and Detrashing"
                        className="bg-[#e5e7eb] border-[#d1d5db] h-[44px] rounded-[10px] px-4 text-gray-900 placeholder:text-[#4b5563]"
                    />
                </div>
                {!categoryId && (
                    <ImageUploadBox
                        file={categoryImage}
                        onFileChange={setCategoryImage}
                        label="Category Image (required to continue)"
                    />
                )}
                {!categoryId && (
                    <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={loading === "category" || !categoryName.trim() || !categoryImage}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] w-fit"
                    >
                        {loading === "category" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Category"}
                    </Button>
                )}
                {categoryId && !editingCategory && (
                    <div className="flex flex-col gap-3">
                        {categoryImageUrl && (
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[#6b7280] text-[12px]">Category Image</Label>
                                <div className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white w-full max-w-[200px] h-[120px] flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={categoryImageUrl} alt={categoryName} className="w-full h-full object-contain" />
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveCategoryNameOnly}
                                disabled={loading === "category-name" || !categoryName.trim()}
                                className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] h-8"
                            >
                                {loading === "category-name" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update category"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditingCategory(true);
                                    setCategoryEditName(categoryName);
                                    setCategoryEditImage(null);
                                }}
                                className="border-[#d1d5db] text-[#6b7280] hover:bg-[#e5e7eb] h-8 gap-1.5"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit name & image
                            </Button>
                        </div>
                    </div>
                )}
                {categoryId && editingCategory && (
                    <div className="bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-3">
                        <Label className="text-[#6b7280] text-[14px]">Edit Category Name</Label>
                        <Input
                            value={categoryEditName}
                            onChange={(e) => setCategoryEditName(e.target.value)}
                            placeholder="Category name"
                            className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900"
                        />
                        <ImageUploadBox
                            file={categoryEditImage}
                            onFileChange={setCategoryEditImage}
                            label="Category Image (required)"
                            existingUrl={categoryImageUrl}
                            onClearExisting={() => setCategoryImageUrl(null)}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveCategoryEdit}
                                disabled={loading === "category-edit" || !(categoryEditImage || categoryImage || categoryImageUrl)}
                                className="bg-[#d45815] hover:bg-[#d45815]/90 text-white"
                            >
                                {loading === "category-edit" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setEditingCategory(false);
                                    setCategoryEditName("");
                                    setCategoryEditImage(null);
                                }}
                                className="text-[#6b7280] hover:bg-[#d1d5db]"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Machines - only after category is added */}
            {categoryId && (
                <div ref={machinesSectionRef} className="flex flex-col gap-4 border-t border-[#607797] pt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 text-base font-medium">2. Machines</h3>
                        <Button
                            type="button"
                            onClick={addMachine}
                            className="bg-[#2D3E5C] hover:bg-[#1f2a44] text-white rounded-[10px] h-9 px-4 flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Machine
                        </Button>
                    </div>
                    {machines.map((m) => (
                        <div
                            key={m.id}
                            className="bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-900 text-sm font-medium">Machine</span>
                                {!m.createdId && (
                                    <button
                                        type="button"
                                        onClick={() => removeMachine(m.id)}
                                        className="p-1.5 rounded-md text-[#6b7280] hover:bg-[#d1d5db] hover:text-gray-900"
                                        title="Remove machine"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#6b7280] text-[12px]">Machine Name</Label>
                                    <Input
                                        value={m.name}
                                        onChange={(e) => updateMachine(m.id, "name", e.target.value)}
                                        placeholder="e.g. Hydrapulper"
                                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#6b7280] text-[12px]">Model Number</Label>
                                    <Input
                                        value={m.modelNumber}
                                        onChange={(e) => updateMachine(m.id, "modelNumber", e.target.value)}
                                        placeholder="e.g. KHP-3200"
                                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#6b7280] text-[12px]">Installation Date</Label>
                                    <Input
                                        type="date"
                                        value={m.installationDate || ""}
                                        onChange={(e) => updateMachine(m.id, "installationDate", e.target.value)}
                                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px]"
                                    />
                                </div>
                                <ImageUploadBox
                                    file={m.imageFile}
                                    onFileChange={(f) => updateMachine(m.id, "imageFile", f)}
                                    label="Machine Image (required for new)"
                                    compact
                                    existingUrl={m.imageUrl}
                                    onClearExisting={() =>
                                        setMachines((prev) =>
                                            prev.map((x) => (x.id === m.id ? { ...x, imageFile: null, imageUrl: null } : x))
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[#6b7280] text-[12px]">Machine description</Label>
                                <textarea
                                    value={m.description ?? ""}
                                    onChange={(e) => updateMachine(m.id, "description", e.target.value)}
                                    placeholder="e.g. High-capacity hydrapulper for stock preparation"
                                    rows={2}
                                    className="bg-white border border-[#d1d5db] rounded-[8px] px-3 py-2 text-gray-900 text-[13px] placeholder:text-[#4b5563] resize-y min-h-[60px]"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[#6b7280] text-[12px]">Additional images</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addMachineGalleryImage(m.id)}
                                        className="h-7 px-2 text-[#6b7280] hover:bg-[#d1d5db] hover:text-gray-900 text-xs"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add image
                                    </Button>
                                </div>
                                {m.galleryImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {m.galleryImages.map((gi) => (
                                            <div
                                                key={gi.id}
                                                className="relative w-20 h-20 rounded-lg border border-[#d1d5db] bg-white overflow-hidden flex items-center justify-center"
                                            >
                                                {gi.file ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={URL.createObjectURL(gi.file)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : gi.imageUrl ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={gi.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[#4b5563] text-xs">No preview</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMachineGalleryImage(m.id, gi.id)}
                                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-[#bf1e21] text-xs z-10"
                                                >
                                                    ×
                                                </button>
                                                <label
                                                    className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity ${
                                                        gi.imageUrl || gi.file
                                                            ? "bg-black/40 hover:bg-black/50 opacity-0 hover:opacity-100"
                                                            : "bg-black/40 hover:bg-black/60 opacity-100"
                                                    }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        className="sr-only"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) setMachineGalleryImageFile(m.id, gi.id, file);
                                                        }}
                                                    />
                                                    <span className="text-white text-xs">{(gi.imageUrl || gi.file) ? "Change" : "Choose"}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[#6b7280] text-[11px]">
                                    Click <strong>Add image</strong> to add as many additional images as you need.
                                </p>
                            </div>
                                            {m.createdId && (
                                                <div className="flex items-center gap-2">
                                                    {!isEditMode && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleUpdateMachine(m.id)}
                                                            disabled={loading === `machine-update-${m.id}` || !m.name.trim()}
                                                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] w-fit"
                                                        >
                                                            {loading === `machine-update-${m.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update machine"}
                                                        </Button>
                                                    )}
                                                    {isEditMode && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteMachine(m.id)}
                                                            disabled={loading === `delete-machine-${m.id}`}
                                                            className="h-8 px-2 text-[#bf1e21] hover:bg-[#bf1e21]/10 text-xs"
                                                        >
                                                            {loading === `delete-machine-${m.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                            {/* Spare parts & parts nested under this machine (only when machine is saved) */}
                            {m.createdId && (
                                <div className="flex flex-col gap-4 border-t border-[#d1d5db] pt-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-gray-900 text-sm font-medium">Spare Parts & Parts</h4>
                                        <Button
                                            type="button"
                                            onClick={() => addSparePart(m.id)}
                                            className="bg-[#d1d5db] hover:bg-[#505050] text-gray-900 rounded-[8px] h-8 px-2 flex items-center gap-1.5 text-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Spare Part
                                        </Button>
                                    </div>
                                    {m.spareParts.map((sp) => (
                                        <div
                                            key={sp.id}
                                            className="bg-white border border-[#d1d5db] rounded-[8px] p-3 flex flex-col gap-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#6b7280] text-xs font-medium">Spare Part</span>
                                                <div className="flex items-center gap-1">
                                                    {isEditMode && sp.createdId ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteSparePart(m.id, sp.id)}
                                                            disabled={loading === `delete-spare-${sp.id}`}
                                                            className="h-7 px-2 text-[#bf1e21] hover:bg-[#bf1e21]/10 text-xs"
                                                            title="Delete spare part"
                                                        >
                                                            {loading === `delete-spare-${sp.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                        </Button>
                                                    ) : !sp.createdId ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSparePart(m.id, sp.id)}
                                                            className="p-1 rounded text-[#6b7280] hover:bg-[#d1d5db] hover:text-gray-900"
                                                            title="Remove spare part"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Spare Part Name</Label>
                                                    <Input
                                                        value={sp.name}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "name", e.target.value)}
                                                        placeholder="e.g. Rotor, Bedplate"
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px] placeholder:text-[#4b5563]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">KL Value (Model Number)</Label>
                                                    <Input
                                                        value={sp.klValue}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "klValue", e.target.value)}
                                                        placeholder="Unique ID"
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px] placeholder:text-[#4b5563]"
                                                    />
                                                </div>
                                            </div>
                                            {/* Multi-image gallery */}
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[#6b7280] text-[12px]">Spare Part Images</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Legacy single imageUrl */}
                                                    {sp.imageUrl && (
                                                        <div className="relative w-[80px] h-[80px] rounded-[6px] overflow-hidden border border-dashed border-[#d1d5db] bg-white group">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={sp.imageUrl} alt="Spare part" className="w-full h-full object-contain" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrl: null } : s) } : x))}
                                                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-4 h-4 text-white" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {/* Additional imageUrls */}
                                                    {sp.imageUrls.map((url, idx) => {
                                                        const fileName = url.split("/uploads/")[1]?.split("?")[0];
                                                        return (
                                                            <div key={idx} className="relative w-[80px] h-[80px] rounded-[6px] overflow-hidden border border-dashed border-[#d1d5db] bg-white group">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        if (sp.createdId && fileName) {
                                                                            try {
                                                                                await removeEntityImage("sparePart", sp.createdId, fileName);
                                                                            } catch { /* swallow, update UI regardless */ }
                                                                        }
                                                                        setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrls: s.imageUrls.filter((_, i) => i !== idx) } : s) } : x));
                                                                    }}
                                                                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-4 h-4 text-white" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Pending new files */}
                                                    {sp.pendingImageFiles.map((f, idx) => (
                                                        <div key={`pending-${idx}`} className="relative w-[80px] h-[80px] rounded-[6px] overflow-hidden border border-dashed border-[#d45815] bg-white group">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-contain" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, pendingImageFiles: s.pendingImageFiles.filter((_, i) => i !== idx) } : s) } : x))}
                                                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-4 h-4 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Add image button */}
                                                    <label className="w-[80px] h-[80px] rounded-[6px] border border-dashed border-[#d1d5db] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#505050] text-[#6b7280]">
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                e.target.value = "";
                                                                if (sp.createdId) {
                                                                    try {
                                                                        const result = await uploadEntityImageAdd("sparePart", sp.createdId, file);
                                                                        setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrls: result.imageUrls ?? s.imageUrls } : s) } : x));
                                                                    } catch { /* ignore, user can retry */ }
                                                                } else {
                                                                    setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, pendingImageFiles: [...s.pendingImageFiles, file] } : s) } : x));
                                                                }
                                                            }}
                                                        />
                                                        <Upload className="w-4 h-4 mb-1" />
                                                        <span className="text-[10px]">Add</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <VideoUploadBox
                                                file={sp.optimalStateVideoFile}
                                                onFileChange={(f) => updateSparePart(m.id, sp.id, "optimalStateVideoFile", f)}
                                                label="Optimal State Spare Part (Video)"
                                                existingUrl={sp.optimalStateVideoUrl}
                                                onDelete={() => sp.createdId ? handleDeleteSparePartVideo(m.id, sp.id) : undefined}
                                                isDeleting={loading === `delete-sp-video-${sp.id}`}
                                            />
                                            {sp.createdId && (
                                                <div className="flex items-center gap-2">
                                                    {!isEditMode && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleUpdateSparePart(m.id, sp.id)}
                                                            disabled={
                                                                loading === `spare-update-${sp.id}` ||
                                                                !sp.name.trim() ||
                                                                !sp.klValue.trim()
                                                            }
                                                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[6px] w-fit text-xs"
                                                        >
                                                            {loading === `spare-update-${sp.id}` ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                "Update spare part"
                                                            )}
                                                        </Button>
                                                    )}
                                                    {isEditMode && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteSparePart(m.id, sp.id)}
                                                            disabled={loading === `delete-spare-${sp.id}`}
                                                            className="h-7 px-2 text-[#bf1e21] hover:bg-[#bf1e21]/10 text-xs"
                                                        >
                                                            {loading === `delete-spare-${sp.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[#6b7280] text-[11px]">Parts (name + image per part)</Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => addPart(m.id, sp.id)}
                                                        className="text-[#d45815] hover:bg-[#d45815]/10 h-7 text-[11px] px-1.5"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Add Part
                                                    </Button>
                                                </div>
                                                {sp.parts.map((pt) => (
                                                    <div key={pt.id} className="flex flex-col gap-2 bg-white rounded-[6px] p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={pt.name}
                                                                onChange={(e) => updatePart(m.id, sp.id, pt.id, "name", e.target.value)}
                                                                placeholder="e.g. Power Saver, Foil"
                                                                className="bg-white border-[#d1d5db] h-[32px] rounded-[4px] px-2 text-gray-900 text-[11px] flex-1"
                                                            />
                                                            <PartImageUpload
                                                                file={pt.imageFile}
                                                                onFileChange={(f) => updatePart(m.id, sp.id, pt.id, "imageFile", f)}
                                                                existingUrl={pt.imageUrl}
                                                                onClearExisting={() =>
                                                                    setMachines((prev) =>
                                                                        prev.map((x) =>
                                                                            x.id === m.id
                                                                                ? {
                                                                                      ...x,
                                                                                      spareParts: x.spareParts.map((s) =>
                                                                                          s.id === sp.id
                                                                                              ? {
                                                                                                    ...s,
                                                                                                    parts: s.parts.map((p) =>
                                                                                                        p.id === pt.id ? { ...p, imageFile: null, imageUrl: null } : p
                                                                                                    ),
                                                                                                }
                                                                                              : s
                                                                                      ),
                                                                                  }
                                                                                : x
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                            {pt.createdId ? (
                                                                <>
                                                                    {!isEditMode && (
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleUpdatePart(m.id, sp.id, pt.id)}
                                                                            disabled={loading === `part-update-${pt.id}` || !pt.name.trim()}
                                                                            className="h-8 px-2 text-[#d45815] hover:bg-[#d45815]/10 text-xs"
                                                                        >
                                                                            {loading === `part-update-${pt.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
                                                                        </Button>
                                                                    )}
                                                                    {isEditMode && (
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleDeletePart(m.id, sp.id, pt.id)}
                                                                            disabled={loading === `delete-part-${pt.id}`}
                                                                            className="h-8 px-2 text-[#bf1e21] hover:bg-[#bf1e21]/10 text-xs"
                                                                            title="Delete part"
                                                                        >
                                                                            {loading === `delete-part-${pt.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            ) : null}
                                                            {!pt.createdId && (
                                                                <>
                                                                    {sp.createdId && (
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleCreatePart(m.id, sp.id, pt.id)}
                                                                            disabled={
                                                                                loading === `part-create-${pt.id}` ||
                                                                                !pt.name.trim() ||
                                                                                !pt.imageFile
                                                                            }
                                                                            className="h-8 px-2 text-[#d45815] hover:bg-[#d45815]/10 text-xs"
                                                                        >
                                                                            {loading === `part-create-${pt.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
                                                                        </Button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removePart(m.id, sp.id, pt.id)}
                                                                        className="p-1 text-[#6b7280] hover:text-red-400 shrink-0"
                                                                        title="Remove part"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        <VideoUploadBox
                                                            file={pt.optimalStateVideoFile}
                                                            onFileChange={(f) => updatePart(m.id, sp.id, pt.id, "optimalStateVideoFile", f)}
                                                            label="Optimal State Part (Video)"
                                                            existingUrl={pt.optimalStateVideoUrl}
                                                            onDelete={() => pt.createdId ? handleDeletePartVideo(m.id, sp.id, pt.id) : undefined}
                                                            isDeleting={loading === `delete-pt-video-${pt.id}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {!isEditMode && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSaveSparePartsAndParts(m.id)}
                                            disabled={
                                                loading === `spare-${m.id}` ||
                                                m.spareParts.every((s) => s.createdId || !s.name.trim() || !s.klValue.trim() || !s.imageFile)
                                            }
                                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] w-fit"
                                        >
                                            {loading === `spare-${m.id}` ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                "Save Spare Parts & Parts"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {!isEditMode && (
                    <Button
                        type="button"
                        onClick={handleSaveMachines}
                        disabled={
                            loading === "machine" ||
                            !machines.some((m) => m.name.trim() && m.imageFile && !m.createdId)
                        }
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] w-fit"
                    >
                        {loading === "machine" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Save All Machines"
                        )}
                    </Button>
                    )}
                </div>
            )}

            {/* 3. Map Machine Positions - shown when category image + saved machines exist */}
            {categoryId && hasCategoryImage && savedMachines.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#607797] pt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 text-base font-medium">3. Map Machine Positions</h3>
                        {allPositionsMapped && (
                            <span className="text-[#22c55e] text-xs font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> All mapped
                            </span>
                        )}
                    </div>
                    <p className="text-[#6b7280] text-sm">
                        Associate each machine with its location on the category image. This is required before closing.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        {savedMachines.map((m) => {
                            const isMapped = machinePositions.some((p) => p.machine === m.createdId);
                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border ${
                                        isMapped
                                            ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                                            : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                                    }`}
                                >
                                    <MapPin className="w-3 h-3" />
                                    {m.name || "Unnamed"}
                                    <span className="ml-1 text-[10px] opacity-70">
                                        {isMapped ? "mapped" : "not mapped"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <Button
                        type="button"
                        onClick={() => setShowImageMapper(true)}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] w-fit flex items-center gap-2"
                    >
                        <MapPin className="w-4 h-4" />
                        {allPositionsMapped ? "Edit Machine Positions" : "Open Image Mapper"}
                    </Button>
                </div>
            )}

            {/* Edit-mode footer: single Save Changes + Done. Replaces the
                per-row Update buttons that used to litter every machine, spare
                part and part. */}
            {isEditMode && (
                <div className="sticky bottom-0 bg-[#DFE6EC] border-t border-[#96A5BA] -mx-6 px-6 py-3 flex items-center justify-end gap-3 z-10">
                    <span className="text-[#6b7280] text-xs mr-auto">
                        Click Save Changes to persist all edits across category, machines, spare parts and parts.
                    </span>
                    <Button
                        type="button"
                        onClick={handleSaveAllEdits}
                        disabled={loading === "save-all"}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] min-w-[140px]"
                    >
                        {loading === "save-all" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            )}

            {/* Done - close modal when user is finished */}
            {categoryId && onComplete && (
                <div className="border-t border-[#607797] pt-5 flex justify-end gap-3">
                    {positionsRequired && !allPositionsMapped && (
                        <span className="text-[#ef4444] text-xs self-center mr-auto">
                            Map all machine positions before closing
                        </span>
                    )}
                    <Button
                        type="button"
                        onClick={handleAttemptClose}
                        variant="outline"
                        className="border-[#d1d5db] text-gray-900 hover:bg-[#e5e7eb] rounded-[10px]"
                    >
                        Done
                    </Button>
                </div>
            )}

            {/* Full-screen Image Mapper overlay */}
            {showImageMapper && categoryId && (categoryImageUrl || categoryImage) && (
                <MachineImageMapper
                    categoryImageUrl={
                        categoryImageUrl || (categoryImage ? URL.createObjectURL(categoryImage) : "")
                    }
                    machines={savedMachines.map((m) => ({
                        id: m.createdId!,
                        name: m.name,
                        imageUrl: m.imageUrl,
                    }))}
                    initialPositions={machinePositions}
                    onSave={handleSavePositions}
                    onClose={() => setShowImageMapper(false)}
                />
            )}
        </div>
    );
}
