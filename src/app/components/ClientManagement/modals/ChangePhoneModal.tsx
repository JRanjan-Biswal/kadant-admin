"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check, Loader2 } from "lucide-react";

interface ChangePhoneModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPhone: string;
    onSave: (phone: string) => Promise<void>;
}

export default function ChangePhoneModal({
    open,
    onOpenChange,
    currentPhone,
    onSave,
}: ChangePhoneModalProps) {
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setError("");
        if (!phone.trim()) {
            setError("Phone number is required");
            return;
        }
        setIsLoading(true);
        try {
            await onSave(phone.trim());
            handleClose();
        } catch {
            setError("Failed to update phone number");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPhone("");
        setError("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                showCloseButton={false}
                className="bg-white border border-[#96A5BA] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[500px] overflow-hidden"
            >
                <div className="bg-[#DFE6EC] border-b border-[#96A5BA] flex items-center justify-between h-[72px] px-6">
                    <h3 className="text-[#2D3E5C] text-xl font-bold leading-7">Change Phone</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#f9fafb] transition-colors"
                    >
                        <X className="w-5 h-5 text-[#2D3E5C]" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[#6b7280] text-base leading-6">Current Phone</label>
                        <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 flex items-center">
                            <span className="text-[#1f2937] text-base">{currentPhone || "Not set"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[#6b7280] text-base leading-6">New Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            placeholder="e.g. +91 9876543210"
                            className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 text-[#2D3E5C] text-base placeholder:text-[#4a4a4a] outline-none focus:border-[#d45815] transition-colors"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="border-t border-[#96A5BA] flex items-center justify-end gap-3 h-[80px] px-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-[#2D3E5C] text-white px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#1f2a44] transition-colors flex items-center gap-[9px] disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
