"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineLink, HiOutlineLocationMarker, HiOutlineClock, HiOutlinePencil } from "react-icons/hi";
import { FaBolt, FaLeaf, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { BsBuilding, BsGearFill } from "react-icons/bs";
import { MdOutlineCalendarToday } from "react-icons/md";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClientMachine } from "@/types/machine";
import { Client } from "@/types/client";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";
import EditSparePartModal from "@/app/components/Modals/EditSparePartModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SparePart {
    _id: string;
    name: string;
    originalName: string;
    status: "healthy" | "warning" | "critical";
    healthPercentage: number;
    lifetimeOfRotor: { value: number; unit: string };
    totalRunningHours: { value: number; unit: string };
    lastServiceDate: string | null;
    sparePartInstallationDate: string | null;
    machineInstallationDate: string | null;
    clientSparePartId: string | null;
}

interface ClientDetailsWithMachines extends Client {
    machines?: ClientMachine[];
}

interface ClientOverviewContentProps {
    clientDetails: ClientDetailsWithMachines;
    allClients: Client[];
    currentClientId: string;
}

export default function ClientOverviewContent({
    clientDetails,
    allClients,
    currentClientId,
}: ClientOverviewContentProps) {
    const router = useRouter();
    const [expandedMachines, setExpandedMachines] = useState<Record<string, boolean>>({});
    const [machineSpareParts, setMachineSpareParts] = useState<Record<string, SparePart[]>>({});
    const [loadingSpareParts, setLoadingSpareParts] = useState<Record<string, boolean>>({});
    const [editingSparePart, setEditingSparePart] = useState<{
        sparePart: SparePart;
        machineId: string;
    } | null>(null);

    const handleClientChange = (clientId: string) => {
        router.push(`/${clientId}/client-overview`);
    };

    const toggleMachine = async (machineId: string) => {
        const isExpanding = !expandedMachines[machineId];
        setExpandedMachines((prev) => ({
            ...prev,
            [machineId]: isExpanding,
        }));

        // Fetch spare parts if expanding and not already loaded
        if (isExpanding && !machineSpareParts[machineId]) {
            await fetchSpareParts(machineId);
        }
    };

    const fetchSpareParts = async (machineId: string) => {
        setLoadingSpareParts((prev) => ({ ...prev, [machineId]: true }));
        try {
            const response = await fetch(
                `/api/clients/${currentClientId}/machines/${machineId}/spare-parts`
            );
            if (response.ok) {
                const data = await response.json();
                setMachineSpareParts((prev) => ({
                    ...prev,
                    [machineId]: data,
                }));
            }
        } catch (error) {
            console.error("Error fetching spare parts:", error);
        } finally {
            setLoadingSpareParts((prev) => ({ ...prev, [machineId]: false }));
        }
    };

    const handleSparePartUpdate = async (
        machineId: string,
        sparePartId: string,
        updates: { customName?: string; lastServiceDate?: string; sparePartInstallationDate?: string }
    ) => {
        try {
            const response = await fetch(
                `/api/clients/${currentClientId}/machines/${machineId}/spare-parts`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sparePartID: sparePartId,
                        ...updates,
                    }),
                }
            );

            if (response.ok) {
                // Refresh spare parts for this machine
                await fetchSpareParts(machineId);
            }
        } catch (error) {
            console.error("Error updating spare part:", error);
        }
    };

    const getStatusColor = (status: string) => {
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

    const getStatusText = (status: string) => {
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

    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header with Client Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Client Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage client information
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Client Selector Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Select Client:</span>
                        <Select
                            value={currentClientId}
                            onValueChange={handleClientChange}
                        >
                            <SelectTrigger className="w-[250px] bg-card border-border">
                                <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {allClients.map((client) => (
                                    <SelectItem
                                        key={client._id}
                                        value={client._id}
                                        className="text-foreground hover:bg-accent cursor-pointer"
                                    >
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <EditClientDetails client={clientDetails} machines={clientDetails?.machines || []} />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Client Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Company Info Card */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Company Name */}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Name</p>
                                    <p className="text-foreground font-medium">{clientDetails?.name || "N/A"}</p>
                                </div>

                                {/* End Product */}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">End Product</p>
                                    <p className="text-foreground font-medium">{clientDetails?.endProduct || "N/A"}</p>
                                </div>

                                {/* Location */}
                                <div className="space-y-1 col-span-2">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                                    <div className="flex items-start gap-2">
                                        <HiOutlineLocationMarker className="h-4 w-4 text-orange mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-foreground">{clientDetails?.location?.address || "N/A"}</p>
                                            {clientDetails?.location?.mapLink && (
                                                <Link href={clientDetails.location.mapLink} target="_blank" className="inline-block mt-1">
                                                    <Badge variant="outline" className="cursor-pointer border-orange/30 text-orange hover:bg-orange/10 transition-colors text-xs">
                                                        <HiOutlineLink className="mr-1 h-3 w-3" />
                                                        View on Map
                                                    </Badge>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Owner */}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Owner</p>
                                    <p className="text-foreground font-medium">{clientDetails?.clientOwnership?.name || "N/A"}</p>
                                </div>

                                {/* Capacity */}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Capacity</p>
                                    <p className="text-foreground font-medium">
                                        {clientDetails?.capacity ? (
                                            <span>
                                                <span className="text-orange font-bold">{clientDetails.capacity}</span>
                                                <span className="text-muted-foreground ml-1">BDMTPD</span>
                                            </span>
                                        ) : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Machines Accordion */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BsGearFill className="h-5 w-5 text-orange" />
                                <h2 className="text-lg font-semibold text-foreground">Machines & Spare Parts</h2>
                            </div>
                            <Badge variant="outline" className="border-border text-muted-foreground">
                                {clientDetails?.machines?.length || 0} machines
                            </Badge>
                        </div>

                        <div className="divide-y divide-border">
                            {clientDetails?.machines && clientDetails.machines.length > 0 ? (
                                clientDetails.machines.map((machine: ClientMachine) => (
                                    <Collapsible
                                        key={machine._id}
                                        open={expandedMachines[machine.machine?._id || machine._id]}
                                        onOpenChange={() => toggleMachine(machine.machine?._id || machine._id)}
                                    >
                                        <CollapsibleTrigger className="w-full">
                                            <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center">
                                                        <BsGearFill className="h-5 w-5 text-orange" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-medium text-foreground">
                                                            {machine?.machine?.name || "N/A"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Serial: {machine?.serialNumber || "N/A"} • Installed: {machine?.installationDate
                                                                ? format(new Date(machine.installationDate), "dd MMM yyyy")
                                                                : "N/A"
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {expandedMachines[machine.machine?._id || machine._id] ? (
                                                        <FaChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                                                    ) : (
                                                        <FaChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                                                    )}
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <div className="px-4 pb-4 bg-muted/10">
                                                {loadingSpareParts[machine.machine?._id || machine._id] ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
                                                        <span className="ml-2 text-muted-foreground text-sm">Loading spare parts...</span>
                                                    </div>
                                                ) : machineSpareParts[machine.machine?._id || machine._id]?.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-border hover:bg-transparent">
                                                                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                                                                    Spare Part Name
                                                                </TableHead>
                                                                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                                                    Status
                                                                </TableHead>
                                                                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                                                    Last Service
                                                                </TableHead>
                                                                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                                                    Installation Date
                                                                </TableHead>
                                                                <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center">
                                                                    Actions
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {machineSpareParts[machine.machine?._id || machine._id].map((sparePart) => (
                                                                <TableRow key={sparePart._id} className="border-border hover:bg-muted/20">
                                                                    <TableCell className="font-medium text-foreground">
                                                                        {sparePart.name}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`${getStatusColor(sparePart.status)} font-medium`}
                                                                        >
                                                                            {getStatusText(sparePart.status)} ({sparePart.healthPercentage}%)
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center text-muted-foreground">
                                                                        {sparePart.lastServiceDate
                                                                            ? format(new Date(sparePart.lastServiceDate), "dd MMM yyyy")
                                                                            : "N/A"
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-center text-muted-foreground">
                                                                        {sparePart.sparePartInstallationDate
                                                                            ? format(new Date(sparePart.sparePartInstallationDate), "dd MMM yyyy")
                                                                            : sparePart.machineInstallationDate
                                                                            ? format(new Date(sparePart.machineInstallationDate), "dd MMM yyyy")
                                                                            : "N/A"
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-orange hover:text-orange hover:bg-orange/10"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingSparePart({
                                                                                    sparePart,
                                                                                    machineId: machine.machine?._id || machine._id,
                                                                                });
                                                                            }}
                                                                        >
                                                                            <HiOutlinePencil className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <div className="flex flex-col items-center py-8">
                                                        <BsGearFill className="h-8 w-8 text-muted-foreground/20 mb-2" />
                                                        <p className="text-muted-foreground text-sm">No spare parts found for this machine</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))
                            ) : (
                                <div className="flex flex-col items-center py-12">
                                    <BsGearFill className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                    <p className="text-muted-foreground">No machines registered</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Facility Image */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Facility Image</h2>
                        </div>
                        <div className="h-48 bg-muted/30">
                            {clientDetails?.facilityImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={clientDetails.facilityImage}
                                    alt="Facility"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <BsBuilding className="h-12 w-12 text-muted-foreground/20 mb-2" />
                                    <p className="text-xs text-muted-foreground">No image uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Power Cost */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                            <FaBolt className="h-4 w-4 text-orange" />
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Power Cost</h2>
                        </div>
                        <div className="p-4">
                            {clientDetails?.powerCost?.value ? (
                                <div>
                                    <span className="text-2xl font-bold text-foreground">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: clientDetails.powerCost.priceUnit || 'EUR'
                                        }).format(clientDetails.powerCost.value)}
                                    </span>
                                    <span className="text-muted-foreground text-sm ml-1">
                                        / {clientDetails.powerCost.perUnit || 'kw'}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Not specified</p>
                            )}
                        </div>
                    </div>

                    {/* Fiber Cost */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                            <FaLeaf className="h-4 w-4 text-orange" />
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Fiber Cost</h2>
                        </div>
                        <div className="p-4">
                            {clientDetails?.fiberCost?.value ? (
                                <div>
                                    <span className="text-2xl font-bold text-foreground">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: clientDetails.fiberCost.priceUnit || 'EUR'
                                        }).format(clientDetails.fiberCost.value)}
                                    </span>
                                    <span className="text-muted-foreground text-sm ml-1">
                                        / {clientDetails.fiberCost.perUnit || 'Ton'}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Not specified</p>
                            )}
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                        <HiOutlineClock className="h-4 w-4" />
                        <span>
                            Last updated: {clientDetails?.updatedAt
                                ? format(new Date(clientDetails.updatedAt), "dd MMM yyyy, HH:mm")
                                : "N/A"
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Edit Spare Part Modal */}
            {editingSparePart && (
                <EditSparePartModal
                    open={!!editingSparePart}
                    onOpenChange={(open) => !open && setEditingSparePart(null)}
                    sparePart={editingSparePart.sparePart}
                    onSave={(updates) => {
                        handleSparePartUpdate(
                            editingSparePart.machineId,
                            editingSparePart.sparePart._id,
                            updates
                        );
                        setEditingSparePart(null);
                    }}
                />
            )}
        </div>
    );
}
