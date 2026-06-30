"use client";

import { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, Plus, Loader2, X, Pencil, MapPin, Video, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";
import MachineImageMapper, { type MachinePosition } from "./MachineImageMapper";
import { AddMachineFormModal, AddSparePartFormModal } from "./AddEntityModals";
import DeleteConfirmModal from "@/app/components/Modals/DeleteConfirmModal";
import ImageUploadModal from "./ImageUploadModal";
import VideoUploadModal from "./VideoUploadModal";
import { uploadEntityImageDirect } from "@/lib/uploadImage";

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
    const [modalOpen, setModalOpen] = useState(false);
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
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setModalOpen(true)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalOpen(true); } }}
                    className="border border-dashed border-[#d1d5db] rounded-[8px] flex items-center justify-center overflow-hidden bg-white cursor-pointer hover:border-[#96A5BA] min-h-[120px] relative group"
                >
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
                        <span className="text-muted-foreground text-[12px] flex items-center gap-2 py-4">
                            <Upload className="w-4 h-4" /> Upload <span className="text-orange font-medium">Image</span>
                        </span>
                    )}
                </div>
                <ImageUploadModal open={modalOpen} onClose={() => setModalOpen(false)} title={`Upload ${label}`} currentImageUrl={previewSrc} onSave={async (f) => { onFileChange(f); }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[#6b7280] text-[14px]">{label}</Label>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setModalOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalOpen(true); } }}
                className="border-2 border-dashed border-[#d1d5db] rounded-[10px] flex flex-col items-center justify-center min-h-[140px] py-4 px-4 bg-white cursor-pointer hover:border-[#96A5BA] transition-colors overflow-hidden relative group"
            >
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
                        <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                        <span className="text-foreground text-[14px]">Upload <span className="text-orange font-medium">image</span> (PNG, JPG, WebP, max 5MB)</span>
                    </>
                )}
            </div>
            <ImageUploadModal open={modalOpen} onClose={() => setModalOpen(false)} title={`Upload ${label}`} currentImageUrl={previewSrc} onSave={async (f) => { onFileChange(f); }} />
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
                <label className="border border-dashed border-[#d1d5db] rounded-[8px] flex items-center justify-center overflow-hidden bg-white cursor-pointer hover:border-[#96A5BA] min-h-[110px]">
                    <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    <span className="text-muted-foreground text-[12px] flex items-center gap-2 py-4">
                        <Video className="w-4 h-4" /> Upload <span className="text-orange font-medium">Video</span> (MP4, WebM, max 50MB)
                    </span>
                </label>
            )}
        </div>
    );
});

export interface AddCategoryMachineFlowProps {
    onSuccess?: () => void;
    onComplete?: () => void;
    /** Called right after a brand-new category is created, so the parent can list it immediately. */
    onCategoryCreated?: (cat: { _id: string; name: string }) => void;
    /** When true, show as compact section (e.g. inside Add Customer form); when false, show as full modal content */
    compact?: boolean;
    /** Pre-loaded full category hierarchy. When set, form is in edit mode. */
    initialData?: CategoryFullPayload | null;
    /** When set, fetch full category and pre-populate form for editing. Ignored if initialData is set. */
    categoryIdForEdit?: string | null;
    /** Called whenever the "can close" status changes. Parent should use this to guard close actions. */
    onCloseGuardChange?: (blocked: boolean) => void;
    /** Called whenever unsaved-changes status changes so the parent can show a confirmation before closing. */
    onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
    /** Parent assigns this ref to receive a handle that triggers save programmatically (e.g. "Save & Close"). */
    saveRef?: { current: (() => Promise<void>) | null };
    /** Called after machines are persisted so a parent (e.g. onboarding form) can link them to a client. */
    onMachinesCreated?: (machineIds: string[]) => void;
    /** When set, machines are filtered to only those linked to this client. */
    clientID?: string;
    /** Open this machine/spare-part after edit data loads. */
    focusTarget?: AddCategoryMachineFlowFocusTarget | null;
}

export interface AddCategoryMachineFlowFocusTarget {
    machineId?: string;
    sparePartId?: string;
    requestId: number;
}

interface MachineGalleryImage {
    id: string;
    file: File | null;
    imageUrl?: string | null;
    imageName?: string | null;
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
    deletedGalleryImageNames: string[];
    spareParts: SparePartRow[];
}

interface SparePartRow {
    id: string;
    name: string;
    klValue: string;
    lifetimeText: string;
    rotorType: "New" | "Rebuilt";
    rebuildsPossible: number;
    isActive: boolean;
    lastServiceDate: string;
    sparePartInstallationDate: string;
    imageFile: File | null;
    createdId?: string;
    imageUrl?: string | null;
    imageUrls: string[];
    pendingImageFiles: File[];
    optimalStateVideoFile: File | null;
    optimalStateVideoUrl?: string | null;
    parts: PartRow[];
}

interface ClientSparePartDetails {
    _id: string;
    lastServiceDate?: string | null;
    sparePartInstallationDate?: string | null;
    lifetimeText?: string | null;
    lifetimeOfRotor?: { value?: number; unit?: string };
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    isActive?: boolean;
    rebuildLifetimeText?: string | null;
    rebuildLifetime?: { value?: number; unit?: string };
}

interface ClientSparePartHydrationItem extends ClientSparePartDetails {
    clientMachineSparePart?: ClientSparePartDetails | null;
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

const isBlankPartRow = (pt: PartRow): boolean =>
    !pt.createdId &&
    !pt.name.trim() &&
    !pt.imageFile &&
    !pt.optimalStateVideoFile;

const isBlankSparePartRow = (sp: SparePartRow): boolean =>
    !sp.createdId &&
    !sp.name.trim() &&
    !sp.klValue.trim() &&
    !sp.lifetimeText.trim() &&
    sp.rotorType === "New" &&
    sp.rebuildsPossible === 0 &&
    sp.isActive === true &&
    !sp.lastServiceDate &&
    !sp.sparePartInstallationDate &&
    !sp.imageFile &&
    sp.pendingImageFiles.length === 0 &&
    !sp.optimalStateVideoFile &&
    sp.parts.every(isBlankPartRow);

const isBlankMachineRow = (m: MachineRow): boolean =>
    !m.createdId &&
    !m.name.trim() &&
    !m.modelNumber.trim() &&
    !m.installationDate &&
    !m.imageFile &&
    !m.description.trim() &&
    m.galleryImages.every((image) => !image.file) &&
    m.deletedGalleryImageNames.length === 0 &&
    m.spareParts.every(isBlankSparePartRow);

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
            lifetimeText?: string | null;
            rotorType?: "New" | "Rebuilt";
            rebuildsPossible?: number;
            isActive?: boolean;
            rebuildLifetimeText?: string | null;
            lifeTime?: { value?: number; unit?: string };
            lastServiceDate?: string | null;
            sparePartInstallationDate?: string | null;
            imageUrl?: string | null;
            optimalStateVideoUrl?: string | null;
            parts?: Array<{ _id: string; name: string; imageUrl?: string | null; optimalStateVideoUrl?: string | null }>;
        }>;
    }>;
}

