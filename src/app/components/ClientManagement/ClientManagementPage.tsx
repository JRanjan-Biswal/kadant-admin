"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/types/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { HiOutlineSearch, HiOutlineLocationMarker } from "react-icons/hi";
import { FaChevronRight, FaPlus } from "react-icons/fa";
import { BsBuilding } from "react-icons/bs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ClientManagementPageProps {
    clients: Client[];
    total: number;
}

export default function ClientManagementPage({ clients, total }: ClientManagementPageProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component is mounted before running client-side effects
    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const handleClientSelect = (clientId: string) => {
        router.push(`/${clientId}/client-overview`);
    };

    const handleAddCustomer = () => {
        // TODO: Implement add customer functionality
        console.log("Add customer clicked");
    };

    const getHealthStatusColor = (status?: string) => {
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

    const getHealthStatusText = (health?: Client["lineHealth"]) => {
        if (!health) return "N/A";
        return `${health.percentage}%`;
    };

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Select a client to view and manage their details
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Top Row: Search and Add Button */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-orange focus:ring-orange"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-card border-border text-muted-foreground">
                            {filteredClients.length} of {total} clients
                        </Badge>
                        <Button
                            onClick={handleAddCustomer}
                            className="bg-orange text-white hover:bg-orange/90 h-10 px-4"
                        >
                            <FaPlus className="mr-2 h-4 w-4" />
                            Add a Customer
                        </Button>
                    </div>
                </div>

                {/* Bottom Row: Region and Customer Dropdowns */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Region:</span>
                        <Select
                            value={selectedRegion || "all"}
                            onValueChange={(value) => {
                                setSelectedRegion(value === "all" ? "" : value);
                                setSelectedCustomer(""); // Reset customer when region changes
                            }}
                        >
                            <SelectTrigger className="w-full bg-card border-border">
                                <SelectValue placeholder="All Regions" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem
                                    value="all"
                                    className="text-foreground hover:bg-accent cursor-pointer"
                                >
                                    All Regions
                                </SelectItem>
                                {regions.map((region) => (
                                    <SelectItem
                                        key={region}
                                        value={region}
                                        className="text-foreground hover:bg-accent cursor-pointer"
                                    >
                                        {region}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 min-w-[200px]">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Customer:</span>
                        <Select
                            value={selectedCustomer || "all"}
                            onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}
                            disabled={!selectedRegion}
                        >
                            <SelectTrigger className="w-full bg-card border-border disabled:opacity-50">
                                <SelectValue placeholder={selectedRegion ? "Select Customer" : "Select Region First"} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {selectedRegion && (
                                    <>
                                        <SelectItem
                                            value="all"
                                            className="text-foreground hover:bg-accent cursor-pointer"
                                        >
                                            All Customers
                                        </SelectItem>
                                        {customersByRegion.map((customer) => (
                                            <SelectItem
                                                key={customer}
                                                value={customer}
                                                className="text-foreground hover:bg-accent cursor-pointer"
                                            >
                                                {customer}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters Button */}
                    {(selectedRegion || selectedCustomer) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedRegion("");
                                setSelectedCustomer("");
                            }}
                            className="border-border text-muted-foreground hover:bg-muted"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Client Name
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                Location
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                Last Visit
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                Next Scheduled
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                Line Health
                            </TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <TableRow
                                    key={client._id}
                                    className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                                    onClick={() => handleClientSelect(client._id)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center overflow-hidden">
                                                {client.facilityImage ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={client.facilityImage}
                                                        alt={client.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <BsBuilding className="h-5 w-5 text-orange" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-foreground font-medium">{client.name}</p>
                                                {client.endProduct && (
                                                    <p className="text-xs text-muted-foreground">{client.endProduct}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <HiOutlineLocationMarker className="h-4 w-4 text-orange shrink-0" />
                                            <span className="text-sm truncate max-w-[200px]">
                                                {client.location?.address || "N/A"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                            {client.lastVisited
                                                ? format(new Date(client.lastVisited), "dd MMM yyyy")
                                                : "N/A"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {client.nextScheduledVisit ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm text-foreground" suppressHydrationWarning>
                                                    {format(new Date(client.nextScheduledVisit), "dd MMM yyyy")}
                                                </span>
                                                {client.nextScheduledVisitType && client.nextScheduledVisitType.length > 0 && (
                                                    <Badge variant="outline" className="text-xs border-orange/30 text-orange">
                                                        {client.nextScheduledVisitType.join(", ")}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={`${getHealthStatusColor(client.lineHealth?.status)} font-medium`}
                                        >
                                            {getHealthStatusText(client.lineHealth)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-orange hover:text-orange hover:bg-orange/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleClientSelect(client._id);
                                            }}
                                        >
                                            View
                                            <FaChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <div className="flex flex-col items-center">
                                        <BsBuilding className="h-16 w-16 text-muted-foreground/20 mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            No clients found
                                        </h3>
                                        <p className="text-muted-foreground text-sm max-w-md">
                                            {searchQuery || selectedRegion || selectedCustomer
                                                ? `No clients match your filters. Try adjusting your search terms or filters.`
                                                : "There are no clients available. Please contact your administrator."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-4 bg-orange/5 border border-orange/20 rounded-lg">
                <p className="text-sm text-orange">
                    <strong>Note:</strong> Select a client from the list above to access their dashboard, machine insights, and other features.
                </p>
            </div>
        </div>
    );
}
