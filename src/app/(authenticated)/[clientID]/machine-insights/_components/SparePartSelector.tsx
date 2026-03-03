"use client";

import React from "react";

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
    return (
        <div className="bg-card border border-border rounded-xl px-6 py-4">
            <p className="text-sm text-muted-foreground font-medium mb-3">
                Select Spare Part
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {parts.map((part) => (
                    <label
                        key={part.id}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => onSelect(part.id)}
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
                                    : "text-muted-foreground group-hover:text-foreground"
                                }`}
                        >
                            {part.name}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default SparePartSelector;
