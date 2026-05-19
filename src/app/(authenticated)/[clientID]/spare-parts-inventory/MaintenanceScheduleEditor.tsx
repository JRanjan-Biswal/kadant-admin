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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { MaintenanceScheduleEntry } from "@/actions/spare-parts-inventory";

const WEEK_SLOTS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52];

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

    useEffect(() => {
        if (open) {
            const sorted = [...initialSchedule].sort((a, b) => a.week - b.week);
            setRows(sorted);
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
        try {
            const sorted = [...rows].sort((a, b) => a.week - b.week);
            await onSave(sorted);
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#ffffff] border-[#607797] max-w-[720px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">
                        Maintenance schedule — {sparePartName}
                    </DialogTitle>
                    <p className="text-sm text-[#6b7280]">
                        Cycle anchors to January 1 each year. Each row fires a notification
                        at the corresponding week.
                    </p>
                </DialogHeader>

                <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
                    {rows.length === 0 && (
                        <p className="text-sm text-[#6b7280] py-4 text-center">
                            No scheduled actions yet.
                        </p>
                    )}
                    {rows.map((row, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-[110px_140px_1fr_40px] gap-2 items-center bg-white border border-[#96A5BA] rounded-md p-2"
                        >
                            <Select
                                value={String(row.week)}
                                onValueChange={(v) => updateRow(idx, { week: Number(v) })}
                            >
                                <SelectTrigger className="bg-[#ffffff] border-[#607797] h-9">
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
                                <SelectTrigger className="bg-[#ffffff] border-[#607797] h-9">
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

                            <Input
                                placeholder="e.g. Check the condition of the Rotor & Adjust the gap"
                                value={row.description}
                                onChange={(e) =>
                                    updateRow(idx, { description: e.target.value })
                                }
                                className="bg-[#ffffff] border-[#607797] h-9"
                            />

                            <button
                                onClick={() => removeRow(idx)}
                                className="text-red-400 hover:text-red-300 flex items-center justify-center h-9"
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
                    Add row {availableWeeks.length === 0 ? "(all 13 slots used)" : ""}
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
