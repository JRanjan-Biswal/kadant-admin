"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Upload } from 'lucide-react';
import { Machine } from '@/types/machine';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useSession } from 'next-auth/react';

interface Category {
    _id: string;
    name: string;
    slug: string;
    machines: Machine[];
    isActive?: boolean;
}

interface BreadcrumbItem {
    type: 'category' | 'subcategory';
    name: string;
    isActive?: boolean;
    isExpanded?: boolean;
    onClick: () => void;
}

interface UploadPhotosProps {
    clientId: string;
}

interface Part {
    _id: string;
    machine: string;
    sparePart: string;
    name: string;
}

interface SparePart {
    _id: string;
    name: string;
    parts: Part[];
}

interface UploadRow {
    id: string;
    _id?: string;
    sparePartId: string;
    partId: string;
    imageUrls: string[];
    comments: string;
    uploading: boolean;
}

interface MachineImage {
    part: {
        _id: string;
        name: string;
    }
    sparePart: {
        _id: string;
        name: string;
    }
    _id: string;
    imageUrls: string[];
    comments: string;
    machine: string;
    client: string;
    createdAt: string;
    updatedAt: string;
}

const UploadPhotos = ({ clientId }: UploadPhotosProps) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
    const [spareParts, setSpareParts] = useState<SparePart[]>([]);
    const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [machineImages, setMachineImages] = useState<MachineImage[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const handleCategoryClick = useCallback((categoryName: string) => {
        if (expandedCategory === categoryName) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(categoryName);
        }
        setActiveCategory(categoryName);
    }, [expandedCategory]);

    const fetchSpareParts = useCallback(async (machineId: string) => {
        try {
            const response = await fetch(`/api/products/spare-parts/${machineId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch spare parts');
            }

            const data = await response.json();
            setSpareParts(data);
            return data;
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            toast.error('Error fetching spare parts');
            throw error;
        }
    }, []);

    const fetchMachineImages = useCallback(async (machineId: string) => {
        try {
            const response = await fetch(`/api/clients/${clientId}/client-machines/spare-parts/spare-parts-uploaded-images/${machineId}`);
            const data = await response.json();
            console.log(data);

            setMachineImages(data);
        } catch (error) {
            console.error('Error fetching machine images:', error);
            toast.error('Error fetching machine images');
        }
    }, [clientId]);

    const handleMachineClick = useCallback(async (machineId: string) => {
        setSelectedMachineId(machineId);
        setUploadRows([]);
        setIsLoading(true);

        try {
            await fetchSpareParts(machineId);
            await fetchMachineImages(machineId);
        } catch (error) {
            console.error('Error in handleMachineClick:', error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchSpareParts, fetchMachineImages]);

    const buildBreadcrumbItems = useCallback((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [];

        categories.forEach((category) => {
            const isExpanded = expandedCategory === category.name;
            const isActive = activeCategory === category.name;

            items.push({
                type: 'category',
                name: category.name,
                isActive: isActive,
                isExpanded: isExpanded,
                onClick: () => handleCategoryClick(category.name)
            });

            if (isExpanded) {
                category.machines.forEach((machine) => {
                    items.push({
                        type: 'subcategory',
                        name: machine.name,
                        isActive: false,
                        onClick: () => {
                            handleMachineClick(machine._id);
                        }
                    });
                });
            }
        });

        return items;
    }, [categories, expandedCategory, activeCategory, handleCategoryClick, handleMachineClick]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/products/categories/with-machines');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching product categories');
        }
    };


    useEffect(() => {
        if (spareParts.length > 0 && machineImages.length > 0) {
            const newRows = machineImages.map((image: MachineImage, index: number) => {
                const sparePartExists = spareParts.some(sp => sp._id === image.sparePart._id);
                const sparePart = spareParts.find(sp => sp._id === image.sparePart._id);
                const partExists = sparePart?.parts.some(p => p._id === image.part._id);

                return {
                    id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                    _id: image._id,
                    sparePartId: sparePartExists ? image.sparePart._id : '',
                    partId: (sparePartExists && partExists) ? image.part._id : '',
                    imageUrls: image.imageUrls || [],
                    comments: image.comments || '',
                    uploading: false
                };
            });

            setUploadRows(newRows);
        } else if (spareParts.length > 0 && machineImages.length === 0) {
            setUploadRows([]);
        }
    }, [spareParts, machineImages]);

    const addNewRow = () => {
        const newRow: UploadRow = {
            id: Date.now().toString(),
            sparePartId: '',
            partId: '',
            imageUrls: [],
            comments: '',
            uploading: false
        };
        setUploadRows([...uploadRows, newRow]);
    };

    const removeRow = async (rowId: string | undefined, rowId2: string | undefined) => {
        setIsDeleting(true);
        try {

            if (rowId) {
                const response = await fetch(`/api/clients/${clientId}/client-machines/spare-parts/spare-parts-uploaded-images/${selectedMachineId}/${rowId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete image');
                }

                if (selectedMachineId) {
                    await fetchMachineImages(selectedMachineId);
                }
            }

            if (rowId2) {
                setUploadRows(uploadRows.filter(row => row.id !== rowId2));
            }
        } catch (error) {
            console.error('Error deleting row:', error);
            toast.error('Error deleting row');
        } finally {
            setIsDeleting(false);
        }
    };

    // const removeImage = async (imageUrl: string, rowId: string) => {
    //     try {
    //         const response = await fetch(`/api/clients/${clientId}/client-machines/spare-parts/spare-parts-uploaded-images/${selectedMachineId}/${rowId}/${imageUrl}`, {
    //             method: 'DELETE',
    //             body: JSON.stringify({ imageUrl }),
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to delete image');
    //         }

    //         toast.success('Image deleted successfully');
    //         if (selectedMachineId) {
    //             await fetchMachineImages(selectedMachineId);
    //         } else {
    //             toast.error('Error deleting image');
    //         }
    //     } catch (error) {
    //         console.error('Error deleting image:', error);
    //         toast.error('Error deleting image');
    //     }
    // }

    const updateRow = (rowId: string, field: keyof UploadRow, value: string | boolean) => {
        setUploadRows(prevRows =>
            prevRows.map(row =>
                row.id === rowId ? { ...row, [field]: value } : row
            )
        );
    };

    const handleSparePartChange = (rowId: string, sparePartId: string) => {
        updateRow(rowId, 'sparePartId', sparePartId);
        updateRow(rowId, 'partId', '');
    };

    const handleFileSelect = async (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        if (files.length > 4) {
            toast.error('You can only upload up to 4 images');
            return;
        }

        updateRow(rowId, 'uploading', true);

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    toast.error('Please select valid image files');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be less than 5MB');
                    return;
                }

                formData.append('files', file);
            });

            const response = await fetch('/api/upload/multiple', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload images');
            }

            const data = await response.json();
            updateRow(rowId, 'imageUrls', data.urls);
            toast.success('Images uploaded successfully');
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Error uploading images');
        } finally {
            updateRow(rowId, 'uploading', false);
        }
    };

    const handleSubmit = async () => {
        const invalidRows = uploadRows.filter(row =>
            !row.sparePartId || !row.partId || row.imageUrls.length === 0
        );

        if (invalidRows.length > 0) {
            toast.error('Please complete all required fields for each row');
            return;
        }

        if (uploadRows.length === 0) {
            toast.error('Please add at least one row');
            return;
        }

        if (!selectedMachineId) {
            toast.error('Please select a machine first');
            return;
        }

        setSubmitting(true);

        try {
            const finalData = uploadRows.map(row => {
                const sparePart = spareParts.find(sp => sp._id === row.sparePartId);
                const part = sparePart?.parts.find(p => p._id === row.partId);

                return {
                    sparePartId: row.sparePartId,
                    sparePartName: sparePart?.name || '',
                    partId: row.partId,
                    partName: part?.name || '',
                    machineId: selectedMachineId,
                    imageUrls: row.imageUrls,
                    comments: row.comments || '',
                    clientId: clientId
                };
            });

            const response = await fetch(`/api/clients/${clientId}/client-machines/spare-parts/spare-parts-uploaded-images/${selectedMachineId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData)
            });

            if (!response.ok) {
                throw new Error('Failed to save images');
            }

            toast.success('Photos uploaded successfully!');
            if (selectedMachineId) {
                await fetchMachineImages(selectedMachineId);
            }
        } catch (error) {
            console.error('Error submitting data:', error);
            toast.error('Error submitting data');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setBreadcrumbItems(buildBreadcrumbItems());
    }, [buildBreadcrumbItems]);

    return (
        categories.length > 0 && (
            <div className="relative mt-4">
                <div className="flex flex-row items-center justify-between border-b pb-4 px-4">
                    <div className="text-left">
                        <h1 className="text-2xl text-base-4 font-bold">Upload Photos</h1>
                    </div>
                </div>

                <div className="w-full bg-white">
                    <div className="relative w-full">
                        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 bg-gray-50 border-b scrollbar-track-transparent">
                            <div className="inline-flex items-center px-4 py-4 w-full">
                                <div className="flex items-center space-x-2">
                                    {breadcrumbItems.map((item, index) => (
                                        <React.Fragment key={`${item.type}-${item.name}-${index}`}>
                                            <button
                                                onClick={item.onClick}
                                                className={`px-3 py-2 text-sm cursor-pointer font-semibold rounded-md transition-all duration-200 flex items-center gap-1 flex-shrink-0 ${item.isActive
                                                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                                    : item.type === 'subcategory'
                                                        ? 'text-base-2 font-normal hover:text-base-4 hover:bg-gray-50'
                                                        : 'text-base-4 font-normal hover:text-base-4 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {item.name}
                                                {item.type === 'category' && (
                                                    item.isExpanded ? (
                                                        <ChevronLeft className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )
                                                )}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        <span className="ml-2 text-base-4">Loading parts...</span>
                    </div>
                ) : spareParts.length > 0 && (
                    <div className='bg-white p-4'>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className='text-base-4 font-bold text-lg'>Update Parts Detail</h2>
                            <Button
                                disabled={isReadOnly}
                                onClick={addNewRow}
                                className="flex items-center gap-2 cursor-pointer"
                                variant="outline"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </Button>
                        </div>

                        <div className='space-y-4'>
                            {uploadRows.map((row) => (
                                <div key={row.id} className='relative'>
                                    <div className="absolute top-0 right-0">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                {/* <Button variant="outline">Show Dialog</Button> */}
                                                <Button
                                                    disabled={isReadOnly}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the image.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removeRow(row.partId, row.id)} disabled={isDeleting}> {isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div> : 'Continue'}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
                                        <div className='lg:col-span-1'>
                                            <Label className='text-base-4 font-medium text-sm mb-1'>Spare Part *</Label>
                                            <Select
                                                defaultValue={row.sparePartId || undefined}
                                                value={row.sparePartId || undefined}
                                                onValueChange={(value: string) => {
                                                    handleSparePartChange(row.id, value);
                                                }}
                                            >
                                                <SelectTrigger size='xl' className="w-full">
                                                    <SelectValue placeholder="Select Spare Part" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {spareParts.map((sparePart) => (
                                                        <SelectItem key={sparePart._id} value={sparePart._id}>
                                                            {sparePart.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className='lg:col-span-1'>
                                            <Label className='text-base-4 font-medium text-sm mb-1'>Part Name *</Label>
                                            <Select
                                                defaultValue={row.partId || undefined}
                                                value={row.partId || undefined}
                                                onValueChange={(value: string) => {
                                                    updateRow(row.id, 'partId', value);
                                                }}
                                                disabled={!row.sparePartId}
                                            >
                                                <SelectTrigger size='xl' className="w-full">
                                                    <SelectValue placeholder="Select Part" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(spareParts
                                                        .find(sp => sp._id === row.sparePartId)
                                                        ?.parts || [])
                                                        .map((part) => (
                                                            <SelectItem key={part._id} value={part._id}>
                                                                {part.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className='lg:col-span-1'>
                                            <Label className='text-base-4 font-medium text-sm mb-1'>Preview</Label>
                                            <div className="w-full h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-x-auto">
                                                {row.imageUrls.length > 0 ? (
                                                    <div className="flex gap-2 p-2">
                                                        {row.imageUrls.map((url, index) => (
                                                            <Dialog key={index}>
                                                                <DialogTrigger asChild>
                                                                    <img
                                                                        src={`${process.env.NEXT_PUBLIC_API_HOST}${url}`}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="h-12 w-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                                                    />
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none">
                                                                    <DialogTitle className='sr-only'>Preview</DialogTitle>
                                                                    {/* <button
                                                                        onClick={() => removeImage(url, row.partId)}
                                                                        className="absolute cursor-pointer top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 z-10"
                                                                    >
                                                                        <Trash2 className='w-4 h-4' />
                                                                    </button> */}
                                                                    <div className="relative w-full h-full">
                                                                        <img
                                                                            src={`${process.env.NEXT_PUBLIC_API_HOST}${url}`}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="w-full h-full object-contain rounded-lg"
                                                                        />
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No images</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className='lg:col-span-1'>
                                            <Label className='text-base-4 font-medium text-sm mb-1 opacity-0'>Upload Images *</Label>
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileSelect(row.id, e)}
                                                    className="hidden"
                                                    id={`file-${row.id}`}
                                                    disabled={row.uploading}
                                                    multiple
                                                />
                                                <Button
                                                    variant='outline'
                                                    className='w-full h-16 cursor-pointer border-dashed border-gray-300'
                                                    onClick={() => document.getElementById(`file-${row.id}`)?.click()}
                                                    disabled={row.uploading}
                                                >
                                                    {row.uploading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className='w-4 h-4 mr-2' />
                                                            Upload Images
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className='lg:col-span-2'>
                                            <Label className='text-base-4 font-medium text-sm mb-1'>Comments</Label>
                                            <Textarea
                                                placeholder="Add comments..."
                                                value={row.comments}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateRow(row.id, 'comments', e.target.value)}
                                                className="h-16"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Submit Button */}
                        {uploadRows.length > 0 && (
                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={handleSubmit}
                                    className="px-8 cursor-pointer"
                                    disabled={submitting || isReadOnly}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        )}

                        {uploadRows.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No rows added yet. Click &quot;Add Row&quot; to start adding parts.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    );
};

export default UploadPhotos;