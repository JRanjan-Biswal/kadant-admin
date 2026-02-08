"use client";

import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FaPlus } from "react-icons/fa6";
import { LuCalendar } from "react-icons/lu";
import { X } from "lucide-react";

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

interface ScheduleNextVisitProps {
    clientID: string;
    onAddSiteVisit: () => void;
    children?: React.ReactNode;
}

const visitDetailsSchema = z.object({
    nextScheduledVisit: z.string().min(1, "Next Visit Date is required"),
    visitType: z.array(z.string()).min(1, "At least one Visit Type must be selected"),
    assignedEngineer: z.string().min(1, "Assign Engineer is required"),
    clientRepresentative: z.string().min(1, "Client Representative is required"),
    clientRepresentativeDesignation: z.string().optional(),
});

type VisitDetailsFormData = z.infer<typeof visitDetailsSchema>;

export default function ScheduleNextVisit({ clientID, onAddSiteVisit, children }: ScheduleNextVisitProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<Admin[]>([]);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset
    } = useForm<VisitDetailsFormData>({
        resolver: zodResolver(visitDetailsSchema),
        defaultValues: {
            clientRepresentative: '',
            visitType: [],
            clientRepresentativeDesignation: '',
            assignedEngineer: '',
            nextScheduledVisit: '',
        }
    });

    const visitType = watch("visitType") || [];

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
                nextScheduledVisit: data.nextScheduledVisit,
                visitType: data.visitType,
                assignedEngineer: data.assignedEngineer,
                clientRepresentative: data.clientRepresentative,
                clientRepresentativeDesignation: data.clientRepresentativeDesignation || '',
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
            toast.success("Visit scheduled successfully");
            setIsOpen(false);
            router.refresh();
            reset();
            onAddSiteVisit();
        } catch (error) {
            console.error("Error submitting data:", error);
            toast.error("Failed to schedule the visit");
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldErrorClass = (hasError: boolean) => {
        return hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-[#404040]";
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button disabled={isReadOnly} variant="ghost" className="text-base-4 cursor-pointer">
                        <FaPlus className="ml-2" /> Log Site Visit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent 
                className="bg-[#171717] border border-[#262626] rounded-[10px] p-0 w-[894px] max-w-[894px] h-[700px] max-h-[700px] overflow-hidden"
                showCloseButton={false}
            >
                {/* Custom Header */}
                <div className="bg-[#171717] border-b border-[#262626] flex h-[89px] items-center justify-between px-8">
                    <div className="flex gap-3 items-center">
                        <div className="bg-[rgba(255,105,0,0.2)] rounded-[10px] w-10 h-10 flex items-center justify-center">
                            <FaPlus className="w-5 h-5 text-[#ff6900]" />
                        </div>
                        <h2 className="text-white text-[24px] leading-[32px] font-lato font-normal">
                            Schedule Next Visit
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-6 h-6 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[611px] px-8 pt-8">
                    {/* Next Visit Date */}
                    <div className="flex flex-col gap-[8px] mb-6">
                        <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                            Next Visit Date *
                        </Label>
                        <div className="relative">
                            <Controller
                                name="nextScheduledVisit"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="date"
                                        {...field}
                                        className={`bg-[#262626] border ${getFieldErrorClass(!!errors.nextScheduledVisit)} h-[50px] rounded-[10px] px-4 pr-12 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5`}
                                    />
                                )}
                            />
                            <LuCalendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1a1] pointer-events-none" />
                        </div>
                        {errors.nextScheduledVisit && (
                            <p className="text-red-500 text-sm">{errors.nextScheduledVisit.message as string}</p>
                        )}
                    </div>

                    {/* Visit Type */}
                    <div className="flex flex-col gap-[12px] mb-6">
                        <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                            Visit Type *
                        </Label>
                        <div className="flex gap-4">
                            <div className="flex gap-3 items-center">
                                <Checkbox
                                    id="process-audit"
                                    checked={visitType.includes('Process Audit')}
                                    onCheckedChange={() => handleVisitTypeChange("Process Audit", visitType)}
                                    className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#262626] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="process-audit" className="text-white text-[16px] leading-[24px] font-lato font-normal cursor-pointer">
                                    Process Audit
                                </Label>
                            </div>
                            <div className="flex gap-3 items-center">
                                <Checkbox
                                    id="mechanical-audit"
                                    checked={visitType.includes('Mechanical Audit')}
                                    onCheckedChange={() => handleVisitTypeChange("Mechanical Audit", visitType)}
                                    className="w-5 h-5 rounded-[4px] data-[state=checked]:bg-[#d45815] data-[state=checked]:border-[#d45815] border-2 border-[#262626] data-[state=checked]:text-white"
                                />
                                <Label htmlFor="mechanical-audit" className="text-white text-[16px] leading-[24px] font-lato font-normal cursor-pointer">
                                    Mechanical Audit
                                </Label>
                            </div>
                        </div>
                        {errors.visitType && (
                            <p className="text-red-500 text-sm">{errors.visitType.message as string}</p>
                        )}
                    </div>

                    {/* Assign Engineer and Client Representative */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                Assign Engineer *
                            </Label>
                            <Controller
                                name="assignedEngineer"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={`bg-[#262626] border ${getFieldErrorClass(!!errors.assignedEngineer)} h-[47px] rounded-[10px] text-white text-[16px] font-lato focus:ring-0`}>
                                            <SelectValue placeholder="Select Engineer" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#262626] border-[#404040]">
                                            {users?.map((user: Admin) => (
                                                <SelectItem key={user._id} value={user._id} className="text-white hover:bg-[#404040]">
                                                    {user?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.assignedEngineer && (
                                <p className="text-red-500 text-sm">{errors.assignedEngineer.message as string}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                                Client Representative *
                            </Label>
                            <Controller
                                name="clientRepresentative"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        {...field}
                                        className={`bg-[#262626] border ${getFieldErrorClass(!!errors.clientRepresentative)} h-[50px] rounded-[10px] px-4 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0`}
                                        placeholder="Enter client name"
                                    />
                                )}
                            />
                            {errors.clientRepresentative && (
                                <p className="text-red-500 text-sm">{errors.clientRepresentative.message as string}</p>
                            )}
                        </div>
                    </div>

                    {/* Client Designation */}
                    <div className="flex flex-col gap-[8px] mb-6">
                        <Label className="text-[#a1a1a1] text-[16px] leading-[20px] font-lato font-normal">
                            Client Designation
                        </Label>
                        <Controller
                            name="clientRepresentativeDesignation"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    {...field}
                                    className={`bg-[#262626] border ${getFieldErrorClass(!!errors.clientRepresentativeDesignation)} h-[50px] rounded-[10px] px-4 text-white text-[16px] font-lato placeholder:text-[#525252] focus-visible:ring-0 focus-visible:ring-offset-0`}
                                    placeholder="Engineer"
                                />
                            )}
                        />
                    </div>

                    {/* Note Section */}
                    <div className="bg-[rgba(255,105,0,0.1)] border border-[rgba(255,105,0,0.3)] rounded-[10px] p-4 mb-6">
                        <p className="text-[#ff8904] text-[14px] leading-[20px] font-lato">
                            <span className="font-bold">Note:</span>
                            <span> This visit will be scheduled for future. You can set reminders and add it to your calendar after scheduling.</span>
                        </p>
                    </div>

                    {/* Footer Buttons */}
                    <DialogFooter className="border-t border-[#262626] pt-6 pb-0 mt-auto">
                        <div className="flex gap-4 justify-end w-full">
                            <Button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="border border-[#404040] bg-transparent hover:bg-[#262626] text-[#d4d4d4] text-[16px] leading-[24px] font-lato font-bold px-[25px] py-[13px] rounded-[10px] h-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#ff6900] hover:bg-[#ff6900]/90 text-white text-[16px] leading-[24px] font-lato font-bold px-8 py-[13px] rounded-[10px] h-auto"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Schedule Visit"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}