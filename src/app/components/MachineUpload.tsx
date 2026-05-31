"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Types ──────────────────────────────────────────────────────────────────

interface MachineUploadProps {
    clientId: string;
}

interface PendingFile {
    file: File;
    previewUrl: string;
}

type SingleKey = "business" | "flowsheet" | "stockprep";

interface SparePartNode {
    _id: string;
    name: string;
    imageUrl: string | null;
}

interface MachineNode {
    _id: string;
    name: string;
    imageUrl: string | null;
    spareParts: SparePartNode[];
}

interface RawClient {
    name?: string;
    updatedAt?: string;
    businessImageUrl?: string | null;
    flowsheetImageUrl?: string | null;
    stockPrepImageUrl?: string | null;
    onboardingImageUrls?: string[];
    onboardingImages?: string[];
    machines?: Array<{
        machine?: { _id?: string; category?: { _id?: string } | string };
    }>;
}

interface RawCategoryFull {
    machines?: Array<{
        _id: string;
        name?: string;
        imageUrl?: string | null;
        spareParts?: Array<{ _id: string; name?: string; imageUrl?: string | null }>;
    }>;
}

// ─── Upload helpers (talk to the existing API proxies) ──────────────────────

/** Generic upload — returns a relative asset path (used for client-level images). */
async function uploadGeneric(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    return (data.path || data.url) as string;
}

/** Entity image upload — persists imageName on the machine/sparePart and returns its imageUrl. */
async function uploadEntityImage(
    type: "machine" | "sparePart",
    id: string,
    file: File
): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("type", type);
    fd.append("id", id);
    const res = await fetch("/api/upload/entity-image", { method: "POST", body: fd });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
    }
    const data = await res.json();
    return (data.imageUrl || "") as string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const SaveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V15" />
        <path d="M18 18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    </svg>
);

const SaveButton: React.FC<{ onClick: () => void; saving: boolean; disabled?: boolean }> = ({ onClick, saving, disabled }) => (
    <Button
        onClick={onClick}
        disabled={saving || disabled}
        className="bg-orange text-white hover:bg-orange-light gap-2 cursor-pointer disabled:opacity-50"
    >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
        Save &amp; Update
    </Button>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
);

interface UploadZoneCardProps {
    label: string;
    imageUrl: string | null;
    onSelect: (file: File) => void;
    onRemove?: () => void;
    clickToReplace?: boolean;
    disabled?: boolean;
}

