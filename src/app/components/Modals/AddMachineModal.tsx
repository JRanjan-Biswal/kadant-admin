"use client";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Trash2, Upload, Calendar, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ComponentRow {
    id: string;
    componentName: string;
    klCode: string;
    partDrawingLink: string;
    installationDate: string;
    endOfLife: string;
}

interface AddMachineModalProps {
    onSuccess?: () => void;
    children?: React.ReactNode;
}

const WORD_LIMIT = 250;

export default function AddMachineModal({ onSuccess, children }: AddMachineModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [machineCategory, setMachineCategory] = useState("");
    const [machineName, setMachineName] = useState("");
    const [productSummary, setProductSummary] = useState("");
    const [categoryAdded, setCategoryAdded] = useState(false);
    const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingMachine, setAddingMachine] = useState(false);
    const [components, setComponents] = useState<ComponentRow[]>([]);

    const addComponent = () => {
        setComponents((prev) => [
            ...prev,
            {
                id: `comp_${Date.now()}`,
                componentName: "",
                klCode: "",
                partDrawingLink: "",
                installationDate: "",
                endOfLife: "",
            },
        ]);
    };

    const removeComponent = (id: string) => {
        setComponents((prev) => prev.filter((c) => c.id !== id));
    };

    const updateComponent = (id: string, field: keyof ComponentRow, value: string) => {
        setComponents((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    };

    const handleAddCategory = async () => {
        const name = machineCategory.trim();
        if (!name) {
            toast.error("Please enter a machine category");
            return;
        }
        setAddingCategory(true);
        try {
            const res = await fetch("/api/machines/machine-category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to add category");
            }
            const data = await res.json();
            setCreatedCategoryId(data._id);
            setCategoryAdded(true);
            toast.success("Category added successfully. Now add the machine part.");
            onSuccess?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add category");
        } finally {
            setAddingCategory(false);
        }
    };

    const handleAddMachinePart = async () => {
        const name = machineName.trim();
        if (!name) {
            toast.error("Please enter a machine name");
            return;
        }
        setAddingMachine(true);
        try {
            if (createdCategoryId) {
                const res = await fetch("/api/machines/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        category: createdCategoryId,
                        isActive: true,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add machine");
                }
                toast.success("Machine part added successfully");
            } else {
                const categoryName = machineCategory.trim();
                if (!categoryName) {
                    toast.error("Add category first or enter category and machine name");
                    setAddingMachine(false);
                    return;
                }
                const res = await fetch("/api/machines/add-with-category", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        categoryName,
                        machineName: name,
                        isActive: true,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to add category and machine");
                }
                toast.success("Category and machine part added successfully");
            }
            onSuccess?.();
            setIsOpen(false);
            setMachineCategory("");
            setMachineName("");
            setProductSummary("");
            setCategoryAdded(false);
            setCreatedCategoryId(null);
            setComponents([]);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add machine part");
        } finally {
            setAddingMachine(false);
        }
    };

    const wordCount = productSummary.trim() ? productSummary.trim().split(/\s+/).length : 0;

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
                className="bg-[#171717] border border-[#262626] rounded-[10px] p-0 lg:w-[720px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                <div className="bg-[#171717] border-b border-[#262626] flex h-[64px] items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-white text-[20px] font-medium">Machine 1</h2>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-md text-[#a1a1a1] hover:bg-[#262626] hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <Label className="text-[#a1a1a1] text-[14px]">Machine Category</Label>
                        <Input
                            value={machineCategory}
                            onChange={(e) => setMachineCategory(e.target.value)}
                            placeholder="e.g., Pulping and Detrashing"
                            className="bg-[#262626] border border-[#404040] h-[44px] rounded-[10px] px-4 text-white text-[14px] placeholder:text-[#525252] focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-[#a1a1a1] text-[14px]">Machine Name</Label>
                        <Input
                            value={machineName}
                            onChange={(e) => setMachineName(e.target.value)}
                            placeholder="e.g., Hydrapulper"
                            className="bg-[#262626] border border-[#404040] h-[44px] rounded-[10px] px-4 text-white text-[14px] placeholder:text-[#525252] focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-[#a1a1a1] text-[14px]">
                            Product Summary ({WORD_LIMIT} words)
                        </Label>
                        <Textarea
                            value={productSummary}
                            onChange={(e) => setProductSummary(e.target.value)}
                            placeholder="Enter detailed product summary..."
                            className="bg-[#262626] border border-[#404040] rounded-[10px] px-4 py-3 text-white text-[14px] placeholder:text-[#525252] focus-visible:ring-0 min-h-[100px] resize-none"
                        />
                        <p className="text-[#525252] text-[12px]">
                            {wordCount} / {WORD_LIMIT} words
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-[#a1a1a1] text-[14px]">Machine Image</Label>
                        <div className="border-2 border-dashed border-[#404040] rounded-[10px] flex flex-col items-center justify-center py-8 px-4 bg-[#1f1f1f]">
                            <Upload className="w-10 h-10 text-[#737373] mb-2" />
                            <p className="text-white text-[14px] text-center">Click to upload Machine image</p>
                            <p className="text-[#737373] text-[12px] text-center mt-0.5">
                                Upload multiple images (PNG, JPG, GIF)
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-[#262626] pt-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-[16px] font-medium">Machine Components</h3>
                            <Button
                                type="button"
                                onClick={addComponent}
                                className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[14px] h-9 px-4 rounded-[10px]"
                            >
                                + Add Component
                            </Button>
                        </div>
                        {components.map((comp) => (
                            <div
                                key={comp.id}
                                className="bg-[#26262680] border border-[#404040] rounded-[10px] p-4 mb-2 flex flex-col gap-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-[14px] font-medium">Component</span>
                                    <button
                                        type="button"
                                        onClick={() => removeComponent(comp.id)}
                                        className="p-1.5 rounded-md text-[#a1a1a1] hover:bg-[#404040] hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[#a1a1a1] text-[12px]">Component Name</Label>
                                        <Input
                                            value={comp.componentName}
                                            onChange={(e) => updateComponent(comp.id, "componentName", e.target.value)}
                                            placeholder="e.g., Rotor Blade"
                                            className="bg-[#262626] border border-[#404040] h-[40px] rounded-[8px] px-3 text-white text-[13px] placeholder:text-[#525252] focus-visible:ring-0"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[#a1a1a1] text-[12px]">KL Code</Label>
                                        <Input
                                            value={comp.klCode}
                                            onChange={(e) => updateComponent(comp.id, "klCode", e.target.value)}
                                            placeholder="e.g., KL-5000"
                                            className="bg-[#262626] border border-[#404040] h-[40px] rounded-[8px] px-3 text-white text-[13px] placeholder:text-[#525252] focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#a1a1a1] text-[12px]">Part Drawing Link</Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                                        <Input
                                            value={comp.partDrawingLink}
                                            onChange={(e) => updateComponent(comp.id, "partDrawingLink", e.target.value)}
                                            placeholder="https://..."
                                            className="bg-[#262626] border border-[#404040] h-[40px] rounded-[8px] pl-9 pr-3 text-white text-[13px] placeholder:text-[#525252] focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[#a1a1a1] text-[12px]">Installation Date</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                                            <Input
                                                type="date"
                                                value={comp.installationDate}
                                                onChange={(e) => updateComponent(comp.id, "installationDate", e.target.value)}
                                                className="bg-[#262626] border border-[#404040] h-[40px] rounded-[8px] pl-9 pr-3 text-white text-[13px] focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[#a1a1a1] text-[12px]">End of Life</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                                            <Input
                                                type="date"
                                                value={comp.endOfLife}
                                                onChange={(e) => updateComponent(comp.id, "endOfLife", e.target.value)}
                                                className="bg-[#262626] border border-[#404040] h-[40px] rounded-[8px] pl-9 pr-3 text-white text-[13px] focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[#a1a1a1] text-[12px]">Component Image</Label>
                                    <div className="border border-dashed border-[#404040] rounded-[8px] flex items-center justify-center py-5 bg-[#262626]">
                                        <Upload className="w-5 h-5 text-[#525252] mr-2" />
                                        <span className="text-[#a1a1a1] text-[12px]">Upload</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {categoryAdded && (
                        <div className="bg-[rgba(255,105,0,0.1)] border border-[rgba(255,105,0,0.3)] rounded-[10px] px-4 py-3">
                            <p className="text-[#ff8904] text-[14px]">
                                Category added. Now add the machine part.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-[#262626] px-6 py-4 flex justify-end gap-3 shrink-0">
                    {/* <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={addingCategory || !machineCategory.trim()}
                        className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[14px] font-medium h-10 px-5 rounded-[10px]"
                    >
                        {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Category"}
                    </Button> */}
                    <Button
                        type="button"
                        onClick={handleAddMachinePart}
                        disabled={addingMachine || !machineName.trim()}
                        className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[14px] font-medium h-10 px-5 rounded-[10px]"
                    >
                        {addingMachine ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Machine Part"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
