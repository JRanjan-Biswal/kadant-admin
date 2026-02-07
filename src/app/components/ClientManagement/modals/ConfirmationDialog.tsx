"use client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Check, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    type: "password" | "loginId" | "visibility";
    isLoading?: boolean;
}

export default function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    type,
    isLoading = false
}: ConfirmationDialogProps) {
    const getTitle = () => {
        switch (type) {
            case "password":
                return { prefix: "Are you sure, you want to change the", highlight: "Password?" };
            case "loginId":
                return { prefix: "Are you sure, you want to change the", highlight: "Login ID?" };
            case "visibility":
                return { prefix: "Are you sure, you want to Edit the", highlight: "Account Visibility?" };
        }
    };

    const title = getTitle();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                showCloseButton={false}
                className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[440px]"
            >
                {/* Header */}
                <div className="border-b border-[#1a1a1a] px-6 py-[17px]">
                    <p className="text-[#f3f4f6] text-xl leading-8">
                        {title.prefix}{" "}
                        <span className="text-[#d45815]">{title.highlight}</span>
                    </p>
                </div>

                {/* Footer */}
                <div className="border-t border-[#1a1a1a] flex items-center justify-end gap-3 px-6 py-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="bg-[#1a1a1a] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#262626] transition-colors disabled:opacity-50"
                    >
                        No
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-[#d45815] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-[9px] disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        Yes, Confirm
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
