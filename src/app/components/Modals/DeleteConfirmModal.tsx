"use client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Check, Loader2 } from "lucide-react";

export interface DeleteConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function DeleteConfirmModal({
    open,
    onOpenChange,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
}: DeleteConfirmModalProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!isLoading) onOpenChange(open);
    };

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[440px]"
            >
                <div className="border-b border-[#1a1a1a] px-6 py-[17px]">
                    <p className="text-[#f3f4f6] text-xl leading-8 font-medium">{title}</p>
                    <p className="text-[#a1a1a1] text-sm mt-1">{message}</p>
                </div>
                <div className="border-t border-[#1a1a1a] flex items-center justify-end gap-3 px-6 py-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="bg-[#1a1a1a] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#262626] transition-colors disabled:opacity-50"
                    >
                        No
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#d45815] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-[9px] disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        Yes, Delete
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
