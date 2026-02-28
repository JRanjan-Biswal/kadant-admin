"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import MetricCard from "./MetricCard";
import InsightSection from "./InsightSection";
import SparePartSelector from "./SparePartSelector";

// ─── Static Data (replace with API calls in the future) ─────────────────────

const categories = [
    { id: "cat-1", name: "Pulping & Detrashing" },
    { id: "cat-2", name: "Screening" },
    { id: "cat-3", name: "Cleaning" },
];

const machines = [
    { id: "mc-1", name: "Hydrapulper 11 DR", categoryId: "cat-1" },
    { id: "mc-2", name: "Hydrapulper 7 DR", categoryId: "cat-1" },
    { id: "mc-3", name: "Fiberizer 4 DR", categoryId: "cat-2" },
    { id: "mc-4", name: "CentriCleaner 3", categoryId: "cat-3" },
];

const spareParts = [
    { id: "sp-1", name: "Vokes rotor", machineId: "mc-1" },
    { id: "sp-2", name: "Maximizer bedplate", machineId: "mc-1" },
    { id: "sp-3", name: "Rotor Cover", machineId: "mc-1" },
    { id: "sp-4", name: "Rotor Hub", machineId: "mc-1" },
    { id: "sp-5", name: "Wear sleeve", machineId: "mc-1" },
    { id: "sp-6", name: "Wear Plate", machineId: "mc-1" },
    { id: "sp-7", name: "Bangor Iron", machineId: "mc-1" },
];

const insightDataMap: Record<
    string,
    {
        metrix: { label: string; value: number; unit: string }[];
        fiberLoss: {
            ranges: { id: string; label: string; value: number; unit: string }[];
            fiberCost: { value: number; currencySymbol: string; perUnit: string };
            totalFiberLoss: { value: number; unit: string };
        };
        powerLoss: {
            actualMotorPower: { healthy: { value: number; unit: string }; wornout: { value: number; unit: string } };
            powerConsumption: { healthy: { value: number; unit: string }; wornout: { value: number; unit: string } };
            powerCost: { value: number; currencySymbol: string; perUnit: string };
            installedMotorPower: { value: number; unit: string };
        };
        lastUpdated: string;
    }
> = {
    "sp-1": {
        metrix: [
            { label: "Capacity of Line", value: 800, unit: "TPD" },
            { label: "Lifetime of Rotor", value: 3600, unit: "Hrs" },
            { label: "Total Running Hrs", value: 5040, unit: "Hrs" },
            { label: "Exceeded Life (Hrs)", value: 1440, unit: "Hrs" },
            { label: "Daily Running Hrs", value: 24, unit: "Hrs" },
            { label: "Total Production", value: 800, unit: "TPD" },
        ],
        fiberLoss: {
            ranges: [
                { id: "fl-1", label: "24 - 240 Hrs", value: 0.15, unit: "%" },
                { id: "fl-2", label: "240 - 480 Hrs", value: 0.25, unit: "%" },
                { id: "fl-3", label: "480 - 720 Hrs", value: 0.40, unit: "%" },
                { id: "fl-4", label: "Above 720 Hrs", value: 0.50, unit: "%" },
            ],
            fiberCost: { value: 200, currencySymbol: "€", perUnit: "Ton" },
            totalFiberLoss: { value: 92, unit: "Tons" },
        },
        powerLoss: {
            actualMotorPower: {
                healthy: { value: 80, unit: "%" },
                wornout: { value: 90, unit: "%" },
            },
            powerConsumption: {
                healthy: { value: 400, unit: "kWhr" },
                wornout: { value: 450, unit: "kWhr" },
            },
            powerCost: { value: 0.09, currencySymbol: "€", perUnit: "kWhr" },
            installedMotorPower: { value: 500, unit: "kW" },
        },
        lastUpdated: "24/03/2025 at 5:00pm",
    },
};

// Fallback: all spare parts use sp-1 data until real API is connected
const getInsightData = (sparePartId: string) =>
    insightDataMap[sparePartId] ?? insightDataMap["sp-1"];

// ─── Component ──────────────────────────────────────────────────────────────

interface MachineInsightsClientProps {
    clientId: string;
}

