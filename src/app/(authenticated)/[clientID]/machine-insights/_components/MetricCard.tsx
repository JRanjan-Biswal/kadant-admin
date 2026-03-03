"use client";

import React from "react";

interface MetricCardProps {
    label: string;
    value: string | number;
    unit: string;
    className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    unit,
    className = "",
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
                {label}
            </span>
            <div className="flex items-center gap-2 bg-[#1a2332] rounded-lg px-4 py-3 min-w-[100px]">
                <span className="text-sm font-semibold text-foreground">
                    {value} {unit}
                </span>
            </div>
        </div>
    );
};

export default MetricCard;
