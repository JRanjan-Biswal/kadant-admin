"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
import { HiOutlineSearch, HiOutlineChevronRight } from "react-icons/hi";
import { FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AddMachineModal from "@/app/components/Modals/AddMachineModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Client } from "@/types/client";
import { Machine, SparePart, ClientMachineSparePart } from "@/types/machine";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";
import EditSparePartModal from "@/app/components/Modals/EditSparePartModal";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Pencil } from "lucide-react";
import { toast } from "sonner";

/** Status logic aligned with machine-health: totalRunningHours > lifeTime → Attention, === → Monitor, else Healthy */
function getSparePartStatusFromHours(
    totalRunningHours: number,
    lifetimeValue: number
): "healthy" | "warning" | "critical" {
    if (totalRunningHours > lifetimeValue) return "critical"; // Attention
    if (totalRunningHours === lifetimeValue) return "warning";  // Monitor
    return "healthy"; // Healthy
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    machines: Machine[];
    isActive?: boolean;
}

interface ClientOverviewContentProps {
    clientDetails: Client;
    allClients: Client[];
    currentClientId: string;
    categories: Category[];
}

interface SparePartWithStatus extends SparePart {
    status?: "healthy" | "warning" | "critical";
    healthPercentage?: number;
    lastServiceDate?: string | null;
    sparePartInstallationDate?: string | null;
    customName?: string;
    clientSparePartId?: string;
    isActive?: boolean;
}

interface MachineSpareParts {
    [machineId: string]: SparePartWithStatus[];
}