const toDateInputValue = (value?: string | Date | null) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

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
        galleryImages: ((m as { galleryWithUrls?: Array<{ imageUrl?: string; imageName?: string }> }).galleryWithUrls ?? []).map((g, i) => ({
            id: `gi_${m._id}_${i}`,
            file: null,
            imageUrl: g.imageUrl ?? null,
            imageName: g.imageName ?? null,
        })),
        deletedGalleryImageNames: [],
        spareParts: (m.spareParts ?? []).map((sp) => ({
            id: sp._id,
            name: sp.name ?? "",
            klValue: sp.klValue ?? "",
            lifetimeText: sp.lifetimeText ?? "",
            rotorType: sp.rotorType === "Rebuilt" ? "Rebuilt" : "New",
            rebuildsPossible: Math.max(0, Number(sp.rebuildsPossible) || 0),
            isActive: sp.isActive !== false,
            lastServiceDate: toDateInputValue(sp.lastServiceDate),
            sparePartInstallationDate: toDateInputValue(sp.sparePartInstallationDate),
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
                deletedGalleryImageNames: [],
                spareParts: [
                    { id: "sp1", name: "", klValue: "", lifetimeText: "", rotorType: "New", rebuildsPossible: 0, isActive: true, lastServiceDate: "", sparePartInstallationDate: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: "p1", name: "", imageFile: null, optimalStateVideoFile: null }] },
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
    deletedGalleryImageNames: [],
    spareParts: [
        { id: `sp_${Date.now()}`, name: "", klValue: "", lifetimeText: "", rotorType: "New", rebuildsPossible: 0, isActive: true, lastServiceDate: "", sparePartInstallationDate: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: `p_${Date.now()}`, name: "", imageFile: null, optimalStateVideoFile: null }] },
    ],
});

