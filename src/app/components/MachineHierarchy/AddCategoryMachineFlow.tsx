"use client";

import { useState, useCallback, useEffect, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Plus, Loader2, X, Pencil, MapPin } from "lucide-react";
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
        <label className="border border-dashed border-[#404040] rounded-[8px] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#505050] min-w-[80px] min-h-[80px] w-[80px] h-[80px] shrink-0 relative group">
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
                        <X className="w-4 h-4 text-white" />
                    </button>
                </>
            ) : (
                <Upload className="w-5 h-5 text-[#525252]" />
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
                <Label className="text-[#a1a1a1] text-[12px]">{label}</Label>
                <label className="border border-dashed border-[#404040] rounded-[8px] flex items-center justify-center overflow-hidden bg-[#171717] cursor-pointer hover:border-[#505050] min-h-[120px] relative group">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    {showPreview && previewSrc ? (
                        <div className="relative w-full h-full min-h-[120px] flex flex-col items-center justify-center p-2">
                            <span className="text-[#737373] text-[10px] uppercase tracking-wide mb-1">Preview</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewSrc} alt="Preview" className="max-w-full max-h-[140px] object-contain rounded flex-1" />
                            {file && (
                                <span className="text-white text-[10px] truncate max-w-full mt-1 bg-black/60 px-1.5 py-0.5 rounded">{file.name}</span>
                            )}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                title="Remove image"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    ) : (
                        <span className="text-[#a1a1a1] text-[12px] flex items-center gap-2 py-4">
                            <Upload className="w-4 h-4" /> Upload
                        </span>
                    )}
                </label>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[#a1a1a1] text-[14px]">{label}</Label>
            <label className="border-2 border-dashed border-[#404040] rounded-[10px] flex flex-col items-center justify-center min-h-[140px] py-4 px-4 bg-[#1f1f1f] cursor-pointer hover:border-[#505050] transition-colors overflow-hidden relative group">
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
                {showPreview && previewSrc ? (
                    <>
                        <span className="text-[#737373] text-xs uppercase tracking-wide mb-1">Image preview</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewSrc} alt="Preview" className="max-w-full max-h-[220px] object-contain rounded mb-1" />
                        {file ? (
                            <span className="text-white text-sm truncate max-w-full">{file.name}</span>
                        ) : null}
                        <span className="text-[#737373] text-xs mt-0.5">Click to replace</span>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-[#737373] mb-1" />
                        <span className="text-white text-[14px]">Upload image (PNG, JPG, WebP, max 5MB)</span>
                    </>
                )}
            </label>
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
}

interface MachineGalleryImage {
    id: string;
    file: File | null;
    imageUrl?: string | null;
}

interface MachineRow {
    id: string;
    name: string;
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
    parts: PartRow[];
}

interface PartRow {
    id: string;
    name: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
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
            parts?: Array<{ _id: string; name: string; imageUrl?: string | null }>;
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
            parts: (sp.parts ?? []).map((p) => ({
                id: p._id,
                name: p.name ?? "",
                imageFile: null,
                createdId: p._id,
                imageUrl: p.imageUrl ?? null,
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
                installationDate: "",
                imageFile: null,
                description: "",
                galleryImages: [],
                spareParts: [
                    { id: "sp1", name: "", klValue: "", imageFile: null, parts: [{ id: "p1", name: "", imageFile: null }] },
                ],
            },
        ],
        machinePositions,
    };
}

