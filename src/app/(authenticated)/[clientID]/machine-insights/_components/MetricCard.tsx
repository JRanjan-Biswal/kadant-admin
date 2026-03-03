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
            <span className="text-[14px] font-normal font-lato text-[#A1A1A1] leading-[20px]">
                {label}
            </span>
            <div className="flex items-center gap-2 bg-[#262626] border border-[#404040] rounded-md px-4 py-3 min-w-[100px]">
                <span className="text-[16px] font-normal font-lato text-[#fff]">
                    {value} {unit}
                </span>
            </div>
        </div>
    );
};

export default MetricCard;
