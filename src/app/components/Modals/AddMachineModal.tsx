"use client";

import { useState, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import AddCategoryMachineFlow from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";

interface AddMachineModalProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export default function AddMachineModal({ onSuccess, children }: AddMachineModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const closeBlockedRef = useRef(false);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open && closeBlockedRef.current) {
            toast.error("Please associate all machine positions with the category image before closing.");
            return;
        }
        setIsOpen(open);
    }, []);

    const handleCloseGuardChange = useCallback((blocked: boolean) => {
        closeBlockedRef.current = blocked;
    }, []);

    const handleComplete = useCallback(() => {
        closeBlockedRef.current = false;
        setIsOpen(false);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button variant="outline" className="border-[#404040] text-white hover:bg-[#262626]">
                        Add Category
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="bg-[#171717] border border-[#262626] rounded-[10px] p-0 lg:w-[720px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
                onInteractOutside={(e) => {
                    if (closeBlockedRef.current) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (closeBlockedRef.current) {
                        e.preventDefault();
                        toast.error("Please associate all machine positions with the category image before closing.");
                    }
                }}
            >
                <div className="bg-[#171717] border-b border-[#262626] flex h-[64px] items-center justify-between px-6 shrink-0">
                    <h2 className="text-white text-[20px] font-medium">Add Category, Machine, Spare Parts & Parts</h2>
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="w-8 h-8 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
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
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
