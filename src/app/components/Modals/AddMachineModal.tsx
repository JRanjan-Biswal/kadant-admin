"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import AddCategoryMachineFlow from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";

interface AddMachineModalProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export default function AddMachineModal({ onSuccess, children }: AddMachineModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button variant="outline" className="border-[#404040] text-white hover:bg-[#262626]">
                        Add Category
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="bg-[#171717] border border-[#262626] rounded-[10px] p-0 w-[720px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                <div className="bg-[#171717] border-b border-[#262626] flex h-[64px] items-center justify-between px-6 shrink-0">
                    <h2 className="text-white text-[20px] font-medium">Add Category, Machine, Spare Parts & Parts</h2>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
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
                        onComplete={() => setIsOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