const MachineInsightsClient: React.FC<MachineInsightsClientProps> = ({
    clientId,
}) => {
    const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
    const [selectedMachine, setSelectedMachine] = useState("");
    const [selectedSparePart, setSelectedSparePart] = useState("");

    // Derived
    const filteredMachines = useMemo(
        () => machines.filter((m) => m.categoryId === selectedCategory),
        [selectedCategory]
    );

    const activeMachineId = selectedMachine || filteredMachines[0]?.id || "";

    const filteredSpareParts = useMemo(
        () => spareParts.filter((sp) => sp.machineId === activeMachineId),
        [activeMachineId]
    );

    const activeSparePartId = selectedSparePart || filteredSpareParts[0]?.id || "";

    const data = useMemo(() => getInsightData(activeSparePartId), [activeSparePartId]);

    // Handlers
    const handleCategoryChange = useCallback((id: string) => {
        setSelectedCategory(id);
        setSelectedMachine("");
        setSelectedSparePart("");
    }, []);

    const handleMachineChange = useCallback((id: string) => {
        setSelectedMachine(id);
        setSelectedSparePart("");
    }, []);

    const handleSparePartSelect = useCallback((id: string) => {
        setSelectedSparePart(id);
    }, []);

    const handleEditSection = useCallback(
        (section: string) => {
            console.log(`Edit section: ${section}`, { clientId });
        },
        [clientId]
    );

    if (!data) return null;

    const { metrix, fiberLoss, powerLoss, lastUpdated } = data;

    return (
        <div className="flex flex-col gap-4 p-4 pb-8">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Machine Insights</h1>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Select Category</span>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="w-[220px] h-10 bg-card border-border">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Select Machine</span>
                        <Select value={activeMachineId} onValueChange={handleMachineChange}>
                            <SelectTrigger className="w-[200px] h-10 bg-card border-border">
                                <SelectValue placeholder="Select Machine" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredMachines.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* ── Spare Part Selector ── */}
            {filteredSpareParts.length > 0 && (
                <SparePartSelector
                    parts={filteredSpareParts}
                    selectedId={activeSparePartId}
                    onSelect={handleSparePartSelect}
                />
            )}

            {/* ── Metrix ── */}
            <InsightSection title="Metrix" onEdit={() => handleEditSection("metrix")}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {metrix.map((m, i) => (
                        <MetricCard key={i} label={m.label} value={m.value} unit={m.unit} />
                    ))}
                </div>
            </InsightSection>

            {/* ── Fiber Loss Calculation ── */}
            <InsightSection title="Fiber Loss Calculation" onEdit={() => handleEditSection("fiberLoss")}>
                <p className="text-sm font-semibold text-foreground mb-3">Fiber Loss</p>
                <div className="flex flex-wrap items-end gap-4">
                    {fiberLoss.ranges.map((r) => (
                        <MetricCard key={r.id} label={r.label} value={`${r.value}${r.unit}`} unit="" />
                    ))}
                    <div className="hidden lg:block w-px bg-border self-stretch" />
                    <MetricCard
                        label="Fiber Cost"
                        value={`${fiberLoss.fiberCost.value} ${fiberLoss.fiberCost.currencySymbol}/${fiberLoss.fiberCost.perUnit}`}
                        unit=""
                    />
                    <MetricCard
                        label="Total Fiber Loss"
                        value={fiberLoss.totalFiberLoss.value}
                        unit={fiberLoss.totalFiberLoss.unit}
                    />
                </div>
            </InsightSection>

            {/* ── Power Loss Calculation ── */}
            <InsightSection title="Power Loss Calculation" onEdit={() => handleEditSection("powerLoss")}>
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Actual Motor Power Consumption</p>
                        <div className="flex gap-4">
                            <MetricCard label="Healthy Rotor" value={`${powerLoss.actualMotorPower.healthy.value}${powerLoss.actualMotorPower.healthy.unit}`} unit="" />
                            <MetricCard label="Wornout Rotor" value={`${powerLoss.actualMotorPower.wornout.value}${powerLoss.actualMotorPower.wornout.unit}`} unit="" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Power Consumption</p>
                        <div className="flex gap-4">
                            <MetricCard label="Healthy Rotor" value={powerLoss.powerConsumption.healthy.value} unit={powerLoss.powerConsumption.healthy.unit} />
                            <MetricCard label="Wornout Rotor" value={powerLoss.powerConsumption.wornout.value} unit={powerLoss.powerConsumption.wornout.unit} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-3 opacity-0">&nbsp;</p>
                        <div className="flex gap-4">
                            <MetricCard
                                label="Power Cost"
                                value={`${powerLoss.powerCost.value} ${powerLoss.powerCost.currencySymbol}/${powerLoss.powerCost.perUnit}`}
                                unit=""
                            />
                            <MetricCard label="Installed Motor Power" value={powerLoss.installedMotorPower.value} unit={powerLoss.installedMotorPower.unit} />
                        </div>
                    </div>
                </div>
            </InsightSection>

            {/* ── Footer ── */}
            <div className="flex justify-end">
                <p className="text-xs text-muted-foreground">Last Update On - {lastUpdated}</p>
            </div>
        </div>
    );
};

export default MachineInsightsClient;
