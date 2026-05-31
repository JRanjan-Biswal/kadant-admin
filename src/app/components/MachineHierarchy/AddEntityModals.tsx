"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2, Plus, Video, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ImageUploadModal from "./ImageUploadModal";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO = 50 * 1024 * 1024; // 50 MB
// Image picking/validation/compression is handled by ImageUploadModal.

// ─── Upload helpers (same endpoints the inline editor uses) ─────────────────

async function uploadEntityImage(type: "machine" | "sparePart" | "part", id: string, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("type", type);
    fd.append("id", id);
    const res = await fetch("/api/upload/entity-image", { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Image upload failed");
}

async function uploadEntityImageAdd(type: "sparePart" | "part", id: string, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("type", type);
    fd.append("id", id);
    const res = await fetch("/api/upload/entity-image-add", { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Image upload failed");
}

async function uploadEntityVideo(type: "sparePart" | "part", id: string, file: File) {
    const fd = new FormData();
    fd.append("video", file);
    fd.append("type", type);
    fd.append("id", id);
    const res = await fetch("/api/upload/entity-video", { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Video upload failed");
}

async function uploadMachineGallery(machineId: string, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("machineId", machineId);
    const res = await fetch("/api/upload/machine-gallery", { method: "POST", body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Gallery upload failed");
}

// ─── Shared UI ──────────────────────────────────────────────────────────────

interface ModalShellProps {
    title: string;
    onClose: () => void;
    saving: boolean;
    children: React.ReactNode;
    submitLabel: string;
    onSubmit: () => void;
    canSubmit: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, saving, children, submitLabel, onSubmit, canSubmit }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={() => !saving && onClose()}
    >
        <div
            className="bg-white border border-[#96A5BA] rounded-[12px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] px-6 py-4 shrink-0">
                <h2 className="text-gray-900 text-[18px] font-semibold">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="w-8 h-8 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity disabled:opacity-40"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">{children}</div>

            {/* Footer */}
            <div className="border-t border-[#607797] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="bg-[#f9fafb] text-[#1f2937] border border-[#d1d5db] px-5 py-[9px] rounded-[10px] text-sm hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={saving || !canSubmit}
                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-5 gap-2 disabled:opacity-50"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </div>
    </div>
);

/** Opens the shared compression modal (Original vs Compressed) and hands back the
 *  chosen File via onPicked. Used everywhere an image is picked in these modals so
 *  the compression UX is identical to the inline editor. */
const CompressedImageButton: React.FC<{ modalTitle: string; onPicked: (f: File) => void; className?: string; children: React.ReactNode }> = ({ modalTitle, onPicked, className, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
            <ImageUploadModal open={open} onClose={() => setOpen(false)} title={modalTitle} onSave={async (f) => { onPicked(f); }} />
        </>
    );
};

/** Single image drop zone: grey dashed border, orange keyword, preview + remove.
 *  Clicking opens the compression modal so the user chooses Original vs Compressed. */
const ImageZone: React.FC<{ label: string; file: File | null; onChange: (f: File | null) => void; className?: string }> = ({
    label,
    file,
    onChange,
    className,
}) => {
    const [open, setOpen] = useState(false);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
                className={`border-2 border-dashed border-[#d1d5db] rounded-[10px] bg-white flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-[#96A5BA] transition-colors overflow-hidden relative group ${className ?? ""}`}
            >
                {previewUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt={label} className="max-h-[180px] w-full object-contain" />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                            title="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-6 px-4">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-foreground text-[13px]">
                            Upload <span className="text-orange font-medium">{label}</span>
                        </span>
                        <span className="text-muted-foreground text-[11px]">PNG, JPG, WebP — choose quality</span>
                    </div>
                )}
            </div>
            <ImageUploadModal open={open} onClose={() => setOpen(false)} title={`Upload ${label}`} currentImageUrl={previewUrl} onSave={async (f) => { onChange(f); }} />
        </>
    );
};

/** Optional video drop zone. */
const VideoZone: React.FC<{ file: File | null; onChange: (f: File | null) => void }> = ({ file, onChange }) => {
    const previewUrl = file ? URL.createObjectURL(file) : null;
    const handlePick = (f?: File) => {
        if (!f) return;
        if (!ACCEPTED_VIDEO.includes(f.type)) { toast.error("Only MP4, WebM, MOV videos are allowed."); return; }
        if (f.size > MAX_VIDEO) { toast.error("Video must be less than 50 MB."); return; }
        onChange(f);
    };
    if (previewUrl) {
        return (
            <div className="border border-[#d1d5db] rounded-[8px] overflow-hidden bg-white relative group">
                <video src={previewUrl} controls className="w-full max-h-[160px] object-contain" preload="metadata" />
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-[#bf1e21] text-white flex items-center justify-center"
                    title="Remove video"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }
    return (
        <label className="border border-dashed border-[#d1d5db] rounded-[8px] bg-white flex items-center justify-center min-h-[72px] cursor-pointer hover:border-[#96A5BA] transition-colors">
            <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => { handlePick(e.target.files?.[0]); e.target.value = ""; }}
            />
            <span className="text-muted-foreground text-[12px] flex items-center gap-2 py-3">
                <Video className="w-4 h-4" /> Upload <span className="text-orange font-medium">Video</span> (MP4, WebM — max 50MB)
            </span>
        </label>
    );
};

// ─── Add Machine modal ──────────────────────────────────────────────────────

interface AddMachineFormModalProps {
    open: boolean;
    onClose: () => void;
    categoryId: string;
    clientId?: string;
    onCreated: () => void;
}

export const AddMachineFormModal: React.FC<AddMachineFormModalProps> = ({ open, onClose, categoryId, clientId, onCreated }) => {
    const [name, setName] = useState("");
    const [modelNumber, setModelNumber] = useState("");
    const [installationDate, setInstallationDate] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);

    const reset = useCallback(() => {
        setName(""); setModelNumber(""); setInstallationDate(""); setDescription("");
        setImageFile(null); setGalleryFiles([]);
    }, []);

    const close = useCallback(() => { if (!saving) { reset(); onClose(); } }, [saving, reset, onClose]);

    const canSubmit = !!name.trim() && !!imageFile;

    const submit = useCallback(async () => {
        if (!canSubmit) return;
        setSaving(true);
        try {
            const res = await fetch("/api/machines/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    category: categoryId,
                    isActive: true,
                    description: description.trim(),
                    installationDate: installationDate || null,
                    modelNumber: modelNumber.trim() || null,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to add machine");
            const data = await res.json();
            const machineId: string = data._id;
            await uploadEntityImage("machine", machineId, imageFile!);
            for (const g of galleryFiles) await uploadMachineGallery(machineId, g);
            // Link the new machine to this client so it shows in the client's list.
            if (clientId) {
                const linkRes = await fetch(`/api/clients/${clientId}/client-machines`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ machineIDs: [machineId] }),
                });
                if (!linkRes.ok) throw new Error((await linkRes.json().catch(() => ({}))).error || "Machine created but failed to link to client");
            }
            toast.success("Machine added.");
            reset();
            onCreated();
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add machine");
        } finally {
            setSaving(false);
        }
    }, [canSubmit, name, categoryId, description, installationDate, modelNumber, imageFile, galleryFiles, clientId, reset, onCreated, onClose]);

    if (!open) return null;

    return (
        <ModalShell title="Add Machine" onClose={close} saving={saving} submitLabel={saving ? "Adding…" : "Add Machine"} onSubmit={submit} canSubmit={canSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">Machine Name <span className="text-[#bf1e21]">*</span></Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hydrapulper"
                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">Model Number</Label>
                    <Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} placeholder="e.g. KHP-3200"
                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">Installation Date</Label>
                    <Input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)}
                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">Machine Image <span className="text-[#bf1e21]">*</span></Label>
                    <ImageZone label="Machine Image" file={imageFile} onChange={setImageFile} className="min-h-[100px]" />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-[#6b7280] text-[12px]">Machine description</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                    placeholder="e.g. High-capacity hydrapulper for stock preparation"
                    className="bg-white border border-[#d1d5db] rounded-[8px] px-3 py-2 text-gray-900 text-[13px] placeholder:text-[#4b5563] resize-y min-h-[60px]" />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-[#6b7280] text-[12px]">Additional images</Label>
                    <CompressedImageButton modalTitle="Add Image" onPicked={(f) => setGalleryFiles((p) => [...p, f])}
                        className="text-[#d45815] hover:bg-[#d45815]/10 rounded-md h-7 px-2 text-xs flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Add image
                    </CompressedImageButton>
                </div>
                {galleryFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {galleryFiles.map((g, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg border border-[#d1d5db] bg-white overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={URL.createObjectURL(g)} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setGalleryFiles((p) => p.filter((_, idx) => idx !== i))}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-[#bf1e21] text-xs">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

// ─── Add Spare Part modal ───────────────────────────────────────────────────

interface DraftPart {
    id: string;
    name: string;
    imageFile: File | null;
    videoFile: File | null;
}

interface AddSparePartFormModalProps {
    open: boolean;
    onClose: () => void;
    machineId: string;
    existingKlValues?: string[];
    onCreated: () => void;
}

export const AddSparePartFormModal: React.FC<AddSparePartFormModalProps> = ({ open, onClose, machineId, existingKlValues = [], onCreated }) => {
    const [name, setName] = useState("");
    const [klValue, setKlValue] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [parts, setParts] = useState<DraftPart[]>([]);
    const [saving, setSaving] = useState(false);
    const partSeq = useRef(0);

    const reset = useCallback(() => {
        setName(""); setKlValue(""); setImageFile(null); setAdditionalFiles([]); setVideoFile(null); setParts([]);
    }, []);

    const close = useCallback(() => { if (!saving) { reset(); onClose(); } }, [saving, reset, onClose]);

    const canSubmit = !!name.trim() && !!klValue.trim() && !!imageFile;

    const submit = useCallback(async () => {
        if (!canSubmit) return;
        const kl = klValue.trim();
        if (existingKlValues.map((k) => k.toLowerCase()).includes(kl.toLowerCase())) {
            toast.error(`KL Value "${kl}" must be unique`);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/machines/spare-parts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), klValue: kl, machineID: machineId }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to add spare part");
            const sp = await res.json();
            const sparePartId: string = sp._id;
            await uploadEntityImage("sparePart", sparePartId, imageFile!);
            for (const f of additionalFiles) await uploadEntityImageAdd("sparePart", sparePartId, f);
            if (videoFile) await uploadEntityVideo("sparePart", sparePartId, videoFile);
            for (const pt of parts.filter((p) => p.name.trim() && p.imageFile)) {
                const pr = await fetch("/api/machines/spare-parts-part", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: pt.name.trim(), machineID: machineId, sparePartID: sparePartId }),
                });
                if (!pr.ok) throw new Error((await pr.json().catch(() => ({}))).error || "Failed to add part");
                const partData = await pr.json();
                await uploadEntityImage("part", partData._id, pt.imageFile!);
                if (pt.videoFile) await uploadEntityVideo("part", partData._id, pt.videoFile);
            }
            toast.success("Spare part added.");
            reset();
            onCreated();
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add spare part");
        } finally {
            setSaving(false);
        }
    }, [canSubmit, klValue, existingKlValues, name, machineId, imageFile, additionalFiles, videoFile, parts, reset, onCreated, onClose]);

    if (!open) return null;

    return (
        <ModalShell title="Add Spare Part" onClose={close} saving={saving} submitLabel={saving ? "Adding…" : "Add Spare Part"} onSubmit={submit} canSubmit={canSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">Spare Part Name <span className="text-[#bf1e21]">*</span></Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rotor, Bedplate"
                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-[#6b7280] text-[12px]">KL Value (Model Number) <span className="text-[#bf1e21]">*</span></Label>
                    <Input value={klValue} onChange={(e) => setKlValue(e.target.value)} placeholder="Unique ID"
                        className="bg-white border-[#d1d5db] h-[40px] rounded-[8px] px-3 text-gray-900 text-[13px] placeholder:text-[#4b5563]" />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-[#6b7280] text-[12px]">Spare Part Image <span className="text-[#bf1e21]">*</span></Label>
                <ImageZone label="Spare Part Image" file={imageFile} onChange={setImageFile} className="min-h-[110px]" />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-[#6b7280] text-[12px]">Additional images</Label>
                    <CompressedImageButton modalTitle="Add Image" onPicked={(f) => setAdditionalFiles((p) => [...p, f])}
                        className="text-[#d45815] hover:bg-[#d45815]/10 rounded-md h-7 px-2 text-xs flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Add image
                    </CompressedImageButton>
                </div>
                {additionalFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {additionalFiles.map((g, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg border border-[#d1d5db] bg-white overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={URL.createObjectURL(g)} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setAdditionalFiles((p) => p.filter((_, idx) => idx !== i))}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-[#bf1e21] text-xs">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label className="text-[#6b7280] text-[12px]">Optimal State Spare Part (Video)</Label>
                <VideoZone file={videoFile} onChange={setVideoFile} />
            </div>

            {/* Parts (optional) */}
            <div className="flex flex-col gap-2 border-t border-[#d1d5db] pt-3">
                <div className="flex items-center justify-between">
                    <Label className="text-[#6b7280] text-[12px]">Parts (name + image per part)</Label>
                    <Button type="button" size="sm" variant="ghost"
                        onClick={() => setParts((p) => [...p, { id: `dp_${partSeq.current++}`, name: "", imageFile: null, videoFile: null }])}
                        className="text-[#d45815] hover:bg-[#d45815]/10 h-7 text-[11px] px-1.5">
                        <Plus className="w-3 h-3 mr-1" /> Add Part
                    </Button>
                </div>
                {parts.map((pt) => (
                    <div key={pt.id} className="bg-white border border-[#d1d5db] rounded-[8px] p-2 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Input value={pt.name} placeholder="e.g. Power Saver, Foil"
                                onChange={(e) => setParts((p) => p.map((x) => x.id === pt.id ? { ...x, name: e.target.value } : x))}
                                className="bg-white border-[#d1d5db] h-[32px] rounded-[4px] px-2 text-gray-900 text-[11px] flex-1" />
                            <CompressedImageButton modalTitle="Part Image" onPicked={(f) => setParts((p) => p.map((x) => x.id === pt.id ? { ...x, imageFile: f } : x))}
                                className="w-[60px] h-[44px] shrink-0 border border-dashed border-[#d1d5db] rounded-[6px] bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#96A5BA] relative">
                                {pt.imageFile ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={URL.createObjectURL(pt.imageFile)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-4 h-4 text-[#4b5563]" />
                                )}
                            </CompressedImageButton>
                            <button type="button" onClick={() => setParts((p) => p.filter((x) => x.id !== pt.id))}
                                className="p-1 text-[#6b7280] hover:text-[#bf1e21] shrink-0" title="Remove part">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <VideoZone file={pt.videoFile} onChange={(f) => setParts((p) => p.map((x) => x.id === pt.id ? { ...x, videoFile: f } : x))} />
                    </div>
                ))}
            </div>
        </ModalShell>
    );
};
