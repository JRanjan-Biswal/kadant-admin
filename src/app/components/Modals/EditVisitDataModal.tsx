"use client";

import {
    Dialog,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Calendar, TriangleAlert, CloudUpload, UserPlus, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useCallback, useRef } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteVisit, MachineIssue } from "@/types/visit-details";
import { Admin } from "@/types/admin";

const visitFormSchema = z.object({
    nextScheduledVisit: z.string().min(1, "Scheduled date is required"),
    visitType: z.array(z.string()).min(1, "Select at least one visit type"),
    assignedEngineer: z.string().min(1, "Engineer is required"),
    clientRepresentative: z.string().min(1, "Client representative is required"),
    clientRepresentativeDesignation: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitFormSchema>;

const MACHINE_STATUS_OPTIONS = [
    "Critical Failure",
    "Needs Repair",
    "Monitor",
    "Healthy",
];

const ACTION_NEEDED_OPTIONS = [
    "Send to Rebuild",
    "Order Now",
    "Needs Repair",
    "Monitor",
];

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /video\//i.test(url);
}

function MediaPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
    const isVideo = isVideoUrl(url);
    return (
        <div className="relative group rounded-[8px] overflow-hidden bg-[#f9fafb] border border-[#d1d5db] flex items-center justify-center w-full aspect-square max-w-[80px] min-h-[60px]">
            {isVideo ? (
                <video src={url} className="w-full h-full object-cover" muted />
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="" className="w-full h-full object-cover" />
            )}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-gray-900 hover:bg-red-600 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

function UploadMediaBox({ label, onTrigger, uploading }: { label: string; onTrigger: () => void; uploading?: boolean }) {
    return (
        <button
            type="button"
            onClick={onTrigger}
            disabled={uploading}
            className="w-[80px] h-[60px] rounded-[8px] border border-dashed border-[#D45815]/50 bg-[#f9fafb] flex flex-col items-center justify-center gap-0.5 text-[#6b7280] hover:border-[#D45815] hover:text-[#D45815] transition-colors disabled:opacity-50"
        >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
            <span className="text-[10px]">{uploading ? "..." : label}</span>
        </button>
    );
}

interface EditVisitDataModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    visitId: string;
    clientID: string;
    onSuccess?: () => void;
    viewOnly?: boolean;
}

export default function EditVisitDataModal({
    open,
    onOpenChange,
    visitId,
    clientID,
    onSuccess,
    viewOnly = false,
}: EditVisitDataModalProps) {
    const [isViewMode, setIsViewMode] = useState(viewOnly);
    const [visit, setVisit] = useState<SiteVisit | null>(null);
    const [users, setUsers] = useState<Admin[]>([]);
    const [loadingVisit, setLoadingVisit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [machineIssues, setMachineIssues] = useState<MachineIssue[]>([]);
    const [showAddMachineIssue, setShowAddMachineIssue] = useState(false);
    const [clientMachines, setClientMachines] = useState<{ _id: string; machine: { _id: string; name: string } }[]>([]);
    const [spareParts, setSpareParts] = useState<{ _id: string; name: string; originalName?: string }[]>([]);
    const [loadingSpareParts, setLoadingSpareParts] = useState(false);
    const [loadingOptimalState, setLoadingOptimalState] = useState(false);
    const [newMachineIssue, setNewMachineIssue] = useState({
        machineId: "",
        sparePartId: "",
        machineName: "",
        sparePartName: "",
        status: "",
        conditionAlert: "",
        actionNeeded: "",
        optimalStateMediaUrls: [] as string[],
        currentVisitMediaUrls: [] as string[],
    });
    const [uploadingMedia, setUploadingMedia] = useState<"optimal" | "current" | null>(null);
    const optimalInputRef = useRef<HTMLInputElement>(null);
    const currentInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ index: number; type: "optimal" | "current" } | null>(null);
    const existingMediaInputRef = useRef<HTMLInputElement>(null);
    const [uploadingExisting, setUploadingExisting] = useState<{ index: number; type: "optimal" | "current" } | null>(null);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<VisitFormData>({
        resolver: zodResolver(visitFormSchema),
        defaultValues: {
            nextScheduledVisit: "",
            visitType: [],
            assignedEngineer: "",
            clientRepresentative: "",
            clientRepresentativeDesignation: "",
        },
    });

    const visitType = watch("visitType") || [];

    const fetchVisit = useCallback(async () => {
        if (!clientID || !visitId) return;
        setLoadingVisit(true);
        try {
            const res = await fetch(`/api/clients/${clientID}/site-visits/${visitId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to load visit");
            const data = await res.json();
            setVisit(data as SiteVisit);
            setMachineIssues(data.machineIssues || []);

            const d = data as SiteVisit;
            // Edit is opened from the Visit History table, so the relevant
            // date is the one the visit actually happened on. Prefer
            // lastVisitOn; fall back to nextScheduledVisit for edge cases
            // (scheduled-only visit opened in edit mode).
            const rawDate = d.lastVisitOn || d.nextScheduledVisit || "";
            const dateStr = rawDate
                ? new Date(rawDate).toISOString().slice(0, 10)
                : "";
            setValue("nextScheduledVisit", dateStr);
            setValue("visitType", Array.isArray(d.visitType) ? d.visitType : []);
            setValue(
                "assignedEngineer",
                (d.assignedEngineer as unknown as string) || d.engineer?.name || ""
            );
            setValue("clientRepresentative", d.clientRepresentative ?? "");
            setValue("clientRepresentativeDesignation", d.clientRepresentativeDesignation ?? "");
        } catch {
            toast.error("Failed to load visit details");
            onOpenChange(false);
        } finally {
            setLoadingVisit(false);
        }
    }, [clientID, visitId, setValue, onOpenChange]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/users", { method: "GET", headers: { "Content-Type": "application/json" } });
            if (!res.ok) return;
            const data = await res.json();
            setUsers(data.users || []);
        } catch {
            // ignore
        }
    }, []);

    const fetchClientMachines = useCallback(async () => {
        if (!clientID) return;
        try {
            const res = await fetch(`/api/clients/${clientID}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            const machines = data.machines || [];
            setClientMachines(Array.isArray(machines) ? machines : []);
        } catch {
            setClientMachines([]);
        }
    }, [clientID]);

    const fetchSparePartsForMachine = useCallback(async (machineId: string) => {
        if (!clientID || !machineId) return;
        setLoadingSpareParts(true);
        try {
            const res = await fetch(`/api/products/${clientID}/spare-parts/${machineId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!res.ok) {
                setSpareParts([]);
                return;
            }
            const data = await res.json();
            const list = data.spareParts ?? (Array.isArray(data) ? data : []);
            setSpareParts(list.map((sp: { _id: string; name?: string; originalName?: string }) => ({
                _id: sp._id,
                name: (sp.name ?? sp.originalName ?? "") as string,
                originalName: sp.originalName ?? sp.name,
            })));
        } catch {
            setSpareParts([]);
        } finally {
            setLoadingSpareParts(false);
        }
    }, [clientID]);

    // Pull the spare part's stored optimal-state media (images + videos
    // uploaded for that part on this client machine) and prefill it into the
    // New Machine Issue form's "Optimal state" field.
    const fetchOptimalStateForSparePart = useCallback(
        async (machineId: string, sparePartId: string) => {
            if (!clientID || !machineId || !sparePartId) return;
            setLoadingOptimalState(true);
            try {
                const base = `/api/clients/${clientID}/client-machines/spare-parts`;
                const [imgRes, vidRes] = await Promise.all([
                    fetch(`${base}/spare-parts-uploaded-images/${machineId}`, { cache: "no-store" }),
                    fetch(`${base}/spare-parts-uploaded-videos/${machineId}`, { cache: "no-store" }),
                ]);
                const imgData = imgRes.ok ? await imgRes.json() : [];
                const vidData = vidRes.ok ? await vidRes.json() : [];
                const items = [
                    ...(Array.isArray(imgData) ? imgData : []),
                    ...(Array.isArray(vidData) ? vidData : []),
                ] as Array<Record<string, unknown>>;
                const urls = items
                    .filter((it) => {
                        const sp = it.sparePart as { _id?: string } | string | undefined;
                        const id = typeof sp === "string" ? sp : sp?._id;
                        return id === sparePartId;
                    })
                    .map(
                        (it) =>
                            (it.imageUrl ||
                                it.photoUrl ||
                                it.videoUrl ||
                                it.url ||
                                it.image) as string | undefined
                    )
                    .filter((u): u is string => !!u);
                setNewMachineIssue((p) => ({ ...p, optimalStateMediaUrls: urls }));
            } catch {
                // ignore — optimal state stays empty, engineer can upload manually
            } finally {
                setLoadingOptimalState(false);
            }
        },
        [clientID]
    );

    useEffect(() => {
        if (open) setIsViewMode(viewOnly);
    }, [open, viewOnly]);

    useEffect(() => {
        if (open && clientID) fetchClientMachines();
    }, [open, clientID, fetchClientMachines]);

    useEffect(() => {
        if (open && visitId && clientID) {
            fetchVisit();
            fetchUsers();
        }
    }, [open, visitId, clientID, fetchVisit, fetchUsers]);

    const handleVisitTypeChange = (type: string) => {
        if (visitType.includes(type)) {
            setValue("visitType", visitType.filter((t) => t !== type));
        } else {
            setValue("visitType", [...visitType, type]);
        }
    };

    const handleAddMachineIssue = () => {
        if (!newMachineIssue.machineId || !newMachineIssue.sparePartId || !newMachineIssue.status) {
            toast.error("Please select machine, spare part, and status");
            return;
        }
        setMachineIssues((prev) => [
            ...prev,
            {
                machineId: newMachineIssue.machineId,
                sparePartId: newMachineIssue.sparePartId,
                machineName: newMachineIssue.machineName,
                sparePartName: newMachineIssue.sparePartName,
                status: newMachineIssue.status,
                conditionAlert: newMachineIssue.conditionAlert,
                actionNeeded: newMachineIssue.actionNeeded,
                optimalStateMediaUrls: newMachineIssue.optimalStateMediaUrls ?? [],
                currentVisitMediaUrls: newMachineIssue.currentVisitMediaUrls ?? [],
            },
        ]);
        setNewMachineIssue({
            machineId: "",
            sparePartId: "",
            machineName: "",
            sparePartName: "",
            status: "",
            conditionAlert: "",
            actionNeeded: "",
            optimalStateMediaUrls: [],
            currentVisitMediaUrls: [],
        });
        setSpareParts([]);
        setShowAddMachineIssue(false);
    };

    const removeMachineIssue = (index: number) => {
        setMachineIssues((prev) => prev.filter((_, i) => i !== index));
    };

    /** Upload to backend; URL is always returned from backend (getFullAssetUrl in kadant-api urlUtils). */
    const uploadFile = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Upload failed");
        }
        const data = await res.json();
        if (!data?.url) throw new Error("No URL returned from backend");
        return data.url;
    }, []);

    const handleNewIssueMediaUpload = useCallback(
        async (type: "optimal" | "current", file: File) => {
            setUploadingMedia(type);
            try {
                const url = await uploadFile(file);
                setNewMachineIssue((p) => ({
                    ...p,
                    ...(type === "optimal"
                        ? { optimalStateMediaUrls: [...(p.optimalStateMediaUrls || []), url] }
                        : { currentVisitMediaUrls: [...(p.currentVisitMediaUrls || []), url] }),
                }));
                toast.success("File uploaded");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed");
            } finally {
                setUploadingMedia(null);
            }
        },
        [uploadFile]
    );

    const removeNewIssueMedia = (type: "optimal" | "current", index: number) => {
        setNewMachineIssue((p) => ({
            ...p,
            ...(type === "optimal"
                ? { optimalStateMediaUrls: p.optimalStateMediaUrls.filter((_, i) => i !== index) }
                : { currentVisitMediaUrls: p.currentVisitMediaUrls.filter((_, i) => i !== index) }),
        }));
    };

    const updateIssueMedia = (issueIndex: number, type: "optimal" | "current", url: string, add: boolean) => {
        setMachineIssues((prev) =>
            prev.map((issue, i) => {
                if (i !== issueIndex) return issue;
                if (type === "optimal") {
                    const next = add ? [...(issue.optimalStateMediaUrls || []), url] : (issue.optimalStateMediaUrls || []).filter((u) => u !== url);
                    return { ...issue, optimalStateMediaUrls: next };
                }
                const next = add ? [...(issue.currentVisitMediaUrls || []), url] : (issue.currentVisitMediaUrls || []).filter((u) => u !== url);
                return { ...issue, currentVisitMediaUrls: next };
            })
        );
    };

    const handleExistingIssueMediaSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file || uploadTarget === null) return;
            const { index, type } = uploadTarget;
            setUploadTarget(null);
            setUploadingExisting({ index, type });
            try {
                const url = await uploadFile(file);
                setMachineIssues((prev) =>
                    prev.map((issue, i) => {
                        if (i !== index) return issue;
                        if (type === "optimal") return { ...issue, optimalStateMediaUrls: [...(issue.optimalStateMediaUrls || []), url] };
                        return { ...issue, currentVisitMediaUrls: [...(issue.currentVisitMediaUrls || []), url] };
                    })
                );
                toast.success("File uploaded");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingExisting(null);
            }
        },
        [uploadTarget, uploadFile]
    );

    const handleOptimalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) handleNewIssueMediaUpload("optimal", file);
    };
    const handleCurrentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) handleNewIssueMediaUpload("current", file);
    };

    const onSubmit = async (data: VisitFormData) => {
        setSubmitting(true);
        try {
            // If the loaded visit had lastVisitOn set, this is a completed
            // visit being edited from Visit History — the date field maps to
            // lastVisitOn and nextScheduledVisit must be cleared so the
            // record stays in History instead of bouncing to Upcoming.
            // Otherwise (scheduled-only record), treat the date as
            // nextScheduledVisit.
            const isCompletedVisit = !!visit?.lastVisitOn;
            const dateFields = isCompletedVisit
                ? { lastVisitOn: data.nextScheduledVisit, nextScheduledVisit: null }
                : { nextScheduledVisit: data.nextScheduledVisit };

            const res = await fetch(`/api/clients/${clientID}/site-visits/${visitId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...dateFields,
                    visitType: data.visitType,
                    assignedEngineer: data.assignedEngineer,
                    clientRepresentative: data.clientRepresentative,
                    clientRepresentativeDesignation: data.clientRepresentativeDesignation || "",
                    machineIssues,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update visit");
            }
            toast.success("Visit updated successfully");
            onSuccess?.();
            onOpenChange(false);
            reset();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update visit");
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldErrorClass = (hasError: boolean) =>
        hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-[#d1d5db]";

    const STATUS_TEXT_STYLES: Record<string, string> = {
        "Critical Failure": "text-[#dc2626]",
        "Needs Repair": "text-[#f59e0b]",
        Monitor: "text-[#2D3E5C]",
        Healthy: "text-[#16a34a]",
    };

    const ACTION_PILL_STYLES: Record<string, string> = {
        "Send to Rebuild":
            "bg-[#fed7aa] border border-[#fb923c] text-[#c2410c]",
        "Order New": "bg-[#fee2e2] border border-[#dc2626] text-[#991b1b]",
        "Needs Repair": "bg-[#fef3c7] border border-[#f59e0b] text-[#92400e]",
        Monitor: "bg-[#dbeafe] border border-[#2D3E5C] text-[#2D3E5C]",
    };

    if (isViewMode) {
        const visitDateRaw = visit?.lastVisitOn || visit?.nextScheduledVisit || "";
        const dateLabel = visitDateRaw
            ? format(parseISO(visitDateRaw), "dd MMM yyyy")
            : "";
        const typeLabel = Array.isArray(visit?.visitType)
            ? (visit?.visitType as string[]).join(", ")
            : "";
        const subtitle = [dateLabel, typeLabel].filter(Boolean).join(" - ");

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="bg-white border border-[#96A5BA] rounded-[14px] p-0 w-[894px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                    showCloseButton={false}
                >
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#e5e7eb]">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-[#2D3E5C] text-2xl font-bold leading-7">
                                Visit Details
                            </h2>
                            {subtitle && (
                                <p className="text-[#6b7280] text-sm">{subtitle}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#f3f4f6] transition-colors"
                        >
                            <X className="w-5 h-5 text-[#2D3E5C]" />
                        </button>
                    </div>

                    {loadingVisit ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-[#D45815] animate-spin" />
                        </div>
                    ) : (
                        <div className="px-6 pb-6">
                            <div className="rounded-[10px] flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <TriangleAlert className="w-6 h-6 text-[#D45815]" />
                                    <h3 className="text-[#2D3E5C] text-xl font-bold">
                                        Machines Requiring Attention ({machineIssues.length})
                                    </h3>
                                </div>

                                {machineIssues.length === 0 && (
                                    <p className="text-[#6b7280] text-sm">
                                        No machine issues recorded for this visit.
                                    </p>
                                )}

                                {machineIssues.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-4"
                                    >
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Machine Name
                                                </p>
                                                <p className="text-[#1f2937] text-sm font-medium">
                                                    {issue.machineName || "—"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">Status</p>
                                                <p
                                                    className={`text-sm font-medium ${
                                                        STATUS_TEXT_STYLES[issue.status || ""] ||
                                                        "text-[#6b7280]"
                                                    }`}
                                                >
                                                    {issue.status || "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {issue.conditionAlert && (
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Condition Alert
                                                </p>
                                                <p className="text-[#1f2937] text-sm">
                                                    {issue.conditionAlert}
                                                </p>
                                            </div>
                                        )}

                                        {issue.actionNeeded && (
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Action Needed
                                                </p>
                                                <span
                                                    className={`inline-block text-xs font-medium rounded-full px-3 py-1 self-start ${
                                                        ACTION_PILL_STYLES[issue.actionNeeded] ||
                                                        "bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280]"
                                                    }`}
                                                >
                                                    {issue.actionNeeded}
                                                </span>
                                            </div>
                                        )}

                                        {((issue.optimalStateMediaUrls || []).length > 0 ||
                                            (issue.currentVisitMediaUrls || []).length > 0) && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[#6b7280] text-xs">
                                                        Last Visit
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 items-start">
                                                        {(issue.optimalStateMediaUrls ?? []).map(
                                                            (url, ui) => (
                                                                <a
                                                                    key={ui}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] flex items-center justify-center w-[80px] h-[60px] cursor-pointer hover:opacity-90 transition-opacity"
                                                                >
                                                                    {isVideoUrl(url) ? (
                                                                        <video
                                                                            src={url}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                        />
                                                                    ) : (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img
                                                                            src={url}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </a>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-[#6b7280] text-xs">
                                                        Current Visit
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 items-start">
                                                        {(issue.currentVisitMediaUrls ?? []).map(
                                                            (url, ui) => (
                                                                <a
                                                                    key={ui}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] flex items-center justify-center w-[80px] h-[60px] cursor-pointer hover:opacity-90 transition-opacity"
                                                                >
                                                                    {isVideoUrl(url) ? (
                                                                        <video
                                                                            src={url}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                        />
                                                                    ) : (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img
                                                                            src={url}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </a>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {(issue.sparePartMedia || []).length > 0 && (
                                            <div className="grid grid-cols-4 gap-3">
                                                {(issue.sparePartMedia || []).map((entry) => (
                                                    <div
                                                        key={entry.sparePartId}
                                                        className="flex flex-col gap-1.5"
                                                    >
                                                        <p className="text-[#1f2937] text-xs font-medium truncate">
                                                            {entry.sparePartName}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5 items-start">
                                                            {(entry.mediaUrls || []).map((url, ui) => (
                                                                <a
                                                                    key={ui}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] flex items-center justify-center w-[80px] h-[60px] cursor-pointer hover:opacity-90 transition-opacity"
                                                                >
                                                                    {isVideoUrl(url) ? (
                                                                        <video
                                                                            src={url}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                        />
                                                                    ) : (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img
                                                                            src={url}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-white border border-[#96A5BA] rounded-[10px] p-0 w-[894px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                <div className="bg-[#DFE6EC] border-b border-[#607797] flex h-[89px] items-center justify-between px-8 shrink-0">
                    <div className="flex gap-3 items-center">
                        <div className="bg-[rgba(255,105,0,0.2)] rounded-full w-10 h-10 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[#ff6900]" />
                        </div>
                        <h2 className="text-gray-900 text-[24px] leading-[32px] font-normal">
                            {isViewMode ? "Visit Details" : "Edit Visit Data"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {isViewMode && (
                            <button
                                type="button"
                                onClick={() => setIsViewMode(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#D45815] hover:bg-[#b8480f] text-white text-[14px] font-medium transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="w-6 h-6 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {loadingVisit ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-[#ff6900] animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                        <input
                            ref={existingMediaInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleExistingIssueMediaSelect}
                        />
                        <div className="px-8 pt-6 pb-6 flex flex-col gap-6">
                            {/* Visit Details */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[#6b7280] text-[16px] leading-[20px] font-normal">
                                        Scheduled Date *
                                    </Label>
                                    <div className="relative">
                                        <Controller
                                            name="nextScheduledVisit"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    onClick={(e) => !isViewMode && (e.currentTarget as HTMLInputElement).showPicker?.()}
                                                    disabled={isViewMode}
                                                    className={`bg-[#e5e7eb] border ${getFieldErrorClass(!!errors.nextScheduledVisit)} h-[50px] rounded-[10px] px-4 pr-12 text-gray-900 text-[16px] placeholder:text-[#4b5563] focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-0 disabled:opacity-70 disabled:cursor-not-allowed`}
                                                />
                                            )}
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280] pointer-events-none" />
                                    </div>
                                    {errors.nextScheduledVisit && (
                                        <p className="text-red-500 text-sm">{errors.nextScheduledVisit.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Label className="text-[#6b7280] text-[16px] leading-[20px] font-normal">
                                        Visit Type *
                                    </Label>
                                    <div className="flex gap-4">
                                        <div className="flex gap-3 items-center">
                                            <Checkbox
                                                id="edit-process-audit"
                                                checked={visitType.includes("Process Audit")}
                                                onCheckedChange={() => handleVisitTypeChange("Process Audit")}
                                                disabled={isViewMode}
                                                className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#607797] data-[state=checked]:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                            <Label htmlFor="edit-process-audit" className="text-gray-900 text-[16px] leading-[24px] font-normal cursor-pointer">
                                                Process Audit
                                            </Label>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <Checkbox
                                                id="edit-mechanical-audit"
                                                checked={visitType.includes("Mechanical Audit")}
                                                onCheckedChange={() => handleVisitTypeChange("Mechanical Audit")}
                                                disabled={isViewMode}
                                                className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#607797] data-[state=checked]:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                            <Label htmlFor="edit-mechanical-audit" className="text-gray-900 text-[16px] leading-[24px] font-normal cursor-pointer">
                                                Mechanical Audit
                                            </Label>
                                        </div>
                                    </div>
                                    {errors.visitType && (
                                        <p className="text-red-500 text-sm">{errors.visitType.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-[16px] leading-[20px] font-normal">
                                            Assign Engineer *
                                        </Label>
                                        <Controller
                                            name="assignedEngineer"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isViewMode}
                                                    placeholder="Type engineer name"
                                                    className={`bg-[#e5e7eb] border ${getFieldErrorClass(!!errors.assignedEngineer)} w-full !h-[50px] rounded-[10px] text-gray-900 text-[16px] placeholder:text-[#6b7280] focus:ring-0 disabled:opacity-70 disabled:cursor-not-allowed`}
                                                />
                                            )}
                                        />
                                        {errors.assignedEngineer && (
                                            <p className="text-red-500 text-sm">{errors.assignedEngineer.message}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-[16px] leading-[20px] font-normal">
                                            Client Representative *
                                        </Label>
                                        <Controller
                                            name="clientRepresentative"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    disabled={isViewMode}
                                                    className={`bg-[#e5e7eb] border ${getFieldErrorClass(!!errors.clientRepresentative)} h-[50px] rounded-[10px] px-4 text-gray-900 text-[16px] placeholder:text-[#4b5563] focus-visible:ring-0 disabled:opacity-70 disabled:cursor-not-allowed`}
                                                    placeholder="Enter client name"
                                                />
                                            )}
                                        />
                                        {errors.clientRepresentative && (
                                            <p className="text-red-500 text-sm">{errors.clientRepresentative.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-[#6b7280] text-[16px] leading-[20px] font-normal">
                                        Client Designation
                                    </Label>
                                    <Controller
                                        name="clientRepresentativeDesignation"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                disabled={isViewMode}
                                                className="bg-[#e5e7eb] border border-[#d1d5db] h-[50px] rounded-[10px] px-4 text-gray-900 text-[16px] placeholder:text-[#4b5563] focus-visible:ring-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                                placeholder="Designation"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Machines Requiring Attention */}
                            <div className="py-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[rgba(255,105,0,0.2)] rounded p-1">
                                            <TriangleAlert className="w-5 h-5 text-[#ff6900]" />
                                        </div>
                                        <h3 className="text-gray-900 text-[16px] leading-[24px] font-medium">
                                            Machines Requiring Attention ({machineIssues.length})
                                        </h3>
                                    </div>
                                    {!isViewMode && (
                                        <Button
                                            type="button"
                                            onClick={() => setShowAddMachineIssue((v) => !v)}
                                            className="bg-[#D45815] hover:bg-[#b8480f] text-white text-[14px] font-medium h-9 px-4 rounded-[10px]"
                                        >
                                            {showAddMachineIssue ? "Cancel" : "+ Add Machine Issue"}
                                        </Button>
                                    )}
                                </div>

                                {machineIssues.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#e5e7eb] border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-gray-900 text-[14px] font-medium">{issue.machineName || "Unnamed machine"}</span>
                                                {issue.sparePartName && (
                                                    <span className="text-[#6b7280] text-[14px]">/ {issue.sparePartName}</span>
                                                )}
                                                <span className="text-red-500 text-[14px] font-medium">{issue.status || ""}</span>
                                            </div>
                                            {!isViewMode && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMachineIssue(index)}
                                                    className="text-[#6b7280] hover:text-gray-900 h-8"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        {issue.conditionAlert && (
                                            <div>
                                                <p className="text-[#6b7280] text-[12px] mb-1">Condition Alert</p>
                                                <p className="text-[#6b7280] text-[13px]">{issue.conditionAlert}</p>
                                            </div>
                                        )}
                                        {issue.actionNeeded && (
                                            <div>
                                                <p className="text-[#6b7280] text-[12px] mb-1">Action Needed</p>
                                                <span className="inline-block text-[#ff6900] text-[13px] font-medium border border-[#ff6900] rounded-full px-3 py-0.5">{issue.actionNeeded}</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-[12px]">Optimal state</p>
                                                <div className="flex flex-wrap gap-2 items-start">
                                                    {(issue.optimalStateMediaUrls ?? []).map((url, ui) => (
                                                        isViewMode
                                                            ? <div key={ui} className="relative rounded-[8px] overflow-hidden bg-[#f9fafb] border border-[#d1d5db] flex items-center justify-center w-full aspect-square max-w-[80px] min-h-[60px]">
                                                                {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                                                              </div>
                                                            : <MediaPreview key={ui} url={url} onRemove={() => updateIssueMedia(index, "optimal", url, false)} />
                                                    ))}
                                                    {!isViewMode && (
                                                        <UploadMediaBox
                                                            label="Add"
                                                            onTrigger={() => { setUploadTarget({ index, type: "optimal" }); existingMediaInputRef.current?.click(); }}
                                                            uploading={uploadingExisting?.index === index && uploadingExisting?.type === "optimal"}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-[12px]">Current Visit</p>
                                                <div className="flex flex-wrap gap-2 items-start">
                                                    {(issue.currentVisitMediaUrls ?? []).map((url, ui) => (
                                                        isViewMode
                                                            ? <div key={ui} className="relative rounded-[8px] overflow-hidden bg-[#f9fafb] border border-[#d1d5db] flex items-center justify-center w-full aspect-square max-w-[80px] min-h-[60px]">
                                                                {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                                                              </div>
                                                            : <MediaPreview key={ui} url={url} onRemove={() => updateIssueMedia(index, "current", url, false)} />
                                                    ))}
                                                    {!isViewMode && (
                                                        <UploadMediaBox
                                                            label="Add"
                                                            onTrigger={() => { setUploadTarget({ index, type: "current" }); existingMediaInputRef.current?.click(); }}
                                                            uploading={uploadingExisting?.index === index && uploadingExisting?.type === "current"}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {showAddMachineIssue && (
                                    <div className="border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-4 bg-[#e5e7eb]">
                                        <h4 className="text-gray-900 text-[14px] font-medium">New Machine Issue</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-gray-900 text-[14px]">Machine *</Label>
                                                <Select
                                                    value={newMachineIssue.machineId}
                                                    onValueChange={(value) => {
                                                        const chosen = clientMachines.find((m) => (m.machine as { _id?: string })?._id === value || m._id === value);
                                                        const name = chosen?.machine && typeof chosen.machine === "object" && "name" in chosen.machine ? (chosen.machine as { name: string }).name : "";
                                                        setNewMachineIssue((p) => ({
                                                            ...p,
                                                            machineId: value,
                                                            machineName: name ?? "",
                                                            sparePartId: "",
                                                            sparePartName: "",
                                                            optimalStateMediaUrls: [],
                                                        }));
                                                        setSpareParts([]);
                                                        fetchSparePartsForMachine(value);
                                                    }}
                                                >
                                                    <SelectTrigger className="bg-white w-full border border-[#d1d5db] !h-[50px] rounded-[10px] text-gray-900 text-[14px] focus:ring-0">
                                                        <SelectValue placeholder="Select machine" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                                        {clientMachines.map((cm) => {
                                                            const id = (cm.machine as { _id?: string })?._id ?? cm._id;
                                                            const name = (cm.machine as { name?: string })?.name ?? "Unnamed machine";
                                                            return (
                                                                <SelectItem key={id} value={id} className="text-gray-900 hover:bg-[#d1d5db]">
                                                                    {name}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-gray-900 text-[14px]">Spare part *</Label>
                                                <Select
                                                    value={newMachineIssue.sparePartId}
                                                    onValueChange={(value) => {
                                                        const chosen = spareParts.find((sp) => sp._id === value);
                                                        setNewMachineIssue((p) => ({
                                                            ...p,
                                                            sparePartId: value,
                                                            sparePartName: chosen?.name ?? "",
                                                        }));
                                                        fetchOptimalStateForSparePart(newMachineIssue.machineId, value);
                                                    }}
                                                    disabled={!newMachineIssue.machineId || loadingSpareParts}
                                                >
                                                    <SelectTrigger className="bg-white w-full border border-[#d1d5db] !h-[50px] rounded-[10px] text-gray-900 text-[14px] focus:ring-0 disabled:opacity-50">
                                                        <SelectValue placeholder={loadingSpareParts ? "Loading..." : "Select spare part"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                                        {spareParts.map((sp) => (
                                                            <SelectItem key={sp._id} value={sp._id} className="text-gray-900 hover:bg-[#d1d5db]">
                                                                {sp.name || sp.originalName || sp._id}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-gray-900 text-[14px]">Status *</Label>
                                                <Select
                                                    value={newMachineIssue.status}
                                                    onValueChange={(v) => setNewMachineIssue((p) => ({ ...p, status: v }))}
                                                >
                                                    <SelectTrigger className="bg-white border border-[#d1d5db] w-full !h-[50px] rounded-[10px] text-gray-900 text-[14px] focus:ring-0">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                                        {MACHINE_STATUS_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt} value={opt} className="text-gray-900 hover:bg-[#d1d5db]">
                                                                {opt}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {/* Condition Alert */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-gray-900 text-[14px]">Condition Alert</Label>
                                            <textarea
                                                value={newMachineIssue.conditionAlert}
                                                onChange={(e) => setNewMachineIssue((p) => ({ ...p, conditionAlert: e.target.value }))}
                                                rows={2}
                                                className="bg-white border border-[#d1d5db] rounded-[10px] px-4 py-3 text-gray-900 text-[14px] placeholder:text-[#4b5563] focus-visible:ring-0 resize-none outline-none"
                                                placeholder="Describe the condition..."
                                            />
                                        </div>
                                        {/* Action Needed */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-gray-900 text-[14px]">Action Needed</Label>
                                            <Select
                                                value={newMachineIssue.actionNeeded}
                                                onValueChange={(v) => setNewMachineIssue((p) => ({ ...p, actionNeeded: v }))}
                                            >
                                                <SelectTrigger className="bg-white border border-[#d1d5db] w-full !h-[50px] rounded-[10px] text-gray-900 text-[14px] focus:ring-0">
                                                    <SelectValue placeholder="Select action" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                                    {ACTION_NEEDED_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt} value={opt} className="text-gray-900 hover:bg-[#d1d5db]">
                                                            {opt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-gray-900 text-[14px] flex items-center gap-2">
                                                    Optimal state
                                                    {loadingOptimalState && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                </Label>
                                                <input
                                                    ref={optimalInputRef}
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    className="hidden"
                                                    onChange={handleOptimalInputChange}
                                                />
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {(newMachineIssue.optimalStateMediaUrls ?? []).map((url, ui) => (
                                                        <MediaPreview key={ui} url={url} onRemove={() => removeNewIssueMedia("optimal", ui)} />
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => optimalInputRef.current?.click()}
                                                        disabled={uploadingMedia === "optimal"}
                                                        className="bg-[#f9fafb] border border-dashed border-[#D45815]/50 h-[80px] min-w-[80px] w-full rounded-[10px] flex flex-col items-center justify-center gap-1 text-[#6b7280] hover:border-[#D45815] hover:text-[#D45815] transition-colors disabled:opacity-50"
                                                    >
                                                        {uploadingMedia === "optimal" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                                                        <span className="text-[12px]">Upload image/video</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-gray-900 text-[14px]">Current Visit</Label>
                                                <input
                                                    ref={currentInputRef}
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    className="hidden"
                                                    onChange={handleCurrentInputChange}
                                                />
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {(newMachineIssue.currentVisitMediaUrls ?? []).map((url, ui) => (
                                                        <MediaPreview key={ui} url={url} onRemove={() => removeNewIssueMedia("current", ui)} />
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => currentInputRef.current?.click()}
                                                        disabled={uploadingMedia === "current"}
                                                        className="bg-[#f9fafb] border border-dashed border-[#D45815]/50 h-[80px] min-w-[80px] w-full rounded-[10px] flex flex-col items-center justify-center gap-1 text-[#6b7280] hover:border-[#D45815] hover:text-[#D45815] transition-colors disabled:opacity-50"
                                                    >
                                                        {uploadingMedia === "current" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                                                        <span className="text-[12px]">Upload image/video</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowAddMachineIssue(false);
                                                    setNewMachineIssue({ machineId: "", sparePartId: "", machineName: "", sparePartName: "", status: "", conditionAlert: "", actionNeeded: "", optimalStateMediaUrls: [], currentVisitMediaUrls: [] });
                                                    setSpareParts([]);
                                                }}
                                                className="bg-[#e5e7eb] border-[#d1d5db] text-gray-900 hover:bg-[#d1d5db] rounded-[10px] h-9 px-4"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleAddMachineIssue}
                                                className="bg-[#D45815] hover:bg-[#b8480f] text-white rounded-[10px] h-9 px-4"
                                            >
                                                Add Issue
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isViewMode && (
                            <DialogFooter className="border-t border-[#607797] px-8 py-4 flex justify-end gap-4 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="border border-[#d1d5db] bg-transparent hover:bg-[#e5e7eb] text-[#6b7280] text-[16px] font-bold px-6 py-3 rounded-[10px] h-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-[#D45815] hover:bg-[#b8480f] text-white text-[16px] font-bold px-8 py-3 rounded-[10px] h-auto"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Visit"}
                                </Button>
                            </DialogFooter>
                        )}
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