export default function AddCategoryMachineFlow({
    onSuccess,
    onComplete,
    compact = false,
    initialData,
    categoryIdForEdit,
    onCloseGuardChange,
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
            installationDate: "",
            imageFile: null,
            description: "",
            galleryImages: [],
            spareParts: [
                { id: "sp1", name: "", klValue: "", imageFile: null, parts: [{ id: "p1", name: "", imageFile: null }] },
            ],
        },
    ]);
    const [loading, setLoading] = useState<string | null>(null);
    const [editDataLoaded, setEditDataLoaded] = useState(false);
    const machinesSectionRef = useRef<HTMLDivElement>(null);
    const isEditMode = editDataLoaded && (!!categoryIdForEdit || !!initialData);

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
                setEditDataLoaded(true);
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load category for editing");
            })
            .finally(() => {
                if (!cancelled) setLoading(null);
            });
        return () => { cancelled = true; };
    }, [initialData, categoryIdForEdit, editDataLoaded]);

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
        setMachines((prev) => [
            ...prev,
            {
                id: `m_${Date.now()}`,
                name: "",
                installationDate: "",
                imageFile: null,
                description: "",
                galleryImages: [],
                spareParts: [
                    {
                        id: `sp_${Date.now()}`,
                        name: "",
                        klValue: "",
                        imageFile: null,
                        parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null }],
                    },
                ],
            },
        ]);
    }, []);

    const removeMachine = useCallback((id: string) => {
        setMachines((prev) => {
            const next = prev.filter((m) => m.id !== id);
            if (next.length === 0) {
                return [
                    {
                        id: `m_${Date.now()}`,
                        name: "",
                        installationDate: "",
                        imageFile: null,
                        description: "",
                        galleryImages: [],
                        spareParts: [
                            { id: `sp_${Date.now()}`, name: "", klValue: "", imageFile: null, parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null }] },
                        ],
                    },
                ];
            }
            return next;
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
            let firstCreatedId: string | null = null;
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
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add machine");
                }
                const data = await res.json();
                const machineId = data._id;
                await uploadEntityImage("machine", machineId, m.imageFile!);
                for (const gi of m.galleryImages) {
                    if (gi.file) {
                        await uploadMachineGalleryImage(machineId, gi.file);
                    }
                }
                if (!firstCreatedId) firstCreatedId = machineId;
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
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save machines");
        } finally {
            setLoading(null);
        }
    }, [categoryId, machines, uploadEntityImage, uploadMachineGalleryImage, onSuccess]);

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
                                parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null }],
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
                                  ? { ...s, parts: [...s.parts, { id: `p_${Date.now()}`, name: "", imageFile: null }] }
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
                setMachines((prev) =>
                    prev.map((m) =>
                        m.id === machineRowId
                            ? {
                                  ...m,
                                  spareParts: m.spareParts.map((s) =>
                                      s.id === sparePartId ? { ...s, imageUrl: undefined, imageFile: null } : s
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
                                  spareParts: m.spareParts.map((s) => (s.id === sparePartId ? { ...s, imageFile: null } : s)),
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
    }, [machines, isDuplicateKlValue, uploadEntityImage, onSuccess]);

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
            if (pt.imageFile) {
                await uploadEntityImage("part", pt.createdId, pt.imageFile);
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
                                                    p.id === partId ? { ...p, imageUrl: undefined, imageFile: null } : p
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
                                                parts: s.parts.map((p) => (p.id === partId ? { ...p, imageFile: null } : p)),
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
    }, [machines, uploadEntityImage, onSuccess]);

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
                                      parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null }],
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
    }, [machines, isDuplicateKlValue, uploadEntityImage, onSuccess]);

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
        : "bg-[#171717] border border-[#262626] rounded-[10px] p-6 flex flex-col gap-5";

    if (loading === "edit-load") {
        return (
            <div className={containerClass}>
                <div className="flex items-center gap-2 text-[#a1a1a1]">
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
                <h3 className="text-white text-base font-medium">1. Machine Category</h3>
                <div className="flex flex-col gap-2">
                    <Label className="text-[#a1a1a1] text-[14px]">Category Name</Label>
                    <Input
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="e.g. Pulping and Detrashing"
                        className="bg-[#262626] border-[#404040] h-[44px] rounded-[10px] px-4 text-white placeholder:text-[#525252]"
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
                                <Label className="text-[#a1a1a1] text-[12px]">Category Image</Label>
                                <div className="rounded-[8px] overflow-hidden border border-[#404040] bg-[#171717] w-full max-w-[200px] h-[120px] flex items-center justify-center">
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
                                className="border-[#404040] text-[#a1a1a1] hover:bg-[#262626] h-8 gap-1.5"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit name & image
                            </Button>
                        </div>
                    </div>
                )}
                {categoryId && editingCategory && (
                    <div className="bg-[#262626] border border-[#404040] rounded-[10px] p-4 flex flex-col gap-3">
                        <Label className="text-[#a1a1a1] text-[14px]">Edit Category Name</Label>
                        <Input
                            value={categoryEditName}
                            onChange={(e) => setCategoryEditName(e.target.value)}
                            placeholder="Category name"
                            className="bg-[#171717] border-[#404040] h-[40px] rounded-[8px] px-3 text-white"
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
                                className="text-[#a1a1a1] hover:bg-[#404040]"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Machines - only after category is added */}
            {categoryId && (
                <div ref={machinesSectionRef} className="flex flex-col gap-4 border-t border-[#262626] pt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white text-base font-medium">2. Machines</h3>
                        <Button
                            type="button"
                            onClick={addMachine}
                            className="bg-[#404040] hover:bg-[#505050] text-white rounded-[10px] h-9 px-3 flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Machine
                        </Button>
                    </div>
                    {machines.map((m) => (
                        <div
                            key={m.id}
                            className="bg-[#262626] border border-[#404040] rounded-[10px] p-4 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium">Machine</span>
                                {!m.createdId && (
                                    <button
                                        type="button"
                                        onClick={() => removeMachine(m.id)}
                                        className="p-1.5 rounded-md text-[#a1a1a1] hover:bg-[#404040] hover:text-white"
                                        title="Remove machine"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#a1a1a1] text-[12px]">Machine Name</Label>
                                    <Input
                                        value={m.name}
                                        onChange={(e) => updateMachine(m.id, "name", e.target.value)}
                                        placeholder="e.g. Hydrapulper"
                                        className="bg-[#171717] border-[#404040] h-[40px] rounded-[8px] px-3 text-white text-[13px] placeholder:text-[#525252]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#a1a1a1] text-[12px]">Installation Date</Label>
                                    <Input
                                        type="date"
                                        value={m.installationDate || ""}
                                        onChange={(e) => updateMachine(m.id, "installationDate", e.target.value)}
                                        className="bg-[#171717] border-[#404040] h-[40px] rounded-[8px] px-3 text-white text-[13px]"
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
                                <Label className="text-[#a1a1a1] text-[12px]">Machine description</Label>
                                <textarea
                                    value={m.description ?? ""}
                                    onChange={(e) => updateMachine(m.id, "description", e.target.value)}
                                    placeholder="e.g. High-capacity hydrapulper for stock preparation"
                                    rows={2}
                                    className="bg-[#171717] border border-[#404040] rounded-[8px] px-3 py-2 text-white text-[13px] placeholder:text-[#525252] resize-y min-h-[60px]"
                                />
                            </div>
                            {/* <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[#a1a1a1] text-[12px]">Additional images</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addMachineGalleryImage(m.id)}
                                        className="h-7 px-2 text-[#a1a1a1] hover:bg-[#404040] hover:text-white text-xs"
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
                                                className="relative w-20 h-20 rounded-lg border border-[#404040] bg-[#171717] overflow-hidden flex items-center justify-center"
                                            >
                                                {gi.file ? (
                                                    <img
                                                        src={URL.createObjectURL(gi.file)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : gi.imageUrl ? (
                                                    <img src={gi.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[#525252] text-xs">No preview</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMachineGalleryImage(m.id, gi.id)}
                                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-[#bf1e21] text-xs"
                                                >
                                                    ×
                                                </button>
                                                <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 hover:bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
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
                            </div> */}
                                            {m.createdId && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleUpdateMachine(m.id)}
                                                        disabled={loading === `machine-update-${m.id}` || !m.name.trim()}
                                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] w-fit"
                                                    >
                                                        {loading === `machine-update-${m.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update machine"}
                                                    </Button>
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
                                <div className="flex flex-col gap-4 border-t border-[#404040] pt-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-white text-sm font-medium">Spare Parts & Parts</h4>
                                        <Button
                                            type="button"
                                            onClick={() => addSparePart(m.id)}
                                            className="bg-[#404040] hover:bg-[#505050] text-white rounded-[8px] h-8 px-2 flex items-center gap-1.5 text-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Spare Part
                                        </Button>
                                    </div>
                                    {m.spareParts.map((sp) => (
                                        <div
                                            key={sp.id}
                                            className="bg-[#171717] border border-[#404040] rounded-[8px] p-3 flex flex-col gap-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#a1a1a1] text-xs font-medium">Spare Part</span>
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
                                                            className="p-1 rounded text-[#a1a1a1] hover:bg-[#404040] hover:text-white"
                                                            title="Remove spare part"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#a1a1a1] text-[11px]">Spare Part Name</Label>
                                                    <Input
                                                        value={sp.name}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "name", e.target.value)}
                                                        placeholder="e.g. Rotor, Bedplate"
                                                        className="bg-[#0d0d0d] border-[#404040] h-[36px] rounded-[6px] px-2 text-white text-[12px] placeholder:text-[#525252]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#a1a1a1] text-[11px]">KL Value (Model Number)</Label>
                                                    <Input
                                                        value={sp.klValue}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "klValue", e.target.value)}
                                                        placeholder="Unique ID"
                                                        className="bg-[#0d0d0d] border-[#404040] h-[36px] rounded-[6px] px-2 text-white text-[12px] placeholder:text-[#525252]"
                                                    />
                                                </div>
                                            </div>
                                            <ImageUploadBox
                                                file={sp.imageFile}
                                                onFileChange={(f) => updateSparePart(m.id, sp.id, "imageFile", f)}
                                                label="Spare Part Image (required for new)"
                                                compact
                                                existingUrl={sp.imageUrl}
                                                onClearExisting={() =>
                                                    setMachines((prev) =>
                                                        prev.map((x) =>
                                                            x.id === m.id
                                                                ? {
                                                                      ...x,
                                                                      spareParts: x.spareParts.map((s) =>
                                                                          s.id === sp.id ? { ...s, imageFile: null, imageUrl: null } : s
                                                                      ),
                                                                  }
                                                                : x
                                                        )
                                                    )
                                                }
                                            />
                                            {sp.createdId && (
                                                <div className="flex items-center gap-2">
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
                                                    <Label className="text-[#a1a1a1] text-[11px]">Parts (name + image per part)</Label>
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
                                                    <div key={pt.id} className="flex items-center gap-2 bg-[#0d0d0d] rounded-[6px] p-2">
                                                        <Input
                                                            value={pt.name}
                                                            onChange={(e) => updatePart(m.id, sp.id, pt.id, "name", e.target.value)}
                                                            placeholder="e.g. Power Saver, Foil"
                                                            className="bg-[#0a0a0a] border-[#404040] h-[32px] rounded-[4px] px-2 text-white text-[11px] flex-1"
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
                                                            <button
                                                                type="button"
                                                                onClick={() => removePart(m.id, sp.id, pt.id)}
                                                                className="p-1 text-[#737373] hover:text-red-400 shrink-0"
                                                                title="Remove part"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
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
                                </div>
                            )}
                        </div>
                    ))}
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
                </div>
            )}

            {/* 3. Map Machine Positions - shown when category image + saved machines exist */}
            {categoryId && hasCategoryImage && savedMachines.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#262626] pt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white text-base font-medium">3. Map Machine Positions</h3>
                        {allPositionsMapped && (
                            <span className="text-[#22c55e] text-xs font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> All mapped
                            </span>
                        )}
                    </div>
                    <p className="text-[#a1a1a1] text-sm">
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

            {/* Done - close modal when user is finished */}
            {categoryId && onComplete && (
                <div className="border-t border-[#262626] pt-5 flex justify-end gap-3">
                    {positionsRequired && !allPositionsMapped && (
                        <span className="text-[#ef4444] text-xs self-center mr-auto">
                            Map all machine positions before closing
                        </span>
                    )}
                    <Button
                        type="button"
                        onClick={handleAttemptClose}
                        variant="outline"
                        className="border-[#404040] text-white hover:bg-[#262626] rounded-[10px]"
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
