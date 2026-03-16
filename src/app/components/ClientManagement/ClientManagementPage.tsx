"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { HiOutlineSearch, HiOutlineLocationMarker } from "react-icons/hi";
import { FaPlus } from "react-icons/fa";
import { BsBuilding } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AddCustomerForm from "./AddCustomerForm";
import ViewCustomerDetails from "./ViewCustomerDetails";
import { searchClients } from "@/actions/search-clients";

interface ClientManagementPageProps {
    clients: Client[];
    total: number;
}

export default function ClientManagementPage({ clients }: ClientManagementPageProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedClientForView, setSelectedClientForView] = useState<Client | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [displayedClients, setDisplayedClients] = useState<Client[]>(clients);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (isMounted) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [showAddForm, selectedClientForView, isMounted]);

    // Derive dropdown options from the full SSR client list (always reflects all available values)
    const regions = useMemo(() => {
        const regionSet = new Set<string>();
        clients.forEach((c) => { if (c.region) regionSet.add(c.region); });
        return Array.from(regionSet).sort();
    }, [clients]);

    const customersByRegion = useMemo(() => {
        const customerSet = new Set<string>();
        clients.forEach((c) => {
            if (!selectedRegion || c.region === selectedRegion) {
                // Fall back to client name when customer field is unset (legacy records)
                const label = c.customer || c.name;
                if (label) customerSet.add(label);
            }
        });
        return Array.from(customerSet).sort();
    }, [clients, selectedRegion]);

    const existingRegions = regions;

    // Fetch from API whenever any filter changes; fall back to SSR list when all filters are cleared
    const runSearch = useCallback(async (q: string, region: string, customer: string) => {
        if (!q.trim() && !region && !customer) {
            setDisplayedClients(clients);
            return;
        }
        setIsSearching(true);
        try {
            const result = await searchClients(q, region, customer);
            setDisplayedClients(result.clients);
        } finally {
            setIsSearching(false);
        }
    }, [clients]);

    useEffect(() => {
        if (!isMounted) return;
        const timer = setTimeout(() => {
            runSearch(searchQuery, selectedRegion, selectedCustomer);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedRegion, selectedCustomer, isMounted, runSearch]);

    // Reset customer selection when the chosen customer no longer exists in the new region
    useEffect(() => {
        if (!isMounted) return;
        if (selectedRegion && selectedCustomer && !customersByRegion.includes(selectedCustomer)) {
            setSelectedCustomer("");
        }
    }, [selectedRegion, selectedCustomer, customersByRegion, isMounted]);

    const getOwnerName = (client: Client) => {
        if (typeof client.clientOwnership === "object" && client.clientOwnership) {
            return client.clientOwnership.name || "N/A";
        }
        return "N/A";
    };

    if (selectedClientForView) {
        return (
            <div className={`min-h-screen ${isAnimating ? "animate-fadeIn" : ""}`}>
                <ViewCustomerDetails client={selectedClientForView} onBack={() => { setShowAddForm(false); setSelectedClientForView(null); }} />
            </div>
        );
    }

    if (showAddForm) {
        return (
            <div className={`min-h-screen ${isAnimating ? "animate-fadeIn" : ""}`}>
                <AddCustomerForm onBack={() => { setShowAddForm(false); setSelectedClientForView(null); }} existingRegions={existingRegions} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#0a0a0a] p-6 ${isAnimating ? "animate-fadeIn" : ""}`}>
            <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between h-[70px]">
                    <div className="flex-1">
                        <h1 className="text-[#f3f4f6] text-[28px] leading-[42px] font-normal">
                            Client Management Portal
                        </h1>
                        <p className="text-[#a1a1a1] text-base leading-6 mt-0">
                            Manage all your client business accounts at one place
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-4 py-2 h-auto flex items-center gap-2"
                    >
                        <FaPlus className="w-4 h-4" />
                        <span className="text-base">Add New Customer</span>
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-[#171717] border border-[#404040] rounded-[8px] p-6 flex gap-6">
                    {/* Region */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#a1a1a1] text-sm leading-5">Select Region</label>
                        <Select
                            value={selectedRegion || "all"}
                            onValueChange={(value) => {
                                setSelectedRegion(value === "all" ? "" : value);
                                setSelectedCustomer("");
                            }}
                        >
                            <SelectTrigger className="bg-[#262626] border-[#404040] rounded-[10px] h-[50px] px-4 text-[#525252] text-base hover:border-[#404040] focus:border-[#d45815]">
                                <div className="flex items-center gap-2">
                                    <HiOutlineLocationMarker className="w-5 h-5 text-[#525252]" />
                                    <SelectValue placeholder="Select region" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#262626] border-[#404040]">
                                <SelectItem value="all" className="text-white hover:bg-[#404040] cursor-pointer">
                                    All Regions
                                </SelectItem>
                                {regions.map((region) => (
                                    <SelectItem key={region} value={region} className="text-white hover:bg-[#404040] cursor-pointer">
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Customer */}
                    <div className="flex-[1.6] flex flex-col gap-2">
                        <label className="text-[#a1a1a1] text-sm leading-5">Select Customer</label>
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="bg-[#262626] border-[#404040] rounded-[10px] h-[50px] px-4 text-[#525252] text-base hover:border-[#404040] focus:border-[#d45815]">
                                <div className="flex items-center gap-2">
                                    <BsBuilding className="w-5 h-5 text-[#525252]" />
                                    <SelectValue placeholder="Select customer" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#262626] border-[#404040]">
                                <SelectItem value="all" className="text-white hover:bg-[#404040] cursor-pointer">
                                    All Customers
                                </SelectItem>
                                {customersByRegion.map((customer) => (
                                    <SelectItem key={customer} value={customer} className="text-white hover:bg-[#404040] cursor-pointer">
                                        {customer}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#a1a1a1] text-sm leading-5">Search Customer</label>
                        <div className="relative">
                            {isSearching ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d45815] animate-spin" />
                            ) : (
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#525252]" />
                            )}
                            <input
                                type="text"
                                placeholder="Search by name, region, product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#262626] border border-[#404040] rounded-[10px] h-[50px] pl-12 pr-4 text-white text-base placeholder:text-[#525252] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                {displayedClients.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {displayedClients.map((client) => (
                            <div key={client._id} className="bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                                <div className="bg-[#262626] border-b border-[#262626] h-[73px] flex items-center justify-between px-6">
                                    <h2 className="text-white text-xl leading-7 font-normal">Business Overview</h2>
                                    <Button
                                        onClick={() => setSelectedClientForView(client)}
                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-6 py-2 h-auto text-base"
                                    >
                                        Show More Detail
                                    </Button>
                                </div>
                                <div className="p-6 pb-3 flex items-center justify-between">
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Company Name</p>
                                        <button
                                            onClick={() => router.push(`/${client._id}/client-overview`)}
                                            className="text-[#d45815] text-lg leading-7 font-normal text-left hover:text-[#d45815]/80 transition-colors cursor-pointer"
                                        >
                                            {client.name}
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Location</p>
                                        <div className="text-white text-base leading-6">
                                            {client.location?.address ? (
                                                client.location.address.split(",").map((part, idx) => (
                                                    <p key={idx} className="mb-0">{part.trim()}</p>
                                                ))
                                            ) : (
                                                <p className="mb-0">N/A</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">End Product</p>
                                        <p className="text-white text-base leading-6">{client.endProduct || "N/A"}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Owner</p>
                                        <p className="text-white text-base leading-6">{getOwnerName(client)}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Capacity</p>
                                        <p className="text-white text-base leading-6">{client.capacity || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#171717] border border-[#262626] rounded-[10px] h-[186px] flex flex-col items-center justify-center gap-4">
                        <BsBuilding className="w-12 h-12 text-[#737373]" />
                        <p className="text-[#a1a1a1] text-base leading-6 text-center">
                            {isSearching ? "Searching..." : "No clients found"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
