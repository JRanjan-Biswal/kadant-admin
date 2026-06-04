'use client';

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { MaintenanceScheduleEntry } from "@/actions/spare-parts-inventory";

const WEEK_SLOTS = Array.from({ length: 78 }, (_, index) => index + 1);

const ACTION_SUGGESTIONS = ["Check", "Change", "Adjust", "Send for repair"];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sparePartName: string;
    initialSchedule: MaintenanceScheduleEntry[];
    onSave: (schedule: MaintenanceScheduleEntry[]) => Promise<void>;
}

export default function MaintenanceScheduleEditor({
    open,
    onOpenChange,
    sparePartName,
    initialSchedule,
    onSave,
}: Props) {
    const [rows, setRows] = useState<MaintenanceScheduleEntry[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            const sorted = [...initialSchedule].sort((a, b) => a.week - b.week);
            setRows(sorted);
            setError(null);
        }
    }, [open, initialSchedule]);

    const usedWeeks = new Set(rows.map((r) => r.week));
    const availableWeeks = WEEK_SLOTS.filter((w) => !usedWeeks.has(w));

    const addRow = () => {
        if (availableWeeks.length === 0) return;
        setRows((r) => [
            ...r,
            { week: availableWeeks[0], action: "Check", description: "" },
        ]);
    };

    const updateRow = (idx: number, patch: Partial<MaintenanceScheduleEntry>) => {
        setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const removeRow = (idx: number) => {
        setRows((rs) => rs.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const sorted = [...rows].sort((a, b) => a.week - b.week);
            await onSave(sorted);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save schedule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#ffffff] border-[#607797] w-[96vw] max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-2rem)] lg:max-w-[1120px] max-h-[92vh]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">
                        Maintenance schedule — {sparePartName}
                    </DialogTitle>
                    <p className="text-sm text-[#6b7280]">
                        Cycle anchors to January 1. Each row fires a notification
                        at the corresponding week, up to week 78.
                    </p>
                </DialogHeader>

                {error && (
                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 max-h-[68vh] overflow-y-auto pr-1">
                    {rows.length === 0 && (
                        <p className="text-sm text-[#6b7280] py-4 text-center">
                            No scheduled actions yet.
                        </p>
                    )}
                    {rows.map((row, idx) => (
                        <div
                            key={idx}
                            className="grid min-w-0 grid-cols-1 gap-3 rounded-md border border-[#96A5BA] bg-white p-3 md:grid-cols-[120px_160px_minmax(0,1fr)_40px]"
                        >
                            <Select
                                value={String(row.week)}
                                onValueChange={(v) => updateRow(idx, { week: Number(v) })}
                            >
                                <SelectTrigger className="h-9 w-full bg-[#ffffff] border-[#607797]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WEEK_SLOTS.filter(
                                        (w) => w === row.week || !usedWeeks.has(w)
                                    ).map((w) => (
                                        <SelectItem key={w} value={String(w)}>
                                            Week {w}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={row.action}
                                onValueChange={(v) => updateRow(idx, { action: v })}
                            >
                                <SelectTrigger className="h-9 w-full bg-[#ffffff] border-[#607797]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACTION_SUGGESTIONS.map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {a}
                                        </SelectItem>
                                    ))}
                                    {!ACTION_SUGGESTIONS.includes(row.action) && (
                                        <SelectItem value={row.action}>{row.action}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>

                            <Textarea
                                placeholder="Add comments or instructions for this week..."
                                value={row.description}
                                onChange={(e) =>
                                    updateRow(idx, { description: e.target.value })
                                }
                                className="min-h-[96px] w-full min-w-0 max-w-full resize-y bg-[#ffffff] border-[#607797] text-sm leading-5"
                            />

                            <button
                                onClick={() => removeRow(idx)}
                                className="flex h-9 items-center justify-center text-red-400 hover:text-red-300 md:mt-0"
                                aria-label="Remove row"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    onClick={addRow}
                    disabled={availableWeeks.length === 0}
                    className="w-fit border-[#607797] bg-[#DFE6EC] hover:bg-[#e5e7eb] text-gray-900"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add row {availableWeeks.length === 0 ? "(all 78 weeks used)" : ""}
                </Button>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#d45815] hover:bg-[#b8480f]"
                    >
                        {saving ? "Saving…" : "Save schedule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
