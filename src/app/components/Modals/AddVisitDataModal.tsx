"use client";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    X,
    Calendar,
    TriangleAlert,
    CloudUpload,
    Loader2,
    UserPlus,
} from "lucide-react";
import { FaPlus } from "react-icons/fa6";
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
import {
    MachineIssue,
    SiteVisit,
    SparePartMediaEntry,
} from "@/types/visit-details";
import { Admin } from "@/types/admin";
import { format, parseISO, isToday } from "date-fns";
import { useSession } from "next-auth/react";

const visitFormSchema = z.object({
    nextScheduledVisit: z.string().min(1, "Scheduled date is required"),
    visitType: z.array(z.string()).min(1, "Select at least one visit type"),
    assignedEngineer: z.string().min(1, "Engineer is required"),
    clientRepresentative: z.string().min(1, "Client representative is required"),
});

type VisitFormData = z.infer<typeof visitFormSchema>;

const MACHINE_STATUS_OPTIONS = [
    "Critical Failure",
    "Needs Repair",
    "Monitor",
    "Healthy",
];

const ACTION_OPTIONS: { value: string; idle: string; active: string }[] = [
    {
        value: "Send to Rebuild",
        idle: "bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280]",
        active:
            "bg-[#e5e7eb] border border-[#9ca3af] text-[#1f2937] ring-2 ring-offset-1 ring-[#9ca3af]",
    },
    {
        value: "Order New",
        idle: "bg-[#dc2626] border border-[#dc2626] text-white opacity-80",
        active:
            "bg-[#dc2626] border border-[#dc2626] text-white ring-2 ring-offset-1 ring-[#dc2626]",
    },
    {
        value: "Needs Repair",
        idle: "bg-[#f59e0b] border border-[#f59e0b] text-white opacity-80",
        active:
            "bg-[#f59e0b] border border-[#f59e0b] text-white ring-2 ring-offset-1 ring-[#f59e0b]",
    },
    {
        value: "Monitor",
        idle: "bg-[#2D3E5C] border border-[#2D3E5C] text-white opacity-80",
        active:
            "bg-[#2D3E5C] border border-[#2D3E5C] text-white ring-2 ring-offset-1 ring-[#2D3E5C]",
    },
];

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

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /video\//i.test(url);
}

function MediaPreview({
    url,
    onRemove,
    size = "w-[80px] h-[60px]",
}: {
    url: string;
    onRemove: () => void;
    size?: string;
}) {
    const isVideo = isVideoUrl(url);
    return (
        <div
            className={`relative group rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] flex items-center justify-center ${size}`}
        >
            {isVideo ? (
                <video src={url} className="w-full h-full object-cover" muted />
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="" className="w-full h-full object-cover" />
            )}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

function UploadBox({
    onTrigger,
    uploading,
    label = "Upload",
    size = "w-[80px] h-[60px]",
}: {
    onTrigger: () => void;
    uploading?: boolean;
    label?: string;
    size?: string;
}) {
    return (
        <button
            type="button"
            onClick={onTrigger}
            disabled={uploading}
            className={`${size} rounded-[8px] border border-dashed border-[#9ca3af] bg-[#f9fafb] flex flex-col items-center justify-center gap-0.5 text-[#6b7280] hover:border-[#2D3E5C] hover:text-[#2D3E5C] transition-colors disabled:opacity-50`}
        >
            {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <CloudUpload className="w-5 h-5" />
            )}
            <span className="text-[10px]">{uploading ? "..." : label}</span>
        </button>
    );
}

function WideUploadBox({
    onTrigger,
    uploading,
    label = "Upload image/video",
    disabled,
}: {
    onTrigger: () => void;
    uploading?: boolean;
    label?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onTrigger}
            disabled={uploading || disabled}
            className="w-full h-[80px] rounded-[10px] border border-dashed border-[#9ca3af] bg-[#f9fafb] flex flex-col items-center justify-center gap-1 text-[#6b7280] hover:border-[#2D3E5C] hover:text-[#2D3E5C] transition-colors disabled:opacity-50"
        >
            {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <CloudUpload className="w-5 h-5" />
            )}
            <span className="text-xs">{uploading ? "Uploading..." : label}</span>
        </button>
    );
}

interface MachineCategory {
    _id: string;
    name: string;
    machines: { _id: string; name: string }[];
}

interface SparePartLite {
    _id: string;
    name: string;
    klValue?: string;
    optimalStateVideoUrl?: string | null;
}

interface NewMachineIssue {
    categoryId: string;
    categoryName: string;
    machineId: string;
    machineName: string;
    sparePartId: string;
    sparePartName: string;
    status: string;
    conditionAlert: string;
    actionNeeded: string;
    optimalStateMediaUrls: string[];
    currentVisitMediaUrls: string[];
    sparePartMedia: SparePartMediaEntry[];
    subPartPhotos: { [partId: string]: string[] };
    subPartLastVisitPhotos: { [partId: string]: string[] };
}

const EMPTY_ISSUE: NewMachineIssue = {
    categoryId: "",
    categoryName: "",
    machineId: "",
    machineName: "",
    sparePartId: "",
    sparePartName: "",
    status: "",
    conditionAlert: "",
    actionNeeded: "",
    optimalStateMediaUrls: [],
    currentVisitMediaUrls: [],
    sparePartMedia: [],
    subPartPhotos: {},
    subPartLastVisitPhotos: {},
};

interface AddVisitDataModalProps {
    clientID: string;
    onSuccess: () => void;
    children?: React.ReactNode;
}

