"use client";

import { Button } from "@/components/ui/button";
import { IoMdNotificationsOutline } from "react-icons/io";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react";

export default function Notifications() {
    const [notifications] = useState([
        {
            id: 1,
            status: "success",
            title: "Update Complete!",
            description: "Your machine part details have been updated successfully.",
            createdAt: new Date(),
        },
        {
            id: 2,
            status: "info",
            title: "Reminder!",
            description: "Your next scheduled visit is on 10th June 2025.",
            createdAt: new Date(),
        },
        {
            id: 3,
            status: "error",
            title: "Update Failed!",
            description: "One or more of your images couldn't be uploaded. Please try again.",
            createdAt: new Date(),
        },
        {
            id: 4,
            status: "warning",
            title: "Replacement Due Soon!",
            description: "Rotor has crossed recommended running hours.",
            createdAt: new Date(),
        },
    ]);

    const getNotificationColor = (status: string) => {
        switch (status) {
            case "success":
                return {
                    bg: "bg-[#F0F9F4]",
                    title: "text-[#00A82D]",
                    text: "text-[#727272]",
                    border: "border-[#C5DBCA]",
                };
            case "info":
                return {
                    bg: "bg-[#E2EAF7]",
                    title: "text-[#227CD9]",
                    text: "text-[#727272]",
                    border: "border-[#C5CCDB]",
                };
            case "error":
                return {
                    bg: "bg-[#FAEFE9]",
                    title: "text-[#BF1E21]",
                    text: "text-[#727272]",
                    border: "border-[#CD9B9B]",
                };
            case "warning":
                return {
                    bg: "bg-[#FFF5E2]",
                    title: "text-[#D98E00]",
                    text: "text-[#727272]",
                    border: "border-[#D9D9D9]",
                };
            default:
                return {
                    bg: "bg-[#FFF7EA]",
                    title: "text-[#E6AB1D]",
                    text: "text-[#727272]",
                    border: "border-[#CDB99B]",
                };
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full cursor-pointer">
                    <IoMdNotificationsOutline size={22} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="overflow-y-auto">
                <p className="text-base-4 uppercase font-semibold">Alerts</p>

                <div className="flex flex-col gap-2 mt-4">
                    {notifications.map((notification) => (
                        <div key={notification.id} className={`p-4 rounded-md flex flex-col gap-1 ${getNotificationColor(notification.status)?.bg} ${getNotificationColor(notification.status)?.border} border`}>
                            <p className={`${getNotificationColor(notification.status)?.title} text-sm font-semibold`}>{notification.title}</p>
                            <p className={`${getNotificationColor(notification.status)?.text} text-xs`}>{notification.description}</p>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}