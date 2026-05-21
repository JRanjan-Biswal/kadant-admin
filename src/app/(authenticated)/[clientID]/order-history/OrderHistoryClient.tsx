'use client';

import { Order } from "@/types/order";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import OrderCreate from "@/app/components/Modals/OrderCreate";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Calendar, User, ClipboardList, Wrench, CalendarClock } from "lucide-react";
import { toast } from "sonner";



// ─── Helpers ─────────────────────────────────────────────────────────────────

// Canonical service types — kept in sync with machine-health RequestServiceModal
// and admin OrderCreate. If you add a type here, update both.
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    "General Maintenance": { bg: "bg-orange-500/20", text: "text-orange-700" },
    "Order New": { bg: "bg-green-500/20", text: "text-green-700" },
    "Rebuild": { bg: "bg-sky-500/20", text: "text-sky-700" },
};

const STATUS_OPTIONS = [
    "pending",
    "ordered",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-500/20", text: "text-yellow-700" },
    ordered: { bg: "bg-blue-500/20", text: "text-blue-700" },
    shipped: { bg: "bg-purple-500/20", text: "text-purple-700" },
    delivered: { bg: "bg-emerald-500/20", text: "text-emerald-700" },
    completed: { bg: "bg-green-500/20", text: "text-green-700" },
    cancelled: { bg: "bg-red-500/20", text: "text-red-700" },
    // Legacy/UI fallbacks
    Completed: { bg: "bg-green-500/20", text: "text-green-700" },
    Scheduled: { bg: "bg-orange-500/20", text: "text-orange-700" },
    Pending: { bg: "bg-yellow-500/20", text: "text-yellow-700" },
};

const isServiceRequest = (orderNumber: string) =>
    orderNumber.startsWith("SR-");

const isUpcoming = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
};

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

// ─── Component ───────────────────────────────────────────────────────────────

interface OrderHistoryClientProps {
    clientID: string;
}

