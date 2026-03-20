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
import { MachineIssue, SiteVisit } from "@/types/visit-details";
import { Admin } from "@/types/admin";
import { format, parseISO, isToday } from "date-fns";
import { useSession } from "next-auth/react";

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

const STATUS_STYLES: Record<string, string> = {
    "Critical Failure": "text-[#FF6467]",
    "Needs Repair": "text-[#FFAA33]",
    Monitor: "text-[#FFD700]",
    Healthy: "text-[#05df72]",
};

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /video\//i.test(url);
}

function MediaPreview({
    url,
    onRemove,
}: {
    url: string;
    onRemove: () => void;
}) {
    const isVideo = isVideoUrl(url);
    return (
        <div className="relative group rounded-[8px] overflow-hidden bg-[#171717] border border-[#404040] flex items-center justify-center w-full aspect-square max-w-[80px] min-h-[60px]">
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

function UploadMediaBox({
    label,
    onTrigger,
    uploading,
}: {
    label: string;
    onTrigger: () => void;
    uploading?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onTrigger}
            disabled={uploading}
            className="w-[80px] h-[60px] rounded-[8px] border border-dashed border-[#404040] bg-[#171717] flex flex-col items-center justify-center gap-0.5 text-[#a1a1a1] hover:border-[#525252] hover:text-[#d4d4d4] transition-colors disabled:opacity-50"
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

interface MachineCategory {
    _id: string;
    name: string;
    machines: { _id: string; name: string }[];
}

interface NewMachineIssue {
    categoryId: string;
    machineId: string;
    machineName: string;
    status: string;
    conditionAlert: string;
    actionNeeded: string;
    optimalStateMediaUrls: string[];
    currentVisitMediaUrls: string[];
}

const EMPTY_ISSUE: NewMachineIssue = {
    categoryId: "",
    machineId: "",
    machineName: "",
    status: "",
    conditionAlert: "",
    actionNeeded: "",
    optimalStateMediaUrls: [],
    currentVisitMediaUrls: [],
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
    const [scheduledToday, setScheduledToday] = useState<{ date: string; id: string }[]>([]);
    const [useCustomDate, setUseCustomDate] = useState(false);
    const [machineIssues, setMachineIssues] = useState<MachineIssue[]>([]);
    const [showAddIssue, setShowAddIssue] = useState(false);
    const [categories, setCategories] = useState<MachineCategory[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<
        { _id: string; name: string }[]
    >([]);
    const [newIssue, setNewIssue] = useState<NewMachineIssue>({ ...EMPTY_ISSUE });
    const [uploadingMedia, setUploadingMedia] = useState<
        "optimal" | "current" | null
    >(null);
    const optimalInputRef = useRef<HTMLInputElement>(null);
    const currentInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{
        index: number;
        type: "optimal" | "current";
    } | null>(null);
    const existingMediaInputRef = useRef<HTMLInputElement>(null);
    const [uploadingExisting, setUploadingExisting] = useState<{
        index: number;
        type: "optimal" | "current";
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
            clientRepresentativeDesignation: "",
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
            const res = await fetch(`/api/clients/${clientID}/site-visits`, { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            const chips = (Array.isArray(data) ? data : [])
                .filter((v: SiteVisit) => v.nextScheduledVisit && isToday(parseISO(v.nextScheduledVisit)))
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
            const res = await fetch("/api/products/categories/with-machines", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            setCategories([]);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchCategories();
            fetchScheduledVisits();
        }
    }, [isOpen, fetchUsers, fetchCategories, fetchScheduledVisits]);

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

    const handleAddMachineIssue = () => {
        if (!newIssue.machineId || !newIssue.status) {
            toast.error("Please select machine and status");
            return;
        }
        setMachineIssues((prev) => [
            ...prev,
            {
                machineId: newIssue.machineId,
                machineName: newIssue.machineName,
                status: newIssue.status,
                conditionAlert: newIssue.conditionAlert,
                actionNeeded: newIssue.actionNeeded,
                optimalStateMediaUrls: newIssue.optimalStateMediaUrls,
                currentVisitMediaUrls: newIssue.currentVisitMediaUrls,
            },
        ]);
        setNewIssue({ ...EMPTY_ISSUE });
        setFilteredMachines([]);
        setShowAddIssue(false);
    };

    const removeMachineIssue = (index: number) => {
        setMachineIssues((prev) => prev.filter((_, i) => i !== index));
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

    const onSubmit = async (data: VisitFormData) => {
        setSubmitting(true);
        try {
            const createRes = await fetch(`/api/clients/${clientID}/site-visits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nextScheduledVisit: data.nextScheduledVisit,
                    visitType: data.visitType,
                    assignedEngineer: data.assignedEngineer,
                    clientRepresentative: data.clientRepresentative,
                    clientRepresentativeDesignation:
                        data.clientRepresentativeDesignation || "",
                }),
            });

            if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({}));
                throw new Error(err.error || "Failed to create visit");
            }

            const created = await createRes.json();

            if (machineIssues.length > 0 && created._id) {
                const putRes = await fetch(
                    `/api/clients/${clientID}/site-visits/${created._id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nextScheduledVisit: data.nextScheduledVisit,
                            visitType: data.visitType,
                            assignedEngineer: data.assignedEngineer,
                            clientRepresentative: data.clientRepresentative,
                            clientRepresentativeDesignation:
                                data.clientRepresentativeDesignation || "",
                            machineIssues,
                        }),
                    }
                );
                if (!putRes.ok) {
                    toast.warning(
                        "Visit created but machine issues could not be saved. Please edit the visit to add them."
                    );
                }
            }

            toast.success("Visit added successfully");
            setIsOpen(false);
            reset();
            setMachineIssues([]);
            setNewIssue({ ...EMPTY_ISSUE });
            setShowAddIssue(false);
            onSuccess();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add visit");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        reset();
        setMachineIssues([]);
        setNewIssue({ ...EMPTY_ISSUE });
        setShowAddIssue(false);
        setScheduledToday([]);
        setUseCustomDate(false);
    };

    const getFieldErrorClass = (hasError: boolean) =>
        hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-[#404040]";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
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
                className="bg-[#171717] border border-[#262626] rounded-[10px] p-0 w-[894px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="bg-[#171717] border-b border-[#262626] flex h-[89px] items-center justify-between px-8 shrink-0">
                    <div className="flex gap-3 items-center">
                        <div className="bg-[rgba(255,105,0,0.2)] rounded-[10px] w-10 h-10 flex items-center justify-center">
                            <FaPlus className="w-5 h-5 text-[#ff6900]" />
                        </div>
                        <h2 className="text-white text-[24px] leading-[32px] font-lato font-normal">
                            Add Visit Data
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-6 h-6 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                    >
                        <X className="w-6 h-6" />
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
                    <div className="px-8 pt-6 pb-6 flex flex-col gap-6">
                        {/* Scheduled Date */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                Scheduled Date *
                            </Label>

                            {/* Today's scheduled visit chips */}
                            {scheduledToday.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {scheduledToday.map(({ date, id }) => {
                                        const chipDate = format(parseISO(date), "yyyy-MM-dd");
                                        const selected = !useCustomDate && watch("nextScheduledVisit") === chipDate;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                disabled={useCustomDate}
                                                onClick={() => setValue("nextScheduledVisit", chipDate, { shouldValidate: true })}
                                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-40 ${
                                                    selected
                                                        ? "bg-[#ff6900] border-[#ff6900] text-white"
                                                        : "bg-[#262626] border-[#404040] text-[#a1a1a1] hover:border-[#ff6900] hover:text-[#d4d4d4]"
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
                                                if (!prev) setValue("nextScheduledVisit", "");
                                                return !prev;
                                            });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                            useCustomDate
                                                ? "bg-[#ff6900] border-[#ff6900] text-white"
                                                : "bg-[#262626] border-[#404040] text-[#a1a1a1] hover:border-[#ff6900] hover:text-[#d4d4d4]"
                                        }`}
                                    >
                                        Custom Date
                                    </button>
                                </div>
                            )}

                            {/* Custom date input */}
                            {useCustomDate && (
                                <div className="relative">
                                    <Controller
                                        name="nextScheduledVisit"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="date"
                                                {...field}
                                                className={`bg-[#262626] border ${getFieldErrorClass(!!errors.nextScheduledVisit)} h-[50px] rounded-[10px] px-4 pr-12 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                                            />
                                        )}
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1a1] pointer-events-none" />
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
                            <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                Visit Type *
                            </Label>
                            <div className="flex gap-4">
                                <div className="flex gap-3 items-center">
                                    <Checkbox
                                        id="add-process-audit"
                                        checked={visitType.includes("Process Audit")}
                                        onCheckedChange={() =>
                                            handleVisitTypeChange("Process Audit")
                                        }
                                        className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#262626] data-[state=checked]:text-white"
                                    />
                                    <Label
                                        htmlFor="add-process-audit"
                                        className="text-white text-[16px] leading-[24px] font-lato font-normal cursor-pointer"
                                    >
                                        Process Audit
                                    </Label>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Checkbox
                                        id="add-mechanical-audit"
                                        checked={visitType.includes("Mechanical Audit")}
                                        onCheckedChange={() =>
                                            handleVisitTypeChange("Mechanical Audit")
                                        }
                                        className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#262626] data-[state=checked]:text-white"
                                    />
                                    <Label
                                        htmlFor="add-mechanical-audit"
                                        className="text-white text-[16px] leading-[24px] font-lato font-normal cursor-pointer"
                                    >
                                        Mechanical Audit
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
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                    Assign Engineer *
                                </Label>
                                <Controller
                                    name="assignedEngineer"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                className={`bg-[#262626] border ${getFieldErrorClass(!!errors.assignedEngineer)} w-full !h-[50px] rounded-[10px] text-white text-[16px] font-lato focus:ring-0`}
                                            >
                                                <SelectValue placeholder="Select Engineer" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#262626] border-[#404040]">
                                                {users.map((u) => (
                                                    <SelectItem
                                                        key={u._id}
                                                        value={u._id}
                                                        className="text-white hover:bg-[#404040]"
                                                    >
                                                        {u.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.assignedEngineer && (
                                    <p className="text-red-500 text-sm">
                                        {errors.assignedEngineer.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                    Client Representative *
                                </Label>
                                <Controller
                                    name="clientRepresentative"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            className={`bg-[#262626] border ${getFieldErrorClass(!!errors.clientRepresentative)} h-[50px] rounded-[10px] px-4 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0`}
                                            placeholder="Enter client name"
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

                        {/* Client Designation */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                Client Designation
                            </Label>
                            <Controller
                                name="clientRepresentativeDesignation"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        className="bg-[#262626] border border-[#404040] h-[50px] rounded-[10px] px-4 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0"
                                        placeholder="Designation"
                                    />
                                )}
                            />
                        </div>

                        {/* ── Machines Requiring Attention ── */}
                        <div className="py-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[rgba(255,105,0,0.2)] rounded p-1">
                                        <TriangleAlert className="w-5 h-5 text-[#ff6900]" />
                                    </div>
                                    <h3 className="text-white text-[16px] leading-[24px] font-medium">
                                        Machines Requiring Attention ({machineIssues.length})
                                    </h3>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setShowAddIssue((v) => !v)}
                                    className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[14px] font-medium h-9 px-4 rounded-[10px]"
                                >
                                    {showAddIssue ? "Cancel" : "+ Add Machine Issue"}
                                </Button>
                            </div>

                            {/* Existing machine issues */}
                            {machineIssues.map((issue, index) => (
                                <div
                                    key={index}
                                    className="bg-[#262626] border border-[#404040] rounded-[10px] p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <span className="text-white text-[14px] font-medium">
                                                {issue.machineName || "Unnamed machine"}
                                            </span>
                                            <span
                                                className={`text-[14px] font-medium ${STATUS_STYLES[issue.status || ""] || "text-muted-foreground"}`}
                                            >
                                                {issue.status || ""}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMachineIssue(index)}
                                            className="text-[#a1a1a1] hover:text-white h-8"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {issue.conditionAlert && (
                                        <div>
                                            <p className="text-[#a1a1a1] text-[12px] mb-1">
                                                Condition Alert
                                            </p>
                                            <p className="text-[#d4d4d4] text-[13px]">
                                                {issue.conditionAlert}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        {issue.actionNeeded && (
                                            <div>
                                                <p className="text-[#a1a1a1] text-[12px] mb-1">
                                                    Action Needed
                                                </p>
                                                <span className="inline-block text-[#ff6900] text-[13px] font-medium border border-[#ff6900] rounded-full px-3 py-0.5">
                                                    {issue.actionNeeded}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[#a1a1a1] text-[12px]">
                                                Last Visit
                                            </p>
                                            <div className="flex flex-wrap gap-2 items-start">
                                                {(issue.optimalStateMediaUrls ?? []).map(
                                                    (url, ui) => (
                                                        <MediaPreview
                                                            key={ui}
                                                            url={url}
                                                            onRemove={() =>
                                                                updateIssueMedia(
                                                                    index,
                                                                    "optimal",
                                                                    url,
                                                                    false
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                                <UploadMediaBox
                                                    label="Add"
                                                    onTrigger={() => {
                                                        setUploadTarget({
                                                            index,
                                                            type: "optimal",
                                                        });
                                                        existingMediaInputRef.current?.click();
                                                    }}
                                                    uploading={
                                                        uploadingExisting?.index === index &&
                                                        uploadingExisting?.type === "optimal"
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[#a1a1a1] text-[12px]">
                                                Current Visit
                                            </p>
                                            <div className="flex flex-wrap gap-2 items-start">
                                                {(issue.currentVisitMediaUrls ?? []).map(
                                                    (url, ui) => (
                                                        <MediaPreview
                                                            key={ui}
                                                            url={url}
                                                            onRemove={() =>
                                                                updateIssueMedia(
                                                                    index,
                                                                    "current",
                                                                    url,
                                                                    false
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                                <UploadMediaBox
                                                    label="Add"
                                                    onTrigger={() => {
                                                        setUploadTarget({
                                                            index,
                                                            type: "current",
                                                        });
                                                        existingMediaInputRef.current?.click();
                                                    }}
                                                    uploading={
                                                        uploadingExisting?.index === index &&
                                                        uploadingExisting?.type === "current"
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* New machine issue form */}
                            {showAddIssue && (
                                <div className="border border-[#404040] rounded-[10px] p-4 flex flex-col gap-4 bg-[#262626]">
                                    <h4 className="text-white text-[14px] font-medium">
                                        New Machine Issue
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Category */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-white text-[14px]">
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
                                                        machineId: "",
                                                        machineName: "",
                                                    }));
                                                    setFilteredMachines(
                                                        cat?.machines || []
                                                    );
                                                }}
                                            >
                                                <SelectTrigger className="bg-[#171717] w-full border border-[#404040] !h-[50px] rounded-[10px] text-white text-[14px] focus:ring-0">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#262626] border-[#404040]">
                                                    {categories.map((cat) => (
                                                        <SelectItem
                                                            key={cat._id}
                                                            value={cat._id}
                                                            className="text-white hover:bg-[#404040]"
                                                        >
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Machine Name */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-white text-[14px]">
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
                                                    }));
                                                }}
                                                disabled={!newIssue.categoryId}
                                            >
                                                <SelectTrigger className="bg-[#171717] w-full border border-[#404040] !h-[50px] rounded-[10px] text-white text-[14px] focus:ring-0 disabled:opacity-50">
                                                    <SelectValue
                                                        placeholder={
                                                            newIssue.categoryId
                                                                ? "Select machine"
                                                                : "Select category first"
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#262626] border-[#404040]">
                                                    {filteredMachines.map((m) => (
                                                        <SelectItem
                                                            key={m._id}
                                                            value={m._id}
                                                            className="text-white hover:bg-[#404040]"
                                                        >
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-white text-[14px]">
                                            Status *
                                        </Label>
                                        <Select
                                            value={newIssue.status}
                                            onValueChange={(v) =>
                                                setNewIssue((p) => ({ ...p, status: v }))
                                            }
                                        >
                                            <SelectTrigger className="bg-[#171717] border border-[#404040] w-full !h-[50px] rounded-[10px] text-white text-[14px] focus:ring-0">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#262626] border-[#404040]">
                                                {MACHINE_STATUS_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt}
                                                        value={opt}
                                                        className="text-white hover:bg-[#404040]"
                                                    >
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Condition Alert */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-white text-[14px]">
                                            Condition Alert
                                        </Label>
                                        <Textarea
                                            value={newIssue.conditionAlert}
                                            onChange={(e) =>
                                                setNewIssue((p) => ({
                                                    ...p,
                                                    conditionAlert: e.target.value,
                                                }))
                                            }
                                            rows={2}
                                            className="bg-[#171717] border border-[#404040] rounded-[10px] px-4 py-3 text-white text-[14px] placeholder:text-[#525252] focus-visible:ring-0 resize-none"
                                            placeholder="Describe the condition..."
                                        />
                                    </div>

                                    {/* Action Needed */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-white text-[14px]">
                                            Action Needed
                                        </Label>
                                        <Select
                                            value={newIssue.actionNeeded}
                                            onValueChange={(v) =>
                                                setNewIssue((p) => ({
                                                    ...p,
                                                    actionNeeded: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="bg-[#171717] border border-[#404040] w-full !h-[50px] rounded-[10px] text-white text-[14px] focus:ring-0">
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#262626] border-[#404040]">
                                                {ACTION_NEEDED_OPTIONS.map((opt) => (
                                                    <SelectItem
                                                        key={opt}
                                                        value={opt}
                                                        className="text-white hover:bg-[#404040]"
                                                    >
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Media Uploads */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-white text-[14px]">
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
                                                        handleNewIssueMediaUpload(
                                                            "optimal",
                                                            file
                                                        );
                                                }}
                                            />
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {(
                                                    newIssue.optimalStateMediaUrls ?? []
                                                ).map((url, ui) => (
                                                    <MediaPreview
                                                        key={ui}
                                                        url={url}
                                                        onRemove={() =>
                                                            removeNewIssueMedia("optimal", ui)
                                                        }
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        optimalInputRef.current?.click()
                                                    }
                                                    disabled={uploadingMedia === "optimal"}
                                                    className="bg-[#171717] border border-[#404040] border-dashed h-[80px] min-w-[80px] w-full rounded-[10px] flex flex-col items-center justify-center gap-1 text-[#a1a1a1] hover:border-[#525252] hover:text-[#d4d4d4] transition-colors disabled:opacity-50"
                                                >
                                                    {uploadingMedia === "optimal" ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <CloudUpload className="w-5 h-5" />
                                                    )}
                                                    <span className="text-[12px]">
                                                        Upload image/video
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-white text-[14px]">
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
                                                        handleNewIssueMediaUpload(
                                                            "current",
                                                            file
                                                        );
                                                }}
                                            />
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {(
                                                    newIssue.currentVisitMediaUrls ?? []
                                                ).map((url, ui) => (
                                                    <MediaPreview
                                                        key={ui}
                                                        url={url}
                                                        onRemove={() =>
                                                            removeNewIssueMedia("current", ui)
                                                        }
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        currentInputRef.current?.click()
                                                    }
                                                    disabled={uploadingMedia === "current"}
                                                    className="bg-[#171717] border border-[#404040] border-dashed h-[80px] min-w-[80px] w-full rounded-[10px] flex flex-col items-center justify-center gap-1 text-[#a1a1a1] hover:border-[#525252] hover:text-[#d4d4d4] transition-colors disabled:opacity-50"
                                                >
                                                    {uploadingMedia === "current" ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <CloudUpload className="w-5 h-5" />
                                                    )}
                                                    <span className="text-[12px]">
                                                        Upload image/video
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowAddIssue(false);
                                                setNewIssue({ ...EMPTY_ISSUE });
                                                setFilteredMachines([]);
                                            }}
                                            className="bg-[#262626] border-[#404040] text-white hover:bg-[#333] rounded-[10px] h-9 px-4"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleAddMachineIssue}
                                            className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white rounded-[10px] h-9 px-4"
                                        >
                                            Add Issue
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-[#262626] px-8 py-4 flex justify-end gap-4 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="border border-[#404040] bg-transparent hover:bg-[#262626] text-[#d4d4d4] text-[16px] font-lato font-bold px-6 py-3 rounded-[10px] h-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[16px] font-lato font-bold px-8 py-3 rounded-[10px] h-auto"
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
