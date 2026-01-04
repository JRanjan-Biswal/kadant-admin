"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaPlus } from "react-icons/fa6";


import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Admin } from "@/types/admin";
import { useSession } from "next-auth/react";

interface EditVisitDetailsProps {
    clientID: string;
    onAddSiteVisit: () => void;
}

const visitDetailsSchema = z.object({
    lastVisitOn: z.string().optional(),
    engineer: z.string().optional(),
    clientRepresentative: z.string().optional(),
    visitType: z.array(z.string()).optional(),
    clientRepresentativeDesignation: z.string().optional(),
    assignedEngineer: z.string().optional(),
    nextScheduledVisit: z.string().optional(),
    auditReportUrl: z.string().optional()
});

type VisitDetailsFormData = z.infer<typeof visitDetailsSchema>;

export default function EditVisitDetails({ clientID, onAddSiteVisit }: EditVisitDetailsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<Admin[]>([]);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
        reset
    } = useForm<VisitDetailsFormData>({
        resolver: zodResolver(visitDetailsSchema),
        defaultValues: {
            lastVisitOn: '',
            engineer: '',
            clientRepresentative: '',
            visitType: [],
            clientRepresentativeDesignation: '',
            assignedEngineer: '',
            nextScheduledVisit: '',
            auditReportUrl: ''
        }
    });

    const handleVisitTypeChange = (type: string, currentVisitTypes: string[]) => {
        if (currentVisitTypes.includes(type)) {
            setValue("visitType", currentVisitTypes.filter(t => t !== type));
        } else {
            setValue("visitType", [...currentVisitTypes, type]);
        }
    };

    const getUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/users`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getUsers();
    }, []);

    const onSubmit = async (data: VisitDetailsFormData) => {
        try {
            setIsLoading(true);
            const updatedData = {
                ...data,
                engineer: data.engineer ? data.engineer : null,
                assignedEngineer: data.assignedEngineer ? data.assignedEngineer : null,
                auditReportUrl: uploadedFileUrl
            };

            const response = await fetch(`/api/clients/${clientID}/site-visits`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();
            toast.success("Site visit logged successfully");
            setIsOpen(false);
            router.refresh();
            reset();
            onAddSiteVisit();
        } catch (error) {
            console.error("Error submitting data:", error);
            toast.error("Failed to log the site visit");
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldErrorClass = (hasError: boolean) => {
        return hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-base-2 border";
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/audit-report', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setUploadedFileUrl(data.url);
            toast.success('File uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={isReadOnly} variant="ghost" className="text-base-4 cursor-pointer">
                    <FaPlus className="ml-2" /> Log Site Visit
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[50%] sm:w-[50%] sm:max-w-[50%]" showCloseButton={true}>
                <DialogHeader>
                    <DialogTitle>Edit Client & Machine Details</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-2 border-base-2 border-b pb-[20px] gap-4 mt-[20px]">
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Last Visit On</Label>
                            <Controller
                                name="lastVisitOn"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="date"
                                        {...field}
                                        className={`h-12 rounded-sm ${getFieldErrorClass(!!errors.lastVisitOn)}`}
                                        placeholder="Last Visit On"
                                    />
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Engineer Name</Label>
                            <Controller
                                name="engineer"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger size="lg" className={`w-full ${getFieldErrorClass(!!errors.engineer)}`}>
                                            <SelectValue placeholder="Select Engineer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users?.map((user: Admin) => (
                                                <SelectItem key={user._id} value={user._id}>
                                                    {user?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-base-4 mb-[12px]">Visit Type</Label>
                            <Controller
                                name="visitType"
                                control={control}
                                render={({ field }) => (
                                    <div className={`flex flex-row gap-4 p-2 pl-0 rounded ${errors.visitType ? 'border border-red-500' : 'border border-transparent'}`}>
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="process-audit"
                                                checked={field.value?.includes('Process Audit')}
                                                onCheckedChange={() => handleVisitTypeChange("Process Audit", field.value || [])}
                                            />
                                            <Label htmlFor="process-audit">Process Audit</Label>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="mechanical-audit"
                                                checked={field.value?.includes('Mechanical Audit')}
                                                onCheckedChange={() => handleVisitTypeChange("Mechanical Audit", field.value || [])}
                                            />
                                            <Label htmlFor="mechanical-audit">Mechanical Audit</Label>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-base-2 border-b pb-8 gap-4 mt-[30px]">
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Client Representative</Label>
                            <Controller
                                name="clientRepresentative"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        {...field}
                                        className={`h-12 rounded-sm ${getFieldErrorClass(!!errors.clientRepresentative)}`}
                                        placeholder="Enter Client Representative"
                                    />
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Designation</Label>
                            <Controller
                                name="clientRepresentativeDesignation"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        {...field}
                                        className={`h-12 rounded-sm ${getFieldErrorClass(!!errors.clientRepresentativeDesignation)}`}
                                        placeholder="Enter Designation"
                                    />
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Next Scheduled Visit</Label>
                            <Controller
                                name="nextScheduledVisit"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="date"
                                        {...field}
                                        className={`h-12 rounded-sm ${getFieldErrorClass(!!errors.nextScheduledVisit)}`}
                                        placeholder="Next Scheduled Visit"
                                    />
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Assigned Engineer</Label>
                            <Controller
                                name="assignedEngineer"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger size="lg" className={`w-full ${getFieldErrorClass(!!errors.assignedEngineer)}`}>
                                            <SelectValue placeholder="Select Assigned Engineer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users?.map((user: Admin) => (
                                                <SelectItem key={user._id} value={user._id}>
                                                    {user?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="col-span-1">
                            <Label className="text-base-4 mb-[10px]">Upload Audit Report</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="h-12 rounded-sm"
                                />
                                {isUploading && (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        <span className="text-sm">Uploading...</span>
                                    </div>
                                )}
                                {uploadedFileUrl && (
                                    <div className="text-sm text-green-600">
                                        File uploaded successfully
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isLoading}
                                className="w-full bg-base-4 text-white uppercase font-semibold cursor-pointer w-[250px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}