"use client";

import { format } from "date-fns";
import EditVisitDetails from "@/app/components/Modals/EditVisitDetails";
import SiteVisitSelector from "@/app/components/Modals/SiteVisitSelector";
import AddToCalendar from "@/app/components/AddToCalendar";
import { useEffect, useState, useCallback } from "react";
import { SiteVisit } from "@/types/visit-details";
import DownloadAuditReport from "@/app/components/DownloadAuditReport";

interface VisitDetailsPageProps {
    clientID: string;
    initialData: SiteVisit;
}

const VisitDetailsPage = ({ clientID, initialData }: VisitDetailsPageProps) => {
    const [latestSiteVisitDetails, setLatestSiteVisitDetails] = useState<SiteVisit>(initialData);
    const [shouldRefreshLogs, setShouldRefreshLogs] = useState(false);

    const fetchLatestSiteVisitDetails = useCallback(async (clientID: string) => {
        try {
            const response = await fetch(`/api/clients/${clientID}/site-visits/latest`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            });
            const data = await response.json();
            setLatestSiteVisitDetails(data as SiteVisit);
        } catch (error) {
            console.log(error);
        }
    }, []);

    const onAddSiteVisit = () => {
        fetchLatestSiteVisitDetails(clientID);
    }

    useEffect(() => {
        fetchLatestSiteVisitDetails(clientID);
    }, [clientID, fetchLatestSiteVisitDetails]);

    return (
        <div className="relative mt-4">
            <div className="flex flex-row items-center justify-between border-b pb-4 px-4">
                <div className="text-left">
                    <h1 className="text-2xl text-base-4 font-bold">Visit Details</h1>
                </div>
                <div className="text-right flex flex-row gap-4">
                    {latestSiteVisitDetails?.auditReportUrl && <DownloadAuditReport auditReportUrl={`${process.env.NEXT_PUBLIC_API_HOST}${latestSiteVisitDetails?.auditReportUrl}`} />}
                    <SiteVisitSelector
                        onRefreshLogs={() => {
                            setShouldRefreshLogs(false);
                        }}
                        shouldRefreshLogs={shouldRefreshLogs}
                        clientID={clientID}
                        minSiteVisits={2}
                    />
                    <EditVisitDetails clientID={clientID} onAddSiteVisit={() => {
                        setShouldRefreshLogs(true);
                        onAddSiteVisit();
                    }} />
                </div>
            </div>

            <div className="grid grid-cols-3">
                <div className="col-span-1 px-4 py-[50px] border-r border-b border-base-1">
                    <p className="text-sm text-base-3">Last Visit On</p>
                    <p className="text-base text-base-4 font-semibold">{latestSiteVisitDetails?.lastVisitOn ? format(latestSiteVisitDetails?.lastVisitOn, "dd MMM yyyy") : "N/A"}</p>
                </div>
                <div className="col-span-2 px-4 py-[50px] border-r border-b border-base-1">
                    <p className="text-sm text-base-3">Engineer Name</p>
                    <p className="text-base text-base-4 font-semibold">{latestSiteVisitDetails?.engineer?.name || "N/A"}</p>
                </div>
                <div className="col-span-1 px-4 py-[50px] border-r border-b border-base-1">
                    <p className="text-sm text-base-3">Client Representative</p>
                    <p className="text-base text-base-4 font-semibold">{latestSiteVisitDetails?.clientRepresentative || "N/A"}</p>
                </div>
                <div className="col-span-2 px-4 py-[50px] border-r border-b border-base-1">
                    <p className="text-sm text-base-3">Visit Type</p>
                    <p className="text-base text-base-4 font-semibold">{latestSiteVisitDetails?.visitType?.join(", ") || "N/A"}</p>
                </div>
            </div>

            <div className="bg-[#F5F5F5] h-[155px] flex flex-row gap-[100px] items-center p-4">
                <div className="flex flex-col justify-between">
                    <p className="text-sm text-[#D45815] font-semibold">Next Scheduled Visit</p>
                    <h1 className="text-2xl text-base-4 font-bold">{latestSiteVisitDetails?.nextScheduledVisit ? format(latestSiteVisitDetails?.nextScheduledVisit, "dd MMM yyyy") : "N/A"}</h1>
                </div>
                <div>
                    <AddToCalendar clientName={latestSiteVisitDetails?.client?.name as string || ""} date={latestSiteVisitDetails?.nextScheduledVisit as string || ""} />
                </div>
            </div>
        </div>
    );
}

export default VisitDetailsPage;