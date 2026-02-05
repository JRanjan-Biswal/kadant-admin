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
                    bg: "bg-green-500/10",
                    title: "text-green-400",
                    text: "text-muted-foreground",
                    border: "border-green-500/20",
                };
            case "info":
                return {
                    bg: "bg-blue-500/10",
                    title: "text-blue-400",
                    text: "text-muted-foreground",
                    border: "border-blue-500/20",
                };
            case "error":
                return {
                    bg: "bg-red-500/10",
                    title: "text-red-400",
                    text: "text-muted-foreground",
                    border: "border-red-500/20",
                };
            case "warning":
                return {
                    bg: "bg-orange/10",
                    title: "text-orange",
                    text: "text-muted-foreground",
                    border: "border-orange/20",
                };
            default:
                return {
                    bg: "bg-yellow-500/10",
                    title: "text-yellow-400",
                    text: "text-muted-foreground",
                    border: "border-yellow-500/20",
                };
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full cursor-pointer border-border text-muted-foreground hover:text-foreground hover:border-orange"
                >
                    <IoMdNotificationsOutline size={22} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="overflow-y-auto bg-popover border-border w-80">
                <p className="text-foreground uppercase font-semibold text-sm">Alerts</p>

                <div className="flex flex-col gap-2 mt-4">
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`p-4 rounded-md flex flex-col gap-1 ${getNotificationColor(notification.status)?.bg} ${getNotificationColor(notification.status)?.border} border`}
                        >
                            <p className={`${getNotificationColor(notification.status)?.title} text-sm font-semibold`}>
                                {notification.title}
                            </p>
                            <p className={`${getNotificationColor(notification.status)?.text} text-xs`}>
                                {notification.description}
                            </p>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
