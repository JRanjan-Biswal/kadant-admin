"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SparePartOption {
    id: string;
    name: string;
}

interface SparePartSelectorProps {
    parts: SparePartOption[];
    selectedId: string;
    onSelect: (id: string) => void;
}

const SparePartSelector: React.FC<SparePartSelectorProps> = ({
    parts,
    selectedId,
    onSelect,
}) => {
    const [open, setOpen] = useState(false);
    const selectedPart = parts.find((p) => p.id === selectedId);

    const handleSelect = (id: string) => {
        onSelect(id);
        setOpen(false);
    };

    return (
        <div className="bg-white border border-[#96A5BA] rounded-[10px] px-6 py-4">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between cursor-pointer"
                aria-expanded={open}
            >
                <div className="flex flex-col items-start">
                    <p className="text-sm text-muted-foreground font-medium">
                        Select Spare Part
                    </p>
                    {selectedPart && (
                        <span className="text-sm text-foreground font-medium mt-1">
                            {selectedPart.name}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            {open && (
                <div className="flex flex-col mt-3 border-t border-[#E5E7EB] pt-3 gap-2">
                    {parts.map((part) => (
                        <label
                            key={part.id}
                            className="flex items-center gap-2 cursor-pointer group py-1"
                            onClick={() => handleSelect(part.id)}
                        >
                            <span
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedId === part.id
                                    ? "border-orange bg-transparent"
                                    : "border-muted-foreground bg-transparent"
                                    }`}
                            >
                                {selectedId === part.id && (
                                    <span className="w-2 h-2 rounded-full bg-orange" />
                                )}
                            </span>
                            <span
                                className={`text-sm transition-colors ${selectedId === part.id
                                    ? "text-foreground font-medium"
                                    : "text-[#717171] group-hover:text-foreground"
                                    }`}
                            >
                                {part.name}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SparePartSelector;
