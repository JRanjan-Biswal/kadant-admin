"use client";

import { useState, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import AddCategoryMachineFlow from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";

interface AddMachineModalProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
    /** When set, machines created in this flow are linked to this client. */
    clientID?: string;
}

export default function AddMachineModal({ onSuccess, children, clientID }: AddMachineModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isSavingAndClosing, setIsSavingAndClosing] = useState(false);
    const closeBlockedRef = useRef(false);
    const hasUnsavedChangesRef = useRef(false);
    const saveRef = useRef<(() => Promise<void>) | null>(null);

    const handleMachinesCreated = useCallback(async (machineIDs: string[]) => {
        if (!clientID || machineIDs.length === 0) return;
        try {
            const res = await fetch(`/api/clients/${clientID}/client-machines`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ machineIDs }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to link machines to client");
            }
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to link machines to client");
        }
    }, [clientID, onSuccess]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            if (hasUnsavedChangesRef.current) { setShowCloseConfirm(true); return; }
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }, []);

    const handleCloseGuardChange = useCallback((blocked: boolean) => {
        closeBlockedRef.current = blocked;
    }, []);

    const handleComplete = useCallback(() => {
        closeBlockedRef.current = false;
        hasUnsavedChangesRef.current = false;
        setIsOpen(false);
    }, []);

    return (
        <>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button variant="outline" className="border-[#d1d5db] text-gray-900 hover:bg-[#e5e7eb]">
                        Add Category
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="bg-white border border-[#96A5BA] rounded-[10px] p-0 lg:w-[720px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
                onInteractOutside={(e) => { e.preventDefault(); }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                    if (hasUnsavedChangesRef.current) {
                        setShowCloseConfirm(true);
                    } else {
                        closeBlockedRef.current = false;
                        setIsOpen(false);
                    }
                }}
            >
                <div className="bg-[#DFE6EC] border-b border-[#607797] flex h-[64px] items-center justify-between px-6 shrink-0 sticky top-0 z-10">
                    <h2 className="text-gray-900 text-[20px] font-medium">Add Category, Machine, Spare Parts & Parts</h2>
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="w-8 h-8 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <AddCategoryMachineFlow
                        compact={false}
                        onSuccess={onSuccess}
                        onComplete={handleComplete}
                        onCloseGuardChange={handleCloseGuardChange}
                        onHasUnsavedChangesChange={(hasChanges) => { hasUnsavedChangesRef.current = hasChanges; }}
                        saveRef={saveRef}
                        onMachinesCreated={clientID ? handleMachinesCreated : undefined}
                    />
                </div>
            </DialogContent>
        </Dialog>

        {/* Unsaved-changes confirmation when user tries to close the add modal */}
        <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
            <DialogContent
                showCloseButton={false}
                className="bg-white border border-[#96A5BA] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[440px]"
            >
                <div className="border-b border-[#607797] px-6 py-[17px]">
                    <p className="text-[#1f2937] text-xl leading-8 font-medium">You have unsaved changes.</p>
                </div>
                <div className="px-6 pt-4 pb-2">
                    <p className="text-[#6b7280] text-sm">Do you want to save your changes before closing?</p>
                    {closeBlockedRef.current && (
                        <p className="text-amber-600 text-sm mt-2">Note: Some machine positions have not been mapped on the category image.</p>
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-6">
                    <button
                        type="button"
                        disabled={isSavingAndClosing}
                        onClick={() => setShowCloseConfirm(false)}
                        className="bg-[#f9fafb] text-[#1f2937] border border-[#d1d5db] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isSavingAndClosing}
                        onClick={() => {
                            setShowCloseConfirm(false);
                            closeBlockedRef.current = false;
                            hasUnsavedChangesRef.current = false;
                            setIsOpen(false);
                        }}
                        className="bg-[#f9fafb] text-[#dc2626] border border-[#dc2626] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#fef2f2] transition-colors disabled:opacity-50"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="button"
                        disabled={isSavingAndClosing}
                        onClick={async () => {
                            setIsSavingAndClosing(true);
                            setShowCloseConfirm(false);
                            try {
                                await saveRef.current?.();
                            } finally {
                                setIsSavingAndClosing(false);
                            }
                            closeBlockedRef.current = false;
                            setIsOpen(false);
                        }}
                        className="bg-[#d45815] text-white px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSavingAndClosing && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save &amp; Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
