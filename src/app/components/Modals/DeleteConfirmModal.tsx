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
                className="bg-white border border-[#96A5BA] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[440px]"
            >
                <div className="border-b border-[#607797] px-6 py-[17px]">
                    <p className="text-[#1f2937] text-xl leading-8 font-medium">{title}</p>
                    <p className="text-[#6b7280] text-sm mt-1">{message}</p>
                </div>
                <div className="border-t border-[#607797] flex items-center justify-end gap-3 px-6 py-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="bg-[#f9fafb] text-[#1f2937] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
                    >
                        No
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#d45815] text-[#1f2937] px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-[9px] disabled:opacity-50"
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