export default function AddCategoryMachineFlow({
    onSuccess,
    onComplete,
    onCategoryCreated,
    compact = false,
    initialData,
    categoryIdForEdit,
    onCloseGuardChange,
    onHasUnsavedChangesChange,
    saveRef,
    onMachinesCreated,
    clientID,
    focusTarget,
}: AddCategoryMachineFlowProps) {
    const [categoryName, setCategoryName] = useState("");
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState(false);
    const [categoryEditName, setCategoryEditName] = useState("");
    const [categoryEditImage, setCategoryEditImage] = useState<File | null>(null);
    // Accordion open/close state for machine + spare-part cards (default: open when new/unsaved).
    const [openMachines, setOpenMachines] = useState<Record<string, boolean>>({});
    const [openSpareParts, setOpenSpareParts] = useState<Record<string, boolean>>({});
    // "Add Machine" / "Add Spare Part" modals (the latter holds the target machine's DB id).
    const [addMachineModalOpen, setAddMachineModalOpen] = useState(false);
    const [addSparePartForMachine, setAddSparePartForMachine] = useState<string | null>(null);
    // Generic confirm modal used for all delete / remove-media actions.
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; run: () => void | Promise<void> } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    // Shared image upload/replace modal (with sharp compression).
    const [imageModal, setImageModal] = useState<{ title: string; currentUrl: string | null; onSave: (file: File) => Promise<void> } | null>(null);
    const [videoModal, setVideoModal] = useState<{ title: string; currentUrl: string | null; onSave: (file: File) => Promise<void> } | null>(null);
    const [machines, setMachines] = useState<MachineRow[]>([
        {
            id: "m1",
            name: "",
            modelNumber: "",
            installationDate: "",
            imageFile: null,
            description: "",
            galleryImages: [],
            deletedGalleryImageNames: [],
            spareParts: [
                { id: "sp1", name: "", klValue: "", lifetimeText: "", rotorType: "New", rebuildsPossible: 0, isActive: true, lastServiceDate: "", sparePartInstallationDate: "", imageFile: null, imageUrls: [], pendingImageFiles: [], optimalStateVideoFile: null, parts: [{ id: "p1", name: "", imageFile: null, optimalStateVideoFile: null }] },
            ],
        },
    ]);
    const [loading, setLoading] = useState<string | null>(null);
    const [editDataLoaded, setEditDataLoaded] = useState(false);
    const machinesSectionRef = useRef<HTMLDivElement>(null);
    const focusTargetRef = useRef<HTMLDivElement>(null);
    const appliedFocusKeyRef = useRef<string | null>(null);
    const isEditMode = editDataLoaded && (!!categoryIdForEdit || !!initialData);

    // Snapshot of the persisted row state when the modal first loads edit data.
    // Used by handleSaveAllEdits to skip PUT calls for rows whose text fields
    // are unchanged and whose user hasn't picked a new image/video, so a
    // single image upload doesn't fan out into N spare-part PUTs.
    type BaselineMachine = { name: string; modelNumber: string; description: string; installationDate: string };
    type BaselineSparePart = { name: string; klValue: string; lifetimeText: string; rotorType: "New" | "Rebuilt"; rebuildsPossible: number; isActive: boolean; lastServiceDate: string; sparePartInstallationDate: string };
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
                        lifetimeText: sp.lifetimeText || "",
                        rotorType: sp.rotorType === "Rebuilt" ? "Rebuilt" : "New",
                        rebuildsPossible: Math.max(0, Number(sp.rebuildsPossible) || 0),
                        isActive: sp.isActive !== false,
                        lastServiceDate: sp.lastServiceDate || "",
                        sparePartInstallationDate: sp.sparePartInstallationDate || "",
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
        if (!m.createdId) return !isBlankMachineRow(m);
        if (m.imageFile) return true;
        if (m.galleryImages.some((g) => g.file)) return true;
        if (m.deletedGalleryImageNames.length > 0) return true;
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
        if (!sp.createdId) return !isBlankSparePartRow(sp);
        if (sp.imageFile) return true;
        if (sp.optimalStateVideoFile) return true;
        const b = sparePartBaselineRef.current.get(sp.createdId);
        if (!b) return true;
        return (
            (sp.name || "") !== b.name ||
            (sp.klValue || "") !== b.klValue ||
            (sp.lifetimeText || "") !== b.lifetimeText ||
            (sp.rotorType || "New") !== b.rotorType ||
            Math.max(0, Number(sp.rebuildsPossible) || 0) !== b.rebuildsPossible ||
            (sp.isActive !== false) !== b.isActive ||
            (sp.lastServiceDate || "") !== b.lastServiceDate ||
            (sp.sparePartInstallationDate || "") !== b.sparePartInstallationDate
        );
    }, []);

    const isPartDirty = useCallback((pt: PartRow): boolean => {
        if (!pt.createdId) return !isBlankPartRow(pt);
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

    const hasUnsavedChanges = useMemo(() => {
        if (isCategoryDirty()) return true;
        for (const m of machines) {
            if (isMachineDirty(m)) return true;
            for (const sp of m.spareParts) {
                if (isSparePartDirty(sp)) return true;
                for (const pt of sp.parts) {
                    if (isPartDirty(pt)) return true;
                }
            }
        }
        return false;
    }, [machines, isCategoryDirty, isMachineDirty, isSparePartDirty, isPartDirty]);

    useEffect(() => {
        onHasUnsavedChangesChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onHasUnsavedChangesChange]);

    const handleAttemptClose = useCallback(() => {
        if (closeBlocked) {
            toast.error("Please map all machine positions on the category image before closing.");
            return;
        }
        onComplete?.();
    }, [closeBlocked, onComplete]);

    const hydrateClientSparePartDates = useCallback(async (rows: MachineRow[]) => {
        if (!clientID) return rows;

        return Promise.all(
            rows.map(async (machine) => {
                if (!machine.createdId) return machine;
                try {
                    const res = await fetch(`/api/products/${encodeURIComponent(clientID)}/spare-parts/${encodeURIComponent(machine.createdId)}`);
                    if (!res.ok) throw new Error("Failed to load client spare-part details");
                    const responseData = await res.json();
                    const items = ((responseData.spareParts || responseData) ?? []) as ClientSparePartHydrationItem[];
                    const detailsById = new Map(
                        items.map((item) => [
                            String(item._id),
                            {
                                ...item,
                                ...(item.clientMachineSparePart || {}),
                            } as ClientSparePartDetails,
                        ])
                    );

                    return {
                        ...machine,
                        spareParts: machine.spareParts.map((sp) => {
                            const detail = sp.createdId ? detailsById.get(sp.createdId) : null;
                            if (!detail) return sp;
                            const rotorType: SparePartRow["rotorType"] =
                                detail.rotorType === "Rebuilt" ? "Rebuilt" : "New";
                            return {
                                ...sp,
                                lifetimeText: detail.lifetimeText || detail.rebuildLifetimeText || sp.lifetimeText || "",
                                rotorType,
                                rebuildsPossible: Math.max(0, Number(detail.rebuildsPossible) || 0),
                                isActive: detail.isActive !== false,
                                lastServiceDate: toDateInputValue(detail.lastServiceDate),
                                sparePartInstallationDate: toDateInputValue(detail.sparePartInstallationDate),
                            };
                        }),
                    };
                } catch (error) {
                    console.warn("Failed to hydrate client spare-part dates", { machineId: machine.createdId, error });
                    return machine;
                }
            })
        );
    }, [clientID]);

    useEffect(() => {
        if (editDataLoaded) return;
        if (initialData) {
            let cancelled = false;
            const loadInitial = async () => {
                const mapped = mapCategoryFullToState(initialData);
                const machinesWithDates = await hydrateClientSparePartDates(mapped.machines);
                if (cancelled) return;
                setCategoryName(mapped.categoryName);
                setCategoryImageUrl(mapped.categoryImageUrl);
                setCategoryId(mapped.categoryId);
                setMachines(machinesWithDates);
                setMachinePositions(mapped.machinePositions);
                captureBaseline(machinesWithDates, mapped.categoryName, mapped.categoryImageUrl);
                setEditDataLoaded(true);
            };
            loadInitial();
            return () => { cancelled = true; };
        }
        if (!categoryIdForEdit?.trim()) return;
        let cancelled = false;
        setLoading("edit-load");
        fetch(`/api/machines/machine-category/${encodeURIComponent(categoryIdForEdit)}/full${clientID ? `?clientId=${encodeURIComponent(clientID)}` : ""}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load category");
                return res.json();
            })
            .then(async (payload: CategoryFullPayload) => {
                if (cancelled) return;
                const mapped = mapCategoryFullToState(payload);
                const machinesWithDates = await hydrateClientSparePartDates(mapped.machines);
                if (cancelled) return;
                setCategoryName(mapped.categoryName);
                setCategoryImageUrl(mapped.categoryImageUrl);
                setCategoryId(mapped.categoryId);
                setMachines(machinesWithDates);
                setMachinePositions(mapped.machinePositions);
                captureBaseline(machinesWithDates, mapped.categoryName, mapped.categoryImageUrl);
                setEditDataLoaded(true);
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load category for editing");
            })
            .finally(() => {
                if (!cancelled) setLoading(null);
            });
        return () => { cancelled = true; };
    }, [initialData, categoryIdForEdit, editDataLoaded, captureBaseline, hydrateClientSparePartDates, clientID]);

    // When edit data has just loaded, scroll machines section into view so pre-populated content is visible
    useEffect(() => {
        if (!editDataLoaded || (!categoryIdForEdit && !initialData)) return;
        const t = setTimeout(() => {
            machinesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return () => clearTimeout(t);
    }, [editDataLoaded, categoryIdForEdit, initialData]);

    useEffect(() => {
        if (!editDataLoaded || !focusTarget) return;

        const focusKey = [
            focusTarget.requestId,
            focusTarget.machineId ?? "",
            focusTarget.sparePartId ?? "",
        ].join(":");
        if (appliedFocusKeyRef.current === focusKey) return;

        const targetMachine = focusTarget.machineId
            ? machines.find((m) => m.createdId === focusTarget.machineId || m.id === focusTarget.machineId)
            : focusTarget.sparePartId
                ? machines.find((m) => m.spareParts.some((sp) => sp.createdId === focusTarget.sparePartId || sp.id === focusTarget.sparePartId))
                : null;
        if (!targetMachine) return;

        const targetSparePart = focusTarget.sparePartId
            ? targetMachine.spareParts.find((sp) => sp.createdId === focusTarget.sparePartId || sp.id === focusTarget.sparePartId)
            : null;
        if (focusTarget.sparePartId && !targetSparePart) return;

        setOpenMachines((prev) => ({ ...prev, [targetMachine.id]: true }));
        if (targetSparePart) {
            setOpenSpareParts((prev) => ({ ...prev, [targetSparePart.id]: true }));
        }

        appliedFocusKeyRef.current = focusKey;
        const t = window.setTimeout(() => {
            focusTargetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
        return () => window.clearTimeout(t);
    }, [editDataLoaded, focusTarget, machines]);

    // Both helpers upload directly to S3 via a presigned PUT (see lib/uploadImage),
    // so a full-size Original of ANY size goes through — not just sub-4.5 MB files.
    const uploadEntityImage = useCallback(async (type: "category" | "machine" | "sparePart" | "part", id: string, file: File) => {
        const data = await uploadEntityImageDirect(type, id, file, "replace");
        return data as { imageUrl?: string };
    }, []);

    const uploadEntityImageAdd = useCallback(async (type: "sparePart" | "part", id: string, file: File) => {
        const data = await uploadEntityImageDirect(type, id, file, "add");
        return data as { imageUrls?: string[] };
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

    const saveClientSparePartDetails = useCallback(async (machineId: string, sparePartId: string, sp: SparePartRow) => {
        if (!clientID) return;

        const body: Record<string, unknown> = {
            sparePartID: sparePartId,
            lastServiceDate: sp.lastServiceDate ? new Date(sp.lastServiceDate).toISOString() : null,
            sparePartInstallationDate: sp.sparePartInstallationDate ? new Date(sp.sparePartInstallationDate).toISOString() : null,
            rotorType: sp.rotorType === "Rebuilt" ? "Rebuilt" : "New",
            rebuildsPossible: Math.max(0, Number(sp.rebuildsPossible) || 0),
            isActive: sp.isActive !== false,
        };
        if (sp.lifetimeText.trim()) body.lifetimeText = sp.lifetimeText.trim();
        if (sp.rotorType === "Rebuilt") body.rebuildLifetimeText = sp.lifetimeText.trim();

        const res = await fetch(`/api/clients/${encodeURIComponent(clientID)}/machines/${encodeURIComponent(machineId)}/spare-parts`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to update spare-part dates");
        }
    }, [clientID]);

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
                body: JSON.stringify({ name, clientId: clientID || null }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to add category");
            }
            const data = await res.json();
            const uploaded = await uploadEntityImage("category", data._id, categoryImage);
            toast.success("Category saved.");
            // Surface the new category to the parent so it appears in the list
            // immediately, even before it has any machines.
            onCategoryCreated?.({ _id: data._id, name });
            onSuccess?.();
            if (onComplete) {
                // Save & close (e.g. Upload Data tab): dismiss the form right away.
                // We deliberately never set categoryId here, so the inline
                // "2. Machines" step is never rendered — no machine-form flash.
                onComplete();
            } else {
                // No close handler (e.g. onboarding form): keep the form open and
                // continue inline so machines can be added to the new category.
                setCategoryId(data._id);
                if (uploaded?.imageUrl) setCategoryImageUrl(uploaded.imageUrl);
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add category");
        } finally {
            setLoading(null);
        }
    }, [categoryName, categoryImage, uploadEntityImage, clientID, onSuccess, onComplete, onCategoryCreated]);

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

    const deleteMachineGalleryImage = useCallback(async (machineId: string, imageName: string) => {
        const res = await fetch("/api/upload/machine-gallery", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ machineId, imageName }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Gallery image delete failed");
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
            for (const imageName of machine.deletedGalleryImageNames) {
                try {
                    await deleteMachineGalleryImage(machine.createdId, imageName);
                } catch (e) {
                    toast.error(`Gallery delete: ${e instanceof Error ? e.message : "failed"}`);
                }
            }
            setMachines((prev) =>
                prev.map((m) => (m.id === machineRowId ? { ...m, deletedGalleryImageNames: [] } : m))
            );
            for (const gi of machine.galleryImages) {
                if (gi.file) {
                    const result = await uploadMachineGalleryImage(machine.createdId, gi.file);
                    const uploadedList: Array<{ imageName: string; imageUrl: string | null }> = result?.galleryWithUrls ?? [];
                    const newEntry = uploadedList[uploadedList.length - 1];
                    setMachines((prev) =>
                        prev.map((m) =>
                            m.id === machineRowId
                                ? {
                                      ...m,
                                      galleryImages: m.galleryImages.map((g) =>
                                          g.id === gi.id
                                              ? { ...g, file: null, imageUrl: newEntry?.imageUrl ?? null, imageName: newEntry?.imageName ?? null }
                                              : g
                                      ),
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
    }, [machines, uploadEntityImage, uploadMachineGalleryImage, deleteMachineGalleryImage, onSuccess]);

    const removeMachine = useCallback((id: string) => {
        setMachines((prev) => {
            const next = prev.filter((m) => m.id !== id);
            return next.length === 0 ? [defaultMachineRow()] : next;
        });
    }, []);

    const handleDeleteMachine = useCallback(async (machineRowId: string) => {
        const machine = machines.find((m) => m.id === machineRowId);
        if (!machine?.createdId) return;
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

    const addMachineGalleryImage = useCallback((machineRowId: string, file: File | null = null) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? { ...m, galleryImages: [...m.galleryImages, { id: `gi_${Date.now()}`, file, imageUrl: null }] }
                    : m
            )
        );
    }, []);

    const removeMachineGalleryImage = useCallback((machineRowId: string, imageId: string) => {
        setMachines((prev) =>
            prev.map((m) => {
                if (m.id !== machineRowId) return m;
                const removed = m.galleryImages.find((gi) => gi.id === imageId);
                return {
                    ...m,
                    galleryImages: m.galleryImages.filter((gi) => gi.id !== imageId),
                    deletedGalleryImageNames: removed?.imageName
                        ? [...m.deletedGalleryImageNames, removed.imageName]
                        : m.deletedGalleryImageNames,
                };
            })
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

    const removeSparePart = useCallback((machineRowId: string, sparePartId: string) => {
        setMachines((prev) =>
            prev.map((m) =>
                m.id === machineRowId
                    ? { ...m, spareParts: m.spareParts.filter((s) => s.id !== sparePartId) }
                    : m
            )
        );
    }, []);

    const updateSparePart = useCallback((machineRowId: string, sparePartId: string, field: keyof SparePartRow, value: string | number | boolean | File | null | PartRow[]) => {
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
            const baseline = sp.createdId ? sparePartBaselineRef.current.get(sp.createdId) : undefined;
            const lifetimeText = sp.lifetimeText.trim();
            const payload: Record<string, string> = { name, klValue };
            if (lifetimeText || (baseline && baseline.lifetimeText !== (sp.lifetimeText || ""))) {
                payload.lifetimeText = lifetimeText;
            }
            const res = await fetch(`/api/machines/spare-parts/${sp.createdId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update spare part");
            }
            if (machine?.createdId) {
                await saveClientSparePartDetails(machine.createdId, sp.createdId, sp);
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
    }, [machines, isDuplicateKlValue, uploadEntityImage, uploadEntityVideo, saveClientSparePartDetails, onSuccess]);

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
                    body: JSON.stringify({ name, klValue, lifetimeText: sp.lifetimeText.trim(), machineID: machine.createdId }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add spare part");
                }
                const spData = await res.json();
                if (clientID) {
                    await saveClientSparePartDetails(machine.createdId, spData._id, sp);
                }
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
                                      lifetimeText: "",
                                      rotorType: "New",
                                      rebuildsPossible: 0,
                                      isActive: true,
                                      lastServiceDate: "",
                                      sparePartInstallationDate: "",
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
    }, [machines, isDuplicateKlValue, uploadEntityImage, uploadEntityImageAdd, uploadEntityVideo, saveClientSparePartDetails, clientID, onSuccess]);

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
                            const baseline = sparePartBaselineRef.current.get(sp.createdId!);
                            const sparePartUpdates: Record<string, string> = {};
                            if (spDirty) {
                                sparePartUpdates.name = sp.name.trim();
                                sparePartUpdates.klValue = sp.klValue.trim();
                                if (!baseline || baseline.lifetimeText !== (sp.lifetimeText || "")) {
                                    sparePartUpdates.lifetimeText = sp.lifetimeText.trim();
                                }
                            }
                            return {
                                _id: sp.createdId,
                                ...sparePartUpdates,
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

            if (clientID) {
                for (const m of machines) {
                    if (!m.createdId) continue;
                    for (const sp of m.spareParts) {
                        if (!sp.createdId) continue;
                        const baseline = sparePartBaselineRef.current.get(sp.createdId);
                        const datesDirty = !baseline ||
                            (sp.lastServiceDate || "") !== baseline.lastServiceDate ||
                            (sp.sparePartInstallationDate || "") !== baseline.sparePartInstallationDate;
                        const lifetimeDirty = !baseline ||
                            (sp.lifetimeText || "") !== baseline.lifetimeText;
                        const typeDirty = !baseline || (sp.rotorType || "New") !== baseline.rotorType;
                        const rebuildsDirty = !baseline ||
                            Math.max(0, Number(sp.rebuildsPossible) || 0) !== baseline.rebuildsPossible;
                        const activeDirty = !baseline || (sp.isActive !== false) !== baseline.isActive;
                        if (!datesDirty && !lifetimeDirty && !typeDirty && !rebuildsDirty && !activeDirty) continue;
                        try {
                            await saveClientSparePartDetails(m.createdId, sp.createdId, sp);
                        } catch (e) {
                            errors.push(`Spare part ${sp.name || sp.id} dates: ${e instanceof Error ? e.message : "failed"}`);
                        }
                    }
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
                for (const imageName of m.deletedGalleryImageNames) {
                    try {
                        await deleteMachineGalleryImage(m.createdId, imageName);
                    } catch (e) {
                        errors.push(`Gallery delete: ${e instanceof Error ? e.message : "failed"}`);
                    }
                }
                setMachines((prev) =>
                    prev.map((x) => (x.id === m.id ? { ...x, deletedGalleryImageNames: [] } : x))
                );
                for (const gi of m.galleryImages) {
                    if (!gi.file) continue;
                    try {
                        const result = await uploadMachineGalleryImage(m.createdId, gi.file);
                        const uploadedList: Array<{ imageName: string; imageUrl: string | null }> = result?.galleryWithUrls ?? [];
                        const newEntry = uploadedList[uploadedList.length - 1];
                        setMachines((prev) =>
                            prev.map((x) =>
                                x.id === m.id
                                    ? {
                                          ...x,
                                          galleryImages: x.galleryImages.map((g) =>
                                              g.id === gi.id
                                                  ? { ...g, file: null, imageUrl: newEntry?.imageUrl ?? null, imageName: newEntry?.imageName ?? null }
                                                  : g
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
        deleteMachineGalleryImage,
        saveClientSparePartDetails,
        clientID,
    ]);

    useEffect(() => {
        if (saveRef) saveRef.current = handleSaveAllEdits;
    }, [saveRef, handleSaveAllEdits]);

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
                <h3 className="text-gray-900 text-base font-semibold">1. Machine Category</h3>
                {!categoryId && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#6b7280] text-[14px]">Category Name</Label>
                            <Input
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="e.g. Pulping and Detrashing"
                                className="bg-white border-[#d1d5db] h-[44px] rounded-[10px] px-4 text-gray-900 placeholder:text-[#4b5563]"
                            />
                        </div>
                        <ImageUploadBox
                            file={categoryImage}
                            onFileChange={setCategoryImage}
                            label="Category Image (required to continue)"
                        />
                        <Button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={loading === "category" || !categoryName.trim() || !categoryImage}
                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] w-fit cursor-pointer"
                        >
                            {loading === "category" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Category"}
                        </Button>
                    </>
                )}
                {categoryId && !editingCategory && (
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <button
                            type="button"
                            onClick={() => setImageModal({
                                title: "Category Image",
                                currentUrl: categoryImageUrl,
                                onSave: async (file) => { if (!categoryId) return; await uploadEntityImage("category", categoryId, file); setEditDataLoaded(false); onSuccess?.(); },
                            })}
                            className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white w-full sm:w-[240px] h-[150px] flex items-center justify-center shrink-0 cursor-pointer hover:border-[#96A5BA] transition-colors relative group"
                            title="Click to change image"
                        >
                            {categoryImageUrl ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={categoryImageUrl} alt={categoryName} className="w-full h-full object-contain" />
                                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">Change image</span>
                                </>
                            ) : (
                                <span className="flex flex-col items-center gap-1 text-[#6b7280]">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-[12px]">Upload <span className="text-orange font-medium">image</span></span>
                                </span>
                            )}
                        </button>
                        <div className="flex flex-col gap-2 flex-1 w-full">
                            <Label className="text-[#6b7280] text-[14px]">Category Name</Label>
                            <Input
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="e.g. Pulping and Detrashing"
                                className="bg-white border-[#d1d5db] h-[44px] rounded-[10px] px-4 text-gray-900 placeholder:text-[#4b5563]"
                            />
                            <div className="flex items-center gap-3 flex-wrap mt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSaveCategoryNameOnly}
                                    disabled={loading === "category-name" || !categoryName.trim() || categoryName === categoryBaselineRef.current.name}
                                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] h-8 cursor-pointer"
                                >
                                    {loading === "category-name" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Machine Category"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {categoryId && editingCategory && (
                    <div className="bg-white border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-3">
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
                        <h3 className="text-gray-900 text-base font-semibold">2. Machines</h3>
                        <Button
                            type="button"
                            onClick={() => setAddMachineModalOpen(true)}
                            className="bg-[#2D3E5C] hover:bg-[#1f2a44] text-white rounded-[10px] h-9 px-4 flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Machine
                        </Button>
                    </div>
                    {machines.filter(m => m.createdId || m.name.trim()).length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center border border-dashed border-[#d1d5db] rounded-[10px] bg-[#f9fafb]">
                            <Package className="w-7 h-7 text-[#9ca3af]" />
                            <p className="text-sm text-[#6b7280]">No machines added yet</p>
                            <p className="text-xs text-[#9ca3af]">Use &ldquo;+ Add Machine&rdquo; above to add one</p>
                        </div>
                    ) : (
                    machines.map((m) => {
                        const isMachineOpen = openMachines[m.id] ?? !m.createdId;
                        const isFocusedMachine = !!focusTarget?.machineId && (m.createdId === focusTarget.machineId || m.id === focusTarget.machineId);
                        return (
                        <div key={m.id} className="flex flex-col gap-3">
                        <div
                            ref={isFocusedMachine && !focusTarget?.sparePartId ? focusTargetRef : undefined}
                            className={`bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden ${isFocusedMachine && !focusTarget?.sparePartId ? "ring-2 ring-[#d45815]/40" : ""}`}
                        >
                            <div
                                role="button"
                                onClick={() => setOpenMachines((p) => ({ ...p, [m.id]: !isMachineOpen }))}
                                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] cursor-pointer select-none"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <ChevronRight className={`w-4 h-4 text-gray-900 shrink-0 transition-transform ${isMachineOpen ? "rotate-90" : ""}`} />
                                    <span className="text-gray-900 text-sm font-semibold truncate">{m.name ? `Machine — ${m.name}` : "Machine"}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (m.createdId) { setConfirmAction({ title: "Delete machine?", message: `Delete machine "${m.name || "this machine"}"? This will delete all its spare parts and parts.`, run: () => handleDeleteMachine(m.id) }); } else { removeMachine(m.id); } }}
                                    className="p-1.5 rounded-md text-[#6b7280] hover:bg-[#bf1e21]/10 hover:text-[#bf1e21] shrink-0 cursor-pointer"
                                    title="Delete machine"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {isMachineOpen && (
                            <div className="p-4 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Left column: name, installation date, description (description sits below the date) */}
                                <div className="flex flex-col gap-3">
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
                                        <Label className="text-[#6b7280] text-[12px]">Installation Date</Label>
                                        <Input
                                            type="date"
                                            value={m.installationDate || ""}
                                            onChange={(e) => updateMachine(m.id, "installationDate", e.target.value)}
                                            className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px]"
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
                                </div>
                                {/* Right column: model number + machine image */}
                                <div className="flex flex-col gap-3">
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
                                        <Label className="text-[#6b7280] text-[12px]">Machine Image</Label>
                                        <button
                                            type="button"
                                            onClick={() => setImageModal({
                                                title: "Machine Image",
                                                currentUrl: m.imageUrl ?? null,
                                                onSave: async (file) => { if (!m.createdId) return; await uploadEntityImage("machine", m.createdId, file); setEditDataLoaded(false); onSuccess?.(); },
                                            })}
                                            className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white min-h-[110px] flex items-center justify-center cursor-pointer hover:border-[#96A5BA] transition-colors relative group"
                                            title="Click to change image"
                                        >
                                            {m.imageUrl ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={m.imageUrl} alt={m.name} className="max-h-[140px] w-full object-contain" />
                                                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">Change image</span>
                                                </>
                                            ) : (
                                                <span className="flex flex-col items-center gap-1 text-[#6b7280] py-4">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-[12px]">Upload <span className="text-orange font-medium">image</span></span>
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-[#6b7280] text-[12px]">Additional images</Label>
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
                                                <button
                                                    type="button"
                                                    onClick={() => setImageModal({
                                                        title: "Machine Image",
                                                        currentUrl: gi.imageUrl ?? null,
                                                        onSave: async (file) => { setMachineGalleryImageFile(m.id, gi.id, file); },
                                                    })}
                                                    className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity ${
                                                        gi.imageUrl || gi.file
                                                            ? "bg-black/40 hover:bg-black/50 opacity-0 hover:opacity-100"
                                                            : "bg-black/40 hover:bg-black/60 opacity-100"
                                                    }`}
                                                >
                                                    <span className="text-white text-xs">{(gi.imageUrl || gi.file) ? "Change" : "Choose"}</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setImageModal({
                                                title: "Machine Image",
                                                currentUrl: null,
                                                onSave: async (file) => { addMachineGalleryImage(m.id, file); },
                                            })}
                                            className="w-20 h-20 rounded-lg border border-dashed border-[#d1d5db] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#96A5BA] text-[#6b7280] gap-1"
                                            title="Add image"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[10px]">add image</span>
                                        </button>
                                    </div>
                            </div>
                                            {m.createdId && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleUpdateMachine(m.id)}
                                                        disabled={loading === `machine-update-${m.id}` || !m.name.trim()}
                                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] w-fit"
                                                    >
                                                        {loading === `machine-update-${m.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Machines"}
                                                    </Button>
                                                </div>
                                            )}
                            </div>
                            )}
                        </div>

                        {/* Spare parts & parts — lifted OUT of the machine card, shown beside it (only when saved) */}
                        {m.createdId && (
                            <div className="flex flex-col gap-3 ml-4 pl-4 border-l-2 border-[#DFE6EC]">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-gray-900 text-sm font-semibold">Spare Parts &amp; Parts</h4>
                                        <Button
                                            type="button"
                                            onClick={() => m.createdId && setAddSparePartForMachine(m.createdId)}
                                            className="bg-[#d1d5db] hover:bg-[#c3ccd6] text-gray-900 rounded-[8px] h-8 px-2 flex items-center gap-1.5 text-xs cursor-pointer transition-transform hover:scale-105"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Spare Part
                                        </Button>
                                    </div>
                                    {m.spareParts.map((sp) => {
                                        const isSpOpen = openSpareParts[sp.id] ?? !sp.createdId;
                                        const isFocusedSparePart = !!focusTarget?.sparePartId && (sp.createdId === focusTarget.sparePartId || sp.id === focusTarget.sparePartId);
                                        return (
                                        <div
                                            key={sp.id}
                                            ref={isFocusedSparePart ? focusTargetRef : undefined}
                                            className={`bg-white border border-[#96A5BA] rounded-[8px] overflow-hidden ${isFocusedSparePart ? "ring-2 ring-[#d45815]/40" : ""}`}
                                        >
                                            <div
                                                role="button"
                                                onClick={() => setOpenSpareParts((p) => ({ ...p, [sp.id]: !isSpOpen }))}
                                                className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] cursor-pointer select-none"
                                            >
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-900 shrink-0 transition-transform ${isSpOpen ? "rotate-90" : ""}`} />
                                                    <span className="text-gray-900 text-xs font-semibold truncate">{sp.name ? `Spare Part — ${sp.name}` : "Spare Part"}</span>
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isEditMode && sp.createdId ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ title: "Delete spare part?", message: `Delete spare part "${sp.name || "this spare part"}"? This will delete all its parts.`, run: () => handleDeleteSparePart(m.id, sp.id) }); }}
                                                            disabled={loading === `delete-spare-${sp.id}`}
                                                            className="h-7 px-2 text-[#bf1e21] hover:bg-[#bf1e21]/10 text-xs"
                                                            title="Delete spare part"
                                                        >
                                                            {loading === `delete-spare-${sp.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                        </Button>
                                                    ) : !sp.createdId ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeSparePart(m.id, sp.id); }}
                                                            className="p-1 rounded text-[#6b7280] hover:bg-[#d1d5db] hover:text-gray-900"
                                                            title="Remove spare part"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {isSpOpen && (
                                            <div className="p-3 flex flex-col gap-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
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
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Lifetime</Label>
                                                    <Input
                                                        value={sp.lifetimeText}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "lifetimeText", e.target.value)}
                                                        placeholder="e.g. 3 Months"
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px] placeholder:text-[#4b5563]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Rebuild Part</Label>
                                                    <div className="h-[36px] rounded-[6px] border border-[#d1d5db] bg-white px-2 flex items-center justify-between gap-2">
                                                        <span className="text-gray-900 text-[12px]">
                                                            {sp.rotorType === "Rebuilt" ? "Rebuilt" : "New"}
                                                        </span>
                                                        <Switch
                                                            checked={sp.rotorType === "Rebuilt"}
                                                            onCheckedChange={(checked) => updateSparePart(m.id, sp.id, "rotorType", checked ? "Rebuilt" : "New")}
                                                            className="data-[state=checked]:bg-[#d45815]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Rebuilds Possible</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={sp.rebuildsPossible}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "rebuildsPossible", Math.max(0, Number(e.target.value) || 0))}
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Active</Label>
                                                    <div className="h-[36px] rounded-[6px] border border-[#d1d5db] bg-white px-2 flex items-center justify-between gap-2">
                                                        <span className="text-gray-900 text-[12px]">
                                                            {sp.isActive !== false ? "Active" : "Inactive"}
                                                        </span>
                                                        <Switch
                                                            checked={sp.isActive !== false}
                                                            onCheckedChange={(checked) => updateSparePart(m.id, sp.id, "isActive", checked)}
                                                            className="data-[state=checked]:bg-[#d45815]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Installation Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={sp.sparePartInstallationDate}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "sparePartInstallationDate", e.target.value)}
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-[#6b7280] text-[11px]">Last Service Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={sp.lastServiceDate}
                                                        onChange={(e) => updateSparePart(m.id, sp.id, "lastServiceDate", e.target.value)}
                                                        className="bg-white border-[#d1d5db] h-[36px] rounded-[6px] px-2 text-gray-900 text-[12px]"
                                                    />
                                                </div>
                                            </div>
                                            {/* Spare Part Images + Optimal-state video — side by side */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                <div className="flex flex-col gap-1.5">
                                                    <Label className="text-[#6b7280] text-[12px]">Spare Part Images</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* Legacy single imageUrl */}
                                                        {sp.imageUrl && (
                                                            <div className="relative w-[110px] h-[110px] rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={sp.imageUrl} alt="Spare part" className="w-full h-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    title="Remove image"
                                                                    onClick={() => setConfirmAction({ title: "Remove image?", message: "Remove this spare part image?", run: () => setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrl: null } : s) } : x)) })}
                                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-[#bf1e21] text-white flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {/* Additional imageUrls */}
                                                        {sp.imageUrls.map((url, idx) => {
                                                            const fileName = url.split("/uploads/")[1]?.split("?")[0];
                                                            return (
                                                                <div key={idx} className="relative w-[110px] h-[110px] rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-contain" />
                                                                    <button
                                                                        type="button"
                                                                        title="Remove image"
                                                                        onClick={() => setConfirmAction({ title: "Remove image?", message: "Remove this spare part image?", run: async () => {
                                                                            if (sp.createdId && fileName) {
                                                                                try { await removeEntityImage("sparePart", sp.createdId, fileName); } catch { /* swallow, update UI regardless */ }
                                                                            }
                                                                            setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrls: s.imageUrls.filter((_, i) => i !== idx) } : s) } : x));
                                                                        } })}
                                                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-[#bf1e21] text-white flex items-center justify-center cursor-pointer"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        {/* Pending new files (local, unsaved) */}
                                                        {sp.pendingImageFiles.map((f, idx) => (
                                                            <div key={`pending-${idx}`} className="relative w-[110px] h-[110px] rounded-[8px] overflow-hidden border border-dashed border-[#d45815] bg-white">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    title="Remove image"
                                                                    onClick={() => setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, pendingImageFiles: s.pendingImageFiles.filter((_, i) => i !== idx) } : s) } : x))}
                                                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-[#bf1e21] text-white flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {/* Add image → compression modal (same logic as category/machine/part images) */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setImageModal({
                                                                title: "Spare Part Image",
                                                                currentUrl: null,
                                                                onSave: async (file) => {
                                                                    if (sp.createdId) {
                                                                        const result = await uploadEntityImageAdd("sparePart", sp.createdId, file);
                                                                        setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, imageUrls: result.imageUrls ?? s.imageUrls } : s) } : x));
                                                                    } else {
                                                                        setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, spareParts: x.spareParts.map((s) => s.id === sp.id ? { ...s, pendingImageFiles: [...s.pendingImageFiles, file] } : s) } : x));
                                                                    }
                                                                },
                                                            })}
                                                            className="w-[110px] h-[110px] rounded-[8px] border border-dashed border-[#d1d5db] bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#96A5BA] text-[#6b7280]"
                                                        >
                                                            <Upload className="w-5 h-5 mb-1 text-[#4b5563]" />
                                                            <span className="text-[11px] text-[#6b7280]">Add <span className="text-orange font-medium">image</span></span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <VideoUploadBox
                                                    file={sp.optimalStateVideoFile}
                                                    onFileChange={(f) => updateSparePart(m.id, sp.id, "optimalStateVideoFile", f)}
                                                    label="Optimal State Spare Part (Video)"
                                                    existingUrl={sp.optimalStateVideoUrl}
                                                    onDelete={() => { if (sp.createdId) setConfirmAction({ title: "Remove video?", message: "Remove the optimal-state video for this spare part?", run: () => handleDeleteSparePartVideo(m.id, sp.id) }); }}
                                                    isDeleting={loading === `delete-sp-video-${sp.id}`}
                                                />
                                            </div>
                                            {sp.createdId && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleUpdateSparePart(m.id, sp.id)}
                                                        disabled={loading === `spare-update-${sp.id}` || !sp.name.trim() || !sp.klValue.trim()}
                                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[6px] w-fit text-xs"
                                                    >
                                                        {loading === `spare-update-${sp.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Spare Part"}
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[#6b7280] text-[11px]">Parts (name + image per part)</Label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => addPart(m.id, sp.id)}
                                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[6px] h-7 text-[11px] px-2.5 cursor-pointer transition-transform hover:scale-105"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Add Part
                                                    </Button>
                                                </div>
                                                {sp.parts.map((pt) => {
                                                    const partImagePreview = pt.imageFile ? URL.createObjectURL(pt.imageFile) : (pt.imageUrl ?? null);
                                                    const partVideoPreview = pt.optimalStateVideoFile ? URL.createObjectURL(pt.optimalStateVideoFile) : (pt.optimalStateVideoUrl ?? null);
                                                    return (
                                                    <div key={pt.id} className="flex flex-col gap-3 bg-white border border-[#d1d5db] rounded-[8px] p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={pt.name}
                                                                onChange={(e) => updatePart(m.id, sp.id, pt.id, "name", e.target.value)}
                                                                placeholder="e.g. Power Saver, Foil"
                                                                className="bg-white border-[#d1d5db] h-[34px] rounded-[6px] px-2 text-gray-900 text-[12px] flex-1"
                                                            />
                                                            {pt.createdId ? (
                                                                <>
                                                                    {!isEditMode && (
                                                                        <Button type="button" size="sm" onClick={() => handleUpdatePart(m.id, sp.id, pt.id)} disabled={loading === `part-update-${pt.id}` || !pt.name.trim()} className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[6px] h-8 text-xs">
                                                                            {loading === `part-update-${pt.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Internal Part"}
                                                                        </Button>
                                                                    )}
                                                                    <button type="button" onClick={() => setConfirmAction({ title: "Delete part?", message: `Delete part "${pt.name || "this part"}"?`, run: () => handleDeletePart(m.id, sp.id, pt.id) })} disabled={loading === `delete-part-${pt.id}`} className="p-1.5 rounded-md text-[#6b7280] hover:bg-[#bf1e21]/10 hover:text-[#bf1e21] shrink-0 cursor-pointer" title="Delete part">
                                                                        {loading === `delete-part-${pt.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {sp.createdId && (
                                                                        <Button type="button" size="sm" onClick={() => handleCreatePart(m.id, sp.id, pt.id)} disabled={loading === `part-create-${pt.id}` || !pt.name.trim() || !pt.imageFile} className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[6px] h-8 text-xs">
                                                                            {loading === `part-create-${pt.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Internal Part"}
                                                                        </Button>
                                                                    )}
                                                                    <button type="button" onClick={() => removePart(m.id, sp.id, pt.id)} className="p-1.5 rounded-md text-[#6b7280] hover:text-[#bf1e21] shrink-0 cursor-pointer" title="Remove part">
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        {/* Part image + optimal-state video, side by side */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <Label className="text-[#6b7280] text-[11px]">Part Image</Label>
                                                                <button type="button" onClick={() => setImageModal({ title: "Part Image", currentUrl: pt.imageUrl ?? null, onSave: async (file) => { if (pt.createdId) { await uploadEntityImage("part", pt.createdId, file); setEditDataLoaded(false); onSuccess?.(); } else { updatePart(m.id, sp.id, pt.id, "imageFile", file); } } })} className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white min-h-[100px] flex items-center justify-center cursor-pointer hover:border-[#96A5BA] transition-colors relative group" title="Click to add image">
                                                                    {partImagePreview ? (
                                                                        <>
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img src={partImagePreview} alt={pt.name} className="max-h-[120px] w-full object-contain" />
                                                                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium">Change</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="flex flex-col items-center gap-1 text-[#6b7280] py-3"><Upload className="w-5 h-5" /><span className="text-[11px]">Upload <span className="text-orange font-medium">image</span></span></span>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-col gap-1.5">
                                                                <Label className="text-[#6b7280] text-[11px]">Optimal State (Video)</Label>
                                                                <button type="button" onClick={() => setVideoModal({ title: "Optimal State Part (Video)", currentUrl: pt.optimalStateVideoUrl ?? null, onSave: async (file) => { if (pt.createdId) { await uploadEntityVideo("part", pt.createdId, file); setEditDataLoaded(false); onSuccess?.(); } else { updatePart(m.id, sp.id, pt.id, "optimalStateVideoFile", file); } } })} className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-white min-h-[100px] flex items-center justify-center cursor-pointer hover:border-[#96A5BA] transition-colors relative group" title="Click to add video">
                                                                    {partVideoPreview ? (
                                                                        <>
                                                                            <video src={partVideoPreview} className="max-h-[120px] w-full object-contain" muted preload="metadata" />
                                                                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium">Change</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="flex flex-col items-center gap-1 text-[#6b7280] py-3"><Video className="w-5 h-5" /><span className="text-[11px]">Upload <span className="text-orange font-medium">video</span></span></span>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                            </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        );
                    })
                    )}
                </div>
            )}

            {/* 3. Map Machine Positions - shown when category image + saved machines exist */}
            {categoryId && hasCategoryImage && savedMachines.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#607797] pt-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 text-base font-semibold">3. Map Machine Positions</h3>
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

            {/* Add Machine modal */}
            {addMachineModalOpen && categoryId && (
                <AddMachineFormModal
                    open
                    onClose={() => setAddMachineModalOpen(false)}
                    categoryId={categoryId}
                    clientId={clientID}
                    onCreated={() => { setEditDataLoaded(false); onSuccess?.(); }}
                />
            )}

            {/* Add Spare Part modal */}
            {addSparePartForMachine && (
                <AddSparePartFormModal
                    open
                    onClose={() => setAddSparePartForMachine(null)}
                    machineId={addSparePartForMachine}
                    clientId={clientID}
                    existingKlValues={machines.flatMap((mm) => mm.spareParts.map((s) => s.klValue).filter(Boolean))}
                    onCreated={() => { setEditDataLoaded(false); onSuccess?.(); }}
                />
            )}

            {/* Generic delete / remove-media confirmation */}
            {confirmAction && (
                <DeleteConfirmModal
                    open
                    onOpenChange={(o) => { if (!o && !confirmLoading) setConfirmAction(null); }}
                    title={confirmAction.title}
                    message={confirmAction.message}
                    isLoading={confirmLoading}
                    onConfirm={async () => {
                        setConfirmLoading(true);
                        try { await confirmAction.run(); } finally { setConfirmLoading(false); setConfirmAction(null); }
                    }}
                    onCancel={() => setConfirmAction(null)}
                />
            )}

            {/* Image upload / replace modal (sharp compression) */}
            {imageModal && (
                <ImageUploadModal
                    open
                    onClose={() => setImageModal(null)}
                    title={imageModal.title}
                    currentImageUrl={imageModal.currentUrl}
                    onSave={imageModal.onSave}
                />
            )}

            {/* Video upload / replace modal */}
            {videoModal && (
                <VideoUploadModal
                    open
                    onClose={() => setVideoModal(null)}
                    title={videoModal.title}
                    currentVideoUrl={videoModal.currentUrl}
                    onSave={videoModal.onSave}
                />
            )}
        </div>
    );
}