export default function AddVisitDataModal({
    clientID,
    onSuccess,
    children,
}: AddVisitDataModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<Admin[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addingIssue, setAddingIssue] = useState(false);
    const [scheduledToday, setScheduledToday] = useState<
        { date: string; id: string }[]
    >([]);
    const [useCustomDate, setUseCustomDate] = useState(false);
    // When user picks a today-scheduled chip, we update that existing visit
    // (mark it as completed) instead of creating a new record. Null means
    // create new.
    const [selectedChipVisitId, setSelectedChipVisitId] = useState<string | null>(
        null
    );
    const [machineIssues, setMachineIssues] = useState<MachineIssue[]>([]);
    const [showAddIssue, setShowAddIssue] = useState(false);
    const [categories, setCategories] = useState<MachineCategory[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<
        { _id: string; name: string }[]
    >([]);
    const [newIssue, setNewIssue] = useState<NewMachineIssue>({ ...EMPTY_ISSUE });
    const [spareParts, setSpareParts] = useState<SparePartLite[]>([]);
    const [loadingSpareParts, setLoadingSpareParts] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState<
        "optimal" | "current" | null
    >(null);
    const [uploadingSparePartId, setUploadingSparePartId] = useState<string | null>(
        null
    );
    const optimalInputRef = useRef<HTMLInputElement>(null);
    const currentInputRef = useRef<HTMLInputElement>(null);
    const sparePartInputRef = useRef<HTMLInputElement>(null);
    const sparePartTargetRef = useRef<{ sparePartId: string; sparePartName: string } | null>(
        null
    );
    const [subParts, setSubParts] = useState<{ _id: string; name: string; optimalStateVideoUrl?: string | null }[]>([]);
    const [selectedSubPartIds, setSelectedSubPartIds] = useState<string[]>([]);
    const [uploadingSubPart, setUploadingSubPart] = useState<string | null>(null);
    const subPartInputRef = useRef<HTMLInputElement>(null);
    const subPartTargetRef = useRef<string | null>(null);
    const [uploadingSubPartLastVisit, setUploadingSubPartLastVisit] = useState<string | null>(null);
    const subPartLastVisitInputRef = useRef<HTMLInputElement>(null);
    const subPartLastVisitTargetRef = useRef<string | null>(null);
    const [uploadingSubPartOptimal, setUploadingSubPartOptimal] = useState<string | null>(null);
    const subPartOptimalInputRef = useRef<HTMLInputElement>(null);
    const subPartOptimalTargetRef = useRef<string | null>(null);
    // Parallel arrays tracking per-confirmed-issue data
    const [machineIssueOptimalUrls, setMachineIssueOptimalUrls] = useState<(string | null)[]>([]);
    const [machineIssueSubParts, setMachineIssueSubParts] = useState<{ _id: string; name: string; optimalStateVideoUrl?: string | null }[][]>([]);
    const [uploadingOptimalNew, setUploadingOptimalNew] = useState(false);
    const [uploadingOptimalExisting, setUploadingOptimalExisting] = useState<number | null>(null);
    const sparePartOptimalNewInputRef = useRef<HTMLInputElement>(null);
    const existingIssueOptimalInputRef = useRef<HTMLInputElement>(null);
    const existingOptimalTargetIdxRef = useRef<number | null>(null);
    const [uploadTarget, setUploadTarget] = useState<{
        index: number;
        type: "optimal" | "current";
    } | null>(null);
    const existingMediaInputRef = useRef<HTMLInputElement>(null);
    const [uploadingExisting, setUploadingExisting] = useState<{
        index: number;
        type: "optimal" | "current";
    } | null>(null);
    const existingSparePartInputRef = useRef<HTMLInputElement>(null);
    const existingSparePartTargetRef = useRef<{
        index: number;
        sparePartId: string;
        sparePartName: string;
    } | null>(null);
    const [uploadingExistingSparePart, setUploadingExistingSparePart] = useState<{
        index: number;
        sparePartId: string;
    } | null>(null);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

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
        },
    });

    const visitType = watch("visitType") || [];

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/users", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) return;
            const data = await res.json();
            setUsers(data.users || []);
        } catch {
            /* ignore */
        }
    }, []);

    const fetchScheduledVisits = useCallback(async () => {
        try {
            const res = await fetch(`/api/clients/${clientID}/site-visits`, {
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            const chips = (Array.isArray(data) ? data : [])
                .filter(
                    (v: SiteVisit) =>
                        v.nextScheduledVisit && isToday(parseISO(v.nextScheduledVisit))
                )
                .map((v: SiteVisit) => ({ date: v.nextScheduledVisit, id: v._id }));
            setScheduledToday(chips);
            if (chips.length === 0) setUseCustomDate(true);
        } catch {
            setScheduledToday([]);
            setUseCustomDate(true);
        }
    }, [clientID]);

    const fetchCategories = useCallback(async () => {
        try {
            const [catRes, clientRes] = await Promise.all([
                fetch("/api/products/categories/with-machines", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                }),
                fetch(`/api/clients/${clientID}`, { cache: "no-store" }),
            ]);
            if (!catRes.ok) return;
            const allCategories = await catRes.json();
            const list: MachineCategory[] = Array.isArray(allCategories)
                ? allCategories
                : [];

            // Filter categories to ones the current client owns machines in.
            // Without this, kadant-team users see the global catalog rather
            // than the scope of the visit's client.
            if (clientRes.ok) {
                const clientData = await clientRes.json();
                const clientMachineIds = new Set<string>(
                    (clientData?.machines || [])
                        .map((cm: { machine?: { _id?: string; id?: string } }) =>
                            (cm.machine?._id || cm.machine?.id)?.toString()
                        )
                        .filter(Boolean) as string[]
                );
                const scoped = list
                    .map((cat) => ({
                        ...cat,
                        machines: (cat.machines || []).filter((m) =>
                            clientMachineIds.has(String(m._id))
                        ),
                    }))
                    .filter((cat) => cat.machines.length > 0);
                setCategories(scoped);
            } else {
                setCategories(list);
            }
        } catch {
            setCategories([]);
        }
    }, [clientID]);

    const fetchSparePartsForMachine = useCallback(
        async (machineId: string) => {
            if (!machineId) {
                setSpareParts([]);
                return;
            }
            setLoadingSpareParts(true);
            try {
                const res = await fetch(
                    `/api/products/${clientID}/spare-parts/${machineId}`,
                    { cache: "no-store" }
                );
                if (!res.ok) {
                    setSpareParts([]);
                    return;
                }
                const data = await res.json();
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.spareParts)
                    ? data.spareParts
                    : [];
                setSpareParts(
                    list.map((p: SparePartLite) => ({
                        _id: p._id,
                        name: p.name,
                        klValue: p.klValue,
                        optimalStateVideoUrl: p.optimalStateVideoUrl ?? null,
                    }))
                );
            } catch {
                setSpareParts([]);
            } finally {
                setLoadingSpareParts(false);
            }
        },
        [clientID]
    );

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchCategories();
            fetchScheduledVisits();
        }
    }, [isOpen, fetchUsers, fetchCategories, fetchScheduledVisits]);

    void users;

    const handleVisitTypeChange = (type: string) => {
        if (visitType.includes(type)) {
            setValue("visitType", visitType.filter((t) => t !== type));
        } else {
            setValue("visitType", [...visitType, type]);
        }
    };

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
                setNewIssue((p) => ({
                    ...p,
                    ...(type === "optimal"
                        ? {
                              optimalStateMediaUrls: [
                                  ...(p.optimalStateMediaUrls || []),
                                  url,
                              ],
                          }
                        : {
                              currentVisitMediaUrls: [
                                  ...(p.currentVisitMediaUrls || []),
                                  url,
                              ],
                          }),
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
        setNewIssue((p) => ({
            ...p,
            ...(type === "optimal"
                ? {
                      optimalStateMediaUrls: p.optimalStateMediaUrls.filter(
                          (_, i) => i !== index
                      ),
                  }
                : {
                      currentVisitMediaUrls: p.currentVisitMediaUrls.filter(
                          (_, i) => i !== index
                      ),
                  }),
        }));
    };

    const handleNewSparePartMediaSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const target = sparePartTargetRef.current;
            sparePartTargetRef.current = null;
            if (!file || !target) return;
            setUploadingSparePartId(target.sparePartId);
            try {
                const url = await uploadFile(file);
                setNewIssue((p) => {
                    const existing = p.sparePartMedia.find(
                        (m) => m.sparePartId === target.sparePartId
                    );
                    const nextList = existing
                        ? p.sparePartMedia.map((m) =>
                              m.sparePartId === target.sparePartId
                                  ? { ...m, mediaUrls: [...(m.mediaUrls || []), url] }
                                  : m
                          )
                        : [
                              ...p.sparePartMedia,
                              {
                                  sparePartId: target.sparePartId,
                                  sparePartName: target.sparePartName,
                                  mediaUrls: [url],
                              },
                          ];
                    return { ...p, sparePartMedia: nextList };
                });
                toast.success("File uploaded");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingSparePartId(null);
            }
        },
        [uploadFile]
    );

    const removeNewSparePartMedia = (sparePartId: string, index: number) => {
        setNewIssue((p) => ({
            ...p,
            sparePartMedia: p.sparePartMedia
                .map((m) =>
                    m.sparePartId === sparePartId
                        ? {
                              ...m,
                              mediaUrls: (m.mediaUrls || []).filter(
                                  (_, i) => i !== index
                              ),
                          }
                        : m
                )
                .filter((m) => (m.mediaUrls || []).length > 0),
        }));
    };

    const handleSubPartUpload = (partId: string) => {
        subPartTargetRef.current = partId;
        subPartInputRef.current?.click();
    };

    const handleSubPartInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const partId = subPartTargetRef.current;
            subPartTargetRef.current = null;
            if (!file || !partId) return;
            setUploadingSubPart(partId);
            try {
                const url = await uploadFile(file);
                setNewIssue((p) => ({
                    ...p,
                    subPartPhotos: {
                        ...p.subPartPhotos,
                        [partId]: [...(p.subPartPhotos[partId] || []), url],
                    },
                }));
                toast.success("File uploaded");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingSubPart(null);
            }
        },
        [uploadFile]
    );

    const removeSubPartPhoto = (partId: string, index: number) => {
        setNewIssue((p) => ({
            ...p,
            subPartPhotos: {
                ...p.subPartPhotos,
                [partId]: (p.subPartPhotos[partId] || []).filter((_, i) => i !== index),
            },
        }));
    };

    const handleSubPartLastVisitUpload = (partId: string) => {
        subPartLastVisitTargetRef.current = partId;
        subPartLastVisitInputRef.current?.click();
    };

    const handleSubPartLastVisitInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const partId = subPartLastVisitTargetRef.current;
            subPartLastVisitTargetRef.current = null;
            if (!file || !partId) return;
            setUploadingSubPartLastVisit(partId);
            try {
                const url = await uploadFile(file);
                setNewIssue((p) => ({
                    ...p,
                    subPartLastVisitPhotos: {
                        ...p.subPartLastVisitPhotos,
                        [partId]: [...(p.subPartLastVisitPhotos[partId] || []), url],
                    },
                }));
                toast.success("File uploaded");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingSubPartLastVisit(null);
            }
        },
        [uploadFile]
    );

    const removeSubPartLastVisitPhoto = (partId: string, index: number) => {
        setNewIssue((p) => ({
            ...p,
            subPartLastVisitPhotos: {
                ...p.subPartLastVisitPhotos,
                [partId]: (p.subPartLastVisitPhotos[partId] || []).filter((_, i) => i !== index),
            },
        }));
    };

    const handleSubPartOptimalInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const partId = subPartOptimalTargetRef.current;
            subPartOptimalTargetRef.current = null;
            if (!file || !partId) return;
            setUploadingSubPartOptimal(partId);
            try {
                const formData = new FormData();
                formData.append("video", file);
                formData.append("type", "part");
                formData.append("id", partId);
                const res = await fetch("/api/upload/entity-video", { method: "POST", body: formData });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Upload failed");
                }
                const data = await res.json();
                if (data?.optimalStateVideoUrl) {
                    setSubParts((prev) =>
                        prev.map((pt) =>
                            pt._id === partId ? { ...pt, optimalStateVideoUrl: data.optimalStateVideoUrl } : pt
                        )
                    );
                    toast.success("Optimal state video uploaded");
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingSubPartOptimal(null);
            }
        },
        []
    );

    const handleNewIssueOptimalSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file || !newIssue.sparePartId) return;
            setUploadingOptimalNew(true);
            try {
                const formData = new FormData();
                formData.append("video", file);
                formData.append("type", "sparePart");
                formData.append("id", newIssue.sparePartId);
                const res = await fetch("/api/upload/entity-video", { method: "POST", body: formData });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Upload failed");
                }
                const data = await res.json();
                if (data?.optimalStateVideoUrl) {
                    setSpareParts((prev) =>
                        prev.map((sp) =>
                            sp._id === newIssue.sparePartId
                                ? { ...sp, optimalStateVideoUrl: data.optimalStateVideoUrl }
                                : sp
                        )
                    );
                    toast.success("Optimal state video uploaded");
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingOptimalNew(false);
            }
        },
        [newIssue.sparePartId]
    );

    const handleExistingIssueOptimalSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const index = existingOptimalTargetIdxRef.current;
            existingOptimalTargetIdxRef.current = null;
            if (!file || index === null) return;
            const issue = machineIssues[index];
            if (!issue?.sparePartId) return;
            setUploadingOptimalExisting(index);
            try {
                const formData = new FormData();
                formData.append("video", file);
                formData.append("type", "sparePart");
                formData.append("id", issue.sparePartId);
                const res = await fetch("/api/upload/entity-video", { method: "POST", body: formData });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Upload failed");
                }
                const data = await res.json();
                if (data?.optimalStateVideoUrl) {
                    setMachineIssueOptimalUrls((prev) =>
                        prev.map((u, i) => (i === index ? data.optimalStateVideoUrl : u))
                    );
                    toast.success("Optimal state video uploaded");
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingOptimalExisting(null);
            }
        },
        [machineIssues]
    );

    const handleAddMachineIssue = async () => {
        if (addingIssue) return;
        if (!newIssue.machineId || !newIssue.sparePartId || !newIssue.status) {
            toast.error("Select machine, spare part, and status");
            return;
        }

        setAddingIssue(true);
        try {
            const subPartEntries = Object.entries(newIssue.subPartPhotos)
                .filter(([, urls]) => urls.length > 0)
                .map(([partId, imageUrls]) => ({
                    partId,
                    sparePartId: newIssue.sparePartId,
                    machineId: newIssue.machineId,
                    clientId: clientID,
                    imageUrls,
                }));

            if (subPartEntries.length > 0) {
                try {
                    await fetch(
                        `/api/clients/${clientID}/client-machines/spare-parts/spare-parts-uploaded-images/${newIssue.machineId}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(subPartEntries),
                        }
                    );
                } catch {
                    toast.error("Failed to upload some part inspection photos");
                }
            }

            const currentOptimalUrl = spareParts.find((sp) => sp._id === newIssue.sparePartId)?.optimalStateVideoUrl ?? null;
            const confirmedSubParts = subParts.filter((pt) => selectedSubPartIds.includes(pt._id));
            setMachineIssues((prev) => [
                ...prev,
                {
                    machineId: newIssue.machineId,
                    machineName: newIssue.machineName,
                    sparePartId: newIssue.sparePartId,
                    sparePartName: newIssue.sparePartName,
                    categoryName: newIssue.categoryName,
                    status: newIssue.status,
                    conditionAlert: newIssue.conditionAlert,
                    actionNeeded: newIssue.actionNeeded,
                    optimalStateMediaUrls: newIssue.optimalStateMediaUrls,
                    currentVisitMediaUrls: newIssue.currentVisitMediaUrls,
                    sparePartMedia: newIssue.sparePartMedia,
                    subPartLastVisitPhotos: newIssue.subPartLastVisitPhotos,
                    subPartCurrentVisitPhotos: newIssue.subPartPhotos,
                },
            ]);
            setMachineIssueOptimalUrls((prev) => [...prev, currentOptimalUrl]);
            setMachineIssueSubParts((prev) => [...prev, confirmedSubParts]);
            setNewIssue({ ...EMPTY_ISSUE });
            setFilteredMachines([]);
            setSpareParts([]);
            setSubParts([]);
            setSelectedSubPartIds([]);
            setShowAddIssue(false);
        } finally {
            setAddingIssue(false);
        }
    };

    const removeMachineIssue = (index: number) => {
        setMachineIssues((prev) => prev.filter((_, i) => i !== index));
        setMachineIssueOptimalUrls((prev) => prev.filter((_, i) => i !== index));
        setMachineIssueSubParts((prev) => prev.filter((_, i) => i !== index));
    };

    const updateIssueMedia = (
        issueIndex: number,
        type: "optimal" | "current",
        url: string,
        add: boolean
    ) => {
        setMachineIssues((prev) =>
            prev.map((issue, i) => {
                if (i !== issueIndex) return issue;
                if (type === "optimal") {
                    const next = add
                        ? [...(issue.optimalStateMediaUrls || []), url]
                        : (issue.optimalStateMediaUrls || []).filter((u) => u !== url);
                    return { ...issue, optimalStateMediaUrls: next };
                }
                const next = add
                    ? [...(issue.currentVisitMediaUrls || []), url]
                    : (issue.currentVisitMediaUrls || []).filter((u) => u !== url);
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
                        if (type === "optimal")
                            return {
                                ...issue,
                                optimalStateMediaUrls: [
                                    ...(issue.optimalStateMediaUrls || []),
                                    url,
                                ],
                            };
                        return {
                            ...issue,
                            currentVisitMediaUrls: [
                                ...(issue.currentVisitMediaUrls || []),
                                url,
                            ],
                        };
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

    const handleExistingSparePartMediaSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            const target = existingSparePartTargetRef.current;
            existingSparePartTargetRef.current = null;
            if (!file || !target) return;
            setUploadingExistingSparePart({
                index: target.index,
                sparePartId: target.sparePartId,
            });
            try {
                const url = await uploadFile(file);
                setMachineIssues((prev) =>
                    prev.map((issue, i) => {
                        if (i !== target.index) return issue;
                        const list = issue.sparePartMedia || [];
                        const exists = list.find(
                            (m) => m.sparePartId === target.sparePartId
                        );
                        const nextList = exists
                            ? list.map((m) =>
                                  m.sparePartId === target.sparePartId
                                      ? {
                                            ...m,
                                            mediaUrls: [
                                                ...(m.mediaUrls || []),
                                                url,
                                            ],
                                        }
                                      : m
                              )
                            : [
                                  ...list,
                                  {
                                      sparePartId: target.sparePartId,
                                      sparePartName: target.sparePartName,
                                      mediaUrls: [url],
                                  },
                              ];
                        return { ...issue, sparePartMedia: nextList };
                    })
                );
                toast.success("File uploaded");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setUploadingExistingSparePart(null);
            }
        },
        [uploadFile]
    );

    const removeExistingSparePartMedia = (
        issueIndex: number,
        sparePartId: string,
        urlIdx: number
    ) => {
        setMachineIssues((prev) =>
            prev.map((issue, i) => {
                if (i !== issueIndex) return issue;
                const list = (issue.sparePartMedia || [])
                    .map((m) =>
                        m.sparePartId === sparePartId
                            ? {
                                  ...m,
                                  mediaUrls: (m.mediaUrls || []).filter(
                                      (_, j) => j !== urlIdx
                                  ),
                              }
                            : m
                    )
                    .filter((m) => (m.mediaUrls || []).length > 0);
                return { ...issue, sparePartMedia: list };
            })
        );
    };

    const onSubmit = async (data: VisitFormData) => {
        if (showAddIssue) {
            const hasData =
                newIssue.machineId ||
                newIssue.sparePartId ||
                newIssue.conditionAlert ||
                (newIssue.currentVisitMediaUrls?.length ?? 0) > 0;
            if (hasData) {
                toast.error(
                    'You have an unsaved machine issue. Click "Add Issue" to save it, or "Cancel" to discard it before submitting.'
                );
                return;
            }
        }
        setSubmitting(true);
        try {
            // If user picked an existing scheduled-today chip, complete that
            // record in place: set lastVisitOn, clear nextScheduledVisit so it
            // moves out of Upcoming and into Visit History. Otherwise create a
            // new record with lastVisitOn so it lands directly in history.
            if (selectedChipVisitId && !useCustomDate) {
                const putRes = await fetch(
                    `/api/clients/${clientID}/site-visits/${selectedChipVisitId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            lastVisitOn: data.nextScheduledVisit,
                            nextScheduledVisit: null,
                            visitType: data.visitType,
                            assignedEngineer: data.assignedEngineer,
                            clientRepresentative: data.clientRepresentative,
                            machineIssues,
                        }),
                    }
                );
                if (!putRes.ok) {
                    const err = await putRes.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to update visit");
                }
            } else {
                const createRes = await fetch(
                    `/api/clients/${clientID}/site-visits`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            lastVisitOn: data.nextScheduledVisit,
                            visitType: data.visitType,
                            assignedEngineer: data.assignedEngineer,
                            clientRepresentative: data.clientRepresentative,
                            machineIssues,
                        }),
                    }
                );

                if (!createRes.ok) {
                    const err = await createRes.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to create visit");
                }
            }

            toast.success("Visit added successfully");
            setIsOpen(false);
            reset();
            setMachineIssues([]);
            setMachineIssueOptimalUrls([]);
            setMachineIssueSubParts([]);
            setNewIssue({ ...EMPTY_ISSUE });
            setShowAddIssue(false);
            setSelectedChipVisitId(null);
            onSuccess();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add visit");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (showAddIssue) {
            const hasData =
                newIssue.machineId ||
                newIssue.sparePartId ||
                newIssue.conditionAlert ||
                (newIssue.currentVisitMediaUrls?.length ?? 0) > 0;
            if (hasData) {
                const confirmed = window.confirm(
                    "You have an unsaved machine issue. If you close now, that data will be lost. Close anyway?"
                );
                if (!confirmed) return;
            }
        }
        setIsOpen(false);
        reset();
        setMachineIssues([]);
        setMachineIssueOptimalUrls([]);
        setMachineIssueSubParts([]);
        setNewIssue({ ...EMPTY_ISSUE });
        setSpareParts([]);
        setSubParts([]);
        setSelectedSubPartIds([]);
        setShowAddIssue(false);
        setScheduledToday([]);
        setUseCustomDate(false);
        setSelectedChipVisitId(null);
    };

    const getFieldErrorClass = (hasError: boolean) =>
        hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-[#d1d5db]";

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}
        >
            <DialogTrigger asChild>
                {children || (
                    <Button
                        disabled={isReadOnly}
                        variant="ghost"
                        className="text-base-4 cursor-pointer"
                    >
                        <FaPlus className="ml-2" /> Add Visit Data
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="bg-white border border-[#96A5BA] rounded-[14px] p-0 w-[894px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="bg-[#DFE6EC] border-b border-[#96A5BA] flex h-[72px] items-center justify-between px-6 shrink-0 rounded-t-[14px]">
                    <div className="flex gap-3 items-center">
                        <div className="bg-[#cbd5e1] rounded-[10px] w-10 h-10 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[#2D3E5C]" />
                        </div>
                        <h2 className="text-[#2D3E5C] text-xl font-bold leading-7">
                            Add Visit Data
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-white transition-colors"
                    >
                        <X className="w-5 h-5 text-[#2D3E5C]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                    <input
                        ref={existingMediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleExistingIssueMediaSelect}
                    />
                    <input
                        ref={existingSparePartInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleExistingSparePartMediaSelect}
                    />
                    <input
                        ref={sparePartInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleNewSparePartMediaSelect}
                    />
                    <input
                        ref={sparePartOptimalNewInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={handleNewIssueOptimalSelect}
                    />
                    <input
                        ref={existingIssueOptimalInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={handleExistingIssueOptimalSelect}
                    />

                    <div className="px-6 pt-6 pb-6 flex flex-col gap-6">
                        {/* Scheduled Date */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#6b7280] text-base">
                                Scheduled Date *
                            </Label>

                            {scheduledToday.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {scheduledToday.map(({ date, id }) => {
                                        const chipDate = format(parseISO(date), "yyyy-MM-dd");
                                        const selected =
                                            !useCustomDate &&
                                            selectedChipVisitId === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                disabled={useCustomDate}
                                                onClick={() => {
                                                    setValue(
                                                        "nextScheduledVisit",
                                                        chipDate,
                                                        { shouldValidate: true }
                                                    );
                                                    setSelectedChipVisitId(id);
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-40 ${
                                                    selected
                                                        ? "bg-[#2D3E5C] border-[#2D3E5C] text-white"
                                                        : "bg-white border-[#d1d5db] text-[#6b7280] hover:border-[#2D3E5C]"
                                                }`}
                                            >
                                                {format(parseISO(date), "dd MMM yyyy")}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseCustomDate((prev) => {
                                                if (!prev) {
                                                    setValue("nextScheduledVisit", "");
                                                    setSelectedChipVisitId(null);
                                                }
                                                return !prev;
                                            });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                            useCustomDate
                                                ? "bg-[#2D3E5C] border-[#2D3E5C] text-white"
                                                : "bg-white border-[#d1d5db] text-[#6b7280] hover:border-[#2D3E5C]"
                                        }`}
                                    >
                                        Custom Date
                                    </button>
                                </div>
                            )}

                            {useCustomDate && (
                                <div className="relative">
                                    <Controller
                                        name="nextScheduledVisit"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="date"
                                                {...field}
                                                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                                                className={`bg-white border ${getFieldErrorClass(
                                                    !!errors.nextScheduledVisit
                                                )} h-[46px] rounded-[10px] px-4 pr-12 text-[#1f2937] text-base placeholder:text-[#4a4a4a] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                                            />
                                        )}
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280] pointer-events-none" />
                                </div>
                            )}

                            {errors.nextScheduledVisit && (
                                <p className="text-red-500 text-sm">
                                    {errors.nextScheduledVisit.message}
                                </p>
                            )}
                        </div>

                        {/* Visit Type */}
                        <div className="flex flex-col gap-3">
                            <Label className="text-[#6b7280] text-base">
                                Visit Type *
                            </Label>
                            <div className="flex gap-6">
                                <div className="flex gap-2 items-center">
                                    <Checkbox
                                        id="add-process-audit"
                                        checked={visitType.includes("Process Audit")}
                                        onCheckedChange={() =>
                                            handleVisitTypeChange("Process Audit")
                                        }
                                        className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#D45815] data-[state=checked]:border-[#D45815] border-2 border-[#9ca3af] data-[state=checked]:text-white"
                                    />
                                    <Label
                                        htmlFor="add-process-audit"
                                        className="text-[#1f2937] text-base cursor-pointer"
                                    >
                                        Process Audit
                                    </Label>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Checkbox
                                        id="add-mechanical-audit"
                                        checked={visitType.includes("Mechanical Audit")}
                                        onCheckedChange={() =>
                                            handleVisitTypeChange("Mechanical Audit")
                                        }
                                        className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#D45815] data-[state=checked]:border-[#D45815] border-2 border-[#9ca3af] data-[state=checked]:text-white"
                                    />
                                    <Label
                                        htmlFor="add-mechanical-audit"
                                        className="text-[#1f2937] text-base cursor-pointer"
                                    >
                                        Mechanical Audit
                                    </Label>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Checkbox
                                        id="add-general-visit"
                                        checked={visitType.includes("General Visit")}
                                        onCheckedChange={() =>
                                            handleVisitTypeChange("General Visit")
                                        }
                                        className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#D45815] data-[state=checked]:border-[#D45815] border-2 border-[#9ca3af] data-[state=checked]:text-white"
                                    />
                                    <Label
                                        htmlFor="add-general-visit"
                                        className="text-[#1f2937] text-base cursor-pointer"
                                    >
                                        General Visit
                                    </Label>
                                </div>
                            </div>
                            {errors.visitType && (
                                <p className="text-red-500 text-sm">
                                    {errors.visitType.message}
                                </p>
                            )}
                        </div>

                        {/* Engineer + Client Representative */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <Label className="text-[#6b7280] text-base">
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
                                            placeholder="Enter Engineer Name"
                                            className={`bg-white border ${getFieldErrorClass(
                                                !!errors.assignedEngineer
                                            )} w-full !h-[46px] rounded-[10px] text-[#1f2937] text-base placeholder:text-[#4a4a4a] focus:ring-0`}
                                        />
                                    )}
                                />
                                {errors.assignedEngineer && (
                                    <p className="text-red-500 text-sm">
                                        {errors.assignedEngineer.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-[#6b7280] text-base">
                                    Client Representative *
                                </Label>
                                <Controller
                                    name="clientRepresentative"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder="Enter client name"
                                            className={`bg-white border ${getFieldErrorClass(
                                                !!errors.clientRepresentative
                                            )} h-[46px] rounded-[10px] px-4 text-[#1f2937] text-base placeholder:text-[#4a4a4a] focus-visible:ring-0 focus-visible:ring-offset-0`}
                                        />
                                    )}
                                />
                                {errors.clientRepresentative && (
                                    <p className="text-red-500 text-sm">
                                        {errors.clientRepresentative.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Machines Requiring Attention ── */}
                        <div className="border-t border-[#e5e7eb] pt-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TriangleAlert className="w-6 h-6 text-[#D45815]" />
                                    <h3 className="text-[#2D3E5C] text-xl font-bold">
                                        Machines Requiring Attention ({machineIssues.length})
                                    </h3>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setShowAddIssue((v) => !v)}
                                    className="bg-[#D45815] hover:bg-[#b8480f] text-white text-sm font-medium h-9 px-4 rounded-[10px]"
                                >
                                    {showAddIssue ? "Cancel" : "+ Add Machine Issue"}
                                </Button>
                            </div>

                            {/* Existing machine issues */}
                            {machineIssues.map((issue, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="grid grid-cols-3 gap-6 flex-1">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Category
                                                </p>
                                                <p className="text-[#1f2937] text-sm font-medium">
                                                    {issue.categoryName || "—"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Machine Name
                                                </p>
                                                <p className="text-[#1f2937] text-sm font-medium">
                                                    {issue.machineName || "—"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[#6b7280] text-xs">
                                                    Status
                                                </p>
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMachineIssue(index)}
                                            className="text-[#6b7280] hover:text-[#1f2937] h-8"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
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

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[#6b7280] text-xs">Last Visit</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(issue.optimalStateMediaUrls ?? []).length > 0
                                                    ? (issue.optimalStateMediaUrls ?? []).map((url, ui) => (
                                                        <div key={ui} className="rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] w-[80px] h-[60px]">
                                                            {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="" className="w-full h-full object-cover" />}
                                                        </div>
                                                    ))
                                                    : <span className="text-[#9ca3af] text-xs italic">None</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[#6b7280] text-xs">Current Visit</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(issue.currentVisitMediaUrls ?? []).length > 0
                                                    ? (issue.currentVisitMediaUrls ?? []).map((url, ui) => (
                                                        <div key={ui} className="rounded-[8px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] w-[80px] h-[60px]">
                                                            {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="" className="w-full h-full object-cover" />}
                                                        </div>
                                                    ))
                                                    : <span className="text-[#9ca3af] text-xs italic">None</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[#6b7280] text-xs">Optimal State</p>
                                            {machineIssueOptimalUrls[index] ? (
                                                <div className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-[#e5e7eb] w-[80px] h-[60px]">
                                                    {isVideoUrl(machineIssueOptimalUrls[index]!) ? (
                                                        <video src={machineIssueOptimalUrls[index]!} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={machineIssueOptimalUrls[index]!} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ) : <span className="text-[#9ca3af] text-xs italic">None</span>}
                                        </div>
                                    </div>

                                    {/* Sub-parts row */}
                                    {(machineIssueSubParts[index] || []).length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[#6b7280] text-xs font-medium">Sub-Parts</p>
                                            {(machineIssueSubParts[index] || []).map((part) => {
                                                const lastVisit = (issue.subPartLastVisitPhotos || {})[part._id] ?? [];
                                                const currentVisit = (issue.subPartCurrentVisitPhotos || {})[part._id] ?? [];
                                                const hasMedia = lastVisit.length > 0 || currentVisit.length > 0 || !!part.optimalStateVideoUrl;
                                                if (!hasMedia) return null;
                                                return (
                                                    <div key={part._id} className="border border-[#e5e7eb] rounded-[8px] p-3 flex flex-col gap-2">
                                                        <p className="text-[#1f2937] text-xs font-medium">{part.name}</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-[#6b7280] text-[10px]">Last Visit</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {lastVisit.map((url, ui) => (
                                                                        <div key={ui} className="rounded-[6px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] w-[60px] h-[45px]">
                                                                            {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                                                                        </div>
                                                                    ))}
                                                                    {lastVisit.length === 0 && <span className="text-[#9ca3af] text-[10px] italic">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-[#6b7280] text-[10px]">Current Visit State</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {currentVisit.map((url, ui) => (
                                                                        <div key={ui} className="rounded-[6px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] w-[60px] h-[45px]">
                                                                            {isVideoUrl(url) ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                                                                        </div>
                                                                    ))}
                                                                    {currentVisit.length === 0 && <span className="text-[#9ca3af] text-[10px] italic">None</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-[#6b7280] text-[10px]">Optimal State</p>
                                                                {part.optimalStateVideoUrl ? (
                                                                    <div className="rounded-[6px] overflow-hidden bg-[#e5e7eb] border border-[#d1d5db] w-[60px] h-[45px]">
                                                                        <video src={part.optimalStateVideoUrl} className="w-full h-full object-cover" muted />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[#9ca3af] text-[10px] italic">None</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Spare parts row */}
                                    {(issue.sparePartMedia || []).length > 0 && (
                                        <div className="grid grid-cols-4 gap-3">
                                            {(issue.sparePartMedia || []).map((entry) => (
                                                <div
                                                    key={entry.sparePartId}
                                                    className="flex flex-col gap-1.5"
                                                >
                                                    <p className="text-[#6b7280] text-xs truncate">
                                                        {entry.sparePartName}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5 items-start">
                                                        {(entry.mediaUrls || []).map((url, ui) => (
                                                            <MediaPreview
                                                                key={ui}
                                                                url={url}
                                                                onRemove={() =>
                                                                    removeExistingSparePartMedia(
                                                                        index,
                                                                        entry.sparePartId,
                                                                        ui
                                                                    )
                                                                }
                                                            />
                                                        ))}
                                                        <UploadBox
                                                            label="Add"
                                                            onTrigger={() => {
                                                                existingSparePartTargetRef.current = {
                                                                    index,
                                                                    sparePartId: entry.sparePartId,
                                                                    sparePartName: entry.sparePartName,
                                                                };
                                                                existingSparePartInputRef.current?.click();
                                                            }}
                                                            uploading={
                                                                uploadingExistingSparePart?.index ===
                                                                    index &&
                                                                uploadingExistingSparePart?.sparePartId ===
                                                                    entry.sparePartId
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* New machine issue form */}
                            {showAddIssue && (
                                <div className="bg-white border border-[#d1d5db] rounded-[10px] p-4 flex flex-col gap-4">
                                    <h4 className="text-[#1f2937] text-sm font-bold">
                                        Add New Machine Issue
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-[#6b7280] text-sm">
                                                Category
                                            </Label>
                                            <Select
                                                value={newIssue.categoryId}
                                                onValueChange={(value) => {
                                                    const cat = categories.find(
                                                        (c) => c._id === value
                                                    );
                                                    setNewIssue((p) => ({
                                                        ...p,
                                                        categoryId: value,
                                                        categoryName: cat?.name || "",
                                                        machineId: "",
                                                        machineName: "",
                                                        sparePartId: "",
                                                        sparePartName: "",
                                                        sparePartMedia: [],
                                                        subPartPhotos: {},
                                                    }));
                                                    setFilteredMachines(cat?.machines || []);
                                                    setSpareParts([]);
                                                    setSubParts([]);
                                                }}
                                            >
                                                <SelectTrigger className="bg-white w-full border border-[#d1d5db] !h-[46px] rounded-[10px] text-[#1f2937] text-sm focus:ring-0">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-[#d1d5db]">
                                                    {categories.map((cat) => (
                                                        <SelectItem
                                                            key={cat._id}
                                                            value={cat._id}
                                                            className="text-[#1f2937] hover:bg-[#f3f4f6]"
                                                        >
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label className="text-[#6b7280] text-sm">
                                                Machine Name *
                                            </Label>
                                            <Select
                                                value={newIssue.machineId}
                                                onValueChange={(value) => {
                                                    const machine = filteredMachines.find(
                                                        (m) => m._id === value
                                                    );
                                                    setNewIssue((p) => ({
                                                        ...p,
                                                        machineId: value,
                                                        machineName: machine?.name ?? "",
                                                        sparePartId: "",
                                                        sparePartName: "",
                                                        sparePartMedia: [],
                                                        subPartPhotos: {},
                                                    }));
                                                    setSubParts([]);
                                                    fetchSparePartsForMachine(value);
                                                }}
                                                disabled={!newIssue.categoryId}
                                            >
                                                <SelectTrigger className="bg-white w-full border border-[#d1d5db] !h-[46px] rounded-[10px] text-[#1f2937] text-sm focus:ring-0 disabled:opacity-50">
                                                    <SelectValue
                                                        placeholder={
                                                            newIssue.categoryId
                                                                ? "Select machine"
                                                                : "Select category first"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-[#d1d5db]">
                                                    {filteredMachines.map((m) => (
                                                        <SelectItem
                                                            key={m._id}
                                                            value={m._id}
                                                            className="text-[#1f2937] hover:bg-[#f3f4f6]"
                                                        >
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-sm">
                                            Spare Part *
                                        </Label>
                                        <Select
                                            value={newIssue.sparePartId}
                                            onValueChange={(value) => {
                                                const sp = spareParts.find(
                                                    (s) => s._id === value
                                                );
                                                setNewIssue((p) => ({
                                                    ...p,
                                                    sparePartId: value,
                                                    sparePartName: sp?.name || "",
                                                    subPartPhotos: {},
                                                }));
                                                setSubParts([]);
                                                setSelectedSubPartIds([]);
                                                fetch(`/api/machines/spare-parts/${value}/parts`, { cache: "no-store" })
                                                    .then((r) => (r.ok ? r.json() : []))
                                                    .then((data) =>
                                                        setSubParts(
                                                            Array.isArray(data)
                                                                ? data.map((p: { _id: string; name: string; optimalStateVideoUrl?: string | null }) => ({
                                                                      _id: p._id,
                                                                      name: p.name,
                                                                      optimalStateVideoUrl: p.optimalStateVideoUrl ?? null,
                                                                  }))
                                                                : []
                                                        )
                                                    )
                                                    .catch(() => setSubParts([]));
                                            }}
                                            disabled={!newIssue.machineId || loadingSpareParts}
                                        >
                                            <SelectTrigger className="bg-white border border-[#d1d5db] w-full !h-[46px] rounded-[10px] text-[#1f2937] text-sm focus:ring-0 disabled:opacity-50">
                                                <SelectValue
                                                    placeholder={
                                                        !newIssue.machineId
                                                            ? "Select machine first"
                                                            : loadingSpareParts
                                                            ? "Loading spare parts..."
                                                            : spareParts.length === 0
                                                            ? "No spare parts for this machine"
                                                            : "Select spare part"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-[#d1d5db]">
                                                {spareParts.map((sp) => (
                                                    <SelectItem
                                                        key={sp._id}
                                                        value={sp._id}
                                                        className="text-[#1f2937] hover:bg-[#f3f4f6]"
                                                    >
                                                        {sp.name}
                                                        {sp.klValue ? ` — ${sp.klValue}` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-sm">
                                            Status *
                                        </Label>
                                        <Select
                                            value={newIssue.status}
                                            onValueChange={(v) =>
                                                setNewIssue((p) => ({ ...p, status: v }))
                                            }
                                        >
                                            <SelectTrigger className="bg-white border border-[#d1d5db] w-full !h-[46px] rounded-[10px] text-[#1f2937] text-sm focus:ring-0">
                                                <SelectValue placeholder="e.g., Critical Failure" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-[#d1d5db]">
                                                {MACHINE_STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt}
                                                        value={opt}
                                                        className="text-[#1f2937] hover:bg-[#f3f4f6]"
                                                    >
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Last Visit / Current Visit / Optimal State — before Condition Alert */}
                                    <div className="grid grid-cols-3 gap-4 items-end">
                                        <div className="flex flex-col gap-2 h-full">
                                            <Label className="text-[#6b7280] text-sm">
                                                Last Visit
                                            </Label>
                                            <input
                                                ref={optimalInputRef}
                                                type="file"
                                                accept="image/*,video/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    e.target.value = "";
                                                    if (file)
                                                        handleNewIssueMediaUpload("optimal", file);
                                                }}
                                            />
                                            {(newIssue.optimalStateMediaUrls ?? []).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-1">
                                                    {(newIssue.optimalStateMediaUrls ?? []).map(
                                                        (url, ui) => (
                                                            <MediaPreview
                                                                key={ui}
                                                                url={url}
                                                                onRemove={() =>
                                                                    removeNewIssueMedia("optimal", ui)
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-auto">
                                                <WideUploadBox
                                                    onTrigger={() => optimalInputRef.current?.click()}
                                                    uploading={uploadingMedia === "optimal"}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 h-full">
                                            <Label className="text-[#6b7280] text-sm">
                                                Current Visit
                                            </Label>
                                            <input
                                                ref={currentInputRef}
                                                type="file"
                                                accept="image/*,video/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    e.target.value = "";
                                                    if (file)
                                                        handleNewIssueMediaUpload("current", file);
                                                }}
                                            />
                                            {(newIssue.currentVisitMediaUrls ?? []).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-1">
                                                    {(newIssue.currentVisitMediaUrls ?? []).map(
                                                        (url, ui) => (
                                                            <MediaPreview
                                                                key={ui}
                                                                url={url}
                                                                onRemove={() =>
                                                                    removeNewIssueMedia("current", ui)
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-auto">
                                                <WideUploadBox
                                                    onTrigger={() => currentInputRef.current?.click()}
                                                    uploading={uploadingMedia === "current"}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 h-full">
                                            <Label className="text-[#6b7280] text-sm">
                                                Optimal State
                                            </Label>
                                            {(() => {
                                                const url = spareParts.find((sp) => sp._id === newIssue.sparePartId)?.optimalStateVideoUrl ?? null;
                                                return url ? (
                                                    <div className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-[#e5e7eb] w-[80px] h-[60px]">
                                                        {isVideoUrl(url) ? (
                                                            <video src={url} className="w-full h-full object-cover" muted />
                                                        ) : (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                ) : null;
                                            })()}
                                            <div className="mt-auto">
                                                <WideUploadBox
                                                    label={spareParts.find((sp) => sp._id === newIssue.sparePartId)?.optimalStateVideoUrl ? "Replace video" : "Upload video"}
                                                    onTrigger={() => sparePartOptimalNewInputRef.current?.click()}
                                                    uploading={uploadingOptimalNew}
                                                    disabled={!newIssue.sparePartId}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-sm">
                                            Condition Alert *
                                        </Label>
                                        <Textarea
                                            value={newIssue.conditionAlert}
                                            onChange={(e) =>
                                                setNewIssue((p) => ({
                                                    ...p,
                                                    conditionAlert: e.target.value,
                                                }))
                                            }
                                            rows={3}
                                            className="bg-white border border-[#d1d5db] rounded-[10px] px-4 py-3 text-[#1f2937] text-sm placeholder:text-[#4a4a4a] focus-visible:ring-0 resize-none"
                                            placeholder="Describe the issue and condition details..."
                                        />
                                    </div>

                                    {/* Action Needed pills */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-[#6b7280] text-sm">
                                            Action Needed *
                                        </Label>
                                        <div className="flex flex-wrap gap-3">
                                            {ACTION_OPTIONS.map((opt) => {
                                                const selected =
                                                    newIssue.actionNeeded === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setNewIssue((p) => ({
                                                                ...p,
                                                                actionNeeded: opt.value,
                                                            }))
                                                        }
                                                        className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
                                                            selected ? opt.active : opt.idle
                                                        }`}
                                                    >
                                                        {opt.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Hidden file inputs for sub-part photos */}
                                    <input
                                        ref={subPartInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleSubPartInputChange}
                                    />
                                    <input
                                        ref={subPartLastVisitInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleSubPartLastVisitInputChange}
                                    />
                                    <input
                                        ref={subPartOptimalInputRef}
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        className="hidden"
                                        onChange={handleSubPartOptimalInputChange}
                                    />

                                    {/* Sub-parts multi-select + per-part media */}
                                    {subParts.length > 0 && (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-[#6b7280] text-sm">Sub-Parts</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {subParts.map((pt) => {
                                                        const isSelected = selectedSubPartIds.includes(pt._id);
                                                        return (
                                                            <button
                                                                key={pt._id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedSubPartIds((prev) =>
                                                                        isSelected
                                                                            ? prev.filter((id) => id !== pt._id)
                                                                            : [...prev, pt._id]
                                                                    )
                                                                }
                                                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                                    isSelected
                                                                        ? "bg-[#2D3E5C] border-[#2D3E5C] text-white"
                                                                        : "bg-white border-[#d1d5db] text-[#6b7280] hover:border-[#2D3E5C]"
                                                                }`}
                                                            >
                                                                {pt.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {selectedSubPartIds.map((partId) => {
                                                const selectedPart = subParts.find((pt) => pt._id === partId);
                                                if (!selectedPart) return null;
                                                const lastVisitPhotos = newIssue.subPartLastVisitPhotos[partId] ?? [];
                                                const currentPhotos = newIssue.subPartPhotos[partId] ?? [];
                                                const isUploadingCurrent = uploadingSubPart === partId;
                                                const isUploadingLastVisit = uploadingSubPartLastVisit === partId;
                                                return (
                                                    <div key={partId} className="flex flex-col gap-2">
                                                        <Label className="text-[#6b7280] text-sm font-medium">
                                                            {selectedPart.name} — Media
                                                        </Label>
                                                        <div className="grid grid-cols-3 gap-4 items-end">
                                                            <div className="flex flex-col gap-2 h-full">
                                                                <Label className="text-[#6b7280] text-xs font-medium">Last Visit</Label>
                                                                {lastVisitPhotos.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                                        {lastVisitPhotos.map((url, ui) => (
                                                                            <MediaPreview
                                                                                key={ui}
                                                                                url={url}
                                                                                onRemove={() => removeSubPartLastVisitPhoto(partId, ui)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="mt-auto">
                                                                    <WideUploadBox
                                                                        label="Upload image/video"
                                                                        onTrigger={() => handleSubPartLastVisitUpload(partId)}
                                                                        uploading={isUploadingLastVisit}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 h-full">
                                                                <Label className="text-[#6b7280] text-xs font-medium">Current Visit State</Label>
                                                                {currentPhotos.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                                        {currentPhotos.map((url, ui) => (
                                                                            <MediaPreview
                                                                                key={ui}
                                                                                url={url}
                                                                                onRemove={() => removeSubPartPhoto(partId, ui)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="mt-auto">
                                                                    <WideUploadBox
                                                                        label="Upload image/video"
                                                                        onTrigger={() => handleSubPartUpload(partId)}
                                                                        uploading={isUploadingCurrent}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 h-full">
                                                                <Label className="text-[#6b7280] text-xs font-medium">Optimal State</Label>
                                                                {selectedPart.optimalStateVideoUrl && (
                                                                    <div className="rounded-[8px] overflow-hidden border border-[#d1d5db] bg-[#e5e7eb] w-[80px] h-[60px]">
                                                                        <video
                                                                            src={selectedPart.optimalStateVideoUrl}
                                                                            className="w-full h-full object-cover"
                                                                            muted
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="mt-auto">
                                                                    <WideUploadBox
                                                                        label={selectedPart.optimalStateVideoUrl ? "Replace video" : "Upload video"}
                                                                        onTrigger={() => {
                                                                            subPartOptimalTargetRef.current = partId;
                                                                            subPartOptimalInputRef.current?.click();
                                                                        }}
                                                                        uploading={uploadingSubPartOptimal === partId}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowAddIssue(false);
                                                setNewIssue({ ...EMPTY_ISSUE });
                                                setFilteredMachines([]);
                                                setSpareParts([]);
                                                setSubParts([]);
                                                setSelectedSubPartIds([]);
                                            }}
                                            className="bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280] hover:bg-[#e5e7eb] rounded-[10px] h-9 px-5"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleAddMachineIssue}
                                            disabled={addingIssue}
                                            className="bg-[#2D3E5C] hover:bg-[#1f2a44] text-white rounded-[10px] h-9 px-5 font-bold disabled:opacity-50"
                                        >
                                            {addingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Issue"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-[#96A5BA] px-6 py-4 flex justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280] text-base hover:bg-[#e5e7eb] px-5 py-[10px] rounded-[10px] h-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#D45815] hover:bg-[#b8480f] text-white text-base font-bold px-6 py-[10px] rounded-[10px] h-auto"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Add Visit"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

