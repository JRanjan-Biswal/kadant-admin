"use client";

import React from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightSectionProps {
    title: string;
    onEdit?: () => void;
    isEditing?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    saving?: boolean;
    children: React.ReactNode;
    className?: string;
}

const InsightSection: React.FC<InsightSectionProps> = ({
    title,
    onEdit,
    isEditing,
    onSave,
    onCancel,
    saving,
    children,
    className = "",
}) => {
    return (
        <div
            className={`bg-[#171717] border border-[#262626] rounded-[10px] p-6 ${className}`}
        >
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            disabled={saving}
                            className="border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={onSave}
                            disabled={saving}
                            className="gap-2"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Save
                        </Button>
                    </div>
                ) : onEdit ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-normal bg-[#262626] text-[#fff] border border-[#404040] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Section
                    </button>
                ) : null}
            </div>
            {children}
        </div>
    );
};

export default InsightSection;
