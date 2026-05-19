"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, CloudUpload, Loader2, Calendar, User, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { SiteVisit, MachineIssue } from "@/types/visit-details";
import { Admin } from "@/types/admin";

interface VisitMeta {
    visitType: string[];
    assignedEngineer: string;
    clientRepresentative: string;
    clientRepresentativeDesignation: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const STATUS_STYLES: Record<string, string> = {
    "Critical Failure": "text-[#FF6467]",
    "Needs Repair": "text-[#FFAA33]",
    "Monitor": "text-[#FFD700]",
    "Healthy": "text-[#05df72]",
};

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /video\//i.test(url);
}

interface VisitUploadProps {
    clientId: string;
}

interface MediaPreviewProps {
    url: string;
    onRemove?: () => void;
    readOnly?: boolean;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ url, onRemove, readOnly = false }) => {
    const isVideo = isVideoUrl(url);
    return (
        <div className="relative group rounded-lg overflow-hidden bg-[#f9fafb] border border-border w-[140px] h-[100px]">
            {isVideo ? (
                <video src={url} className="w-full h-full object-cover" muted />
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="" className="w-full h-full object-cover" />
            )}
            {!readOnly && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-gray-900 hover:bg-red-600 transition-colors cursor-pointer"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

interface UploadZoneProps {
    label: string;
    onTrigger: () => void;
    uploading?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ label, onTrigger, uploading }) => (
    <button
        type="button"
        onClick={onTrigger}
        disabled={uploading}
        className="w-[140px] h-[100px] border-2 border-dashed border-orange/60 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-orange transition-colors bg-transparent disabled:opacity-50"
    >
        {uploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        ) : (
            <CloudUpload className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : label}</span>
    </button>
);

interface MachineIssueSectionProps {
    issue: MachineIssue;
    issueIndex: number;
    onMediaUpdate: (issueIndex: number, type: "optimal" | "current", urls: string[]) => void;
    onUploadFile: (file: File) => Promise<string>;
    referenceIssue?: MachineIssue | null;
}

const MachineIssueSection: React.FC<MachineIssueSectionProps> = ({
    issue,
    issueIndex,
    onMediaUpdate,
    onUploadFile,
    referenceIssue,
}) => {
    const optimalInputRef = useRef<HTMLInputElement>(null);
    const currentInputRef = useRef<HTMLInputElement>(null);
    const [uploadingOptimal, setUploadingOptimal] = useState(false);
    const [uploadingCurrent, setUploadingCurrent] = useState(false);
    const [showReference, setShowReference] = useState(false);

    const hasReferenceImages =
        (referenceIssue?.optimalStateMediaUrls?.length ?? 0) > 0 ||
        (referenceIssue?.currentVisitMediaUrls?.length ?? 0) > 0;

    const handleFileUpload = useCallback(
        async (type: "optimal" | "current", file: File) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast.error("Only PNG, JPG, and WebP images are allowed.");
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File size must be less than 5 MB.");
                return;
            }

            const setUploading = type === "optimal" ? setUploadingOptimal : setUploadingCurrent;
            setUploading(true);
            try {
                const url = await onUploadFile(file);
                const existingUrls =
                    type === "optimal"
                        ? issue.optimalStateMediaUrls ?? []
                        : issue.currentVisitMediaUrls ?? [];
                onMediaUpdate(issueIndex, type, [...existingUrls, url]);
                toast.success("File uploaded");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed");
            } finally {
                setUploading(false);
            }
        },
        [issue, issueIndex, onMediaUpdate, onUploadFile]
    );

    const handleRemoveMedia = (type: "optimal" | "current", urlIndex: number) => {
        const existingUrls =
            type === "optimal"
                ? [...(issue.optimalStateMediaUrls ?? [])]
                : [...(issue.currentVisitMediaUrls ?? [])];
        existingUrls.splice(urlIndex, 1);
        onMediaUpdate(issueIndex, type, existingUrls);
    };

    const statusColor = STATUS_STYLES[issue.status ?? ""] ?? "text-muted-foreground";

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-12">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Machine Name</p>
                    <p className="text-sm font-medium text-foreground">
                        {issue.machineName || "N/A"}
                    </p>
                </div>
                {issue.sparePartName && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Spare Part</p>
                        <p className="text-sm font-medium text-foreground">
                            {issue.sparePartName}
                        </p>
                    </div>
                )}
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className={`text-sm font-medium ${statusColor}`}>
                        {issue.status || "N/A"}
                    </p>
                </div>
            </div>

            {issue.conditionAlert && (
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Condition Alert</p>
                    <p className="text-sm text-foreground">{issue.conditionAlert}</p>
                </div>
            )}

            {issue.actionNeeded && (
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Action Needed</p>
                    <span className="inline-block text-[#ff6900] text-sm font-medium border border-[#ff6900] rounded-full px-3 py-0.5">
                        {issue.actionNeeded}
                    </span>
                </div>
            )}

            {/* Upload zones */}
            <div className="flex items-start gap-8 mt-4">
                <input
                    ref={optimalInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleFileUpload("optimal", file);
                    }}
                />
                <input
                    ref={currentInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleFileUpload("current", file);
                    }}
                />

                <div>
                    <p className="text-xs text-muted-foreground mb-2">Optimal State</p>
                    <div className="flex flex-wrap gap-2 items-start">
                        {(issue.optimalStateMediaUrls ?? []).map((url, ui) => (
                            <MediaPreview
                                key={ui}
                                url={url}
                                onRemove={() => handleRemoveMedia("optimal", ui)}
                            />
                        ))}
                        <UploadZone
                            label="Upload"
                            onTrigger={() => optimalInputRef.current?.click()}
                            uploading={uploadingOptimal}
                        />
                    </div>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-2">Current Visit</p>
                    <div className="flex flex-wrap gap-2 items-start">
                        {(issue.currentVisitMediaUrls ?? []).map((url, ui) => (
                            <MediaPreview
                                key={ui}
                                url={url}
                                onRemove={() => handleRemoveMedia("current", ui)}
                            />
                        ))}
                        <UploadZone
                            label="Upload"
                            onTrigger={() => currentInputRef.current?.click()}
                            uploading={uploadingCurrent}
                        />
                    </div>
                </div>
            </div>

            {/* Last Visit Reference Images */}
            {hasReferenceImages && (
                <div className="mt-3 border border-[#607797] rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowReference((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#ffffff] hover:bg-[#ffffff] transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-[#6b7280]" />
                            <span className="text-xs text-[#6b7280] font-medium">
                                Last Visit Reference
                            </span>
                        </div>
                        <span className="text-[10px] text-[#6b7280]">
                            {showReference ? "hide" : "show"}
                        </span>
                    </button>

                    {showReference && (
                        <div className="px-4 py-3 bg-[#ffffff] flex items-start gap-8">
                            {(referenceIssue?.optimalStateMediaUrls?.length ?? 0) > 0 && (
                                <div>
                                    <p className="text-[10px] text-[#6b7280] mb-2">
                                        Optimal State (last visit)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {referenceIssue!.optimalStateMediaUrls!.map((url, i) => (
                                            <MediaPreview key={i} url={url} readOnly />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(referenceIssue?.currentVisitMediaUrls?.length ?? 0) > 0 && (
                                <div>
                                    <p className="text-[10px] text-[#6b7280] mb-2">
                                        Current State (last visit)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {referenceIssue!.currentVisitMediaUrls!.map((url, i) => (
                                            <MediaPreview key={i} url={url} readOnly />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const VisitUpload: React.FC<VisitUploadProps> = ({ clientId }) => {
    const [todayVisits, setTodayVisits] = useState<SiteVisit[]>([]);
    const [pastVisits, setPastVisits] = useState<SiteVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingVisitId, setSavingVisitId] = useState<string | null>(null);
    const [localIssuesMap, setLocalIssuesMap] = useState<Record<string, MachineIssue[]>>({});
    const [localMetaMap, setLocalMetaMap] = useState<Record<string, VisitMeta>>({});
    const [users, setUsers] = useState<Admin[]>([]);

    const fetchVisits = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/clients/${clientId}/site-visits`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!response.ok) throw new Error("Failed to fetch visits");
            const data: SiteVisit[] = await response.json();

            const todayStart = startOfDay(new Date());

            const filtered = data.filter((visit) => {
                const scheduledDate = visit.nextScheduledVisit
                    ? parseISO(visit.nextScheduledVisit)
                    : null;
                const lastVisitDate = visit.lastVisitOn
                    ? parseISO(visit.lastVisitOn)
                    : null;
                return (
                    (scheduledDate && isToday(scheduledDate)) ||
                    (lastVisitDate && isToday(lastVisitDate))
                );
            });

            // Past visits: have a lastVisitOn before today, sorted newest first
            const past = data
                .filter((visit) => {
                    if (!visit.lastVisitOn) return false;
                    return isBefore(parseISO(visit.lastVisitOn), todayStart);
                })
                .sort(
                    (a, b) =>
                        parseISO(b.lastVisitOn!).getTime() -
                        parseISO(a.lastVisitOn!).getTime()
                );

            setTodayVisits(filtered);
            setPastVisits(past);

            const issuesMap: Record<string, MachineIssue[]> = {};
            const metaMap: Record<string, VisitMeta> = {};
            filtered.forEach((visit) => {
                issuesMap[visit._id] = visit.machineIssues ? [...visit.machineIssues] : [];
                metaMap[visit._id] = {
                    visitType: visit.visitType ? [...visit.visitType] : [],
                    assignedEngineer: (visit.assignedEngineer as unknown as string) ?? "",
                    clientRepresentative: visit.clientRepresentative ?? "",
                    clientRepresentativeDesignation: visit.clientRepresentativeDesignation ?? "",
                };
            });
            setLocalIssuesMap(issuesMap);
            setLocalMetaMap(metaMap);
        } catch (error) {
            console.error("Error fetching site visits:", error);
            toast.error("Failed to load today's visits");
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/users");
            if (!res.ok) return;
            const data = await res.json();
            setUsers(data.users || []);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        fetchVisits();
        fetchUsers();
    }, [fetchVisits, fetchUsers]);

    /** Find the most recent past issue matching the same machine + spare part */
    const getReferenceIssue = useCallback(
        (issue: MachineIssue): MachineIssue | null => {
            for (const visit of pastVisits) {
                const match = (visit.machineIssues ?? []).find(
                    (i) =>
                        i.machineId === issue.machineId &&
                        i.sparePartId === issue.sparePartId &&
                        ((i.optimalStateMediaUrls?.length ?? 0) > 0 ||
                            (i.currentVisitMediaUrls?.length ?? 0) > 0)
                );
                if (match) return match;
            }
            return null;
        },
        [pastVisits]
    );

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

    const handleMediaUpdate = useCallback(
        (visitId: string, issueIndex: number, type: "optimal" | "current", urls: string[]) => {
            setLocalIssuesMap((prev) => {
                const issues = [...(prev[visitId] || [])];
                if (!issues[issueIndex]) return prev;
                const updated = { ...issues[issueIndex] };
                if (type === "optimal") {
                    updated.optimalStateMediaUrls = urls;
                } else {
                    updated.currentVisitMediaUrls = urls;
                }
                issues[issueIndex] = updated;
                return { ...prev, [visitId]: issues };
            });
        },
        []
    );

    const handleSaveVisit = useCallback(
        async (visit: SiteVisit) => {
            setSavingVisitId(visit._id);
            try {
                const issues = localIssuesMap[visit._id] || [];
                const meta = localMetaMap[visit._id];
                const res = await fetch(
                    `/api/clients/${clientId}/site-visits/${visit._id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nextScheduledVisit: visit.nextScheduledVisit,
                            visitType: meta?.visitType ?? visit.visitType,
                            assignedEngineer: meta?.assignedEngineer ?? ((visit.assignedEngineer as unknown as string) ?? ""),
                            clientRepresentative: meta?.clientRepresentative ?? visit.clientRepresentative ?? "",
                            clientRepresentativeDesignation: meta?.clientRepresentativeDesignation ?? visit.clientRepresentativeDesignation ?? "",
                            machineIssues: issues,
                        }),
                    }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to save");
                }
                toast.success("Visit updated successfully");
                fetchVisits();
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save visit");
            } finally {
                setSavingVisitId(null);
            }
        },
        [clientId, localIssuesMap, localMetaMap, fetchVisits]
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                <Loader2 className="w-8 h-8 text-[#ff6900] animate-spin" />
                <p className="text-sm text-muted-foreground">Loading today&apos;s visits...</p>
            </div>
        );
    }

    if (todayVisits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                <Calendar className="w-10 h-10 text-muted-foreground" />
                <p className="text-base text-foreground font-medium">No visits scheduled for today</p>
                <p className="text-sm text-muted-foreground">
                    Visits scheduled for today will appear here. Create a visit from the Visit Details page.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 mt-2">
            {todayVisits.map((visit) => {
                const visitDate = visit.nextScheduledVisit
                    ? format(parseISO(visit.nextScheduledVisit), "dd/MM/yyyy")
                    : visit.lastVisitOn
                      ? format(parseISO(visit.lastVisitOn), "dd/MM/yyyy")
                      : "N/A";
                const issues = localIssuesMap[visit._id] || [];
                const isSaving = savingVisitId === visit._id;

                return (
                    <div
                        key={visit._id}
                        className="rounded-[10px] bg-[#ffffff] border border-[#607797] overflow-hidden"
                    >
                        {/* Card Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#607797] rounded-t-[10px] px-6 py-4">
                            <h3 className="text-base font-semibold text-foreground">
                                {visit.client?.name || "Unknown Client"}
                            </h3>
                            <div className="flex items-center gap-6">
                                <span className="text-sm text-muted-foreground">
                                    Visit date - {visitDate}
                                </span>
                                <Button
                                    onClick={() => handleSaveVisit(visit)}
                                    disabled={isSaving}
                                    className="bg-orange text-white hover:bg-orange-light gap-2 cursor-pointer"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V15" />
                                            <path d="M18 18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                        </svg>
                                    )}
                                    Save &amp; Update
                                </Button>
                            </div>
                        </div>

                        {/* Visit Info — editable */}
                        <div className="px-6 py-4 border-b border-[#607797] flex flex-col gap-4">
                            {/* Visit Type */}
                            <div className="flex items-center gap-4">
                                <FileText className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                                <span className="text-xs text-muted-foreground shrink-0">Visit Type:</span>
                                <div className="flex gap-4">
                                    {["Process Audit", "Mechanical Audit"].map((type) => {
                                        const checked = localMetaMap[visit._id]?.visitType?.includes(type) ?? false;
                                        return (
                                            <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => {
                                                        const vt = localMetaMap[visit._id]?.visitType ?? [];
                                                        const next = checked
                                                            ? vt.filter((t) => t !== type)
                                                            : [...vt, type];
                                                        setLocalMetaMap((prev) => ({
                                                            ...prev,
                                                            [visit._id]: { ...prev[visit._id], visitType: next },
                                                        }));
                                                    }}
                                                    className="w-3.5 h-3.5 accent-[#ff6900]"
                                                />
                                                <span className="text-xs text-foreground">{type}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Engineer */}
                            <div className="flex items-center gap-3">
                                <User className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                                <span className="text-xs text-muted-foreground shrink-0">Engineer:</span>
                                <input
                                    type="text"
                                    value={localMetaMap[visit._id]?.assignedEngineer ?? ""}
                                    onChange={(e) =>
                                        setLocalMetaMap((prev) => ({
                                            ...prev,
                                            [visit._id]: { ...prev[visit._id], assignedEngineer: e.target.value },
                                        }))
                                    }
                                    placeholder="Type engineer name"
                                    className="bg-[#e5e7eb] border border-[#d1d5db] text-xs text-foreground rounded-md px-2 py-1 placeholder:text-[#6b7280] focus:outline-none focus:border-[#ff6900]"
                                />
                            </div>

                            {/* Client Rep */}
                            <div className="flex items-center gap-3">
                                <User className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
                                <span className="text-xs text-muted-foreground shrink-0">Client Rep:</span>
                                <input
                                    type="text"
                                    value={localMetaMap[visit._id]?.clientRepresentative ?? ""}
                                    onChange={(e) =>
                                        setLocalMetaMap((prev) => ({
                                            ...prev,
                                            [visit._id]: { ...prev[visit._id], clientRepresentative: e.target.value },
                                        }))
                                    }
                                    placeholder="Client representative"
                                    className="bg-[#e5e7eb] border border-[#d1d5db] text-xs text-foreground rounded-md px-2 py-1 focus:outline-none focus:border-[#ff6900] w-40"
                                />
                                <input
                                    type="text"
                                    value={localMetaMap[visit._id]?.clientRepresentativeDesignation ?? ""}
                                    onChange={(e) =>
                                        setLocalMetaMap((prev) => ({
                                            ...prev,
                                            [visit._id]: { ...prev[visit._id], clientRepresentativeDesignation: e.target.value },
                                        }))
                                    }
                                    placeholder="Designation"
                                    className="bg-[#e5e7eb] border border-[#d1d5db] text-xs text-foreground rounded-md px-2 py-1 focus:outline-none focus:border-[#ff6900] w-32"
                                />
                            </div>
                        </div>

                        {/* Card Body — Machine Issues */}
                        <div className="bg-[#ffffff] p-6 space-y-6">
                            {issues.length > 0 ? (
                                issues.map((issue, idx) => (
                                    <div
                                        key={idx}
                                        className={
                                            idx < issues.length - 1
                                                ? "pb-6 border-b border-[#607797]"
                                                : ""
                                        }
                                    >
                                        <MachineIssueSection
                                            issue={issue}
                                            issueIndex={idx}
                                            onMediaUpdate={(issueIndex, type, urls) =>
                                                handleMediaUpdate(visit._id, issueIndex, type, urls)
                                            }
                                            onUploadFile={uploadFile}
                                            referenceIssue={getReferenceIssue(issue)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        No machine issues added yet. Add machine issues from the Visit
                                        Details page to upload photos here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VisitUpload;
