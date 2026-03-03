"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Plus, Loader2, X, Pencil } from "lucide-react";
import { toast } from "sonner";

/** Stable component: file preview or upload placeholder. Prevents remount glitch on parent re-render. */
const PartImageUpload = memo(function PartImageUpload({
    file,
    onFileChange,
}: {
    file: File | null;
    onFileChange: (f: File | null) => void;
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
    return (
        <label className="border border-dashed border-[#404040] rounded-[6px] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#505050] min-w-[80px] h-[36px] shrink-0">
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
                <Upload className="w-3 h-3 text-[#525252]" />
            )}
        </label>
    );
});

/** Stable component: image upload with optional existing URL and compact mode. Prevents remount glitch on parent re-render. */
const ImageUploadBox = memo(function ImageUploadBox({
    file,
    onFileChange,
    label,
    compact,
    existingUrl,
}: {
    file: File | null;
    onFileChange: (f: File | null) => void;
    label: string;
    compact?: boolean;
    existingUrl?: string | null;
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

    if (compact) {
        return (
            <div className="flex flex-col gap-1.5">
                <Label className="text-[#a1a1a1] text-[12px]">{label}</Label>
                <label className="border border-dashed border-[#404040] rounded-[8px] flex items-center justify-center overflow-hidden bg-[#171717] cursor-pointer hover:border-[#505050] min-h-[74px] relative">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    {showPreview && previewSrc ? (
                        <div className="relative w-full h-full min-h-[74px] flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewSrc} alt="Preview" className="max-w-full max-h-[120px] object-contain rounded" />
                            {file && (
                                <span className="absolute bottom-1 left-1 right-1 text-white text-[10px] truncate bg-black/60 px-1 rounded">{file.name}</span>
                            )}
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
            <label className="border-2 border-dashed border-[#404040] rounded-[10px] flex flex-col items-center justify-center min-h-[140px] py-4 px-4 bg-[#1f1f1f] cursor-pointer hover:border-[#505050] transition-colors overflow-hidden relative">
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                />
                {showPreview && previewSrc ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewSrc} alt="Preview" className="max-w-full max-h-[200px] object-contain rounded mb-1" />
                        {file ? (
                            <span className="text-white text-sm truncate max-w-full">{file.name}</span>
                        ) : null}
                        <span className="text-[#737373] text-xs mt-0.5">Click to replace</span>
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
}

interface MachineRow {
    id: string;
    name: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
    spareParts: SparePartRow[];
}

interface SparePartRow {
    id: string;
    name: string;
    lifeTimeValue: string;
    lifeTimeUnit: string;
    imageFile: File | null;
    createdId?: string;
    parts: PartRow[];
}

interface PartRow {
    id: string;
    name: string;
    imageFile: File | null;
    createdId?: string;
}

export default function AddCategoryMachineFlow({
    onSuccess,
    onComplete,
    compact = false,
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
            imageFile: null,
            spareParts: [
                { id: "sp1", name: "", lifeTimeValue: "0", lifeTimeUnit: "Hrs", imageFile: null, parts: [{ id: "p1", name: "", imageFile: null }] },
            ],
        },
    ]);
    const [loading, setLoading] = useState<string | null>(null);

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
        if (!categoryEditImage && !categoryImage) {
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
    }, [categoryId, categoryName, categoryEditName, categoryEditImage, categoryImage, uploadEntityImage, onSuccess]);

    const addMachine = useCallback(() => {
        setMachines((prev) => [
            ...prev,
            {
                id: `m_${Date.now()}`,
                name: "",
                imageFile: null,
                spareParts: [
                    {
                        id: `sp_${Date.now()}`,
                        name: "",
                        lifeTimeValue: "0",
                        lifeTimeUnit: "Hrs",
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
                        imageFile: null,
                        spareParts: [
                            { id: `sp_${Date.now()}`, name: "", lifeTimeValue: "0", lifeTimeUnit: "Hrs", imageFile: null, parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null }] },
                        ],
                    },
                ];
            }
            return next;
        });
    }, []);

    const updateMachine = useCallback((id: string, field: keyof MachineRow, value: string | File | null | undefined) => {
        setMachines((prev) =>
            prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
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
                    body: JSON.stringify({ name, category: categoryId, isActive: true }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add machine");
                }
                const data = await res.json();
                await uploadEntityImage("machine", data._id, m.imageFile!);
                if (!firstCreatedId) firstCreatedId = data._id;
                setMachines((prev) =>
                    prev.map((x) =>
                        x.id === m.id
                            ? { ...x, createdId: data._id, imageUrl: undefined }
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
    }, [categoryId, machines, uploadEntityImage, onSuccess]);

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
                                lifeTimeValue: "0",
                                lifeTimeUnit: "Hrs",
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

    const handleSaveSparePartsAndParts = useCallback(async (machineRowId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        if (!machine?.createdId) {
            toast.error("Save the machine first");
            return;
        }
        const validSpareParts = machine.spareParts.filter((sp) => sp.name.trim() && sp.imageFile);
        if (validSpareParts.length === 0) {
            toast.error("Add at least one spare part with name and image to save");
            return;
        }
        setLoading(`spare-${machineRowId}`);
        try {
            for (const sp of validSpareParts) {
                const name = sp.name.trim();
                const lifeTime = {
                    value: parseInt(sp.lifeTimeValue, 10) || 0,
                    unit: sp.lifeTimeUnit || "Hrs",
                };
                const res = await fetch("/api/machines/spare-parts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, machineID: machine.createdId, lifeTime }),
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
                                      lifeTimeValue: "0",
                                      lifeTimeUnit: "Hrs",
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
    }, [machines, uploadEntityImage, onSuccess]);

    const containerClass = compact
        ? "flex flex-col gap-5"
        : "bg-[#171717] border border-[#262626] rounded-[10px] p-6 flex flex-col gap-5";

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
                        disabled={!!categoryId}
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
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[#00a82d] text-sm">Category added. Continue to Machine below.</p>
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
                            Edit
                        </Button>
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
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveCategoryEdit}
                                disabled={loading === "category-edit" || !(categoryEditImage || categoryImage)}
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
                <div className="flex flex-col gap-4 border-t border-[#262626] pt-5">
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
                                        disabled={!!m.createdId}
                                    />
                                </div>
                                <ImageUploadBox
                                    file={m.imageFile}
                                    onFileChange={(f) => updateMachine(m.id, "imageFile", f)}
                                    label="Machine Image (required)"
                                    compact
                                    existingUrl={m.imageUrl}
                                />
                            </div>
                            {m.createdId && (
                                <p className="text-[#00a82d] text-xs">Saved</p>
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
                                                <button
                                                    type="button"
                                                    onClick={() => removeSparePart(m.id, sp.id)}
                                                    className="p-1 rounded text-[#a1a1a1] hover:bg-[#404040] hover:text-white"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
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
                                                    <Label className="text-[#a1a1a1] text-[11px]">Lifetime (value / unit)</Label>
                                                    <div className="flex gap-1.5">
                                                        <Input
                                                            value={sp.lifeTimeValue}
                                                            onChange={(e) => updateSparePart(m.id, sp.id, "lifeTimeValue", e.target.value)}
                                                            placeholder="0"
                                                            className="bg-[#0d0d0d] border-[#404040] h-[36px] rounded-[6px] px-2 text-white text-[12px]"
                                                        />
                                                        <Input
                                                            value={sp.lifeTimeUnit}
                                                            onChange={(e) => updateSparePart(m.id, sp.id, "lifeTimeUnit", e.target.value)}
                                                            placeholder="Hrs"
                                                            className="bg-[#0d0d0d] border-[#404040] h-[36px] rounded-[6px] px-2 text-white text-[12px] w-16"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <ImageUploadBox
                                                file={sp.imageFile}
                                                onFileChange={(f) => updateSparePart(m.id, sp.id, "imageFile", f)}
                                                label="Spare Part Image (required)"
                                                compact
                                            />
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
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePart(m.id, sp.id, pt.id)}
                                                            className="p-1 text-[#737373] hover:text-red-400"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
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
                                            m.spareParts.every((s) => !s.name.trim() || !s.imageFile)
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

            {/* Done - close modal when user is finished */}
            {categoryId && onComplete && (
                <div className="border-t border-[#262626] pt-5 flex justify-end">
                    <Button
                        type="button"
                        onClick={() => onComplete()}
                        variant="outline"
                        className="border-[#404040] text-white hover:bg-[#262626] rounded-[10px]"
                    >
                        Done
                    </Button>
                </div>
            )}
        </div>
    );
}
