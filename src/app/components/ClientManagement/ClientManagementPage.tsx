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
        <div className={`min-h-screen bg-[#ffffff] p-6 ${isAnimating ? "animate-fadeIn" : ""}`}>
            <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between h-[70px]">
                    <div className="flex-1">
                        <h1 className="text-[#2D3E5C] text-[28px] leading-[42px] font-bold">
                            Client Management Portal
                        </h1>
                        <p className="text-[#6b7280] text-base leading-6 mt-0">
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
                <div className="bg-white border border-[#d1d5db] rounded-[8px] p-6 flex gap-6">
                    {/* Region */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#6b7280] text-sm leading-5">Select Region</label>
                        <Select
                            value={selectedRegion || "all"}
                            onValueChange={(value) => {
                                setSelectedRegion(value === "all" ? "" : value);
                                setSelectedCustomer("");
                            }}
                        >
                            <SelectTrigger className="bg-white border-[#d1d5db] rounded-[10px] h-[50px] px-4 text-[#4b5563] text-base hover:border-[#d1d5db] focus:border-[#d45815]">
                                <div className="flex items-center gap-2">
                                    <HiOutlineLocationMarker className="w-5 h-5 text-[#4b5563]" />
                                    <SelectValue placeholder="Select region" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                <SelectItem value="all" className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer">
                                    All Regions
                                </SelectItem>
                                {regions.map((region) => (
                                    <SelectItem key={region} value={region} className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer">
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Customer */}
                    <div className="flex-[1.6] flex flex-col gap-2">
                        <label className="text-[#6b7280] text-sm leading-5">Select Customer</label>
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="bg-white border-[#d1d5db] rounded-[10px] h-[50px] px-4 text-[#4b5563] text-base hover:border-[#d1d5db] focus:border-[#d45815]">
                                <div className="flex items-center gap-2">
                                    <BsBuilding className="w-5 h-5 text-[#4b5563]" />
                                    <SelectValue placeholder="Select customer" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                                <SelectItem value="all" className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer">
                                    All Customers
                                </SelectItem>
                                {customersByRegion.map((customer) => (
                                    <SelectItem key={customer} value={customer} className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer">
                                        {customer}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#6b7280] text-sm leading-5">Search Customer</label>
                        <div className="relative">
                            {isSearching ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d45815] animate-spin" />
                            ) : (
                                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4b5563]" />
                            )}
                            <input
                                type="text"
                                placeholder="Search by name, region, product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-[#d1d5db] rounded-[10px] h-[50px] pl-12 pr-4 text-gray-900 text-base placeholder:text-[#4b5563] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Total count */}
                <p className="text-[#2D3E5C] text-sm font-bold mt-1">
                    Total Clients {displayedClients.length}
                </p>

                {/* Results list */}
                {displayedClients.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {displayedClients.map((client) => (
                            <div
                                key={client._id}
                                className="bg-white border border-[#96A5BA] rounded-[10px] flex items-stretch gap-0 overflow-hidden"
                            >
                                {/* Company Name — highlighted blue-gray strip */}
                                <div className="bg-[#DFE6EC] flex flex-col justify-center gap-0.5 px-5 py-3 min-w-[200px] flex-1">
                                    <p className="text-[#6b7280] text-[13px] leading-5">Company Name</p>
                                    <button
                                        onClick={() => router.push(`/${client._id}/client-overview`)}
                                        className="text-[#2D3E5C] text-[15px] font-bold text-left hover:text-[#d45815] transition-colors cursor-pointer truncate"
                                    >
                                        {client.name}
                                    </button>
                                </div>

                                {/* Remaining fields on white */}
                                <div className="flex items-center gap-6 flex-[3] px-5 py-3 min-w-0">
                                    <div className="flex flex-col gap-0.5 flex-[1.4] min-w-0">
                                        <p className="text-[#6b7280] text-[13px] leading-5">Location</p>
                                        <p className="text-[#2D3E5C] text-[14px] font-medium leading-5 truncate">
                                            {client.location?.address || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <p className="text-[#6b7280] text-[13px] leading-5">End Product</p>
                                        <p className="text-[#2D3E5C] text-[14px] font-medium leading-5 truncate">
                                            {client.endProduct || "N/A"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <p className="text-[#6b7280] text-[13px] leading-5">Owner</p>
                                        <p className="text-[#2D3E5C] text-[14px] font-medium leading-5 truncate">
                                            {getOwnerName(client)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-[90px]">
                                        <p className="text-[#6b7280] text-[13px] leading-5">Capacity</p>
                                        <p className="text-[#2D3E5C] text-[14px] font-medium leading-5 truncate">
                                            {client.capacity || "N/A"}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedClientForView(client)}
                                        className="bg-[#DFE6EC] hover:bg-[#c8d4dc] text-[#2D3E5C] rounded-[10px] px-4 py-2 h-auto text-sm font-medium border border-[#96A5BA] shrink-0"
                                    >
                                        More Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Standing placeholder — always visible. Invites picking a client. */}
                <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[186px] flex flex-col items-center justify-center gap-4 mt-2">
                    <BsBuilding className="w-12 h-12 text-[#6b7280]" />
                    <p className="text-[#6b7280] text-base leading-6 text-center">
                        {isSearching
                            ? "Searching..."
                            : displayedClients.length === 0
                                ? "No clients found"
                                : "Select a customer to view business overview details"}
                    </p>
                </div>
            </div>
        </div>
    );
}