export default function ClientOverviewContent({
    clientDetails,
    allClients,
    currentClientId,
    categories,
}: ClientOverviewContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    // Only machine row is accordion; category shows table, machine expands to show spare parts table
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [machineSpareParts, setMachineSpareParts] = useState<MachineSpareParts>({});
    const [loadingSpareParts, setLoadingSpareParts] = useState<Record<string, boolean>>({});
    const [editingSparePart, setEditingSparePart] = useState<SparePartWithStatus | null>(null);

    // Extract unique regions from all clients
    const regions = useMemo(() => {
        const regionSet = new Set<string>();
        allClients.forEach((client) => {
            if (client.region) {
                regionSet.add(client.region);
            }
        });
        return Array.from(regionSet).sort();
    }, [allClients]);

    // Get customers filtered by selected region
    const customersByRegion = useMemo(() => {
        if (!selectedRegion) return [];
        const customerSet = new Set<string>();
        allClients.forEach((client) => {
            if (client.region === selectedRegion && client.customer) {
                customerSet.add(client.customer);
            }
        });
        return Array.from(customerSet).sort();
    }, [allClients, selectedRegion]);

    // Filter categories by search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;

        const query = searchQuery.toLowerCase();
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(query) ||
            cat.machines.some((m) =>
                m.name?.toLowerCase().includes(query)
            )
        );
    }, [categories, searchQuery]);

    // Total machines count
    const totalMachines = useMemo(() => {
        return categories.reduce((sum, cat) => sum + (cat.machines?.length || 0), 0);
    }, [categories]);

    const toggleCategory = useCallback((categoryName: string) => {
        setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
        setExpandedMachine(null);
    }, []);

    const fetchSpareParts = useCallback(async (machineId: string) => {
        if (machineSpareParts[machineId]) {
            setExpandedMachine((prev) => (prev === machineId ? null : machineId));
            return;
        }

        setLoadingSpareParts((prev) => ({ ...prev, [machineId]: true }));
        setExpandedMachine(machineId);
        try {
            const response = await fetch(`/api/products/${currentClientId}/spare-parts/${machineId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch spare parts');
            }

            const responseData = await response.json();
            const data = responseData.spareParts || responseData;

            const transformedSpareParts: SparePartWithStatus[] = data.map((part: SparePart & { clientMachineSparePart?: ClientMachineSparePart & { lastServiceDate?: string; sparePartInstallationDate?: string; customName?: string; isActive?: boolean } }) => {
                const clientSparePart = part.clientMachineSparePart;
                const totalRunningHours = clientSparePart?.totalRunningHours?.value ?? 0;
                const lifetimeValue = part.lifeTime?.value ?? clientSparePart?.lifetimeOfRotor?.value ?? 0;
                const healthPercentage = lifetimeValue > 0
                    ? Math.max(0, Math.min(100, ((lifetimeValue - totalRunningHours) / lifetimeValue) * 100))
                    : 100;
                const status = getSparePartStatusFromHours(totalRunningHours, lifetimeValue);

                return {
                    ...part,
                    status,
                    healthPercentage: Math.round(healthPercentage),
                    lastServiceDate: clientSparePart?.lastServiceDate || null,
                    sparePartInstallationDate: clientSparePart?.sparePartInstallationDate || null,
                    customName: clientSparePart?.customName || part.name,
                    clientSparePartId: clientSparePart?._id || undefined,
                    isActive: clientSparePart?.isActive !== undefined ? clientSparePart.isActive : true,
                };
            });

            setMachineSpareParts((prev) => ({ ...prev, [machineId]: transformedSpareParts }));
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            toast.error('Failed to fetch spare parts');
            setExpandedMachine(null);
        } finally {
            setLoadingSpareParts((prev) => ({ ...prev, [machineId]: false }));
        }
    }, [currentClientId, machineSpareParts]);

    const toggleMachine = useCallback((machineId: string) => {
        if (expandedMachine === machineId) {
            setExpandedMachine(null);
            return;
        }
        fetchSpareParts(machineId);
    }, [fetchSpareParts, expandedMachine]);


    const handleSaveSparePart = useCallback(async (updates: {
        customName?: string;
        lastServiceDate?: string;
        sparePartInstallationDate?: string;
        isActive?: boolean;
    }) => {
        if (!editingSparePart) return;

        const machineId = typeof editingSparePart.machine === 'object'
            ? editingSparePart.machine._id
            : editingSparePart.machine || '';

        try {
            const response = await fetch(`/api/clients/${currentClientId}/machines/${machineId}/spare-parts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sparePartID: editingSparePart._id,
                    ...updates,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update spare part');
            }

            // Refresh spare parts for this machine
            const sparePartsResponse = await fetch(`/api/products/${currentClientId}/spare-parts/${machineId}`);
            if (sparePartsResponse.ok) {
                const responseData = await sparePartsResponse.json();
                // API returns { spareParts, categories } - extract spareParts array
                const data = responseData.spareParts || responseData;
                const transformedSpareParts: SparePartWithStatus[] = data.map((part: SparePart & { clientMachineSparePart?: ClientMachineSparePart & { lastServiceDate?: string; sparePartInstallationDate?: string; customName?: string; isActive?: boolean } }) => {
                    const clientSparePart = part.clientMachineSparePart;
                    const totalRunningHours = clientSparePart?.totalRunningHours?.value ?? 0;
                    const lifetimeValue = part.lifeTime?.value ?? clientSparePart?.lifetimeOfRotor?.value ?? 0;
                    const healthPercentage = lifetimeValue > 0
                        ? Math.max(0, Math.min(100, ((lifetimeValue - totalRunningHours) / lifetimeValue) * 100))
                        : 100;
                    const status = getSparePartStatusFromHours(totalRunningHours, lifetimeValue);

                    return {
                        ...part,
                        status,
                        healthPercentage: Math.round(healthPercentage),
                        lastServiceDate: clientSparePart?.lastServiceDate || null,
                        sparePartInstallationDate: clientSparePart?.sparePartInstallationDate || null,
                        customName: clientSparePart?.customName || part.name,
                        clientSparePartId: clientSparePart?._id || undefined,
                        isActive: clientSparePart?.isActive !== undefined ? clientSparePart.isActive : true,
                    };
                });

                setMachineSpareParts((prev) => ({
                    ...prev,
                    [machineId]: transformedSpareParts,
                }));
            }

            toast.success('Spare part updated successfully');
            setEditingSparePart(null);
        } catch (error) {
            console.error('Error updating spare part:', error);
            toast.error('Failed to update spare part');
        }
    }, [editingSparePart, currentClientId]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "healthy":
                return "bg-[#00a82d]/20 text-[#00a82d] border-[#00a82d]/40";
            case "warning":
                return "bg-[#ff9a00]/20 text-[#ff9a00] border-[#ff9a00]/40";
            case "critical":
                return "bg-[#bf1e21]/20 text-[#bf1e21] border-[#bf1e21]/40";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case "healthy":
                return "Healthy";
            case "warning":
                return "Monitor";
            case "critical":
                return "Attention";
            default:
                return "Unknown";
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle2 className="w-4 h-4 text-[#00a82d] shrink-0" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-[#ff9a00] shrink-0" />;
            case "critical":
                return <XCircle className="w-4 h-4 text-[#bf1e21] shrink-0" />;
            default:
                return <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />;
        }
    };

    // Get owner name
    const ownerName = typeof clientDetails?.clientOwnership === 'object'
        ? clientDetails.clientOwnership.name
        : "N/A";

    // Get last update date
    const lastUpdate = clientDetails?.updatedAt
        ? format(new Date(clientDetails.updatedAt), "dd/MM/yyyy 'At' h:mma")
        : "N/A";

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-6">
            <div className="flex flex-col gap-3">
                {/* Header Section */}
                <div className="h-[70px] flex items-center justify-between">
                    <h1 className="text-[#f3f4f6] text-[28px] leading-[42px] font-normal">
                        Client & Machine Overview
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* Region Dropdown */}
                        <Select
                            value={selectedRegion || "all"}
                            onValueChange={(value) => {
                                setSelectedRegion(value === "all" ? "" : value);
                                setSelectedCustomer("");
                            }}
                        >
                            <SelectTrigger className="bg-[#262626] border-[#404040] rounded-[8px] h-[44px] px-3 text-[#787878] text-base hover:border-[#404040] focus:border-[#d45815] w-[191px]">
                                <SelectValue placeholder="Asia" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#262626] border-[#404040]">
                                <SelectItem
                                    value="all"
                                    className="text-white hover:bg-[#404040] cursor-pointer"
                                >
                                    All Regions
                                </SelectItem>
                                {regions.map((region) => (
                                    <SelectItem
                                        key={region}
                                        value={region}
                                        className="text-white hover:bg-[#404040] cursor-pointer"
                                    >
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Customer Dropdown */}
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                            disabled={!selectedRegion}
                        >
                            <SelectTrigger className="bg-[#262626] border-[#404040] rounded-[8px] h-[44px] px-3 text-[#787878] text-base hover:border-[#404040] focus:border-[#d45815] w-[191px] disabled:opacity-50">
                                <SelectValue placeholder={selectedRegion ? "Customer" : "Select region first"} />
                            </SelectTrigger>
                            <SelectContent className="bg-[#262626] border-[#404040]">
                                {selectedRegion && (
                                    <>
                                        <SelectItem
                                            value="all"
                                            className="text-white hover:bg-[#404040] cursor-pointer"
                                        >
                                            All Customers
                                        </SelectItem>
                                        {customersByRegion.map((customer) => (
                                            <SelectItem
                                                key={customer}
                                                value={customer}
                                                className="text-white hover:bg-[#404040] cursor-pointer"
                                            >
                                                {customer}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        {/* Edit Details Button */}
                        <EditClientDetails client={clientDetails} machines={[]} />
                    </div>
                </div>

                {/* Info Cards Row */}
                <div className="flex gap-[15px]">
                    {/* Company Name */}
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#4a5565] text-sm leading-5">Company Name</p>
                        <p className="text-[#d45815] text-base font-bold leading-6">
                            {clientDetails?.name || "N/A"}
                        </p>
                    </div>

                    {/* Location */}
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#4a5565] text-sm leading-5">Location</p>
                        <p className="text-white text-base font-bold leading-6 truncate">
                            {clientDetails?.location?.address
                                ? clientDetails.location.address.length > 20
                                    ? `${clientDetails.location.address.substring(0, 20)}...`
                                    : clientDetails.location.address
                                : "N/A"}
                        </p>
                    </div>

                    {/* End Product */}
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] p-4 flex flex-col gap-1 w-[216px] h-[82px]">
                        <p className="text-[#4a5565] text-sm leading-5">End Product</p>
                        <p className="text-white text-base font-bold leading-6">
                            {clientDetails?.endProduct || "N/A"}
                        </p>
                    </div>

                    {/* Owner */}
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#4a5565] text-sm leading-5">Owner</p>
                        <p className="text-white text-base font-bold leading-6">
                            {ownerName}
                        </p>
                    </div>

                    {/* Capacity */}
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] p-4 flex flex-col gap-1 w-[215px] h-[82px]">
                        <p className="text-[#4a5565] text-sm leading-5">Capacity</p>
                        <p className="text-white text-base font-bold leading-6">
                            {clientDetails?.capacity || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Machine Categories Section */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[10px] overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-[#1a1a1a] flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-white text-xl leading-7 font-normal">Total Machines</h2>
                                <div className="bg-[rgba(255,105,0,0.2)] rounded px-2 py-0.5">
                                    <span className="text-[#d45815] text-sm leading-5">
                                        {totalMachines} Units
                                    </span>
                                </div>
                            </div>
                            <AddMachineModal onSuccess={() => router.refresh()}>
                                <Button
                                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] px-2 py-1 h-auto flex items-center gap-1 text-sm"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    Add Category
                                </Button>
                            </AddMachineModal>
                        </div>
                        {/* Search Input */}
                        <div className="relative w-[256px]">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a7282]" />
                            <input
                                type="text"
                                placeholder="Search machines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-[10px] h-[42px] pl-9 pr-4 text-white text-base placeholder:text-[rgba(243,244,246,0.5)] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Category List - single open accordion with smooth animation */}
                    <div className="flex flex-col">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => {
                                const isCategoryOpen = expandedCategory === category.name;
                                return (
                                    <div key={category._id || category.name}>
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(category.name)}
                                            className="w-full bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-6 py-3 hover:bg-[#1a1a1a] transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="transition-transform duration-200 ease-out"
                                                    style={{ transform: isCategoryOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                                                >
                                                    <HiOutlineChevronRight className="w-4 h-4 text-white" />
                                                </span>
                                                <span className="text-white text-[16px] font-normal font-lato leading-[24px]">
                                                    {category.name}
                                                </span>
                                                <div className="bg-[#1a1a1a] rounded px-2 py-0.5">
                                                    <span className="text-[#6a7282] text-sm leading-5">
                                                        {category.machines?.length || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Animated Category content - Machine List */}
                                        <div
                                            className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            style={{ gridTemplateRows: isCategoryOpen ? "1fr" : "0fr" }}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                <div className="bg-[#1a1a1a] border-b border-[#1a1a1a] overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead className="bg-[#171717]">
                                                            <tr className="border-b border-[#262626]">
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider w-16">Sr.No.</th>
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Machine Name</th>
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Current Status</th>
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Last Service on</th>
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Installation Date</th>
                                                                <th className="text-left py-5 px-4 text-[#6a7282] text-xs font-medium uppercase tracking-wider w-auto">Edit Detail</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-[#0D0D0D]">
                                                            {(category.machines ?? []).map((machine, index) => {
                                                                const isMachineOpen = expandedMachine === machine._id;
                                                                const spareParts = machineSpareParts[machine._id] ?? [];
                                                                const isLoading = loadingSpareParts[machine._id];
                                                                return (
                                                                    <Fragment key={machine._id}>
                                                                        <tr
                                                                            onClick={() => toggleMachine(machine._id)}
                                                                            className="border-b border-[#262626] bg-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors cursor-pointer"
                                                                        >
                                                                            <td className="py-3 px-4 text-white text-sm">{index + 1}</td>
                                                                            <td className="py-3 px-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="transition-transform duration-200 ease-out shrink-0" style={{ transform: isMachineOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                                                                                        <HiOutlineChevronRight className="w-4 h-4 text-white" />
                                                                                    </span>
                                                                                    <span className="text-white text-[16px] font-normal">{machine.name || "N/A"}</span>
                                                                                    {isLoading && <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />}
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-3 px-4">
                                                                                <Badge className="bg-[#00a82d]/20 text-[#00a82d] border border-[#00a82d]/40 text-xs rounded-2xl">Active</Badge>
                                                                            </td>
                                                                            <td className="py-3 px-4 text-[#9ca3af] text-sm">—</td>
                                                                            <td className="py-3 px-4 text-[#9ca3af] text-sm">—</td>
                                                                            <td className="py-3 px-4 text-[#6a7282]">—</td>
                                                                        </tr>
                                                                        {isMachineOpen && (
                                                                            <tr className="bg-[#0d0d0d]">
                                                                                <td colSpan={6} className="p-0 border-b border-[#262626]">
                                                                                    <div className="px-0 pb-0">
                                                                                        {spareParts.length > 0 ? (
                                                                                            <table className="w-full border-collapse rounded-none overflow-hidden border border-[#262626]">
                                                                                                <thead>
                                                                                                    <tr className="bg-[#171717] border-b border-[#262626] ">
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider w-12">#</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Spare Part Name</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Health</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Current Status</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Last Service On</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider">Installation Date</th>
                                                                                                        <th className="text-left py-4 px-3 text-[#6a7282] text-xs font-medium uppercase tracking-wider w-auto">Edit Detail</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {spareParts.map((sparePart, spIndex) => (
                                                                                                        <tr key={sparePart._id} className="border-b border-[#262626] bg-[#171717] hover:bg-[#262626]/50 last:border-b-0">
                                                                                                            <td className="py-2 px-3 text-white text-sm">{spIndex + 1}</td>
                                                                                                            <td className="py-2 px-3 text-white text-sm font-medium">{sparePart.customName || sparePart.name}</td>
                                                                                                            <td className="py-2 px-3">
                                                                                                                <div className="flex items-center gap-1.5">
                                                                                                                    {getStatusIcon(sparePart.status)}
                                                                                                                    <Badge className={`${getStatusColor(sparePart.status)} text-xs border font-medium`}>{getStatusText(sparePart.status)}</Badge>
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="py-2 px-3">
                                                                                                                <Badge className={`text-xs border ${sparePart.isActive !== false ? "bg-[#00a82d]/20 text-[#00a82d] border-[#00a82d]/40" : "bg-[#bf1e21]/20 text-[#bf1e21] border-[#bf1e21]/40"}`}>
                                                                                                                    {sparePart.isActive !== false ? "Active" : "Inactive"}
                                                                                                                </Badge>
                                                                                                            </td>
                                                                                                            <td className="py-2 px-3 text-[#9ca3af] text-sm">{sparePart.lastServiceDate ? format(new Date(sparePart.lastServiceDate), "dd MMM yyyy") : "—"}</td>
                                                                                                            <td className="py-2 px-3 text-[#9ca3af] text-sm">{sparePart.sparePartInstallationDate ? format(new Date(sparePart.sparePartInstallationDate), "dd MMM yyyy") : "—"}</td>
                                                                                                            <td className="py-2 px-3">
                                                                                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingSparePart(sparePart); }} className="h-8 w-8 p-0 text-[#6a7282] hover:text-[#d45815] hover:bg-[#d45815]/10">
                                                                                                                    <Pencil className="w-4 h-4" />
                                                                                                                </Button>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        ) : !isLoading ? (
                                                                                            <p className="text-[#6a7282] text-sm py-4">No spare parts found</p>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </Fragment>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <p className="text-[#6a7282] text-sm">No machines found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer - Last Update */}
                    <div className="bg-[#0d0d0d] border-t border-[#1a1a1a] flex items-center justify-end px-6 py-2">
                        <p className="text-[#607797] text-sm leading-6">
                            Last Update On - {lastUpdate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Spare Part Modal */}
            {editingSparePart && (
                <EditSparePartModal
                    open={!!editingSparePart}
                    onOpenChange={(open) => !open && setEditingSparePart(null)}
                    sparePart={{
                        _id: editingSparePart._id,
                        name: editingSparePart.customName || editingSparePart.name,
                        originalName: editingSparePart.name,
                        status: editingSparePart.status || "healthy",
                        healthPercentage: editingSparePart.healthPercentage || 100,
                        lifetimeOfRotor: editingSparePart.lifeTime || { value: 0, unit: "Hrs" },
                        totalRunningHours: editingSparePart.clientMachineSparePart?.totalRunningHours || { value: 0, unit: "Hrs" },
                        lastServiceDate: editingSparePart.lastServiceDate || null,
                        sparePartInstallationDate: editingSparePart.sparePartInstallationDate || null,
                        machineInstallationDate: null,
                        clientSparePartId: editingSparePart.clientSparePartId || null,
                        isActive: editingSparePart.isActive !== false,
                    }}
                    onSave={handleSaveSparePart}
                />
            )}
        </div>
    );
}
