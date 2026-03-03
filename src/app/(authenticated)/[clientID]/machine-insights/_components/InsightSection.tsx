"use client";

import React from "react";
import { Pencil } from "lucide-react";

interface InsightSectionProps {
    title: string;
    onEdit?: () => void;
    children: React.ReactNode;
    className?: string;
}

const InsightSection: React.FC<InsightSectionProps> = ({
    title,
    onEdit,
    children,
    className = "",
}) => {
    return (
        <div
            className={`bg-[#171717] border border-[#262626] rounded-[10px] p-6 ${className}`}
        >
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-normal text-[#A1A1A1] leading-[20px] font-lato">{title}</h2>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-normal bg-[#262626] text-[#fff] border border-[#404040] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Section
                    </button>
                )}
            </div>
            {children}
        </div>
    );
};

export default InsightSection;
