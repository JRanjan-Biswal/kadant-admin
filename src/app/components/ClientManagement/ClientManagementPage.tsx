"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { HiOutlineSearch, HiOutlineLocationMarker } from "react-icons/hi";
import { FaPlus } from "react-icons/fa";
import { BsBuilding } from "react-icons/bs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AddCustomerForm from "./AddCustomerForm";
import ViewCustomerDetails from "./ViewCustomerDetails";

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

    // Ensure component is mounted before running client-side effects
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Trigger animation when switching between views
    useEffect(() => {
        if (isMounted) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [showAddForm, selectedClientForView, isMounted]);

    // Extract unique regions from clients
    const regions = useMemo(() => {
        const regionSet = new Set<string>();
        clients.forEach((client) => {
            if (client.region) {
                regionSet.add(client.region);
            }
        });
        return Array.from(regionSet).sort();
    }, [clients]);

    // Get customers filtered by selected region
    const customersByRegion = useMemo(() => {
        if (!selectedRegion) return [];
        
        const customerSet = new Set<string>();
        clients.forEach((client) => {
            if (client.region === selectedRegion && client.customer) {
                customerSet.add(client.customer);
            }
        });
        return Array.from(customerSet).sort();
    }, [clients, selectedRegion]);

    // Filter clients based on search, region, and customer
    const filteredClients = useMemo(() => {
        let filtered = clients;

        // Filter by region
        if (selectedRegion) {
            filtered = filtered.filter((client) => client.region === selectedRegion);
        }

        // Filter by customer
        if (selectedCustomer) {
            filtered = filtered.filter((client) => client.customer === selectedCustomer);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((client) =>
                client.name?.toLowerCase().includes(query) ||
                client.location?.address?.toLowerCase().includes(query) ||
                client.endProduct?.toLowerCase().includes(query) ||
                client.region?.toLowerCase().includes(query) ||
                client.customer?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [clients, searchQuery, selectedRegion, selectedCustomer]);

    // Auto-fill region and customer when search matches a client (only after mount)
    useEffect(() => {
        if (!isMounted) return;
        
        if (searchQuery.trim() && filteredClients.length === 1) {
            const matchedClient = filteredClients[0];
            if (matchedClient.region && matchedClient.region !== selectedRegion) {
                setSelectedRegion(matchedClient.region);
            }
            if (matchedClient.customer && matchedClient.customer !== selectedCustomer) {
                setSelectedCustomer(matchedClient.customer);
            }
        }
    }, [searchQuery, filteredClients, selectedRegion, selectedCustomer, isMounted]);

    // Reset customer when region changes (only after mount)
    useEffect(() => {
        if (!isMounted) return;
        
        if (selectedRegion && selectedCustomer) {
            // Check if selected customer exists in the new region
            const customerExists = customersByRegion.includes(selectedCustomer);
            if (!customerExists) {
                setSelectedCustomer("");
            }
        }
    }, [selectedRegion, selectedCustomer, customersByRegion, isMounted]);

    const handleViewClient = (client: Client) => {
        setSelectedClientForView(client);
    };

    const handleNavigateToOverview = (clientId: string) => {
        router.push(`/${clientId}/client-overview`);
    };

    const handleAddCustomer = () => {
        setShowAddForm(true);
    };

    const handleBackToList = () => {
        setShowAddForm(false);
        setSelectedClientForView(null);
    };

    // Extract unique regions for the form
    const existingRegions = useMemo(() => {
        const regionSet = new Set<string>();
        clients.forEach((client) => {
            if (client.region) {
                regionSet.add(client.region);
            }
        });
        return Array.from(regionSet).sort();
    }, [clients]);

    // Get owner name from client
    const getOwnerName = (client: Client) => {
        if (typeof client.clientOwnership === 'object' && client.clientOwnership) {
            return client.clientOwnership.name || "N/A";
        }
        return "N/A";
    };

    // Show view customer details if a client is selected for viewing
    if (selectedClientForView) {
        return (
            <div 
                className={`min-h-screen ${isAnimating ? 'animate-fadeIn' : ''}`}
            >
                <ViewCustomerDetails client={selectedClientForView} onBack={handleBackToList} />
            </div>
        );
    }

    // Show form if showAddForm is true
    if (showAddForm) {
        return (
            <div 
                className={`min-h-screen ${isAnimating ? 'animate-fadeIn' : ''}`}
            >
                <AddCustomerForm onBack={handleBackToList} existingRegions={existingRegions} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#0a0a0a] p-6 ${isAnimating ? 'animate-fadeIn' : ''}`}>
            <div className="flex flex-col gap-3">
                {/* Header Section */}
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
                        onClick={handleAddCustomer}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-4 py-2 h-auto flex items-center gap-2"
                    >
                        <FaPlus className="w-4 h-4" />
                        <span className="text-base">Add New Customer</span>
                    </Button>
                </div>

                {/* Filter Section */}
                <div className="bg-[#171717] border border-[#404040] rounded-[8px] p-6 flex gap-6">
                    {/* Select Region */}
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
                                    <SelectValue placeholder="Search region" />
                                </div>
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
                    </div>

                    {/* Select Customer */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#a1a1a1] text-sm leading-5">Select Customer</label>
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                            disabled={!selectedRegion}
                        >
                            <SelectTrigger className="bg-[#262626] border-[#404040] rounded-[10px] h-[50px] px-4 text-[#525252] text-base hover:border-[#404040] focus:border-[#d45815] disabled:opacity-50">
                                <div className="flex items-center gap-2">
                                    <BsBuilding className="w-5 h-5 text-[#525252]" />
                                    <SelectValue placeholder={selectedRegion ? "Search customer" : "Select region first"} />
                                </div>
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
                    </div>

                    {/* Search Customer */}
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[#a1a1a1] text-sm leading-5">Search Customer</label>
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#525252]" />
                            <input
                                type="text"
                                placeholder="Search by company name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#262626] border border-[#404040] rounded-[10px] h-[50px] pl-12 pr-4 text-white text-base placeholder:text-[#525252] outline-none focus:border-[#d45815] transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Overview Cards */}
                {filteredClients.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {filteredClients.map((client) => (
                            <div
                                key={client._id}
                                className="bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="bg-[#262626] border-b border-[#262626] h-[73px] flex items-center justify-between px-6">
                                    <h2 className="text-white text-xl leading-7 font-normal">Business Overview</h2>
                                    <Button
                                        onClick={() => handleViewClient(client)}
                                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-6 py-2 h-auto text-base"
                                    >
                                        Show More Detail
                                    </Button>
                                </div>

                                {/* Card Content */}
                                <div className="p-6 pb-3 flex items-center justify-between">
                                    {/* Company Name */}
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Company Name</p>
                                        <button
                                            onClick={() => handleNavigateToOverview(client._id)}
                                            className="text-[#d45815] text-lg leading-7 font-normal text-left hover:text-[#d45815]/80 transition-colors cursor-pointer"
                                        >
                                            {client.name}
                                        </button>
                                    </div>

                                    {/* Location */}
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Location</p>
                                        <div className="text-white text-base leading-6">
                                            {client.location?.address ? (
                                                client.location.address.split(',').map((part, idx) => (
                                                    <p key={idx} className="mb-0">{part.trim()}</p>
                                                ))
                                            ) : (
                                                <p className="mb-0">N/A</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* End Product */}
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">End Product</p>
                                        <p className="text-white text-base leading-6">
                                            {client.endProduct || "N/A"}
                                        </p>
                                    </div>

                                    {/* Owner */}
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Owner</p>
                                        <p className="text-white text-base leading-6">
                                            {getOwnerName(client)}
                                        </p>
                                    </div>

                                    {/* Capacity */}
                                    <div className="flex flex-col gap-2 w-[203px]">
                                        <p className="text-[#737373] text-sm leading-5">Capacity</p>
                                        <p className="text-white text-base leading-6">
                                            {client.capacity || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-[#171717] border border-[#262626] rounded-[10px] h-[186px] flex flex-col items-center justify-center gap-4">
                        <BsBuilding className="w-12 h-12 text-[#737373]" />
                        <p className="text-[#a1a1a1] text-base leading-6 text-center">
                            Select a customer to view business overview details
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
