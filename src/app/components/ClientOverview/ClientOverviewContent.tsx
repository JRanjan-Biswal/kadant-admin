"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { ClientMachine } from "@/types/machine";
import { Client } from "@/types/client";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";

interface ClientDetailsWithMachines extends Client {
    machines?: ClientMachine[];
}

interface ClientOverviewContentProps {
    clientDetails: ClientDetailsWithMachines;
    allClients: Client[];
    currentClientId: string;
}

interface MachineCategory {
    category: string;
    machines: ClientMachine[];
    count: number;
}

export default function ClientOverviewContent({
    clientDetails,
    allClients,
    currentClientId,
}: ClientOverviewContentProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");

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

    // Group machines by category
    const machineCategories = useMemo(() => {
        if (!clientDetails?.machines) return [];
        
        const categoryMap = new Map<string, ClientMachine[]>();

        clientDetails.machines.forEach((machine) => {
            // Handle category as object (populated) or string
            let categoryName = "Uncategorized";
            if (machine.machine?.category) {
                if (typeof machine.machine.category === 'object' && machine.machine.category.name) {
                    categoryName = machine.machine.category.name;
                } else if (typeof machine.machine.category === 'string') {
                    categoryName = machine.machine.category;
                }
            }
            
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName)!.push(machine);
        });

        const categories: MachineCategory[] = [];
        categoryMap.forEach((machines, category) => {
            categories.push({
                category,
                machines,
                count: machines.length,
            });
        });

        return categories.sort((a, b) => a.category.localeCompare(b.category));
    }, [clientDetails?.machines]);

    // Filter categories by search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return machineCategories;
        
        const query = searchQuery.toLowerCase();
        return machineCategories.filter((cat) =>
            cat.category.toLowerCase().includes(query) 
        ||
            cat.machines.some((m) =>
                m.machine?.name?.toLowerCase().includes(query)
            )
        );
    }, [machineCategories, searchQuery]);

    // Total machines count
    const totalMachines = useMemo(() => {
        return clientDetails?.machines?.length || 0;
    }, [clientDetails?.machines]);

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
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
                        <EditClientDetails client={clientDetails} machines={clientDetails?.machines || []} />
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
                                <div key={category.category}>
                                    <button
                                        onClick={() => toggleCategory(category.category)}
                                        className="w-full bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center justify-between px-6 py-3 hover:bg-[#1a1a1a] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedCategories[category.category] ? (
                                                <FaChevronDown className="w-4 h-4 text-white" />
                                            ) : (
                                                <HiOutlineChevronRight className="w-4 h-4 text-white" />
                                            )}
                                            <span className="text-white text-lg font-bold leading-[1.2]">
                                                {category.category}
                                            </span>
                                            <div className="bg-[#1a1a1a] rounded px-2 py-0.5">
                                                <span className="text-[#6a7282] text-sm leading-5">
                                                    {category.count}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Expanded Content - Machine List */}
                                    {expandedCategories[category.category] && (
                                        <div className="bg-[#1a1a1a] border-b border-[#1a1a1a] px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {category.machines.map((machine) => (
                                                    <div
                                                        key={machine._id}
                                                        className="text-white text-sm py-2 hover:text-[#d45815] transition-colors cursor-pointer"
                                                        onClick={() => router.push(`/${currentClientId}/machines/${machine.machine?._id || machine._id}`)}
                                                    >
                                                        {machine.machine?.name || "N/A"}
                                                    </div>
                                                ))}
                                            </div>
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
        </div>
    );
}
