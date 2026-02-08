"use client";

import { format, differenceInDays, parseISO } from "date-fns";
import EditVisitDetails from "@/app/components/Modals/EditVisitDetails";
import SiteVisitSelector from "@/app/components/Modals/SiteVisitSelector";
import AddToCalendar from "@/app/components/AddToCalendar";
import { useEffect, useState, useCallback } from "react";
import { SiteVisit } from "@/types/visit-details";
import { FaPlus } from "react-icons/fa6";
import { CiCalendarDate } from "react-icons/ci";
import { LuCalendar } from "react-icons/lu";
import { HiOutlineClock } from "react-icons/hi2";
import { HiOutlineUser } from "react-icons/hi2";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { HiOutlineEye } from "react-icons/hi2";
import { TbEdit } from "react-icons/tb";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface VisitDetailsPageProps {
    clientID: string;
    initialData: SiteVisit;
}

interface ScheduledVisit extends SiteVisit {
    daysUntil?: number;
}

const VisitDetailsPage = ({ clientID, initialData }: VisitDetailsPageProps) => {
    const router = useRouter();
    const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
    const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
    const [visitHistory, setVisitHistory] = useState<SiteVisit[]>([]);
    const [filterPeriod, setFilterPeriod] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    const fetchSiteVisits = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/clients/${clientID}/site-visits`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            });
            const data = await response.json();
            setSiteVisits(data);

            // Filter scheduled visits (future dates)
            const now = new Date();
            const scheduled = data
                .filter((visit: SiteVisit) => {
                    if (!visit.nextScheduledVisit) return false;
                    const scheduledDate = parseISO(visit.nextScheduledVisit);
                    return scheduledDate >= now;
                })
                .map((visit: SiteVisit) => {
                    const scheduledDate = parseISO(visit.nextScheduledVisit);
                    const daysUntil = differenceInDays(scheduledDate, now);
                    return { ...visit, daysUntil };
                })
                .sort((a: ScheduledVisit, b: ScheduledVisit) => {
                    if (!a.nextScheduledVisit || !b.nextScheduledVisit) return 0;
                    return parseISO(a.nextScheduledVisit).getTime() - parseISO(b.nextScheduledVisit).getTime();
                });
            setScheduledVisits(scheduled);

            // Filter visit history (past visits)
            const history = data
                .filter((visit: SiteVisit) => {
                    if (!visit.lastVisitOn) return false;
                    const visitDate = parseISO(visit.lastVisitOn);
                    return visitDate < now;
                })
                .sort((a: SiteVisit, b: SiteVisit) => {
                    if (!a.lastVisitOn || !b.lastVisitOn) return 0;
                    return parseISO(b.lastVisitOn).getTime() - parseISO(a.lastVisitOn).getTime();
                });
            setVisitHistory(history);
        } catch (error) {
            console.error("Error fetching site visits:", error);
        } finally {
            setIsLoading(false);
        }
    }, [clientID]);

    useEffect(() => {
        fetchSiteVisits();
    }, [fetchSiteVisits]);

    const handleFilterChange = (period: string) => {
        setFilterPeriod(period);
    };

    const getFilteredHistory = () => {
        if (filterPeriod === "all") return visitHistory;
        
        const now = new Date();
        const periodMap: { [key: string]: number } = {
            "3": 3,
            "6": 6,
            "12": 12
        };
        const months = periodMap[filterPeriod] || 12;
        const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        
        return visitHistory.filter((visit) => {
            if (!visit.lastVisitOn) return false;
            const visitDate = parseISO(visit.lastVisitOn);
            return visitDate >= cutoffDate;
        });
    };

    const getVisitTypeBadge = (visitType: string[]) => {
        if (!visitType || visitType.length === 0) return null;
        const type = visitType[0];
        
        if (type === "Process Audit") {
            return (
                <div className="bg-[rgba(255,105,0,0.2)] flex h-[25px] items-center px-[12px] py-[4px] rounded-full">
                    <p className="text-[#ff8904] text-[14px] leading-[14px] font-normal">Process Audit</p>
                </div>
            );
        } else if (type === "Mechanical Audit") {
            return (
                <div className="bg-[rgba(43,127,255,0.2)] flex h-[25px] items-center px-[12px] py-[4px] rounded-full">
                    <p className="text-[#51a2ff] text-[14px] leading-[14px] font-normal">Mechanical Audit</p>
                </div>
            );
        }
        return null;
    };

    const handleViewDetail = (visitID: string) => {
        router.push(`/${clientID}/visit-details/${visitID}`);
    };

    const handleEdit = (visitID: string) => {
        // Handle edit action - you may want to open a modal or navigate
        console.log("Edit visit:", visitID);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex h-[70px] items-center justify-between">
                    <div className="w-[733px]">
                        <h1 className="text-[28px] leading-[42px] text-[#f3f4f6] font-normal capitalize">
                            Visit Details
                        </h1>
                    </div>
                    <div className="flex-1 flex gap-3 items-center justify-end">
                        <EditVisitDetails clientID={clientID} onAddSiteVisit={fetchSiteVisits}>
                            <Button 
                                className="bg-[#1a1a1a] flex gap-2 items-center px-4 py-2 rounded-[10px] shrink-0 hover:bg-[#262626] border-0 h-auto text-white"
                                variant="ghost"
                            >
                                <FaPlus className="w-4 h-4" />
                                <span className="text-base leading-6">Add Visit Data</span>
                            </Button>
                        </EditVisitDetails>
                        <EditVisitDetails clientID={clientID} onAddSiteVisit={fetchSiteVisits}>
                            <Button 
                                className="bg-[#1a1a1a] flex gap-2 items-center px-4 py-2 rounded-[10px] shrink-0 hover:bg-[#262626] border-0 h-auto text-white"
                                variant="ghost"
                            >
                                <LuCalendar className="w-4 h-4" />
                                <span className="text-base leading-6">Schedule Next Visit</span>
                            </Button>
                        </EditVisitDetails>
                    </div>
                </div>

                {/* Upcoming Scheduled Visits Section */}
                <div className="bg-[#0d0d0d] border border-[#262626] flex flex-col gap-3 pb-3 rounded-[10px]">
                    <div className="bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-[rgba(128,52,0,0.2)] border-b border-[#262626] flex flex-col items-start pl-5 pr-6 py-3">
                        <div className="flex h-[28px] items-center justify-between w-full">
                            <h2 className="text-[20px] leading-[28px] text-white font-normal">
                                Upcoming Scheduled Visits
                            </h2>
                            <p className="text-[#a1a1a1] text-[14px] leading-[20px]">
                                {scheduledVisits.length} visits scheduled
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center px-3">
                        {scheduledVisits.slice(0, 4).map((visit, index) => {
                            const scheduledDate = visit.nextScheduledVisit ? parseISO(visit.nextScheduledVisit) : null;
                            const timeStr = scheduledDate ? format(scheduledDate, "h:mm a") : "";
                            const dateStr = scheduledDate ? format(scheduledDate, "dd MMM yyyy") : "";
                            
                            return (
                                <div
                                    key={visit._id || index}
                                    className="bg-[rgba(38,38,38,0.3)] border border-[#404040] flex flex-col gap-3 items-start p-[21px] rounded-[10px] w-[270.25px]"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="bg-[rgba(38,38,38,0.5)] border border-[rgba(64,64,64,0.5)] rounded-full h-[37px] w-[37px] flex items-center justify-center">
                                            <p className="text-[#ff6900] text-[12px] leading-[16px]">
                                                {visit.daysUntil !== undefined ? `${visit.daysUntil}d` : "3d"}
                                            </p>
                                        </div>
                                        <div className="bg-[rgba(0,201,80,0.1)] border border-[rgba(0,201,80,0.2)] h-[30px] rounded-full flex gap-1.5 items-center px-[13px] py-0.5">
                                            <div className="bg-[#05df72] opacity-98 rounded-full w-1.5 h-1.5" />
                                            <p className="text-[#05df72] text-[12px] leading-[16px] capitalize">confirmed</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 h-[52px]">
                                        <p className="text-[18px] leading-[28px] text-white">{dateStr}</p>
                                        <div className="flex gap-1.5 h-5 items-center">
                                            <HiOutlineClock className="w-3.5 h-3.5 text-[#d4d4d4]" />
                                            <p className="text-[#d4d4d4] text-[14px] leading-5">{timeStr}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 h-[38px]">
                                        <div className="flex gap-1.5 h-4 items-center">
                                            <HiOutlineUser className="w-3 h-3 text-[#a1a1a1]" />
                                            <p className="text-[#a1a1a1] text-[12px] leading-4">
                                                {visit.assignedEngineer?.name || visit.engineer?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 h-4 items-center">
                                            <HiOutlineDocumentText className="w-3 h-3 text-[#a1a1a1]" />
                                            <p className="text-[#a1a1a1] text-[12px] leading-4">
                                                {visit.visitType?.[0] || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (visit.nextScheduledVisit && visit.client?.name) {
                                                window.open(
                                                    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Site+Visit+@+${visit.client.name}&dates=${format(parseISO(visit.nextScheduledVisit), "yyyyMMdd")}/${format(parseISO(visit.nextScheduledVisit), "yyyyMMdd")}&desc=Discuss+Audit+Details`,
                                                    "_blank"
                                                );
                                            }
                                        }}
                                        className="bg-[#ff6900] h-9 w-full rounded-[10px] flex items-center justify-center gap-2"
                                    >
                                        <CiCalendarDate className="w-4 h-4 text-white" />
                                        <p className="text-white text-[14px] leading-5">Add to Calendar</p>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Visit History Section */}
            <div className="flex flex-col gap-6">
                <div className="flex h-[28px] items-center justify-between">
                    <h3 className="text-[20px] leading-[28px] text-white font-normal">Visit History</h3>
                    <div className="flex gap-2 items-center w-[364.734px]">
                        <p className="text-[#737373] text-[14px] leading-5">Filter:</p>
                        <button
                            onClick={() => handleFilterChange("3")}
                            className={`h-7 rounded px-[11px] py-[3px] ${
                                filterPeriod === "3" ? "bg-[#ff6900]" : "bg-[#262626]"
                            }`}
                        >
                            <p className={`text-[14px] leading-5 text-center ${
                                filterPeriod === "3" ? "text-white" : "text-[#a1a1a1]"
                            }`}>3 Months</p>
                        </button>
                        <button
                            onClick={() => handleFilterChange("6")}
                            className={`h-7 rounded px-[11px] py-[3px] ${
                                filterPeriod === "6" ? "bg-[#ff6900]" : "bg-[#262626]"
                            }`}
                        >
                            <p className={`text-[14px] leading-5 text-center ${
                                filterPeriod === "6" ? "text-white" : "text-[#a1a1a1]"
                            }`}>6 Months</p>
                        </button>
                        <button
                            onClick={() => handleFilterChange("12")}
                            className={`h-7 rounded flex-1 px-[11px] py-[3px] ${
                                filterPeriod === "12" ? "bg-[#ff6900]" : "bg-[#262626]"
                            }`}
                        >
                            <p className={`text-[14px] leading-5 text-center ${
                                filterPeriod === "12" ? "text-white" : "text-[#a1a1a1]"
                            }`}>12 Months</p>
                        </button>
                        <button
                            onClick={() => handleFilterChange("all")}
                            className={`h-7 rounded px-3 py-[3px] ${
                                filterPeriod === "all" ? "bg-[#ff6900]" : "bg-[#262626]"
                            }`}
                        >
                            <p className={`text-[14px] leading-5 text-center ${
                                filterPeriod === "all" ? "text-white" : "text-[#a1a1a1]"
                            }`}>All</p>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex flex-col">
                    {/* Table Header */}
                    <div className="bg-[#171717] border border-[#262626] flex items-center rounded-t-[10px]">
                        <div className="flex items-center self-stretch w-[85px]">
                            <div className="flex h-full items-center justify-center px-9 py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Sr.no
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center self-stretch">
                            <div className="flex h-full items-center justify-center px-6 py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Scheduled Date
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center self-stretch w-[171px]">
                            <div className="flex h-full items-center justify-center px-6 py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Engineer Name
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center self-stretch w-[144px]">
                            <div className="flex h-full items-center justify-center px-[33px] py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Client
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center self-stretch w-[155px]">
                            <div className="flex h-full items-center justify-center px-3 py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Visit Type
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center self-stretch">
                            <div className="flex h-full items-center justify-center px-[68px] py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Visit detail
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-1 items-center self-stretch">
                            <div className="flex flex-1 h-full items-center justify-center px-6 py-4">
                                <p className="text-[#a1a1a1] text-[14px] leading-5 tracking-[0.7px] uppercase font-bold">
                                    Actions
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table Rows */}
                    {getFilteredHistory().map((visit, index) => {
                        const visitDate = visit.lastVisitOn ? parseISO(visit.lastVisitOn) : null;
                        const dateStr = visitDate ? format(visitDate, "dd MMM yyyy") : "N/A";
                        
                        return (
                            <div
                                key={visit._id || index}
                                className="bg-[#0d0d0d] border-b border-l border-r border-[#262626] flex items-center"
                            >
                                <div className="flex items-center self-stretch w-[85px]">
                                    <div className="flex h-full items-center justify-center px-9 py-4">
                                        <p className="text-[#d4d4d4] text-base leading-6">{index + 1}.</p>
                                    </div>
                                </div>
                                <div className="flex items-center self-stretch">
                                    <div className="flex h-full items-center justify-center px-[46px] py-4">
                                        <p className="text-[#d4d4d4] text-base leading-6">{dateStr}</p>
                                    </div>
                                </div>
                                <div className="flex items-center self-stretch w-[171px]">
                                    <div className="flex h-full items-center justify-center px-6 py-4">
                                        <p className="text-[#d4d4d4] text-base leading-6">
                                            {visit.engineer?.name || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center self-stretch w-[144px]">
                                    <div className="flex h-full items-center justify-center px-[33px] py-4">
                                        <p className="text-[#d4d4d4] text-base leading-6">
                                            {visit.client?.name || "N/A"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center self-stretch w-[155px]">
                                    <div className="flex h-full items-center justify-center px-3 py-4">
                                        {getVisitTypeBadge(visit.visitType || [])}
                                    </div>
                                </div>
                                <div className="flex items-center self-stretch">
                                    <div className="flex h-full items-start px-[68px] py-4">
                                        <button
                                            onClick={() => handleViewDetail(visit._id)}
                                            className="flex gap-2 h-5 items-center"
                                        >
                                            <HiOutlineEye className="w-5 h-5 text-[#607797]" />
                                            <p className="text-[#607797] text-[14px] leading-5 font-medium">Detail</p>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-1 items-center self-stretch">
                                    <div className="flex flex-1 h-full items-center justify-center px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(visit._id)}
                                            className="flex gap-2 h-5 items-center"
                                        >
                                            <TbEdit className="w-4 h-4 text-[#ff6900]" />
                                            <p className="text-[#ff6900] text-[14px] leading-5 font-medium">Edit</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VisitDetailsPage;
