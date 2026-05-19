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
            <span className="text-[14px] font-normal font-lato text-[#6b7280] leading-[20px]">
                {label}
            </span>
            <div className="flex items-center gap-2 bg-[#e5e7eb] border border-[#d1d5db] rounded-md px-4 py-3 min-w-[100px]">
                <span className="text-[16px] font-normal font-lato text-[#1f2937]">
                    {value} {unit}
                </span>
            </div>
        </div>
    );
};

export default MetricCard;
