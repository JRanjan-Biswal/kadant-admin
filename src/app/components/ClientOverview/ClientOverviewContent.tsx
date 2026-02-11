"use client";

import { useState, useMemo, useCallback } from "react";
import { HiOutlineSearch, HiOutlineChevronRight } from "react-icons/hi";
import { FaPlus, FaChevronDown } from "react-icons/fa";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedMachines, setExpandedMachines] = useState<Record<string, boolean>>({});
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
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }));
    }, []);

    const fetchSpareParts = useCallback(async (machineId: string) => {
        if (machineSpareParts[machineId]) {
            // Already fetched, just toggle
            setExpandedMachines((prev) => ({
                ...prev,
                [machineId]: !prev[machineId],
            }));
            return;
        }

        setLoadingSpareParts((prev) => ({ ...prev, [machineId]: true }));
        try {
            const response = await fetch(`/api/products/${currentClientId}/spare-parts/${machineId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch spare parts');
            }

            const data = await response.json();
            
            // Transform spare parts to include status and dates
            const transformedSpareParts: SparePartWithStatus[] = data.map((part: SparePart & { clientMachineSparePart?: ClientMachineSparePart & { lastServiceDate?: string; sparePartInstallationDate?: string; customName?: string } }) => {
                const clientSparePart = part.clientMachineSparePart;
                const totalRunningHours = clientSparePart?.totalRunningHours?.value || 0;
                const lifetimeOfRotor = part.lifeTime?.value || clientSparePart?.lifetimeOfRotor?.value || 0;
                const healthPercentage = lifetimeOfRotor > 0 
                    ? Math.max(0, Math.min(100, ((lifetimeOfRotor - totalRunningHours) / lifetimeOfRotor) * 100))
                    : 100;
                
                let status: "healthy" | "warning" | "critical" = "healthy";
                if (healthPercentage < 20) {
                    status = "critical";
                } else if (healthPercentage < 50) {
                    status = "warning";
                }

                return {
                    ...part,
                    status,
                    healthPercentage: Math.round(healthPercentage),
                    lastServiceDate: clientSparePart?.lastServiceDate || null,
                    sparePartInstallationDate: clientSparePart?.sparePartInstallationDate || null,
                    customName: clientSparePart?.customName || part.name,
                    clientSparePartId: clientSparePart?._id || undefined,
                };
            });

            setMachineSpareParts((prev) => ({
                ...prev,
                [machineId]: transformedSpareParts,
            }));
            setExpandedMachines((prev) => ({
                ...prev,
                [machineId]: true,
            }));
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            toast.error('Failed to fetch spare parts');
        } finally {
            setLoadingSpareParts((prev) => ({ ...prev, [machineId]: false }));
        }
    }, [currentClientId, machineSpareParts]);

    const toggleMachine = useCallback((machineId: string) => {
        fetchSpareParts(machineId);
    }, [fetchSpareParts]);

    const handleSaveSparePart = useCallback(async (updates: {
        customName?: string;
        lastServiceDate?: string;
        sparePartInstallationDate?: string;
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
                const data = await sparePartsResponse.json();
                const transformedSpareParts: SparePartWithStatus[] = data.map((part: SparePart & { clientMachineSparePart?: ClientMachineSparePart & { lastServiceDate?: string; sparePartInstallationDate?: string; customName?: string } }) => {
                    const clientSparePart = part.clientMachineSparePart;
                    const totalRunningHours = clientSparePart?.totalRunningHours?.value || 0;
                    const lifetimeOfRotor = part.lifeTime?.value || clientSparePart?.lifetimeOfRotor?.value || 0;
                    const healthPercentage = lifetimeOfRotor > 0 
                        ? Math.max(0, Math.min(100, ((lifetimeOfRotor - totalRunningHours) / lifetimeOfRotor) * 100))
                        : 100;
                    
                    let status: "healthy" | "warning" | "critical" = "healthy";
                    if (healthPercentage < 20) {
                        status = "critical";
                    } else if (healthPercentage < 50) {
                        status = "warning";
                    }

                    return {
                        ...part,
                        status,
                        healthPercentage: Math.round(healthPercentage),
                        lastServiceDate: clientSparePart?.lastServiceDate || null,
                        sparePartInstallationDate: clientSparePart?.sparePartInstallationDate || null,
                        customName: clientSparePart?.customName || part.name,
                        clientSparePartId: clientSparePart?._id || undefined,
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
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "warning":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "critical":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case "healthy":
                return "Healthy";
            case "warning":
                return "Warning";
            case "critical":
                return "Critical";
            default:
                return "Unknown";
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
                            <Button
                                className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[8px] px-2 py-1 h-auto flex items-center gap-1 text-sm"
                            >
                                <FaPlus className="w-4 h-4" />
                                Add Category
                            </Button>
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

                    {/* Category List */}
                    <div className="flex flex-col">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <div key={category._id || category.name}>
                                    <button
                                        onClick={() => toggleCategory(category.name)}
                                        className="w-full bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-6 py-3 hover:bg-[#1a1a1a] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedCategories[category.name] ? (
                                                <FaChevronDown className="w-4 h-4 text-white" />
                                            ) : (
                                                <HiOutlineChevronRight className="w-4 h-4 text-white" />
                                            )}
                                            <span className="text-white text-lg font-bold leading-[1.2]">
                                                {category.name}
                                            </span>
                                            <div className="bg-[#1a1a1a] rounded px-2 py-0.5">
                                                <span className="text-[#6a7282] text-sm leading-5">
                                                    {category.machines?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Expanded Content - Machine List */}
                                    {expandedCategories[category.name] && (
                                        <div className="bg-[#1a1a1a] border-b border-[#1a1a1a]">
                                            {category.machines?.map((machine) => (
                                                <div key={machine._id}>
                                                    <button
                                                        onClick={() => toggleMachine(machine._id)}
                                                        className="w-full bg-[#1a1a1a] border-b border-[#262626] flex items-center justify-between px-8 py-3 hover:bg-[#262626] transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {expandedMachines[machine._id] ? (
                                                                <FaChevronDown className="w-4 h-4 text-white" />
                                                            ) : (
                                                                <HiOutlineChevronRight className="w-4 h-4 text-white" />
                                                            )}
                                                            <span className="text-white text-base font-medium">
                                                                {machine.name || "N/A"}
                                                            </span>
                                                        </div>
                                                        {loadingSpareParts[machine._id] && (
                                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                        )}
                                                    </button>

                                                    {/* Expanded Spare Parts */}
                                                    {expandedMachines[machine._id] && machineSpareParts[machine._id] && (
                                                        <div className="bg-[#262626] border-b border-[#1a1a1a] px-12 py-4">
                                                            <div className="flex flex-col gap-3">
                                                                {machineSpareParts[machine._id].length > 0 ? (
                                                                    machineSpareParts[machine._id].map((sparePart) => (
                                                                        <div
                                                                            key={sparePart._id}
                                                                            className="bg-[#1a1a1a] border border-[#404040] rounded-[8px] p-4 flex items-center justify-between hover:border-[#d45815] transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-4 flex-1">
                                                                                <div className="flex-1">
                                                                                    <p className="text-white text-sm font-medium mb-1">
                                                                                        {sparePart.customName || sparePart.name}
                                                                                    </p>
                                                                                    <div className="flex items-center gap-4 text-xs text-[#a1a1a1]">
                                                                                        <span>
                                                                                            Status: <Badge className={`${getStatusColor(sparePart.status)} text-xs border`}>
                                                                                                {getStatusText(sparePart.status)}
                                                                                            </Badge>
                                                                                        </span>
                                                                                        {sparePart.lastServiceDate && (
                                                                                            <span>
                                                                                                Last Service: {format(new Date(sparePart.lastServiceDate), "dd MMM yyyy")}
                                                                                            </span>
                                                                                        )}
                                                                                        {sparePart.sparePartInstallationDate && (
                                                                                            <span>
                                                                                                Installed: {format(new Date(sparePart.sparePartInstallationDate), "dd MMM yyyy")}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    onClick={() => setEditingSparePart(sparePart)}
                                                                                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white text-xs px-3 py-1 h-auto"
                                                                                >
                                                                                    Edit Detail
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-[#6a7282] text-sm text-center py-4">
                                                                        No spare parts found
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
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
                    }}
                    onSave={handleSaveSparePart}
                />
            )}
        </div>
    );
}
