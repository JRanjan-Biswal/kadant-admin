"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X } from "lucide-react";
import {
    fetchWeekSchedules,
    fetchHealthAlerts,
    type ScheduleNotification,
    type HealthNotification,
} from "@/actions/notifications";

// ── localStorage helpers ──────────────────────────────────────────────────────

const storageKey = (clientId: string) => `kadant_dismissed_${clientId}`;

function getDismissed(clientId: string): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(storageKey(clientId));
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
}

function saveDismissed(clientId: string, set: Set<string>) {
    localStorage.setItem(storageKey(clientId), JSON.stringify([...set]));
}

// ── Notification item rows ────────────────────────────────────────────────────

function ScheduleRow({ n, onDismiss }: { n: ScheduleNotification; onDismiss: (id: string) => void }) {
    const label = n.overdue
        ? `${Math.abs(n.daysUntil)}d overdue`
        : n.daysUntil === 0
        ? "due today"
        : `in ${n.daysUntil}d`;

    return (
        <div className="flex items-start gap-3 p-3 rounded-md bg-orange/10 border border-orange/20">
            <span className="mt-1 w-2 h-2 rounded-full bg-orange flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-orange text-sm font-semibold truncate">
                    {n.action}: {n.sparePartName}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                    {n.machineName && <span>{n.machineName} · </span>}
                    Week {n.week} · <span className={n.overdue ? "text-red-400" : ""}>{label}</span>
                </p>
            </div>
            <button
                onClick={() => onDismiss(n.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer transition-colors mt-0.5"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function HealthRow({ n, onDismiss }: { n: HealthNotification; onDismiss: (id: string) => void }) {
    const overBy = n.totalRunningHours - n.lifetimeOfRotor;
    return (
        <div className="flex items-start gap-3 p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-red-400 text-sm font-semibold truncate">
                    Period Exceeded: {n.sparePartName}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                    {n.machineName && <span>{n.machineName} · </span>}
                    {n.totalRunningHours.toLocaleString()} / {n.lifetimeOfRotor.toLocaleString()} hrs
                    <span className="text-red-400"> (+{overBy.toLocaleString()} over)</span>
                </p>
            </div>
            <button
                onClick={() => onDismiss(n.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer transition-colors mt-0.5"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ── Panel (only rendered when clientID is present) ────────────────────────────

function NotificationsPanel({ clientID }: { clientID: string }) {
    const [schedules, setSchedules] = useState<ScheduleNotification[]>([]);
    const [healthAlerts, setHealthAlerts] = useState<HealthNotification[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    const loadData = useCallback(async () => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setLoading(true);
        setDismissed(getDismissed(clientID));
        try {
            const [sched, health] = await Promise.all([
                fetchWeekSchedules(clientID),
                fetchHealthAlerts(clientID),
            ]);
            setSchedules(sched);
            setHealthAlerts(health);
        } finally {
            setLoading(false);
        }
    }, [clientID]);

    const dismiss = useCallback(
        (id: string) => {
            setDismissed((prev) => {
                const next = new Set(prev);
                next.add(id);
                saveDismissed(clientID, next);
                return next;
            });
        },
        [clientID]
    );

    const visibleSchedules = schedules.filter((n) => !dismissed.has(n.id));
    const visibleHealth = healthAlerts.filter((n) => !dismissed.has(n.id));
    const totalVisible = visibleSchedules.length + visibleHealth.length;

    return (
        <Popover onOpenChange={(open) => { if (open) loadData(); }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="relative rounded-full cursor-pointer border-border text-muted-foreground hover:text-foreground hover:border-orange"
                >
                    <IoMdNotificationsOutline size={22} />
                    {totalVisible > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange text-white text-[10px] font-bold leading-none">
                            {totalVisible > 99 ? "99+" : totalVisible}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="bg-popover border-border w-[340px] max-h-[480px] overflow-y-auto p-4">
                <p className="text-foreground uppercase font-semibold text-sm mb-4">
                    Notifications
                </p>

                {loading ? (
                    <p className="text-muted-foreground text-sm text-center py-6">Loading…</p>
                ) : totalVisible === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                        No active notifications
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {visibleSchedules.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                    This Week&apos;s Schedule
                                </p>
                                {visibleSchedules.map((n) => (
                                    <ScheduleRow key={n.id} n={n} onDismiss={dismiss} />
                                ))}
                            </div>
                        )}

                        {visibleHealth.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                    Health Alerts
                                </p>
                                {visibleHealth.map((n) => (
                                    <HealthRow key={n.id} n={n} onDismiss={dismiss} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ── Shell — only shows when on a [clientID] route ─────────────────────────────

export default function Notifications() {
    const params = useParams();
    const clientID = params?.clientID as string | undefined;

    if (!clientID) return null;
    return <NotificationsPanel key={clientID} clientID={clientID} />;
}