export default function OrderHistoryClient({ clientID }: OrderHistoryClientProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch(`/api/clients/${clientID}/orders`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch {
            // Keep current state on error
        }
    }, [clientID]);

    const handleDeleteOrder = async (orderId: string) => {
        if (!orderId) return;
        const confirm = window.confirm("Are you sure you want to delete this order?");
        if (!confirm) return;

        const response = await fetch(`/api/clients/${clientID}/orders/${orderId}`, {
            method: "DELETE",
        });
        if (response.ok) {
            toast.success("Order deleted successfully");
            fetchOrders();
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (!orderId) return;
        try {
            const response = await fetch(`/api/clients/${clientID}/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            toast.success(`Status changed to ${newStatus}`);
            fetchOrders();
        } catch (err) {
            console.error("Status change failed:", err);
            toast.error("Failed to update status");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ── Derived unique filter options ──
    const typeOptions = useMemo(
        () => [...new Set(orders.map((o) => o.type).filter(Boolean))],
        [orders]
    );
    const statusOptions = useMemo(
        () => [...new Set(orders.map((o) => o.status).filter(Boolean))],
        [orders]
    );

    // ── Filtered orders ──
    const filteredOrders = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return orders.filter((o) => {
            const matchesSearch =
                !q ||
                o.orderNumber?.toLowerCase().includes(q) ||
                o.machineName?.toLowerCase().includes(q) ||
                o.doneBy?.toLowerCase().includes(q) ||
                o.type?.toLowerCase().includes(q) ||
                o.rotor?.toLowerCase().includes(q);
            const matchesType = typeFilter === "all" || o.type === typeFilter;
            const matchesStatus = statusFilter === "all" || o.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [orders, searchQuery, typeFilter, statusFilter]);

    // ── Summary stats ──
    const totalRecords = orders.length;
    const serviceRequests = orders.filter((o) => isServiceRequest(o.orderNumber)).length;
    const pendingScheduled = orders.filter(
        (o) =>
            o.status === "pending" ||
            o.status === "ordered" ||
            o.status === "shipped" ||
            o.status === "Pending" ||
            o.status === "Scheduled"
    ).length;

    return (
        <div className="flex flex-col gap-6 p-4 pb-8 animate-fadeIn">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] leading-[42px] font-lato font-bold text-[#2D3E5C]">Order History</h1>
                    <p className="text-[16px] leading-[24px] font-lato font-normal text-[#4b5563] mt-1">
                        Complete order and service request tracking
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <OrderCreate clientID={clientID} onCreate={fetchOrders} />
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    label="Total Records"
                    value={totalRecords}
                    icon={<ClipboardList className="w-6 h-6 text-orange" />}
                />
                <SummaryCard
                    label="Service Requests"
                    value={serviceRequests}
                    icon={<Wrench className="w-6 h-6 text-orange" />}
                />
                <SummaryCard
                    label="Pending/Scheduled"
                    value={pendingScheduled}
                    icon={<CalendarClock className="w-6 h-6 text-orange" />}
                />
            </div>

            {/* ── Search & Filters ── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Order ID, Machine, or Person..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[160px] h-11 bg-card border-border">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {typeOptions.map((t) => (
                            <SelectItem key={t} value={t!}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[160px] h-11 bg-card border-border">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {statusOptions.map((s) => (
                            <SelectItem key={s} value={s!}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ── Records Table ── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-[#1f2937]">
                        Records ({filteredOrders.length})
                    </h2>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-[#607797] bg-[#e5e7eb] hover:bg-[#e5e7eb]">
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider pl-5">
                                Order ID
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider">
                                Machine Name
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider">
                                Type
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider">
                                Date
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider">
                                Done By
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider">
                                Status
                            </TableHead>
                            <TableHead className="text-[#374151] font-semibold text-xs uppercase tracking-wider text-center">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-[#4b5563]">
                                    No records found matching your search criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => {
                                const isSR = isServiceRequest(order.orderNumber);
                                const upcoming = isUpcoming(order.date);
                                const typeColor = TYPE_COLORS[order.type] ?? {
                                    bg: "bg-gray-500/20",
                                    text: "text-gray-700",
                                };
                                const statusColor = STATUS_COLORS[order.status ?? ""] ?? {
                                    bg: "bg-gray-500/20",
                                    text: "text-gray-700",
                                };

                                return (
                                    <TableRow
                                        key={order._id}
                                        className={`border-border transition-colors hover:bg-muted/40 ${isSR ? "border-l-2" : ""}`}
                                    >
                                        <TableCell className="font-medium text-[#1f2937] pl-5">
                                            {order.orderNumber || "-"}
                                        </TableCell>
                                        <TableCell className="text-[#374151]">
                                            {order.machineName || order.rotor || "Hydrapulper"}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor.bg} ${typeColor.text}`}
                                            >
                                                {order.type || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-[#374151]">
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                <span>{formatDate(order.date || order.installedDate)}</span>
                                                {upcoming && (
                                                    <span className="text-[10px] font-semibold text-orange-700 bg-orange-500/15 px-1.5 py-0.5 rounded">
                                                        Upcoming
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-[#374151]">
                                                <User className="w-3.5 h-3.5 shrink-0" />
                                                <span>{order.doneBy || "Admin"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={order.status || "pending"}
                                                onValueChange={(v) =>
                                                    handleStatusChange(order._id || "", v)
                                                }
                                            >
                                                <SelectTrigger
                                                    className={`w-[130px] h-8 px-2.5 rounded-full text-xs font-semibold border-0 ${statusColor.bg} ${statusColor.text} focus:ring-1 focus:ring-orange/40`}
                                                >
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <SelectItem key={s} value={s}>
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeleteOrder(order._id || "")}
                                                className="cursor-pointer bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20 hover:text-red-800"
                                                size="icon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// ─── Summary Card Sub-Component ──────────────────────────────────────────────

function SummaryCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 transition-all hover:border-orange/40">
            <div className="flex flex-col gap-1">
                <span className="text-[14px] leading-[20px] font-lato font-medium text-[#4b5563]">{label}</span>
                <span className="text-[30px] leading-[42px] font-lato font-semibold text-[#111827]">{value}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
}
