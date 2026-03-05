"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import MetricCard from "./MetricCard";
import InsightSection from "./InsightSection";
import SparePartSelector from "./SparePartSelector";

type EditingSection = null | "metrix" | "fiberLoss" | "powerLoss";

interface CategoryOption {
    _id: string;
    name: string;
    machines?: Array<{ _id: string; name: string; category?: string }>;
}

interface MachineOption {
    _id: string;
    name: string;
    categoryId?: string;
}

interface SparePartFromApi {
    _id: string;
    name: string;
    originalName?: string;
    status?: string;
    healthPercentage?: number;
    lifetimeOfRotor?: { value: number; unit: string };
    totalRunningHours?: { value: number; unit: string };
    capacityOfLine?: { value: number; unit: string };
    dailyRunningHours?: { value: number; unit: string };
    exceededLife?: { value: number; unit: string };
    totalProduction?: { value: number; unit: string };
    fiberLossRanges?: Array<{ id?: string; min: number; max: number | null; value: number }>;
    fiberCost?: { value: number; priceUnit?: string; perUnit?: string };
    totalFiberLoss?: { value: number; unit: string };
    actualMotorPowerConsumption?: { healthy: { value: number; unit: string }; wornout: { value: number; unit: string } };
    powerConsumption?: { healthy: { value: number; unit: string }; wornout: { value: number; unit: string } };
    powerCost?: { value: number; priceUnit?: string; perUnit?: string };
    installedMotorPower?: { value: number; unit: string };
    totalPowerLoss?: { value: number; unit: string };
    updatedAt?: string;
}

interface MachineInsightsClientProps {
    clientId: string;
}