const UploadZoneCard: React.FC<UploadZoneCardProps> = ({
    label,
    imageUrl,
    onSelect,
    onRemove,
    clickToReplace = true,
    disabled,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (disabled) return;
        if (imageUrl && !clickToReplace) return;
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error("Only PNG, JPG, and WebP images are allowed.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be less than 5 MB.");
            return;
        }
        onSelect(file);
        if (inputRef.current) inputRef.current.value = "";
    };

    const interactive = !disabled && (!imageUrl || clickToReplace);

    return (
        <div
            onClick={handleClick}
            className={`flex-1 min-w-[180px] border-2 border-dashed rounded-lg relative overflow-hidden transition-colors ${imageUrl ? "border-orange/60" : "border-border hover:border-orange/60"
                } ${interactive ? "cursor-pointer" : ""} ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleChange}
            />

            {imageUrl ? (
                <div className="relative w-full h-full min-h-[120px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-md" />
                    {onRemove && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-foreground text-center">
                        Upload <span className="text-orange font-medium">{label}</span> Image
                    </p>
                    <p className="text-xs text-muted-foreground">Upload images (PNG, JPG)</p>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const MachineUpload: React.FC<MachineUploadProps> = ({ clientId }) => {
    const [loading, setLoading] = useState(true);
    const [clientName, setClientName] = useState("Client");
    const [lastUpdated, setLastUpdated] = useState("");

    // Server-persisted client-level images
    const [businessUrl, setBusinessUrl] = useState<string | null>(null);
    const [flowsheetUrl, setFlowsheetUrl] = useState<string | null>(null);
    const [stockPrepUrl, setStockPrepUrl] = useState<string | null>(null);
    const [onboardingUrls, setOnboardingUrls] = useState<string[]>([]);
    const [onboardingPaths, setOnboardingPaths] = useState<string[]>([]);

    // Client's machines (with component spare parts), pre-filled with existing images
    const [machines, setMachines] = useState<MachineNode[]>([]);

    // Pending (unsaved) edits
    const [pendingSingle, setPendingSingle] = useState<Partial<Record<SingleKey, PendingFile>>>({});
    const [removedSingle, setRemovedSingle] = useState<Partial<Record<SingleKey, boolean>>>({});
    const [pendingOnboarding, setPendingOnboarding] = useState<PendingFile[]>([]);
    const [onboardingDirty, setOnboardingDirty] = useState(false);
    const [pendingEntity, setPendingEntity] = useState<
        Record<string, { kind: "machine" | "sparePart"; id: string } & PendingFile>
    >({});

    const [savingClient, setSavingClient] = useState(false);
    const [savingProduct, setSavingProduct] = useState(false);

    // ── Fetch client + machine hierarchy ──
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const cRes = await fetch(`/api/clients/${clientId}`, { cache: "no-store" });
            if (!cRes.ok) throw new Error("Failed to load client");
            const client: RawClient = await cRes.json();

            setClientName(client?.name || "Client");
            setBusinessUrl(client?.businessImageUrl || null);
            setFlowsheetUrl(client?.flowsheetImageUrl || null);
            setStockPrepUrl(client?.stockPrepImageUrl || null);
            setOnboardingUrls(Array.isArray(client?.onboardingImageUrls) ? client.onboardingImageUrls : []);
            setOnboardingPaths(Array.isArray(client?.onboardingImages) ? client.onboardingImages : []);
            setLastUpdated(
                client?.updatedAt ? format(new Date(client.updatedAt), "dd/MM/yyyy 'At' h:mma") : ""
            );

            // Which machines / categories does this client actually have?
            const machineIds = new Set<string>();
            const categoryIds = new Set<string>();
            (client?.machines || []).forEach((cm) => {
                const mid = cm?.machine?._id;
                if (mid) machineIds.add(String(mid));
                const cat = cm?.machine?.category;
                const cid = typeof cat === "string" ? cat : cat?._id;
                if (cid) categoryIds.add(String(cid));
            });

            // Pull each category's full subtree (machine + spare-part image URLs live here)
            const cats = await Promise.all(
                Array.from(categoryIds).map(async (cid): Promise<RawCategoryFull | null> => {
                    try {
                        const r = await fetch(`/api/machines/machine-category/${cid}/full`, { cache: "no-store" });
                        if (!r.ok) return null;
                        return (await r.json()) as RawCategoryFull;
                    } catch {
                        return null;
                    }
                })
            );

            const collected: MachineNode[] = [];
            cats.forEach((cat) => {
                (cat?.machines || []).forEach((m) => {
                    if (!machineIds.has(String(m._id))) return;
                    collected.push({
                        _id: m._id,
                        name: m.name || "Machine",
                        imageUrl: m.imageUrl || null,
                        spareParts: (m.spareParts || []).map((sp) => ({
                            _id: sp._id,
                            name: sp.name || "Component",
                            imageUrl: sp.imageUrl || null,
                        })),
                    });
                });
            });
            setMachines(collected);
        } catch (e) {
            console.error("MachineUpload fetch error:", e);
            toast.error(e instanceof Error ? e.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Staging helpers ──
    const stageSingle = useCallback((key: SingleKey, file: File) => {
        setPendingSingle((p) => {
            if (p[key]) URL.revokeObjectURL(p[key]!.previewUrl);
            return { ...p, [key]: { file, previewUrl: URL.createObjectURL(file) } };
        });
        setRemovedSingle((r) => {
            const n = { ...r };
            delete n[key];
            return n;
        });
    }, []);

    const removeSingle = useCallback((key: SingleKey, hasServerImage: boolean) => {
        setPendingSingle((p) => {
            if (p[key]) URL.revokeObjectURL(p[key]!.previewUrl);
            const n = { ...p };
            delete n[key];
            return n;
        });
        if (hasServerImage) setRemovedSingle((r) => ({ ...r, [key]: true }));
    }, []);

    const stageOnboarding = useCallback((file: File) => {
        setPendingOnboarding((arr) => [...arr, { file, previewUrl: URL.createObjectURL(file) }]);
    }, []);

    const removePendingOnboarding = useCallback((idx: number) => {
        setPendingOnboarding((arr) => {
            const target = arr[idx];
            if (target) URL.revokeObjectURL(target.previewUrl);
            return arr.filter((_, i) => i !== idx);
        });
    }, []);

    const removeExistingOnboarding = useCallback((idx: number) => {
        setOnboardingUrls((u) => u.filter((_, i) => i !== idx));
        setOnboardingPaths((p) => p.filter((_, i) => i !== idx));
        setOnboardingDirty(true);
    }, []);

    const stageEntity = useCallback((kind: "machine" | "sparePart", id: string, file: File) => {
        setPendingEntity((p) => {
            const k = `${kind}:${id}`;
            if (p[k]) URL.revokeObjectURL(p[k].previewUrl);
            return { ...p, [k]: { kind, id, file, previewUrl: URL.createObjectURL(file) } };
        });
    }, []);

    const removePendingEntity = useCallback((kind: "machine" | "sparePart", id: string) => {
        setPendingEntity((p) => {
            const k = `${kind}:${id}`;
            if (p[k]) URL.revokeObjectURL(p[k].previewUrl);
            const n = { ...p };
            delete n[k];
            return n;
        });
    }, []);

    // ── Preview resolution ──
    const singlePreview = (key: SingleKey): string | null => {
        if (pendingSingle[key]) return pendingSingle[key]!.previewUrl;
        if (removedSingle[key]) return null;
        return key === "business" ? businessUrl : key === "flowsheet" ? flowsheetUrl : stockPrepUrl;
    };
    const serverSingle = (key: SingleKey): string | null =>
        key === "business" ? businessUrl : key === "flowsheet" ? flowsheetUrl : stockPrepUrl;
    const entityPreview = (kind: "machine" | "sparePart", id: string, serverUrl: string | null): string | null =>
        pendingEntity[`${kind}:${id}`]?.previewUrl ?? serverUrl;

    // ── Save handlers ──
    const clientDirty =
        Object.keys(pendingSingle).length > 0 ||
        Object.keys(removedSingle).length > 0 ||
        pendingOnboarding.length > 0 ||
        onboardingDirty;
    const productDirty = Object.keys(pendingEntity).length > 0;

    const saveClient = useCallback(async () => {
        setSavingClient(true);
        try {
            const update: Record<string, unknown> = {};
            const fieldFor: Record<SingleKey, string> = {
                business: "businessImage",
                flowsheet: "flowsheetImage",
                stockprep: "stockPrepImage",
            };
            for (const key of ["business", "flowsheet", "stockprep"] as SingleKey[]) {
                if (pendingSingle[key]) update[fieldFor[key]] = await uploadGeneric(pendingSingle[key]!.file);
                else if (removedSingle[key]) update[fieldFor[key]] = null;
            }
            if (pendingOnboarding.length > 0 || onboardingDirty) {
                const newPaths = await Promise.all(pendingOnboarding.map((p) => uploadGeneric(p.file)));
                update.onboardingImages = [...onboardingPaths, ...newPaths];
            }

            if (Object.keys(update).length === 0) {
                toast("Nothing to save");
                setSavingClient(false);
                return;
            }

            const res = await fetch(`/api/clients/${clientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(update),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save");
            }

            // The PUT endpoint returns only a status message, so refetch the
            // client to pick up the new image URLs (built by the model virtuals).
            const refresh = await fetch(`/api/clients/${clientId}`, { cache: "no-store" });
            if (refresh.ok) {
                const c: RawClient = await refresh.json();
                setBusinessUrl(c.businessImageUrl || null);
                setFlowsheetUrl(c.flowsheetImageUrl || null);
                setStockPrepUrl(c.stockPrepImageUrl || null);
                setOnboardingUrls(Array.isArray(c.onboardingImageUrls) ? c.onboardingImageUrls : []);
                setOnboardingPaths(Array.isArray(c.onboardingImages) ? c.onboardingImages : []);
                if (c.updatedAt) setLastUpdated(format(new Date(c.updatedAt), "dd/MM/yyyy 'At' h:mma"));
            }

            Object.values(pendingSingle).forEach((p) => p && URL.revokeObjectURL(p.previewUrl));
            pendingOnboarding.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            setPendingSingle({});
            setRemovedSingle({});
            setPendingOnboarding([]);
            setOnboardingDirty(false);
            toast.success("Saved successfully");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSavingClient(false);
        }
    }, [clientId, pendingSingle, removedSingle, pendingOnboarding, onboardingDirty, onboardingPaths]);

    const saveProduct = useCallback(async () => {
        setSavingProduct(true);
        try {
            const entries = Object.values(pendingEntity);
            if (entries.length === 0) {
                toast("Nothing to save");
                setSavingProduct(false);
                return;
            }
            const results: Array<{ kind: "machine" | "sparePart"; id: string; url: string }> = [];
            for (const p of entries) {
                const url = await uploadEntityImage(p.kind, p.id, p.file);
                results.push({ kind: p.kind, id: p.id, url });
            }

            setMachines((ms) =>
                ms.map((m) => {
                    let nm = m;
                    results.forEach((r) => {
                        if (r.kind === "machine" && r.id === m._id) nm = { ...nm, imageUrl: r.url };
                        if (r.kind === "sparePart") {
                            nm = {
                                ...nm,
                                spareParts: nm.spareParts.map((sp) =>
                                    sp._id === r.id ? { ...sp, imageUrl: r.url } : sp
                                ),
                            };
                        }
                    });
                    return nm;
                })
            );

            Object.values(pendingEntity).forEach((p) => URL.revokeObjectURL(p.previewUrl));
            setPendingEntity({});
            toast.success("Saved successfully");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSavingProduct(false);
        }
    }, [pendingEntity]);

    // ── Render ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                <Loader2 className="w-8 h-8 text-orange animate-spin" />
                <p className="text-sm text-muted-foreground">Loading client data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 mt-2">
            {/* ── Client Card ── */}
            <div className="rounded-[10px] bg-white border border-[#96A5BA] overflow-hidden">
                <div className="flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] rounded-t-[10px] px-6 py-4">
                    <h3 className="text-base font-semibold text-foreground">{clientName}</h3>
                    <SaveButton onClick={saveClient} saving={savingClient} disabled={!clientDirty} />
                </div>

                <div className="bg-white p-6 space-y-6">
                    {/* Onboarding Images */}
                    <div>
                        <SectionHeader title="Onboarding Images" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {onboardingUrls.map((url, i) => (
                                <UploadZoneCard
                                    key={`onb-existing-${i}`}
                                    label="Onboarding"
                                    imageUrl={url}
                                    clickToReplace={false}
                                    onSelect={() => { }}
                                    onRemove={() => removeExistingOnboarding(i)}
                                />
                            ))}
                            {pendingOnboarding.map((p, i) => (
                                <UploadZoneCard
                                    key={`onb-pending-${i}`}
                                    label="Onboarding"
                                    imageUrl={p.previewUrl}
                                    clickToReplace={false}
                                    onSelect={() => { }}
                                    onRemove={() => removePendingOnboarding(i)}
                                />
                            ))}
                            <UploadZoneCard label="Onboarding" imageUrl={null} onSelect={stageOnboarding} />
                        </div>
                    </div>

                    {/* Business / Flowsheet / Stock Preparation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <SectionHeader title="Business Images" />
                            <UploadZoneCard
                                label="Business"
                                imageUrl={singlePreview("business")}
                                onSelect={(f) => stageSingle("business", f)}
                                onRemove={singlePreview("business") ? () => removeSingle("business", !!serverSingle("business")) : undefined}
                            />
                        </div>
                        <div>
                            <SectionHeader title="Flowsheet Images" />
                            <UploadZoneCard
                                label="Flowsheet"
                                imageUrl={singlePreview("flowsheet")}
                                onSelect={(f) => stageSingle("flowsheet", f)}
                                onRemove={singlePreview("flowsheet") ? () => removeSingle("flowsheet", !!serverSingle("flowsheet")) : undefined}
                            />
                        </div>
                        <div>
                            <SectionHeader title="Stock Preparation Images" />
                            <UploadZoneCard
                                label="Stock Preparation"
                                imageUrl={singlePreview("stockprep")}
                                onSelect={(f) => stageSingle("stockprep", f)}
                                onRemove={singlePreview("stockprep") ? () => removeSingle("stockprep", !!serverSingle("stockprep")) : undefined}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Upload Product Images ── */}
            <div className="rounded-[10px] bg-white border border-[#96A5BA] overflow-hidden">
                <div className="bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] rounded-t-[10px] px-6 py-4">
                    <h3 className="text-lg font-semibold text-foreground">Upload Product Images</h3>
                </div>

                <div className="bg-white p-6 space-y-8">
                    {machines.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            No machines found for this client. Add machines from the Client Overview to upload product images here.
                        </p>
                    ) : (
                        machines.map((machine) => (
                            <div key={machine._id} className="space-y-6">
                                {/* Machine Image */}
                                <div>
                                    <SectionHeader title={`Machine Image ( ${machine.name} )`} />
                                    <div className="flex gap-4 flex-wrap">
                                        <UploadZoneCard
                                            label={machine.name}
                                            imageUrl={entityPreview("machine", machine._id, machine.imageUrl)}
                                            onSelect={(f) => stageEntity("machine", machine._id, f)}
                                            onRemove={
                                                pendingEntity[`machine:${machine._id}`]
                                                    ? () => removePendingEntity("machine", machine._id)
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Component Images */}
                                {machine.spareParts.length > 0 && (
                                    <div>
                                        <SectionHeader title="Component Images" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {machine.spareParts.map((sp) => (
                                                <UploadZoneCard
                                                    key={sp._id}
                                                    label={sp.name}
                                                    imageUrl={entityPreview("sparePart", sp._id, sp.imageUrl)}
                                                    onSelect={(f) => stageEntity("sparePart", sp._id, f)}
                                                    onRemove={
                                                        pendingEntity[`sparePart:${sp._id}`]
                                                            ? () => removePendingEntity("sparePart", sp._id)
                                                            : undefined
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-6 pt-4 border-t border-border">
                        {lastUpdated && (
                            <span className="text-xs text-muted-foreground">Last Update On - {lastUpdated}</span>
                        )}
                        <SaveButton onClick={saveProduct} saving={savingProduct} disabled={!productDirty} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineUpload;
