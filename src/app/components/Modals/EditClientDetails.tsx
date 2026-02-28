"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { TbEdit, TbLink, TbTrash, TbUpload, TbX } from "react-icons/tb";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Client } from "@/types/client";
import { ClientMachine } from "@/types/machine";
import { Product } from "@/types/product";
import { format } from "date-fns";
import { FaPlus } from "react-icons/fa6";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface EditClientDetailsProps {
    client: Client;
    machines: ClientMachine[];
}

interface MachineRow {
    id: string;
    productId: string;
    serialNumber: string;
    installationDate: string;
    _id?: string;
}

export default function EditClientDetails({ client, machines = [] }: EditClientDetailsProps) {
    const router = useRouter();
    const [clientDetails, setClientDetails] = useState<Client>(client);
    const [machineRows, setMachineRows] = useState<MachineRow[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [facilityImage, setFacilityImage] = useState<string | null>(client?.facilityImage || null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const handleClientDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'owner') {
            setClientDetails(prev => ({
                ...prev,
                clientOwnership: { ...prev.clientOwnership, name: value }
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

    const handleMachineChange = (id: string, field: keyof MachineRow, value: string) => {
        setMachineRows(prev => prev.map(machine =>
            machine.id === id ? { ...machine, [field]: value } : machine
        ));
    };

    const addMachineRow = () => {
        const newMachine: MachineRow = {
            id: `new_${Date.now()}`,
            productId: '',
            serialNumber: '',
            installationDate: ''
        };
        setMachineRows(prev => [...prev, newMachine]);
    };

    const deleteMachineRow = (id: string) => {
        setMachineRows(prev => prev.filter(machine => machine.id !== id));
    };

    const handleFacilityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        try {
            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            setFacilityImage(data.url);
            toast.success('Facility image uploaded successfully');
        } catch (error) {
            console.error('Error uploading facility image:', error);
            toast.error('Failed to upload facility image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const removeFacilityImage = () => {
        setFacilityImage(null);
    };

    const getProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/products`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
        } finally {
            setIsLoading(false);
        }
    };

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

    useEffect(() => {
        getProducts();
    }, []);

    const handleSubmit = async () => {
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
            facilityImage: facilityImage,
            machines: machineRows.map(machine => ({
                _id: machine._id,
                productId: machine.productId,
                serialNumber: machine.serialNumber,
                installationDate: machine.installationDate
            }))
        }

        try {
            setIsLoading(true);

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
            <DialogTrigger asChild>
                <button
                    disabled={isReadOnly}
                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-4 py-2 h-auto flex items-center gap-2 text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <TbEdit className="w-4 h-4" />
                    <span>Edit Details</span>
                </button>
            </DialogTrigger>
            <DialogContent className="w-[75%] sm:w-[75%] sm:max-w-[75%] bg-[#0D0D0D] border-border max-h-[90vh] overflow-y-auto" showCloseButton={true}>
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">Edit Client & Machine Details</DialogTitle>
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
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
                            value={clientDetails?.clientOwnership?.name || ''}
                            className="h-11 rounded-md border-border bg-[#1A1A1A] bg-muted text-muted-foreground cursor-not-allowed"
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
                            className="h-11 rounded-md border-border bg-[#1A1A1A] text-foreground"
                            placeholder="Location"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground text-sm opacity-0">Paste Link</Label>
                        <Button className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A] border border-dashed border-border text-muted-foreground h-11 cursor-not-allowed gap-2">
                            <TbLink className="shrink-0" />
                            <span className="truncate">Paste address link</span>
                        </Button>
                    </div>
                </div>

                {/* Facility Image Upload Section */}
                <div className="mt-5">
                    <Label className="text-muted-foreground text-sm">Facility Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                        {facilityImage ? (
                            <div className="relative shrink-0">
                                <div className="w-40 h-24 border border-border rounded-md overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={facilityImage}
                                        alt="Facility"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFacilityImage}
                                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80 transition-colors"
                                >
                                    <TbX size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-orange/50 transition-colors bg-muted/30 shrink-0">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFacilityImageUpload}
                                    className="hidden"
                                    disabled={isUploadingImage}
                                />
                                {isUploadingImage ? (
                                    <Loader2 className="animate-spin text-orange" />
                                ) : (
                                    <>
                                        <TbUpload className="text-muted-foreground text-xl mb-1" />
                                        <span className="text-xs text-muted-foreground">Upload Image</span>
                                    </>
                                )}
                            </label>
                        )}
                        {facilityImage && (
                            <label className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] hover:bg-muted/80 border border-dashed border-border text-muted-foreground rounded-md cursor-pointer transition-colors shrink-0">
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFacilityImageUpload}
                                    className="hidden"
                                    disabled={isUploadingImage}
                                />
                                {isUploadingImage ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <>
                                        <TbUpload size={16} />
                                        <span className="text-sm">Change</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Supported: JPEG, PNG, WebP (max 10MB)</p>
                </div>

                {/* Machines Section */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-foreground">Total Machines</h2>
                    <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg mt-3">
                        <Table>
                            <TableHeader className="bg-[#171717] sticky top-0 z-10">
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
                                                    onValueChange={(value) => handleMachineChange(machine.id, 'productId', value)}
                                                >
                                                    <SelectTrigger className="w-full border-border bg-input text-foreground h-10">
                                                        <SelectValue placeholder="Select Machine" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border">
                                                        {products?.map((product: Product) => (
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
                                                    onChange={(e) => handleMachineChange(machine.id, 'serialNumber', e.target.value)}
                                                    className="h-10 rounded-md border-border bg-input text-foreground text-center"
                                                    placeholder="Serial Number"
                                                />
                                            </TableCell>
                                            <TableCell className="border-border border-r p-2">
                                                <Input
                                                    type="date"
                                                    value={machine.installationDate}
                                                    onChange={(e) => handleMachineChange(machine.id, 'installationDate', e.target.value)}
                                                    className="h-10 rounded-md border-border bg-input text-foreground text-center"
                                                    placeholder="Installation Date"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteMachineRow(machine.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <TbTrash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-start mt-3">
                    <Button
                        onClick={addMachineRow}
                        className="cursor-pointer bg-[#171717] hover:bg-[#171717] text-muted-foreground border border-dashed border-border gap-2"
                    >
                        <FaPlus /> Add Machine
                    </Button>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        className="bg-orange text-white uppercase font-semibold cursor-pointer w-[250px] hover:bg-orange/90"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}