function buildInsightDataFromSparePart(sp: SparePartFromApi | null): {
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
} | null {
    if (!sp) return null;
    const fmt = (v: number | undefined) => v ?? 0;
    const ranges = (sp.fiberLossRanges ?? []).map((r, i) => ({
        id: `fl-${i}`,
        label: r.max != null ? `${r.min} - ${r.max} Hrs` : `Above ${r.min} Hrs`,
        value: r.value ?? 0,
        unit: "%",
    }));
    return {
        metrix: [
            { label: "Capacity of Line", value: fmt(sp.capacityOfLine?.value), unit: sp.capacityOfLine?.unit ?? "TPD" },
            { label: "Lifetime of Rotor", value: fmt(sp.lifetimeOfRotor?.value), unit: sp.lifetimeOfRotor?.unit ?? "Hrs" },
            { label: "Total Running Hrs", value: fmt(sp.totalRunningHours?.value), unit: sp.totalRunningHours?.unit ?? "Hrs" },
            { label: "Exceeded Life (Hrs)", value: fmt(sp.exceededLife?.value), unit: sp.exceededLife?.unit ?? "Hrs" },
            { label: "Daily Running Hrs", value: fmt(sp.dailyRunningHours?.value), unit: sp.dailyRunningHours?.unit ?? "Hrs" },
            { label: "Total Production", value: fmt(sp.totalProduction?.value), unit: sp.totalProduction?.unit ?? "TPD" },
        ],
        fiberLoss: {
            ranges,
            fiberCost: {
                value: fmt(sp.fiberCost?.value),
                currencySymbol: sp.fiberCost?.priceUnit ?? "€",
                perUnit: sp.fiberCost?.perUnit ?? "Ton",
            },
            totalFiberLoss: { value: fmt(sp.totalFiberLoss?.value), unit: sp.totalFiberLoss?.unit ?? "Tons" },
        },
        powerLoss: {
            actualMotorPower: {
                healthy: { value: fmt(sp.actualMotorPowerConsumption?.healthy?.value), unit: sp.actualMotorPowerConsumption?.healthy?.unit ?? "%" },
                wornout: { value: fmt(sp.actualMotorPowerConsumption?.wornout?.value), unit: sp.actualMotorPowerConsumption?.wornout?.unit ?? "%" },
            },
            powerConsumption: {
                healthy: { value: fmt(sp.powerConsumption?.healthy?.value), unit: sp.powerConsumption?.healthy?.unit ?? "kWhr" },
                wornout: { value: fmt(sp.powerConsumption?.wornout?.value), unit: sp.powerConsumption?.wornout?.unit ?? "kWhr" },
            },
            powerCost: {
                value: fmt(sp.powerCost?.value),
                currencySymbol: sp.powerCost?.priceUnit ?? "€",
                perUnit: sp.powerCost?.perUnit ?? "kWhr",
            },
            installedMotorPower: { value: fmt(sp.installedMotorPower?.value), unit: sp.installedMotorPower?.unit ?? "kW" },
        },
        lastUpdated: sp.updatedAt
            ? new Date(sp.updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—",
    };
}

const MachineInsightsClient: React.FC<MachineInsightsClientProps> = ({ clientId }) => {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedMachineId, setSelectedMachineId] = useState("");
    const [spareParts, setSpareParts] = useState<SparePartFromApi[]>([]);
    const [loadingSpareParts, setLoadingSpareParts] = useState(false);
    const [selectedSparePartId, setSelectedSparePartId] = useState("");
    const [editingSection, setEditingSection] = useState<EditingSection>(null);
    const [savingSection, setSavingSection] = useState(false);
    const [draft, setDraft] = useState<Record<string, unknown>>({});

    useEffect(() => {
        let cancelled = false;
        setLoadingCategories(true);
        fetch("/api/products/categories/with-machines")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load categories");
                return res.json();
            })
            .then((data: CategoryOption[]) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                setCategories(list);
                if (list.length > 0 && !selectedCategoryId) setSelectedCategoryId(list[0]._id);
            })
            .catch(() => {
                if (!cancelled) setCategories([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingCategories(false);
            });
        return () => { cancelled = true; };
    }, []);

    const machinesForCategory = useMemo(() => {
        const cat = categories.find((c) => c._id === selectedCategoryId);
        const list = cat?.machines ?? [];
        return list.map((m) => ({ ...m, categoryId: selectedCategoryId }));
    }, [categories, selectedCategoryId]);

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) setSelectedCategoryId(categories[0]._id);
    }, [categories, selectedCategoryId]);

    useEffect(() => {
        const machineIds = machinesForCategory.map((m) => m._id);
        if (machineIds.length === 0) setSelectedMachineId("");
        else if (!machineIds.includes(selectedMachineId)) setSelectedMachineId(machineIds[0]);
    }, [machinesForCategory, selectedMachineId]);

    useEffect(() => {
        if (!clientId || !selectedMachineId) {
            setSpareParts([]);
            setSelectedSparePartId("");
            return;
        }
        let cancelled = false;
        setLoadingSpareParts(true);
        fetch(`/api/clients/${clientId}/machines/${selectedMachineId}/spare-parts`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load spare parts");
                return res.json();
            })
            .then((data: SparePartFromApi[]) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                setSpareParts(list);
                setSelectedSparePartId(list[0]?._id ?? "");
            })
            .catch(() => {
                if (!cancelled) setSpareParts([]);
                setSelectedSparePartId("");
            })
            .finally(() => {
                if (!cancelled) setLoadingSpareParts(false);
            });
        return () => { cancelled = true; };
    }, [clientId, selectedMachineId]);

    const activeSparePart = useMemo(
        () => spareParts.find((sp) => sp._id === selectedSparePartId) ?? spareParts[0] ?? null,
        [spareParts, selectedSparePartId]
    );

    const data = useMemo(() => buildInsightDataFromSparePart(activeSparePart), [activeSparePart]);

    const handleCategoryChange = useCallback((id: string) => {
        setSelectedCategoryId(id);
        setSelectedMachineId("");
        setSelectedSparePartId("");
    }, []);

    const handleMachineChange = useCallback((id: string) => {
        setSelectedMachineId(id);
        setSelectedSparePartId("");
    }, []);

    const handleSparePartSelect = useCallback((id: string) => {
        setSelectedSparePartId(id);
    }, []);

    const startEditSection = useCallback((section: EditingSection) => {
        if (!activeSparePart || !section) return;
        setEditingSection(section);
        if (section === "metrix") {
            setDraft({
                capacityOfLine: activeSparePart.capacityOfLine ?? { value: 0, unit: "tpd" },
                dailyRunningHours: activeSparePart.dailyRunningHours ?? { value: 0, unit: "Hrs" },
                lifetimeOfRotor: activeSparePart.lifetimeOfRotor ?? { value: 0, unit: "Hrs" },
                totalRunningHours: activeSparePart.totalRunningHours ?? { value: 0, unit: "Hrs" },
            });
        } else if (section === "fiberLoss") {
            setDraft({
                fiberLossRanges: activeSparePart.fiberLossRanges ?? [],
                fiberCost: activeSparePart.fiberCost ?? { value: 0, priceUnit: "EUR", perUnit: "Ton" },
            });
        } else if (section === "powerLoss") {
            setDraft({
                actualMotorPowerConsumption: activeSparePart.actualMotorPowerConsumption ?? { healthy: { value: 0, unit: "%" }, wornout: { value: 0, unit: "%" } },
                powerConsumption: activeSparePart.powerConsumption ?? { healthy: { value: 0, unit: "kWhr" }, wornout: { value: 0, unit: "kWhr" } },
                powerCost: activeSparePart.powerCost ?? { value: 0, priceUnit: "EUR", perUnit: "kWhr" },
                installedMotorPower: activeSparePart.installedMotorPower ?? { value: 0, unit: "kW" },
            });
        }
    }, [activeSparePart]);

    const cancelEditSection = useCallback(() => {
        setEditingSection(null);
        setDraft({});
    }, []);

    const saveEditSection = useCallback(() => {
        if (!activeSparePart || !selectedMachineId || !editingSection) return;
        const sparePartID = activeSparePart._id;
        const updates: Record<string, unknown> = { ...draft };
        setSavingSection(true);
        fetch(`/api/clients/${clientId}/client-machines/spare-parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientID: clientId,
                machineID: selectedMachineId,
                sparePartID,
                updates,
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Update failed");
                return fetch(`/api/clients/${clientId}/machines/${selectedMachineId}/spare-parts`);
            })
            .then((res) => res.json())
            .then((list: SparePartFromApi[]) => {
                setSpareParts(Array.isArray(list) ? list : []);
                setEditingSection(null);
                setDraft({});
            })
            .catch(() => {})
            .finally(() => setSavingSection(false));
    }, [clientId, selectedMachineId, activeSparePart, editingSection, draft]);

    const categoryOptions = categories.map((c) => ({ id: c._id, name: c.name }));
    const machineOptions = machinesForCategory.map((m) => ({ id: m._id, name: m.name }));
    const sparePartOptions = spareParts.map((sp) => ({ id: sp._id, name: sp.name }));
    const activeMachineId = selectedMachineId || machineOptions[0]?.id || "";
    const activeSparePartId = selectedSparePartId || sparePartOptions[0]?.id || "";

    if (!data) {
        return (
            <div className="flex flex-col gap-4 p-4 pb-8">
                {loadingCategories ? (
                    <>
                        <h1 className="text-2xl font-bold text-foreground">Machine Insights</h1>
                        <p className="text-muted-foreground">Loading categories...</p>
                    </>

                ) : loadingSpareParts ? (
                    <>
                        <h1 className="text-2xl font-bold text-foreground">Machine Insights</h1>
                        <p className="text-muted-foreground">Loading spare parts...</p>
                    </>
                ) : (
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">Machine Insights</h1>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Select Category</span>
                                <Select value={selectedCategoryId || categoryOptions[0]?.id} onValueChange={handleCategoryChange} disabled={loadingCategories}>
                                    <SelectTrigger className="w-[220px] h-10 bg-card border-border">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoryOptions.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Select Machine</span>
                                <Select value={activeMachineId} onValueChange={handleMachineChange} disabled={loadingSpareParts || machineOptions.length === 0}>
                                    <SelectTrigger className="w-[200px] h-10 bg-card border-border">
                                        <SelectValue placeholder="Select Machine" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {machineOptions.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const { metrix, fiberLoss, powerLoss, lastUpdated } = data;

    return (
        <div className="flex flex-col gap-4 p-4 pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Machine Insights</h1>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Select Category</span>
                        <Select value={selectedCategoryId || categoryOptions[0]?.id} onValueChange={handleCategoryChange} disabled={loadingCategories}>
                            <SelectTrigger className="w-[220px] h-10 bg-card border-border">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Select Machine</span>
                        <Select value={activeMachineId} onValueChange={handleMachineChange} disabled={loadingSpareParts || machineOptions.length === 0}>
                            <SelectTrigger className="w-[200px] h-10 bg-card border-border">
                                <SelectValue placeholder="Select Machine" />
                            </SelectTrigger>
                            <SelectContent>
                                {machineOptions.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {sparePartOptions.length > 0 && (
                <SparePartSelector
                    parts={sparePartOptions}
                    selectedId={activeSparePartId}
                    onSelect={handleSparePartSelect}
                />
            )}

            <InsightSection
                title="Metrix"
                onEdit={editingSection === "metrix" ? undefined : () => startEditSection("metrix")}
                isEditing={editingSection === "metrix"}
                onSave={saveEditSection}
                onCancel={cancelEditSection}
                saving={savingSection}
            >
                {editingSection === "metrix" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(["capacityOfLine", "lifetimeOfRotor", "totalRunningHours", "dailyRunningHours"] as const).map((key) => {
                            const obj = draft[key] as { value?: number; unit?: string } | undefined;
                            const val = obj?.value ?? 0;
                            const unit = obj?.unit ?? (key === "capacityOfLine" ? "tpd" : "Hrs");
                            const label = key === "capacityOfLine" ? "Capacity of Line" : key === "lifetimeOfRotor" ? "Lifetime of Rotor" : key === "totalRunningHours" ? "Total Running Hrs" : "Daily Running Hrs";
                            return (
                                <div key={key} className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">{label}</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            value={val}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    [key]: { ...(prev[key] as object), value: Number(e.target.value) || 0, unit },
                                                }))
                                            }
                                            className="h-9 w-full max-w-[120px]"
                                        />
                                        <span className="text-sm text-muted-foreground">{unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {metrix.map((m, i) => (
                            <MetricCard key={i} label={m.label} value={m.value} unit={m.unit} />
                        ))}
                    </div>
                )}
            </InsightSection>

            <InsightSection
                title="Fiber Loss Calculation"
                onEdit={editingSection === "fiberLoss" ? undefined : () => startEditSection("fiberLoss")}
                isEditing={editingSection === "fiberLoss"}
                onSave={saveEditSection}
                onCancel={cancelEditSection}
                saving={savingSection}
            >
                {editingSection === "fiberLoss" ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Fiber Cost (value)</Label>
                            <Input
                                type="number"
                                value={(draft.fiberCost as { value?: number })?.value ?? 0}
                                onChange={(e) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        fiberCost: { ...(prev.fiberCost as object), value: Number(e.target.value) || 0, priceUnit: "EUR", perUnit: "Ton" },
                                    }))
                                }
                                className="h-9 max-w-[140px]"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Fiber loss ranges can be updated via the same API; editing simplified here.</p>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </InsightSection>

            <InsightSection
                title="Power Loss Calculation"
                onEdit={editingSection === "powerLoss" ? undefined : () => startEditSection("powerLoss")}
                isEditing={editingSection === "powerLoss"}
                onSave={saveEditSection}
                onCancel={cancelEditSection}
                saving={savingSection}
            >
                {editingSection === "powerLoss" ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { key: "actualMotorPowerConsumption", sub: "healthy" as const, label: "Actual Motor (Healthy %)", unit: "%" },
                            { key: "actualMotorPowerConsumption", sub: "wornout" as const, label: "Actual Motor (Wornout %)", unit: "%" },
                            { key: "powerConsumption", sub: "healthy" as const, label: "Power (Healthy kWhr)", unit: "kWhr" },
                            { key: "powerConsumption", sub: "wornout" as const, label: "Power (Wornout kWhr)", unit: "kWhr" },
                            { key: "powerCost", sub: null, label: "Power Cost", unit: "EUR/kWhr" },
                            { key: "installedMotorPower", sub: null, label: "Installed Motor (kW)", unit: "kW" },
                        ].map((item) => {
                            const isSimple = item.sub === null;
                            const obj = draft[item.key] as Record<string, { value?: number }> | undefined;
                            const num = isSimple ? (obj as { value?: number })?.value ?? 0 : (obj?.[item.sub as string] as { value?: number })?.value ?? 0;
                            return (
                                <div key={isSimple ? item.key : `${item.key}-${item.sub}`} className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">{item.label}</Label>
                                    <Input
                                        type="number"
                                        value={num}
                                        onChange={(e) => {
                                            const n = Number(e.target.value) || 0;
                                            setDraft((prev) => {
                                                const current = (prev[item.key] as Record<string, unknown>) ?? {};
                                                if (isSimple) {
                                                    const extra = item.key === "powerCost" ? { priceUnit: "EUR", perUnit: "kWhr" } : {};
                                                    return { ...prev, [item.key]: { ...current, value: n, unit: item.unit, ...extra } };
                                                }
                                                const subKey = item.sub as "healthy" | "wornout";
                                                return {
                                                    ...prev,
                                                    [item.key]: {
                                                        ...current,
                                                        [subKey]: { ...(current[subKey] as object), value: n, unit: item.unit },
                                                    },
                                                };
                                            });
                                        }}
                                        className="h-9 max-w-[120px]"
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
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
                )}
            </InsightSection>

            <div className="flex justify-end">
                <p className="text-xs text-muted-foreground">Last Update On - {lastUpdated}</p>
            </div>
        </div>
    );
};

export default MachineInsightsClient;
