'use client';

import { Order } from "@/types/order";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import OrderCreate from "@/app/components/Modals/OrderCreate";
import PagePrint from "@/app/components/PagePrint";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrderHistoryClientProps {
    clientID: string;
}

export default function OrderHistoryClient({ clientID }: OrderHistoryClientProps) {
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchOrders = async () => {
        const response = await fetch(`/api/clients/${clientID}/orders`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const data = await response.json();
        setOrders(data);
    }

    const handleDeleteOrder = async (orderId: string) => {
        if (!orderId) {
            return;
        }

        const confirm = window.confirm("Are you sure you want to delete this order?");
        if (!confirm) {
            return;
        }

        const response = await fetch(`/api/clients/${clientID}/orders/${orderId}`, {
            method: "DELETE",
        });
        if (response.ok) {
            toast.success("Order deleted successfully");
            fetchOrders();
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="relative mt-4">
            <div className="flex flex-row items-center justify-between border-b pb-4 px-4">
                <div className="text-left">
                    <h1 className="text-2xl text-base-4 font-bold">Installation & Order History</h1>
                </div>
                <div className="text-right">
                    <OrderCreate clientID={clientID} onCreate={fetchOrders} />
                    <PagePrint />
                </div>
            </div>

            <div className="block pb-4 px-4">
                <Table className="mt-4">
                    <TableHeader className="text-base-4">
                        <TableRow>
                            <TableHead className="font-semibold">Order No.</TableHead>
                            <TableHead className="text-center font-semibold">Type</TableHead>
                            <TableHead className="text-center font-semibold">Rotor</TableHead>
                            <TableHead className="text-center font-semibold">Installed Date</TableHead>
                            <TableHead className="text-center font-semibold">Replaced Date</TableHead>
                            <TableHead className="text-center font-semibold">Running Hrs</TableHead>
                            <TableHead className="text-left font-semibold">Remarks</TableHead>
                            <TableHead className="text-left font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order: Order) => (
                            <TableRow key={order._id}>
                                <TableCell className="font-medium">{order.orderNumber || "-"}</TableCell>
                                <TableCell className="text-center">{order.type || "-"}</TableCell>
                                <TableCell className="text-center">{order.rotor || "-"}</TableCell>
                                <TableCell className="text-center">{order.installedDate ? new Date(order.installedDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell className="text-center">{order.replacedDate ? new Date(order.replacedDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell className="text-center">{order.runningHr || "-"}</TableCell>
                                <TableCell className="text-left">{order.remarks || "-"}</TableCell>
                                <TableCell className="text-left">
                                    <Button variant="outline" onClick={() => handleDeleteOrder(order._id || "")} className="cursor-pointer bg-red-500 text-white" size={"icon"}>
                                        <Trash2 className="w-4 h-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}