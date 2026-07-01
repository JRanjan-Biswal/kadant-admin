"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { TbEdit, TbLink, TbUpload, TbX } from "react-icons/tb";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Client } from "@/types/client";
import { ClientMachine } from "@/types/machine";
// import { Product } from "@/types/product";
import { format } from "date-fns";
// import { FaPlus } from "react-icons/fa6";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select"
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import ImageUploadModal from "@/app/components/MachineHierarchy/ImageUploadModal";
import { uploadClientImageDirect } from "@/lib/uploadImage";
import FacilityImageMapper, { type CategoryPosition } from "@/app/components/MachineHierarchy/FacilityImageMapper";
import { Map as MapIcon } from "lucide-react";

const MAX_CLIENT_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_CLIENT_IMAGE_LABEL = "10 MB";

interface CategoryInfo {
    _id: string;
    name: string;
}

interface EditClientDetailsProps {
    client: Client;
    machines: ClientMachine[];
    categories?: CategoryInfo[];
    /** Optional controlled-open mode. When provided, the built-in trigger is hidden. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface MachineRow {
    id: string;
    productId: string;
    serialNumber: string;
    installationDate: string;
    _id?: string;
}

const getClientOwnerName = (client: Client) => {
    if (typeof client.loginUser === "object" && client.loginUser) {
        return client.loginUser.name || "";
    }
    if (
        typeof client.clientOwnership === "object" &&
        client.clientOwnership &&
        "role" in client.clientOwnership &&
        client.clientOwnership.role === "client"
    ) {
        return client.clientOwnership.name || "";
    }
    return "";
};

export default function EditClientDetails({ client, machines = [], categories = [], open, onOpenChange }: EditClientDetailsProps) {
    const router = useRouter();
    const [clientDetails, setClientDetails] = useState<Client>(client);
    const [machineRows, setMachineRows] = useState<MachineRow[]>([]);
    // const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? !!open : internalOpen;
    const setIsOpen = (next: boolean) => {
        if (isControlled) {
            onOpenChange?.(next);
        } else {
            setInternalOpen(next);
        }
    };
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);
    // Display URL — fully built by backend (virtual `facilityImageUrl`). Never composed on FE.
    const [facilityImage, setFacilityImage] = useState<string | null>(client?.facilityImageUrl || null);
    // Storage path — what we send back to the backend on save. Backend builds the URL on read.
    const [facilityImagePath, setFacilityImagePath] = useState<string | null>(client?.facilityImagePath || null);
    const [facilityImageFile, setFacilityImageFile] = useState<File | null>(null);
    const [facilityPreviewUrl, setFacilityPreviewUrl] = useState<string | null>(null);

    const [homeImage, setHomeImage] = useState<string | null>(client?.homeImageUrl || null);
    const [homeImagePath, setHomeImagePath] = useState<string | null>(client?.homeImagePath || null);
    const [homeImageFile, setHomeImageFile] = useState<File | null>(null);
    const [homePreviewUrl, setHomePreviewUrl] = useState<string | null>(null);
    const [imageModal, setImageModal] = useState<null | {
        title: string;
        currentImageUrl: string | null;
        onSave: (file: File) => Promise<void>;
    }>(null);
    const [showFacilityMapper, setShowFacilityMapper] = useState(false);
    const [facilityLayout, setFacilityLayout] = useState<CategoryPosition[]>(
        () => (client.facilityLayout || []).map((item) => ({
            category: typeof item.category === "object" ? (item.category as { _id: string })._id : item.category as string,
            points: item.points,
        }))
    );

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    useEffect(() => {
        return () => {
            if (facilityPreviewUrl) URL.revokeObjectURL(facilityPreviewUrl);
            if (homePreviewUrl) URL.revokeObjectURL(homePreviewUrl);
        };
    }, [facilityPreviewUrl, homePreviewUrl]);

    const handleClientDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'owner') {
            setClientDetails(prev => ({
                ...prev,
                loginUser: typeof prev.loginUser === "object" && prev.loginUser
                    ? { ...prev.loginUser, name: value }
                    : prev.loginUser
            }));
        } else if (name === 'location') {
            setClientDetails(prev => ({
                ...prev,
                location: { ...prev.location, address: value }
            }));
        } else if (name === 'powerCost.value') {
            setClientDetails(prev => ({
                ...prev,
                powerCost: { ...prev.powerCost, value: Number(value) }
            }));
        } else if (name === 'fiberCost.value') {
            setClientDetails(prev => ({
                ...prev,
                fiberCost: { ...prev.fiberCost, value: Number(value) }
            }));
        } else {
            setClientDetails(prev => ({ ...prev, [name]: value }));
        }
    };

    // const handleMachineChange = (id: string, field: keyof MachineRow, value: string) => {
    //     setMachineRows(prev => prev.map(machine =>
    //         machine.id === id ? { ...machine, [field]: value } : machine
    //     ));
    // };

    // const addMachineRow = () => {
    //     const newMachine: MachineRow = {
    //         id: `new_${Date.now()}`,
    //         productId: '',
    //         serialNumber: '',
    //         installationDate: ''
    //     };
    //     setMachineRows(prev => [...prev, newMachine]);
    // };

    // const deleteMachineRow = (id: string) => {
    //     setMachineRows(prev => prev.filter(machine => machine.id !== id));
    // };

    const stageFacilityImage = async (file: File) => {
        if (file.size > MAX_CLIENT_IMAGE_SIZE) {
            throw new Error(`Selected image must be ${MAX_CLIENT_IMAGE_LABEL} or smaller`);
        }
        const previewUrl = URL.createObjectURL(file);
        setFacilityPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        setFacilityImageFile(file);
        setFacilityImage(previewUrl);
    };

    const removeFacilityImage = () => {
        setFacilityPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setFacilityImageFile(null);
        setFacilityImage(null);
        setFacilityImagePath(null);
    };

    const stageHomeImage = async (file: File) => {
        if (file.size > MAX_CLIENT_IMAGE_SIZE) {
            throw new Error(`Selected image must be ${MAX_CLIENT_IMAGE_LABEL} or smaller`);
        }
        const previewUrl = URL.createObjectURL(file);
        setHomePreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        setHomeImageFile(file);
        setHomeImage(previewUrl);
    };

    const removeHomeImage = () => {
        setHomePreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setHomeImageFile(null);
        setHomeImage(null);
        setHomeImagePath(null);
    };

    // const getProducts = async () => {
    //     try {
    //         setIsLoading(true);
    //         const response = await fetch(`/api/products`, {
    //             method: "GET",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         setProducts(data);
    //     } catch (error) {
    //         console.error("Error fetching products:", error);
    //         toast.error("Failed to fetch products");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        const initialMachines: MachineRow[] = machines.map((machine, index) => ({
            id: machine._id || `existing_${index}`,
            productId: machine.machine._id || '',
            serialNumber: machine.serialNumber || '',
            installationDate: machine.installationDate ? format(new Date(machine.installationDate), 'yyyy-MM-dd') : '',
            _id: machine._id
        }));

        setMachineRows(initialMachines);
    }, [machines]);

    // useEffect(() => {
    //     getProducts();
    // }, []);

    const handleSaveFacilityLayout = async (positions: CategoryPosition[]) => {
        const res = await fetch(`/api/clients/${clientDetails._id}/facility-layout`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facilityLayout: positions }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || "Failed to save facility layout");
        }
        setFacilityLayout(positions);
        setShowFacilityMapper(false);
        toast.success("Facility layout saved.");
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            const nextFacilityImagePath = facilityImageFile
                ? await uploadClientImageDirect(facilityImageFile)
                : facilityImagePath;
            const nextHomeImagePath = homeImageFile
                ? await uploadClientImageDirect(homeImageFile)
                : homeImagePath;

            const updatedData = {
                capacity: clientDetails.capacity,
                endProduct: clientDetails.endProduct,
                name: clientDetails.name,
                powerCost: {
                    value: clientDetails.powerCost.value,
                    priceUnit: clientDetails.powerCost.priceUnit,
                    perUnit: clientDetails.powerCost.perUnit
                },
                fiberCost: {
                    value: clientDetails.fiberCost.value,
                    priceUnit: clientDetails.fiberCost.priceUnit,
                    perUnit: clientDetails.fiberCost.perUnit
                },
                location: clientDetails.location,
                // Send the relative path; backend rebuilds the public URL via virtual.
                facilityImage: nextFacilityImagePath,
                homeImage: nextHomeImagePath,
                // Machines are managed in the dedicated machine flow — do NOT send
                // them from this modal or the backend will treat the absence as
                // "delete the rest" and wipe the client's ClientMachine rows.
            }

            const response = await fetch(`/api/clients/${clientDetails._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();
            setFacilityImagePath(nextFacilityImagePath);
            setHomeImagePath(nextHomeImagePath);
            setFacilityImageFile(null);
            setHomeImageFile(null);
            toast.success("Client details updated successfully");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Error submitting data:", error);
            toast.error("Failed to update the client details");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <button
                        disabled={isReadOnly}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-4 py-2 h-auto flex items-center gap-2 text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TbEdit className="w-4 h-4" />
                        <span>Edit Details</span>
                    </button>
                </DialogTrigger>
            )}
            <DialogContent
                className="w-[75%] sm:w-[75%] sm:max-w-[75%] bg-white border border-[#96A5BA] rounded-[14px] max-h-[90vh] overflow-y-auto"
                showCloseButton={true}
                onInteractOutside={(event) => {
                    if (imageModal) event.preventDefault();
                }}
                onEscapeKeyDown={(event) => {
                    if (imageModal) event.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-[#2D3E5C] text-xl font-bold">Edit Client & Machine Details</DialogTitle>
                </DialogHeader>

                {/* Row 1: 5 equal columns */}
                <div className="grid grid-cols-5 gap-x-4 gap-y-5 mt-5">
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Company Name</Label>
                        <Input
                            type="text"
                            name="name"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.name || ''}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="Company Name"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">End Product</Label>
                        <Input
                            type="text"
                            name="endProduct"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.endProduct || ''}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="End Product"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Capacity (TPD)</Label>
                        <Input
                            type="number"
                            name="capacity"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.capacity || ''}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="Capacity (TPD)"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Power Cost</Label>
                        <Input
                            type="number"
                            name="powerCost.value"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.powerCost?.value || 0}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="Power Cost"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Fiber Cost</Label>
                        <Input
                            type="number"
                            name="fiberCost.value"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.fiberCost?.value || 0}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="Fiber Cost"
                        />
                    </div>
                </div>

                {/* Row 2: Owner (1 col) + Location (3 cols) + Paste Link (1 col) */}
                <div className="grid grid-cols-5 gap-x-4 gap-y-5 mt-5">
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Owner</Label>
                        <Input
                            disabled={true}
                            type="text"
                            name="owner"
                            onChange={handleClientDetailsChange}
                            value={getClientOwnerName(clientDetails)}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] bg-muted text-muted-foreground cursor-not-allowed"
                            placeholder="Owner"
                        />
                    </div>
                    <div className="col-span-3 flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm">Location</Label>
                        <Input
                            type="text"
                            name="location"
                            onChange={handleClientDetailsChange}
                            value={clientDetails?.location?.address || ''}
                            className="h-11 rounded-md border-border bg-[#DFE6EC] text-foreground"
                            placeholder="Location"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm opacity-0">Paste Link</Label>
                        <Button className="w-full bg-[#DFE6EC] hover:bg-[#DFE6EC] border border-dashed border-border text-muted-foreground h-11 cursor-not-allowed gap-2">
                            <TbLink className="shrink-0" />
                            <span className="truncate">Paste address link</span>
                        </Button>
                    </div>
                </div>

                {/* Facility Image + Section Mapping — unified card */}
                <div className="mt-5 border border-[#e2e8f0] rounded-xl p-4">
                    <Label className="text-muted-foreground text-sm font-medium">Facility Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                        {facilityImage ? (
                            <div className="relative shrink-0">
                                <div className="w-40 h-24 border border-border rounded-md overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={facilityImage || ''}
                                        alt="Facility"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFacilityImage}
                                    className="absolute -top-2 -right-2 bg-destructive text-gray-900 rounded-full p-1 hover:bg-destructive/80 transition-colors"
                                >
                                    <TbX size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setImageModal({
                                    title: "Facility Image",
                                    currentImageUrl: facilityImage,
                                    onSave: stageFacilityImage,
                                })}
                                className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-orange/50 transition-colors bg-muted/30 shrink-0"
                            >
                                <TbUpload className="text-muted-foreground text-xl mb-1" />
                                <span className="text-xs text-muted-foreground">Upload Image</span>
                            </button>
                        )}
                        {facilityImage && (
                            <button
                                type="button"
                                onClick={() => setImageModal({
                                    title: "Facility Image",
                                    currentImageUrl: facilityImage,
                                    onSave: stageFacilityImage,
                                })}
                                className="flex items-center gap-2 px-3 py-2 bg-[#DFE6EC] hover:bg-muted/80 border border-dashed border-border text-muted-foreground rounded-md cursor-pointer transition-colors shrink-0"
                            >
                                <TbUpload size={16} />
                                <span className="text-sm">Change</span>
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Supported: JPEG, PNG, WebP (max 10MB)</p>

                    {/* Map Facility Sections */}
                    {facilityImage && categories && categories.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] p-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-gray-900 text-sm font-semibold">Map Facility Sections</h3>
                                {facilityLayout.length >= categories.length && facilityLayout.length > 0 && (
                                    <span className="text-[#22c55e] text-xs font-medium flex items-center gap-1">
                                        <MapPin size={12} /> All mapped
                                    </span>
                                )}
                            </div>
                            <p className="text-[#6b7280] text-xs">
                                Place each production section on the facility image so users can click through to it.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {categories.map((cat) => {
                                    const isMapped = facilityLayout.some((p) => p.category === cat.id);
                                    return (
                                        <div
                                            key={cat.id}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border ${
                                                isMapped
                                                    ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                                                    : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                                            }`}
                                        >
                                            <MapPin size={10} />
                                            {cat.name}
                                            <span className="ml-1 text-[10px] opacity-70">
                                                {isMapped ? "mapped" : "not mapped"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFacilityMapper(true)}
                                className="flex items-center gap-2 bg-[#d45815] hover:bg-[#b84c11] text-white rounded-[10px] px-4 py-2 text-sm font-medium w-fit transition-colors"
                            >
                                <MapPin size={14} />
                                {facilityLayout.length > 0 ? "Edit Section Positions" : "Open Facility Mapper"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Home Image Upload Section */}
                <div className="mt-5">
                    <Label className="text-muted-foreground text-sm">Home Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                        {homeImage ? (
                            <div className="relative shrink-0">
                                <div className="w-40 h-24 border border-border rounded-md overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={homeImage || ''}
                                        alt="Home"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeHomeImage}
                                    className="absolute -top-2 -right-2 bg-destructive text-gray-900 rounded-full p-1 hover:bg-destructive/80 transition-colors"
                                >
                                    <TbX size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setImageModal({
                                    title: "Home Image",
                                    currentImageUrl: homeImage,
                                    onSave: stageHomeImage,
                                })}
                                className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-orange/50 transition-colors bg-muted/30 shrink-0"
                            >
                                <TbUpload className="text-muted-foreground text-xl mb-1" />
                                <span className="text-xs text-muted-foreground">Upload Image</span>
                            </button>
                        )}
                        {homeImage && (
                            <button
                                type="button"
                                onClick={() => setImageModal({
                                    title: "Home Image",
                                    currentImageUrl: homeImage,
                                    onSave: stageHomeImage,
                                })}
                                className="flex items-center gap-2 px-3 py-2 bg-[#DFE6EC] hover:bg-muted/80 border border-dashed border-border text-muted-foreground rounded-md cursor-pointer transition-colors shrink-0"
                            >
                                <TbUpload size={16} />
                                <span className="text-sm">Change</span>
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Supported: JPEG, PNG, WebP (max 10MB)</p>
                </div>

                {/* <div className="block mt-4">
                    <h2 className="text-lg font-semibold text-foreground">Total Machines</h2>
                    <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg mt-3">
                        <Table>
                            <TableHeader className="bg-[#ffffff] sticky top-0 z-10">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="border-border border-r font-semibold text-muted-foreground w-[35%]">Machine Name</TableHead>
                                    <TableHead className="text-center border-border border-r font-semibold text-muted-foreground w-[25%]">Serial Number</TableHead>
                                    <TableHead className="text-center border-border border-r font-semibold text-muted-foreground w-[25%]">Installation Date</TableHead>
                                    <TableHead className="text-center font-semibold text-muted-foreground w-[15%]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {machineRows.length === 0 ? (
                                    <TableRow className="border-border">
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No machines added yet. Click &quot;Add Machine&quot; to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    machineRows.map((machine) => (
                                        <TableRow key={machine.id} className="border-border hover:bg-muted/30">
                                            <TableCell className="border-border border-r p-2">
                                                <Select
                                                    value={machine.productId}
                                                    onValueChange={(value) => _handleMachineChange(machine.id, 'productId', value)}
                                                >
                                                    <SelectTrigger className="w-full border-border bg-input text-foreground h-10">
                                                        <SelectValue placeholder="Select Machine" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border">
                                                        {_products?.map((product: Product) => (
                                                            <SelectItem key={product._id} value={product._id} className="text-foreground hover:bg-accent">
                                                                {product?.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="border-border border-r p-2">
                                                <Input
                                                    type="text"
                                                    value={machine.serialNumber}
                                                    onChange={(e) => _handleMachineChange(machine.id, 'serialNumber', e.target.value)}
                                                    className="h-10 rounded-sm border-border bg-input text-foreground"
                                                    placeholder="Serial Number"
                                                />
                                            </TableCell>
                                            <TableCell className="border-border border-r p-2">
                                                <Input
                                                    type="date"
                                                    value={machine.installationDate}
                                                    onChange={(e) => _handleMachineChange(machine.id, 'installationDate', e.target.value)}
                                                    className="h-10 rounded-sm border-border bg-input text-foreground"
                                                    placeholder="Installation Date"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center border-border border">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => _deleteMachineRow(machine.id)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <TbTrash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div> */}

                {/* <div className="flex justify-start">
                    <Button
                        onClick={_addMachineRow}
                        className="cursor-pointer bg-muted hover:bg-muted/80 text-muted-foreground border border-dashed border-border"
                    >
                        <FaPlus /> Add Machine
                    </Button>
                </div> */}

                <DialogFooter className="mt-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        className="bg-[#2D3E5C] text-white uppercase font-semibold cursor-pointer w-[250px] hover:bg-[#1f2a44]"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
            {imageModal && (
                <ImageUploadModal
                    open
                    onClose={() => setImageModal(null)}
                    title={imageModal.title}
                    currentImageUrl={imageModal.currentImageUrl}
                    onSave={imageModal.onSave}
                    maxSavedBytes={MAX_CLIENT_IMAGE_SIZE}
                    maxSavedLabel={MAX_CLIENT_IMAGE_LABEL}
                />
            )}
            {showFacilityMapper && facilityImage && categories.length > 0 && (
                <FacilityImageMapper
                    facilityImageUrl={facilityImage}
                    categories={categories.map((c) => ({ id: c._id, name: c.name }))}
                    initialPositions={facilityLayout}
                    onSave={handleSaveFacilityLayout}
                    onClose={() => setShowFacilityMapper(false)}
                />
            )}
        </Dialog>
    );
}
