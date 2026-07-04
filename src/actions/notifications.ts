"use server";

import getCurrentUser from "./get-current-user";

const API = process.env.NEXT_PUBLIC_API_URL;

const requireToken = async () => {
    const session = await getCurrentUser();
    if (!session?.accessToken) throw new Error("Not authenticated");
    return session.accessToken;
};

export interface ScheduleNotification {
    id: string;
    type: "schedule";
    sparePartName: string;
    machineName: string;
    klValue: string;
    action: string;
    week: number;
    daysUntil: number;
    overdue: boolean;
    dueDate: string;
}

export interface HealthNotification {
    id: string;
    type: "health";
    sparePartName: string;
    machineName: string;
    klValue: string;
    totalRunningHours: number;
    lifetimeOfRotor: number;
}

export type AppNotification = ScheduleNotification | HealthNotification;

export async function fetchWeekSchedules(clientID: string): Promise<ScheduleNotification[]> {
    try {
        const token = await requireToken();
        const res = await fetch(
            `${API}/maintenance-schedule/admin/upcoming?clientID=${encodeURIComponent(clientID)}&days=7`,
            { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map((ev: Record<string, unknown>) => ({
            id: `sched_${ev.clientMachineSparePartId}_w${ev.week}_${new Date(ev.dueDate as string).getFullYear()}`,
            type: "schedule" as const,
            sparePartName: ev.sparePartName as string,
            machineName: ev.machineName as string,
            klValue: ev.klValue as string,
            action: ev.action as string,
            week: ev.week as number,
            daysUntil: ev.daysUntil as number,
            overdue: ev.overdue as boolean,
            dueDate: ev.dueDate as string,
        }));
    } catch {
        return [];
    }
}

export async function fetchHealthAlerts(clientID: string): Promise<HealthNotification[]> {
    try {
        const token = await requireToken();
        const res = await fetch(
            `${API}/maintenance-schedule/admin/health-alerts/${encodeURIComponent(clientID)}`,
            { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.alerts || [];
    } catch {
        return [];
    }
}
