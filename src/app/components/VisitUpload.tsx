"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Types (structured for future API integration) ──────────────────────────

interface MachineDetail {
    machineName: string;
    status: string;
    statusColor: string;
    conditionAlert: string;
    actionNeeded: string;
}

interface VisitCard {
    id: string;
    clientName: string;
    visitDate: string;
    machines: MachineDetail[];
    lastVisitImage: string | null;
    currentVisitImage: string | null;
}

// ─── Static Data (replace with API calls in the future) ─────────────────────

const visitCards: VisitCard[] = [
    {
        id: "visit-1",
        clientName: "Sri Andal Paper Mill",
        visitDate: "31/03/2025",
        machines: [
            {
                machineName: "Vokes Rotor",
                status: "Critical Failure",
                statusColor: "text-[#FF6467]",
                conditionAlert:
                    "Rotor bearing showing excessive wear and vibration levels exceed safety thresholds",
                actionNeeded: "Send to Rebuild",
            },
        ],
        lastVisitImage: "/placeholder-rotor.png",
        currentVisitImage: null,
    },
    {
        id: "visit-2",
        clientName: "Sri Andal Paper Mill",
        visitDate: "24/03/2025",
        machines: [
            {
                machineName: "Vokes Rotor",
                status: "Critical Failure",
                statusColor: "text-[#FF6467]",
                conditionAlert:
                    "Rotor bearing showing excessive wear and vibration levels exceed safety thresholds",
                actionNeeded: "Send to Rebuild",
            },
        ],
        lastVisitImage: "/placeholder-rotor.png",
        currentVisitImage: null,
    },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

interface VisitCardHeaderProps {
    clientName: string;
    visitDate: string;
}

const VisitCardHeader: React.FC<VisitCardHeaderProps> = ({
    clientName,
    visitDate,
}) => (
    <div className="flex items-center justify-between bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#262626] rounded-t-[10px] px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{clientName}</h3>
        <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground">
                Visit date - {visitDate}
            </span>
            <Button className="bg-orange text-white hover:bg-orange-light gap-2 cursor-pointer">
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
                Save &amp; Update
            </Button>
        </div>
    </div>
);

interface MachineDetailSectionProps {
    machine: MachineDetail;
}

const MachineDetailSection: React.FC<MachineDetailSectionProps> = ({
    machine,
}) => (
    <div className="space-y-4">
        {/* Machine Info Grid */}
        <div className="flex items-start gap-12">
            <div>
                <p className="text-xs text-muted-foreground mb-1">Machine Name</p>
                <p className="text-sm font-medium text-foreground">
                    {machine.machineName}
                </p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className={`text-sm font-medium ${machine.statusColor}`}>
                    {machine.status}
                </p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1">Condition Alert</p>
                <p className="text-sm text-foreground">{machine.conditionAlert}</p>
            </div>
        </div>

        {/* Action Needed */}
        <div>
            <p className="text-xs text-muted-foreground mb-2">Action Needed</p>
            <Button
                variant="outline"
                className="border-orange text-orange hover:bg-orange/10 text-sm px-4 py-1 h-auto cursor-pointer"
            >
                {machine.actionNeeded}
            </Button>
        </div>
    </div>
);

interface ImageUploadZoneProps {
    visitId: string;
    lastVisitImage: string | null;
    currentPreviewUrl: string | null;
    onFileSelect: (visitId: string, file: File) => void;
    onRemoveCurrentImage: (visitId: string) => void;
    onRemoveLastImage: (visitId: string) => void;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
    visitId,
    lastVisitImage,
    currentPreviewUrl,
    onFileSelect,
    onRemoveCurrentImage,
    onRemoveLastImage,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!currentPreviewUrl) {
            inputRef.current?.click();
        }
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

        onFileSelect(visitId, file);

        // Reset so the same file can be re-selected if removed
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="flex items-start gap-8 mt-4">
            <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleChange}
            />

            {/* Last Visit */}
            <div>
                <p className="text-xs text-muted-foreground mb-2">Last Visit</p>
                <div className="relative w-[180px] h-[140px] rounded-lg border border-border overflow-hidden bg-[#1a1a1a]">
                    {lastVisitImage ? (
                        <>
                            <img
                                src={lastVisitImage}
                                alt="Last visit"
                                className="w-full h-full object-cover opacity-70"
                            />
                            <button
                                onClick={() => onRemoveLastImage(visitId)}
                                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                            No image
                        </div>
                    )}
                </div>
            </div>

            {/* Current Visit Upload */}
            <div>
                <p className="text-xs text-muted-foreground mb-2">Current Visit</p>
                {currentPreviewUrl ? (
                    <div className="relative w-[260px] h-[140px] rounded-lg border border-orange/60 overflow-hidden">
                        <img
                            src={currentPreviewUrl}
                            alt="Current visit"
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => onRemoveCurrentImage(visitId)}
                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={handleClick}
                        className="w-[260px] h-[140px] border-2 border-dashed border-orange/60 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange transition-colors bg-transparent"
                    >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm text-foreground">
                            Upload{" "}
                            <span className="text-orange font-medium">Current Visit</span>{" "}
                            Image
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Upload images (PNG, JPG)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const VisitUpload: React.FC = () => {
    // Map of visitId → preview URL for current visit images
    const [currentPreviews, setCurrentPreviews] = useState<Record<string, string>>({});
    // Map of visitId → File for future API upload
    const [currentFiles, setCurrentFiles] = useState<Record<string, File>>({});
    // Track removed last-visit images (for future API sync)
    const [removedLastImages, setRemovedLastImages] = useState<Set<string>>(new Set());

    const handleFileSelect = useCallback((visitId: string, file: File) => {
        const objectUrl = URL.createObjectURL(file);

        setCurrentPreviews((prev) => {
            if (prev[visitId]) URL.revokeObjectURL(prev[visitId]);
            return { ...prev, [visitId]: objectUrl };
        });

        setCurrentFiles((prev) => ({ ...prev, [visitId]: file }));
    }, []);

    const handleRemoveCurrentImage = useCallback((visitId: string) => {
        setCurrentPreviews((prev) => {
            if (prev[visitId]) URL.revokeObjectURL(prev[visitId]);
            const next = { ...prev };
            delete next[visitId];
            return next;
        });

        setCurrentFiles((prev) => {
            const next = { ...prev };
            delete next[visitId];
            return next;
        });
    }, []);

    const handleRemoveLastImage = useCallback((visitId: string) => {
        setRemovedLastImages((prev) => new Set(prev).add(visitId));
    }, []);

    return (
        <div className="flex flex-col gap-6 mt-2">
            {visitCards.map((visit) => (
                <div
                    key={visit.id}
                    className="rounded-[10px] bg-[#0D0D0D] border border-[#262626] overflow-hidden"
                >
                    {/* Card Header */}
                    <VisitCardHeader
                        clientName={visit.clientName}
                        visitDate={visit.visitDate}
                    />

                    {/* Card Body */}
                    <div className="bg-[#0D0D0D] p-6 space-y-4">
                        {visit.machines.map((machine, idx) => (
                            <MachineDetailSection key={idx} machine={machine} />
                        ))}

                        {/* Image Upload Zone */}
                        <ImageUploadZone
                            visitId={visit.id}
                            lastVisitImage={
                                removedLastImages.has(visit.id)
                                    ? null
                                    : visit.lastVisitImage
                            }
                            currentPreviewUrl={currentPreviews[visit.id] ?? null}
                            onFileSelect={handleFileSelect}
                            onRemoveCurrentImage={handleRemoveCurrentImage}
                            onRemoveLastImage={handleRemoveLastImage}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VisitUpload;
