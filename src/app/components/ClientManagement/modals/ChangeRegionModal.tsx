"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check, Loader2 } from "lucide-react";

interface ChangeRegionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentRegion: string;
    onSave: (region: string) => Promise<void>;
}

export default function ChangeRegionModal({
    open,
    onOpenChange,
    currentRegion,
    onSave,
}: ChangeRegionModalProps) {
    const [region, setRegion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setError("");
        if (!region.trim()) {
            setError("Region is required");
            return;
        }
        setIsLoading(true);
        try {
            await onSave(region.trim());
            handleClose();
        } catch {
            setError("Failed to update region");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setRegion("");
        setError("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                showCloseButton={false}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[500px]"
            >
                <div className="border-b border-[#1a1a1a] flex items-center justify-between h-[85px] px-6">
                    <h3 className="text-[#f3f4f6] text-2xl leading-8">Change Region</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#1a1a1a] transition-colors"
                    >
                        <X className="w-5 h-5 text-[#f3f4f6]" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[#6a7282] text-base leading-6">Current Region</label>
                        <div className="bg-[#1a1a1a] border border-[#272626] rounded-[10px] h-[46px] px-4 flex items-center">
                            <span className="text-[#f3f4f6] text-base">{currentRegion || "Not set"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[#6a7282] text-base leading-6">New Region</label>
                        <input
                            type="text"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            placeholder="e.g. LATAM, APAC, EMEA"
                            className="bg-[#1a1a1a] border border-[#262626] rounded-[10px] h-[46px] px-4 text-[#f3f4f6] text-base placeholder:text-[#4a4a4a] outline-none focus:border-[#d45815] transition-colors"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="border-t border-[#1a1a1a] flex items-center justify-end gap-3 h-[93px] px-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="bg-[#1a1a1a] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#262626] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-[#d45815] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-[9px] disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
