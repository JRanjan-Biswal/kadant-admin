'use client';

import { useState, useMemo } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ManualMachine {
    id: string;
    name: string;
    model: string;
    imageUrl: string;
    manualUrl: string;
}

interface Category {
    id: string;
    name: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
    { id: "pulping-detrashing", name: "Pulping & Detrashing" },
    { id: "screening", name: "Screening" },
    { id: "cleaning", name: "Cleaning" },
    { id: "thickening", name: "Thickening" },
];

const MACHINES: ManualMachine[] = [
    {
        id: "mm-1",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-2",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-3",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-4",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-5",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-6",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-7",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
    {
        id: "mm-8",
        name: "Hydrapurge",
        model: "RM-5000X",
        imageUrl: "/hydrapurge1.png",
        manualUrl: "#",
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface MaintenanceManualClientProps {
    clientID: string;
}

export default function MaintenanceManualClient({ clientID }: MaintenanceManualClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0].id);

    // Future: Replace with API call using clientID and selectedCategory
    const machines = useMemo(() => {
        // In production, this would be fetched from API:
        // GET /api/clients/${clientID}/maintenance-manuals?category=${selectedCategory}
        return MACHINES;
    }, [selectedCategory]);

    const selectedCategoryName = CATEGORIES.find((c) => c.id === selectedCategory)?.name ?? "";

    // Suppress unused variable warning — clientID will be used for API calls
    void clientID;

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div>
                <h1 className="text-[28px] leading-[42px] font-lato font-normal text-[#F3F4F6]">
                    Maintenance Manual
                </h1>
                <p className="text-[16px] leading-[24px] font-lato font-normal text-[#A1A1A1] mt-1">
                    Access and download maintenance manuals for all equipment
                </p>
            </div>

            {/* ── Category Selector ── */}
            <div className="flex flex-col gap-2">
                <label className="text-[16px] leading-[24px] font-lato font-normal text-[#99A1AF]">
                    Select Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full max-w-[260px] h-11 bg-[#171717] border-[#262626]">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ── Machine Count ── */}
            <p className="text-[16px] leading-[24px] font-lato font-normal text-[#A1A1A1]">
                Showing{" "}
                <span className="text-orange font-normal">{machines.length} Machine</span>{" "}
                in {selectedCategoryName}
            </p>

            {/* ── Machine Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {machines.map((machine) => (
                    <div
                        key={machine.id}
                        className="group rounded-xl border border-[#262626] bg-[#171717] overflow-hidden transition-all duration-200 hover:border-orange/50 hover:shadow-lg hover:shadow-orange/5"
                    >
                        {/* Machine Image */}
                        <div className="relative w-full aspect-[4/3] bg-[#262626] overflow-hidden">
                            <Image
                                src={machine.imageUrl}
                                alt={`${machine.name} - ${machine.model}`}
                                fill
                                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                        </div>

                        {/* Card Info */}
                        <div className="p-4 flex flex-col gap-3">
                            <div>
                                <h3 className="text-[18px] leading-[28px] font-normal text-[#FFFFFF]">
                                    {machine.name}
                                </h3>
                                <p className="text-[14px] leading-[21px] font-normal text-[#A1A1A1]">
                                    Model: {machine.model}
                                </p>
                            </div>

                            {/* Download Button */}
                            <a
                                href={machine.manualUrl}
                                download
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-orange hover:bg-orange-light text-white text-sm font-medium transition-colors duration-200 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Download Manual
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
