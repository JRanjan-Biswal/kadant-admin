"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
    fetchInventoryForMachine,
    type InventoryMachine,
} from "@/actions/spare-parts-inventory";
import AddCategoryMachineFlow from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";
import {
    AddMachineFormModal,
    AddSparePartFormModal,
} from "@/app/components/MachineHierarchy/AddEntityModals";

interface InventoryManagementAddModalProps {
    clientID: string;
    machines: InventoryMachine[];
    selectedCategory?: string;
    selectedMachine?: string;
    onSuccess?: () => void;
    children: React.ReactNode;
}

type AddMode = "existing-spare-part" | "existing-category-machine" | "new-hierarchy";

const modeLabels: Array<{ id: AddMode; label: string }> = [
    { id: "existing-spare-part", label: "Existing Machine" },
    { id: "existing-category-machine", label: "Existing Category" },
    { id: "new-hierarchy", label: "New Category" },
];

const buildCategories = (machines: InventoryMachine[]) => {
    const map = new Map<string, string>();
    for (const machine of machines) {
        if (machine.categoryId && machine.categoryName && !map.has(machine.categoryId)) {
            map.set(machine.categoryId, machine.categoryName);
        }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
};

export default function InventoryManagementAddModal({
    clientID,
    machines,
    selectedCategory,
    selectedMachine,
    onSuccess,
    children,
}: InventoryManagementAddModalProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<AddMode>("existing-spare-part");
    const categories = useMemo(() => buildCategories(machines), [machines]);

    const selectedMachineData = useMemo(
        () => machines.find((machine) => machine._id === selectedMachine) || null,
        [machines, selectedMachine]
    );

    const preferredCategory =
        selectedCategory && categories.some((category) => category.id === selectedCategory)
            ? selectedCategory
            : selectedMachineData?.categoryId && categories.some((category) => category.id === selectedMachineData.categoryId)
            ? selectedMachineData.categoryId
            : categories[0]?.id || "";

    const [existingCategoryId, setExistingCategoryId] = useState(preferredCategory);
    const [existingMachineId, setExistingMachineId] = useState("");
    const [machineCategoryId, setMachineCategoryId] = useState(preferredCategory);
    const [sparePartModalOpen, setSparePartModalOpen] = useState(false);
    const [machineModalOpen, setMachineModalOpen] = useState(false);
    const [existingKlValues, setExistingKlValues] = useState<string[]>([]);
    const [loadingKlValues, setLoadingKlValues] = useState(false);

    const machinesForExistingCategory = useMemo(
        () => machines.filter((machine) => machine.categoryId === existingCategoryId),
        [existingCategoryId, machines]
    );

    useEffect(() => {
        if (!open) return;
        setExistingCategoryId(preferredCategory);
        setMachineCategoryId(preferredCategory);
    }, [open, preferredCategory]);

    useEffect(() => {
        if (!open) return;
        if (machinesForExistingCategory.length === 0) {
            setExistingMachineId("");
            return;
        }
        const selectedMachineIsInCategory =
            !!selectedMachine &&
            machinesForExistingCategory.some((machine) => machine._id === selectedMachine);
        setExistingMachineId(
            selectedMachineIsInCategory ? selectedMachine! : machinesForExistingCategory[0]._id
        );
    }, [machinesForExistingCategory, open, selectedMachine]);

    const handleSuccess = useCallback(() => {
        onSuccess?.();
        setOpen(false);
    }, [onSuccess]);

    const openSparePartModal = useCallback(async () => {
        if (!existingMachineId) return;
        setLoadingKlValues(true);
        try {
            const parts = await fetchInventoryForMachine(clientID, existingMachineId);
            setExistingKlValues(parts.map((part) => part.klValue).filter(Boolean));
            setSparePartModalOpen(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load machine spare parts");
        } finally {
            setLoadingKlValues(false);
        }
    }, [clientID, existingMachineId]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent
                    showCloseButton={false}
                    className="bg-white border border-[#96A5BA] rounded-[12px] p-0 w-[min(920px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden"
                >
                    <div className="bg-[#DFE6EC] border-b border-[#607797] flex h-[64px] items-center justify-between px-6">
                        <h2 className="text-gray-900 text-[20px] font-medium">Inventory Management</h2>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="w-8 h-8 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[calc(90vh-64px)] overflow-y-auto p-6">
                        <div className="flex flex-wrap gap-2 border-b border-[#C5D1DC] pb-3">
                            {modeLabels.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setMode(item.id)}
                                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                                        mode === item.id
                                            ? "border-[#d45815] bg-[#fff3ed] text-[#d45815]"
                                            : "border-[#C5D1DC] bg-[#F8FAFC] text-[#607797] hover:text-[#2D3E5C]"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {mode === "existing-spare-part" && (
                            <div className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[13px] text-[#6b7280]">Machine Category</Label>
                                    {categories.length > 0 ? (
                                        <Select value={existingCategoryId} onValueChange={setExistingCategoryId}>
                                            <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="rounded-md border border-dashed border-[#C5D1DC] px-3 py-2 text-sm text-[#6b7280]">
                                            No machine categories linked to this client.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-[13px] text-[#6b7280]">Machine</Label>
                                    {machinesForExistingCategory.length > 0 ? (
                                        <Select value={existingMachineId} onValueChange={setExistingMachineId}>
                                            <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                                <SelectValue placeholder="Select machine" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {machinesForExistingCategory.map((machine) => (
                                                    <SelectItem key={machine._id} value={machine._id}>
                                                        {machine.name}
                                                        {machine.serialNumber ? ` - ${machine.serialNumber}` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="rounded-md border border-dashed border-[#C5D1DC] px-3 py-2 text-sm text-[#6b7280]">
                                            No machines in this category.
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    disabled={!existingMachineId || loadingKlValues}
                                    onClick={openSparePartModal}
                                    className="h-11 bg-[#d45815] text-white hover:bg-[#b8480e]"
                                >
                                    {loadingKlValues ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Add Spare Part
                                </Button>
                            </div>
                        )}

                        {mode === "existing-category-machine" && (
                            <div className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[13px] text-[#6b7280]">Machine Category</Label>
                                    {categories.length > 0 ? (
                                        <Select value={machineCategoryId} onValueChange={setMachineCategoryId}>
                                            <SelectTrigger className="h-11 bg-[#DFE6EC] border-[#C5D1DC] text-[#2D3E5C] rounded-[8px]">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="rounded-md border border-dashed border-[#C5D1DC] px-3 py-2 text-sm text-[#6b7280]">
                                            No machine categories linked to this client.
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    disabled={!machineCategoryId}
                                    onClick={() => setMachineModalOpen(true)}
                                    className="h-11 bg-[#d45815] text-white hover:bg-[#b8480e]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Machine
                                </Button>
                            </div>
                        )}

                        {mode === "new-hierarchy" && (
                            <div className="pt-5">
                                <AddCategoryMachineFlow
                                    compact
                                    clientID={clientID}
                                    onSuccess={onSuccess}
                                    onComplete={handleSuccess}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddSparePartFormModal
                open={sparePartModalOpen}
                onClose={() => setSparePartModalOpen(false)}
                machineId={existingMachineId}
                clientId={clientID}
                existingKlValues={existingKlValues}
                onCreated={() => {
                    setSparePartModalOpen(false);
                    handleSuccess();
                }}
            />

            <AddMachineFormModal
                open={machineModalOpen}
                onClose={() => setMachineModalOpen(false)}
                categoryId={machineCategoryId}
                clientId={clientID}
                onCreated={() => {
                    setMachineModalOpen(false);
                    handleSuccess();
                }}
            />
        </>
    );
}
