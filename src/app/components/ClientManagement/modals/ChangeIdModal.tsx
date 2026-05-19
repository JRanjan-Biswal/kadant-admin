"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { X, Check, Loader2 } from "lucide-react";
import ConfirmationDialog from "./ConfirmationDialog";

interface ChangeIdModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentId: string;
    onSave: (newId: string) => Promise<void>;
}

export default function ChangeIdModal({
    open,
    onOpenChange,
    currentId,
    onSave
}: ChangeIdModalProps) {
    const [newId, setNewId] = useState("");
    const [confirmNewId, setConfirmNewId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSaveClick = () => {
        setError("");
        
        if (!newId.trim()) {
            setError("New ID is required");
            return;
        }
        
        if (newId !== confirmNewId) {
            setError("IDs do not match");
            return;
        }
        
        if (newId === currentId) {
            setError("New ID must be different from current ID");
            return;
        }

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onSave(newId);
            setShowConfirmation(false);
            handleClose();
        } catch {
            setError("Failed to update ID");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewId("");
        setConfirmNewId("");
        setError("");
        setShowConfirmation(false);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open && !showConfirmation} onOpenChange={handleClose}>
                <DialogContent 
                    showCloseButton={false}
                    className="bg-white border border-[#96A5BA] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[500px] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#DFE6EC] border-b border-[#96A5BA] flex items-center justify-between h-[72px] px-6">
                        <h3 className="text-[#2D3E5C] text-xl font-bold leading-7">Change your ID</h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#f9fafb] transition-colors"
                        >
                            <X className="w-5 h-5 text-[#2D3E5C]" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col gap-5">
                        {/* Current ID */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6b7280] text-base leading-6">Current ID</label>
                            <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 flex items-center">
                                <span className="text-[#1f2937] text-base">{currentId}</span>
                            </div>
                        </div>

                        {/* New ID */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6b7280] text-base leading-6">New ID</label>
                            <input
                                type="email"
                                value={newId}
                                onChange={(e) => setNewId(e.target.value)}
                                placeholder="Enter new ID"
                                className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 text-[#2D3E5C] text-base placeholder:text-[#4a4a4a] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>

                        {/* Confirm New ID */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6b7280] text-base leading-6">Confirm New ID</label>
                            <input
                                type="email"
                                value={confirmNewId}
                                onChange={(e) => setConfirmNewId(e.target.value)}
                                placeholder="Confirm new ID"
                                className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 text-[#2D3E5C] text-base placeholder:text-[#4a4a4a] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                    </div>

                    {/* Footer */}
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
                            onClick={handleSaveClick}
                            disabled={isLoading}
                            className="bg-[#2D3E5C] text-white px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#1f2a44] transition-colors flex items-center gap-[9px] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                type="loginId"
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirmation(false)}
                isLoading={isLoading}
            />
        </>
    );
}
