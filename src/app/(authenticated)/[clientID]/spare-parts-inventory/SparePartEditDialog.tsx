'use client';

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventorySparePart } from "@/actions/spare-parts-inventory";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sparePart: InventorySparePart | null;
    onSave: (data: {
        catalog: {
            name: string;
            klValue: string;
            lifetimeText: string;
            itemOnSpareSketch: string;
            deliveryTimeText: string;
            unitPriceNew: number;
            priceRepairPerPc: number;
        };
        client: {
            clientItemNumber: string;
            qtySelected: number;
            stockQuantity: number;
            nbNew: number;
            nbRepair: number;
            lastOrderRefKL: string;
            lastOrderRefClient: string;
        };
    }) => Promise<void>;
}

const parseDeliveryWeeks = (dt: { value: number; unit: string } | undefined) =>
    dt && dt.value ? `${dt.value} ${dt.unit}` : "";

export default function SparePartEditDialog({ open, onOpenChange, sparePart, onSave }: Props) {
    const [form, setForm] = useState({
        name: "",
        klValue: "",
        lifetimeText: "",
        itemOnSpareSketch: "",
        deliveryTimeText: "",
        unitPriceNew: 0,
        priceRepairPerPc: 0,
        clientItemNumber: "",
        qtySelected: 0,
        stockQuantity: 0,
        nbNew: 0,
        nbRepair: 0,
        lastOrderRefKL: "",
        lastOrderRefClient: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && sparePart) {
            setForm({
                name: sparePart.name || "",
                klValue: sparePart.klValue || "",
                lifetimeText: sparePart.lifetimeText || "",
                itemOnSpareSketch: sparePart.itemOnSpareSketch || "",
                deliveryTimeText: parseDeliveryWeeks(sparePart.deliveryTime),
                unitPriceNew: sparePart.unitPriceNew?.value || 0,
                priceRepairPerPc: sparePart.priceRepairPerPc?.value || 0,
                clientItemNumber: sparePart.clientMachineSparePart?.clientItemNumber || "",
                qtySelected: sparePart.clientMachineSparePart?.qtySelected || 0,
                stockQuantity: sparePart.clientMachineSparePart?.stockQuantity || 0,
                nbNew: sparePart.clientMachineSparePart?.nbNew || 0,
                nbRepair: sparePart.clientMachineSparePart?.nbRepair || 0,
                lastOrderRefKL: sparePart.clientMachineSparePart?.lastOrderRefKL || "",
                lastOrderRefClient: sparePart.clientMachineSparePart?.lastOrderRefClient || "",
            });
        }
    }, [open, sparePart]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                catalog: {
                    name: form.name.trim(),
                    klValue: form.klValue.trim().toUpperCase(),
                    lifetimeText: form.lifetimeText.trim(),
                    itemOnSpareSketch: form.itemOnSpareSketch.trim(),
                    deliveryTimeText: form.deliveryTimeText.trim(),
                    unitPriceNew: Number(form.unitPriceNew) || 0,
                    priceRepairPerPc: Number(form.priceRepairPerPc) || 0,
                },
                client: {
                    clientItemNumber: form.clientItemNumber.trim(),
                    qtySelected: Number(form.qtySelected) || 0,
                    stockQuantity: Number(form.stockQuantity) || 0,
                    nbNew: Number(form.nbNew) || 0,
                    nbRepair: Number(form.nbRepair) || 0,
                    lastOrderRefKL: form.lastOrderRefKL.trim(),
                    lastOrderRefClient: form.lastOrderRefClient.trim(),
                },
            });
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    if (!sparePart) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#ffffff] border-[#607797] max-w-[760px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">Edit spare part</DialogTitle>
                    <p className="text-sm text-[#6b7280]">
                        Catalog fields apply to all clients. Inventory fields are specific to this client.
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                    <Field label="Name">
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </Field>
                    <Field label="KL Code">
                        <Input
                            value={form.klValue}
                            onChange={(e) => setForm({ ...form, klValue: e.target.value })}
                        />
                    </Field>
                    <Field label="Lifetime (e.g. '3 Months', '1 to 2 Years')">
                        <Input
                            value={form.lifetimeText}
                            onChange={(e) => setForm({ ...form, lifetimeText: e.target.value })}
                            placeholder="3 Months"
                        />
                    </Field>
                    <Field label="Delivery time (e.g. '22 weeks')">
                        <Input
                            value={form.deliveryTimeText}
                            onChange={(e) => setForm({ ...form, deliveryTimeText: e.target.value })}
                            placeholder="22 weeks"
                        />
                    </Field>
                    <Field label="Item on spare sketch">
                        <Input
                            value={form.itemOnSpareSketch}
                            onChange={(e) => setForm({ ...form, itemOnSpareSketch: e.target.value })}
                        />
                    </Field>
                    <Field label="Unit price (new)">
                        <Input
                            type="number"
                            value={form.unitPriceNew}
                            onChange={(e) => setForm({ ...form, unitPriceNew: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Repair price / pc">
                        <Input
                            type="number"
                            value={form.priceRepairPerPc}
                            onChange={(e) => setForm({ ...form, priceRepairPerPc: Number(e.target.value) })}
                        />
                    </Field>

                    <div className="col-span-2 border-t border-[#607797] mt-2 pt-3">
                        <p className="text-xs uppercase tracking-wider text-[#6b7280]">
                            Per-client inventory
                        </p>
                    </div>

                    <Field label="Client item N°">
                        <Input
                            value={form.clientItemNumber}
                            onChange={(e) => setForm({ ...form, clientItemNumber: e.target.value })}
                        />
                    </Field>
                    <Field label="Qty selected">
                        <Input
                            type="number"
                            value={form.qtySelected}
                            onChange={(e) => setForm({ ...form, qtySelected: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Stock quantity">
                        <Input
                            type="number"
                            value={form.stockQuantity}
                            onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Nb new (yearly)">
                        <Input
                            type="number"
                            value={form.nbNew}
                            onChange={(e) => setForm({ ...form, nbNew: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Nb repair (yearly)">
                        <Input
                            type="number"
                            value={form.nbRepair}
                            onChange={(e) => setForm({ ...form, nbRepair: Number(e.target.value) })}
                        />
                    </Field>
                    <Field label="Last order ref (KL)">
                        <Input
                            value={form.lastOrderRefKL}
                            onChange={(e) => setForm({ ...form, lastOrderRefKL: e.target.value })}
                        />
                    </Field>
                    <Field label="Last order ref (client)">
                        <Input
                            value={form.lastOrderRefClient}
                            onChange={(e) => setForm({ ...form, lastOrderRefClient: e.target.value })}
                        />
                    </Field>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#d45815] hover:bg-[#b8480f]"
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-[#6b7280] text-xs">{label}</Label>
            {children}
        </div>
    );
}
