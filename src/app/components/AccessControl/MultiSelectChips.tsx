"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Option {
    _id: string;
    label: string;
}

interface MultiSelectChipsProps {
    options: Option[];
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
}

export default function MultiSelectChips({
    options,
    value,
    onChange,
    placeholder = "Select…",
}: MultiSelectChipsProps) {
    const [open, setOpen] = useState(false);
    const selected = options.filter((o) => value.includes(o._id));

    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "w-full min-h-[42px] rounded-[10px] border border-[#96A5BA] bg-white px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:border-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#d45815]/40 transition"
                    )}
                >
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                        {selected.length === 0 ? (
                            <span className="text-[#9ca3af]">{placeholder}</span>
                        ) : (
                            selected.map((s) => (
                                <span
                                    key={s._id}
                                    className="inline-flex items-center gap-1 bg-[#f3f4f6] text-gray-900 text-xs font-medium pl-2 pr-1 py-0.5 rounded-full"
                                >
                                    {s.label}
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggle(s._id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(s._id);
                                            }
                                        }}
                                        className="hover:bg-gray-200 rounded-full p-0.5 cursor-pointer"
                                    >
                                        <X className="w-3 h-3" />
                                    </span>
                                </span>
                            ))
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#6b7280] shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 max-h-72 overflow-y-auto"
                align="start"
            >
                {options.length === 0 ? (
                    <div className="p-3 text-sm text-[#6b7280]">No options</div>
                ) : (
                    options.map((opt) => {
                        const isSelected = value.includes(opt._id);
                        return (
                            <button
                                type="button"
                                key={opt._id}
                                onClick={() => toggle(opt._id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f3f4f6] cursor-pointer",
                                    isSelected && "bg-[#fef3ec]"
                                )}
                            >
                                <span className="flex items-center justify-center w-4 h-4 rounded border border-[#96A5BA]">
                                    {isSelected ? <Check className="w-3 h-3 text-[#d45815]" /> : null}
                                </span>
                                <span className="flex-1 text-left">{opt.label}</span>
                            </button>
                        );
                    })
                )}
            </PopoverContent>
        </Popover>
    );
}
