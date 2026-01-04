"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CiCalendarDate } from "react-icons/ci";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AddToCalendarProps {
    date: string;
    clientName: string;
}

export default function AddToCalendar({ date, clientName }: AddToCalendarProps) {
    const { data: session } = useSession();
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    const handleAddToCalendar = () => {
        const formattedDate = format(new Date(date), "yyyyMMdd");
        window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Site+Visit+@+${clientName}&dates=${formattedDate}/${formattedDate}&desc=Discuss+Audit+Details`, "_blank");
    }

    return (
        <div>
            <Button onClick={handleAddToCalendar} disabled={!date || isReadOnly} variant="outline" className="bg-base-3 text-white cursor-pointer hover:bg-black hover:text-white">
                <CiCalendarDate />
                Add to calendar
            </Button>
        </div>
    )
}