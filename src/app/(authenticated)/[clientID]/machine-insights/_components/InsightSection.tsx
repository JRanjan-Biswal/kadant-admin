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
            className={`bg-card border border-border rounded-xl p-6 ${className}`}
        >
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
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
