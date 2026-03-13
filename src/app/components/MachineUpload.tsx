"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Types (structured for future API integration) ──────────────────────────

interface UploadZone {
    id: string;
    label: string;
    highlightText: string;
}

interface ImageSection {
    id: string;
    title: string;
    zones: UploadZone[];
}

interface ProductMachine {
    id: string;
    machineName: string;
    onboardingZone: UploadZone;
    componentZones: UploadZone[];
}

interface ClientUploadData {
    id: string;
    clientName: string;
    sections: ImageSection[];
    productMachines: ProductMachine[];
    lastUpdated: string;
}

// ─── Static Data (replace with API calls in the future) ─────────────────────

const clientUploadData: ClientUploadData = {
    id: "client-1",
    clientName: "Sri Andal Paper Mill",
    sections: [
        {
            id: "sec-onboarding",
            title: "Onboarding Images",
            zones: [
                { id: "onb-1", label: "Onboarding", highlightText: "Onboarding" },
                { id: "onb-2", label: "Onboarding", highlightText: "Onboarding" },
                { id: "onb-3", label: "Onboarding", highlightText: "Onboarding" },
            ],
        },
        {
            id: "sec-business",
            title: "Business Images",
            zones: [
                { id: "biz-1", label: "Business", highlightText: "Business" },
            ],
        },
        {
            id: "sec-flowsheet",
            title: "Flowsheet Images",
            zones: [
                { id: "flow-1", label: "Flowsheet", highlightText: "Flowsheet" },
            ],
        },
        {
            id: "sec-stock",
            title: "Stock Preparation Images",
            zones: [
                { id: "stock-1", label: "Stock Preparation", highlightText: "Stock Preparation" },
            ],
        },
    ],
    productMachines: [
        {
            id: "pm-1",
            machineName: "Hydrapulper 11 DR",
            onboardingZone: {
                id: "pm-onb-1",
                label: "Onboarding",
                highlightText: "Onboarding",
            },
            componentZones: [
                { id: "comp-1", label: "Vokes Rotor", highlightText: "Vokes Rotor" },
                { id: "comp-2", label: "Maximizer Bedplate", highlightText: "Maximizer Bedplate" },
                { id: "comp-3", label: "Wear Sleeve", highlightText: "Wear Sleeve" },
                { id: "comp-4", label: "Wear Plate", highlightText: "Wear Plate" },
                { id: "comp-5", label: "Rotor Cover", highlightText: "Rotor Cover" },
                { id: "comp-6", label: "Rotor Hub", highlightText: "Rotor Hub" },
                { id: "comp-7", label: "Bangor Iron", highlightText: "Bangor Iron" },
            ],
        },
    ],
    lastUpdated: "24/03/2025 At 5:00pm",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const SaveButton: React.FC = () => (
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
);

interface UploadZoneCardProps {
    zone: UploadZone;
    previewUrl: string | null;
    onFileSelect: (zoneId: string, file: File) => void;
    onRemove: (zoneId: string) => void;
}

const UploadZoneCard: React.FC<UploadZoneCardProps> = ({
    zone,
    previewUrl,
    onFileSelect,
    onRemove,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!previewUrl) {
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

        onFileSelect(zone.id, file);

        // Reset so the same file can be re‑selected if removed
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div
            onClick={handleClick}
            className={`flex-1 min-w-[180px] border-2 border-dashed rounded-lg relative overflow-hidden transition-colors ${previewUrl
                ? "border-orange/60"
                : "border-border cursor-pointer hover:border-orange/60"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleChange}
            />

            {previewUrl ? (
                /* ── Preview State ── */
                <div className="relative w-full h-full min-h-[120px]">
                    <img
                        src={previewUrl}
                        alt={zone.label}
                        className="w-full h-full object-cover rounded-md"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(zone.id);
                        }}
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            ) : (
                /* ── Empty / Upload State ── */
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-foreground text-center">
                        Upload{" "}
                        <span className="text-orange font-medium">
                            {zone.highlightText}
                        </span>{" "}
                        Image
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Upload images (PNG, JPG)
                    </p>
                </div>
            )}
        </div>
    );
};

interface SectionHeaderProps {
    title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const MachineUpload: React.FC = () => {
    const data = clientUploadData;

    // Map of zoneId → preview URL (object URL or future API URL)
    const [previews, setPreviews] = useState<Record<string, string>>({});

    // Map of zoneId → File (for future API upload)
    const [files, setFiles] = useState<Record<string, File>>({});

    const handleFileSelect = useCallback((zoneId: string, file: File) => {
        const objectUrl = URL.createObjectURL(file);

        // Revoke previous URL if it exists to avoid memory leaks
        setPreviews((prev) => {
            if (prev[zoneId]) URL.revokeObjectURL(prev[zoneId]);
            return { ...prev, [zoneId]: objectUrl };
        });

        setFiles((prev) => ({ ...prev, [zoneId]: file }));
    }, []);

    const handleRemove = useCallback((zoneId: string) => {
        setPreviews((prev) => {
            if (prev[zoneId]) URL.revokeObjectURL(prev[zoneId]);
            const next = { ...prev };
            delete next[zoneId];
            return next;
        });

        setFiles((prev) => {
            const next = { ...prev };
            delete next[zoneId];
            return next;
        });
    }, []);

    return (
        <div className="flex flex-col gap-6 mt-2">
            {/* ── Client Card ── */}
            <div className="rounded-[10px] bg-[#171717] border border-[#262626] overflow-hidden">
                {/* Client Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#262626] rounded-t-[10px] px-6 py-4">
                    <h3 className="text-base font-semibold text-foreground">
                        {data.clientName}
                    </h3>
                    <SaveButton />
                </div>

                {/* Upload Sections */}
                <div className="bg-[#0D0D0D] p-6 space-y-6">
                    {data.sections.map((section) => (
                        <div key={section.id}>
                            <SectionHeader title={section.title} />
                            <div className="flex gap-4 flex-wrap">
                                {section.zones.map((zone) => (
                                    <UploadZoneCard
                                        key={zone.id}
                                        zone={zone}
                                        previewUrl={previews[zone.id] ?? null}
                                        onFileSelect={handleFileSelect}
                                        onRemove={handleRemove}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Upload Product Images ── */}
            <div className="rounded-[10px] bg-[#171717] border border-[#262626] overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#262626] rounded-t-[10px] px-6 py-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        Upload Product Images
                    </h3>
                </div>

                {/* Product Machine Sections */}
                <div className="bg-[#0D0D0D] p-6 space-y-8">
                    {data.productMachines.map((machine) => (
                        <div key={machine.id} className="space-y-6">
                            {/* Machine Image */}
                            <div>
                                <SectionHeader
                                    title={`Machine Image ( ${machine.machineName} )`}
                                />
                                <div className="flex gap-4 flex-wrap">
                                    <UploadZoneCard
                                        zone={machine.onboardingZone}
                                        previewUrl={previews[machine.onboardingZone.id] ?? null}
                                        onFileSelect={handleFileSelect}
                                        onRemove={handleRemove}
                                    />
                                </div>
                            </div>

                            {/* Component Images */}
                            <div>
                                <SectionHeader title="Component Images" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {machine.componentZones.map((zone) => (
                                        <UploadZoneCard
                                            key={zone.id}
                                            zone={zone}
                                            previewUrl={previews[zone.id] ?? null}
                                            onFileSelect={handleFileSelect}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-6 pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                            Last Update On - {data.lastUpdated}
                        </span>
                        <SaveButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineUpload;
