"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FaRegTrashCan } from "react-icons/fa6";
import { SiteVisit } from "@/types/visit-details";
import { GoLog } from "react-icons/go";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSession } from "next-auth/react";

interface SiteVisitSelectorProps {
    clientID: string;
    minSiteVisits?: number;
    shouldRefreshLogs?: boolean;
    onRefreshLogs: () => void;
}

export default function SiteVisitSelector({ clientID, minSiteVisits = 0, shouldRefreshLogs = false, onRefreshLogs }: SiteVisitSelectorProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const getSiteVisits = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/clients/${clientID}/site-visits`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSiteVisits(data);
            onRefreshLogs();
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    }, [clientID, shouldRefreshLogs]);

    useEffect(() => {
        getSiteVisits();
    }, [getSiteVisits, shouldRefreshLogs]);

    const handleDelete = async (visitID: string) => {
        if (confirm("Are you sure you want to delete this site visit?")) {
            try {
                const response = await fetch(`/api/clients/${clientID}/site-visits?visitID=${visitID}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                toast.success("Site visit deleted successfully");
                getSiteVisits();
            } catch (error) {
                console.error("Error deleting site visit:", error);
                toast.error("Failed to delete site visit");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {
                    siteVisits.length >= minSiteVisits && (<Button variant="ghost" className="text-base-4 cursor-pointer">
                        <GoLog className="ml-2" /> Site Visit Logs
                    </Button>)
                }
            </DialogTrigger>
            <DialogContent className="w-[50%] sm:w-[50%] sm:max-w-[50%]" showCloseButton={true}>
                <DialogHeader>
                    <DialogTitle>Select Site Visit</DialogTitle>
                </DialogHeader>

                <div className="max-h-[200px] overflow-y-auto border-base-2 border-b">
                    <Table className="border-[#96A5BA] border mt-4">
                        <TableHeader className="bg-base-1 text-base-4">
                            <TableRow>
                                <TableHead className="border-[#96A5BA] border font-semibold">Visited Date</TableHead>
                                <TableHead className="text-center border-[#96A5BA] border font-semibold">Engineer</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                siteVisits?.map((siteVisit: SiteVisit) => (
                                    <TableRow key={siteVisit._id}>
                                        <TableCell className="font-medium border-[#96A5BA] border">{siteVisit?.lastVisitOn ? format(new Date(siteVisit.lastVisitOn), "dd MMMM yyyy") : "NA"}</TableCell>
                                        <TableCell className="text-center border-[#96A5BA] border">{siteVisit?.engineer?.name || "NA"}</TableCell>
                                        <TableCell className="text-center border-[#96A5BA] border">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button onClick={() => router.push(`/${clientID}/visit-details/${siteVisit._id}`)} variant="ghost" className="text-base-4 cursor-pointer">
                                                        <GoLog className="ml-2" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View Site Visit Details</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button disabled={isReadOnly} variant="ghost" onClick={() => handleDelete(siteVisit._id)} className="text-base-4 cursor-pointer">
                                                        <FaRegTrashCan className="ml-2 text-red-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete Log</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter>
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
            </DialogContent>
        </Dialog >
    );
}