"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Order } from "@/types/order";
import { Textarea } from "@/components/ui/textarea";

interface OrderCreateProps {
    clientID: string;
    onCreate?: () => void;
}

export default function OrderCreate({ clientID, onCreate }: OrderCreateProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [orderDetails, setOrderDetails] = useState<Order>({
        orderNumber: "",
        type: "",
        rotor: "",
        installedDate: "",
        replacedDate: "",
        runningHr: 0,
        remarks: "",
    });

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const handleOrderDetailsChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOrderDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const updatedData = orderDetails;
        try {
            setIsLoading(true);

            const response = await fetch(`/api/clients/${clientID}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();
            setOrderDetails({
                orderNumber: "",
                type: "",
                rotor: "",
                installedDate: "",
                replacedDate: "",
                runningHr: 0,
                remarks: "",
            });
            toast.success("Order created successfully");
            setIsOpen(false);
            router.refresh();
            onCreate?.();
        } catch (error) {
            console.error("Error submitting data:", error);
            toast.error("Failed to create the order");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={isReadOnly} variant="ghost" className="text-base-4 cursor-pointer"><FaPlus className="ml-2" /> Create Order</Button>
            </DialogTrigger>
            <DialogContent className="w-[55%] sm:w-[55%] sm:max-w-[55%]" showCloseButton={true}>
                <DialogHeader>
                    <DialogTitle>Create Order</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4 mt-[20px]">
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Order Number</Label>
                        <Input
                            type="text"
                            name="orderNumber"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.orderNumber || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Order Number"
                        />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Type</Label>
                        <Input
                            type="text"
                            name="type"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.type || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Type"
                        />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Rotor</Label>
                        <Input
                            type="text"
                            name="rotor"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.rotor || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Rotor"
                        />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Installed Date</Label>
                        <Input
                            type="date"
                            name="installedDate"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.installedDate || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Installed Date"
                        />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Replaced Date</Label>
                        <Input
                            type="date"
                            name="replacedDate"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.replacedDate || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Replaced Date"
                        />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-base-4 mb-[10px]">Running Hr</Label>
                        <Input
                            type="number"
                            min={0}
                            name="runningHr"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.runningHr || ''}
                            className="h-12 rounded-sm border-base-2 border"
                            placeholder="Running Hr"
                        />
                    </div>
                    <div className="col-span-3">
                        <Label className="text-base-4 mb-[10px]">Remarks</Label>
                        <Textarea
                            name="remarks"
                            onChange={handleOrderDetailsChange}
                            value={orderDetails?.remarks || ''}
                            className="h-24 rounded-sm border-base-2 border"
                            placeholder="Remarks"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            className="w-full bg-base-4 text-white uppercase font-semibold cursor-pointer w-[250px]"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}