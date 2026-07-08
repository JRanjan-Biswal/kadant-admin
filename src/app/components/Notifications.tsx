"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X } from "lucide-react";
import {
    fetchWeekSchedules,
    fetchHealthAlerts,
    fetchRetiredAlerts,
    type ScheduleNotification,
    type HealthNotification,
    type RetiredNotification,
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

// ── Notification cards ────────────────────────────────────────────────────────

function ScheduleRow({ n, onDismiss }: { n: ScheduleNotification; onDismiss: (id: string) => void }) {
    const timeLabel = n.daysUntil === 0 ? "Due today" : `In ${n.daysUntil}d`;

    return (
        <div className="rounded-lg border border-orange/25 bg-orange/[0.06] p-3 space-y-1.5">
            {/* Row 1: action badge + time + dismiss */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange/20 text-orange uppercase tracking-wide">
                        {n.action}
                    </span>
                    <span className="text-orange text-[11px] font-semibold shrink-0">
                        · {timeLabel}
                    </span>
                </div>
                <button
                    onClick={() => onDismiss(n.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Row 2: part name — wraps up to 2 lines */}
            <p
                className="text-foreground text-[12px] font-medium leading-snug line-clamp-2"
                title={n.sparePartName}
            >
                {n.sparePartName}
            </p>

            {/* Row 3: machine · KL code · week */}
            <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
                {n.machineName && <span className="truncate max-w-[160px]">{n.machineName}</span>}
                {n.klValue && (
                    <>
                        <span className="opacity-40">·</span>
                        <span className="font-mono text-muted-foreground">{n.klValue}</span>
                    </>
                )}
                <span className="opacity-40">·</span>
                <span>Wk {n.week}</span>
            </div>
        </div>
    );
}

function RetiredRow({ n, onDismiss, clientID }: { n: RetiredNotification; onDismiss: (id: string) => void; clientID: string }) {
    return (
        <div className="rounded-lg border border-gray-400/30 bg-gray-500/[0.06] p-3 space-y-1.5">
            {/* Row 1: badge + dismiss */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-400/20 text-gray-600 uppercase tracking-wide">
                        Retired
                    </span>
                    <span className="text-gray-500 text-[11px] font-semibold shrink-0">
                        · Needs replacement
                    </span>
                </div>
                <button
                    onClick={() => onDismiss(n.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Row 2: part name */}
            <p
                className="text-foreground text-[12px] font-medium leading-snug line-clamp-2"
                title={n.sparePartName}
            >
                {n.sparePartName}
            </p>

            {/* Row 3: machine · KL code · link */}
            <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
                {n.machineName && <span className="truncate max-w-[140px]">{n.machineName}</span>}
                {n.klValue && (
                    <>
                        <span className="opacity-40">·</span>
                        <span className="font-mono">{n.klValue}</span>
                    </>
                )}
            </div>

            {/* Row 4: link to Order New queue */}
            <a
                href={`/${clientID}/spare-parts-inventory?tab=orderedNew`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D3E5C] underline underline-offset-2 hover:opacity-75 transition-opacity"
            >
                Go to Order New →
            </a>
        </div>
    );
}

function HealthRow({ n, onDismiss }: { n: HealthNotification; onDismiss: (id: string) => void }) {
    const overBy = n.totalRunningHours - n.lifetimeOfRotor;

    return (
        <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3 space-y-1.5">
            {/* Row 1: badge + over amount + dismiss */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 uppercase tracking-wide">
                        Period Exceeded
                    </span>
                    <span className="text-red-400 text-[11px] font-semibold shrink-0">
                        · +{overBy.toLocaleString()} hrs
                    </span>
                </div>
                <button
                    onClick={() => onDismiss(n.id)}
                    className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Row 2: part name */}
            <p
                className="text-foreground text-[12px] font-medium leading-snug line-clamp-2"
                title={n.sparePartName}
            >
                {n.sparePartName}
            </p>

            {/* Row 3: machine · KL code · hours */}
            <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
                {n.machineName && <span className="truncate max-w-[140px]">{n.machineName}</span>}
                {n.klValue && (
                    <>
                        <span className="opacity-40">·</span>
                        <span className="font-mono">{n.klValue}</span>
                    </>
                )}
                <span className="opacity-40">·</span>
                <span>{n.totalRunningHours.toLocaleString()}/{n.lifetimeOfRotor.toLocaleString()} hrs</span>
            </div>
        </div>
    );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function NotificationsPanel({ clientID }: { clientID: string }) {
    const [schedules, setSchedules] = useState<ScheduleNotification[]>([]);
    const [healthAlerts, setHealthAlerts] = useState<HealthNotification[]>([]);
    const [retiredAlerts, setRetiredAlerts] = useState<RetiredNotification[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    const loadData = useCallback(async () => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setLoading(true);
        setDismissed(getDismissed(clientID));
        try {
            const [sched, health, retired] = await Promise.all([
                fetchWeekSchedules(clientID),
                fetchHealthAlerts(clientID),
                fetchRetiredAlerts(clientID),
            ]);
            setSchedules(sched);
            setHealthAlerts(health);
            setRetiredAlerts(retired);
        } finally {
            setLoading(false);
        }
    }, [clientID]);

    useEffect(() => { loadData(); }, [loadData]);

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
    const visibleRetired = retiredAlerts.filter((n) => !dismissed.has(n.id));
    const totalVisible = visibleSchedules.length + visibleHealth.length + visibleRetired.length;

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

            <PopoverContent className="bg-popover border-border w-[380px] max-h-[520px] flex flex-col p-0 overflow-hidden">
                {/* Sticky header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div>
                        <p className="text-foreground font-semibold text-sm">Notifications</p>
                        {!loading && totalVisible > 0 && (
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                                {totalVisible} active
                            </p>
                        )}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-4 py-3">
                    {loading ? (
                        <p className="text-muted-foreground text-sm text-center py-8">Loading…</p>
                    ) : totalVisible === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            No active notifications
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {visibleSchedules.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
                                        This Week&apos;s Schedule
                                        <span className="ml-1.5 text-orange font-bold">{visibleSchedules.length}</span>
                                    </p>
                                    {visibleSchedules.map((n) => (
                                        <ScheduleRow key={n.id} n={n} onDismiss={dismiss} />
                                    ))}
                                </div>
                            )}

                            {visibleHealth.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
                                        Health Alerts
                                        <span className="ml-1.5 text-red-400 font-bold">{visibleHealth.length}</span>
                                    </p>
                                    {visibleHealth.map((n) => (
                                        <HealthRow key={n.id} n={n} onDismiss={dismiss} />
                                    ))}
                                </div>
                            )}

                            {visibleRetired.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
                                        Retired — Needs Replacement
                                        <span className="ml-1.5 text-gray-500 font-bold">{visibleRetired.length}</span>
                                    </p>
                                    {visibleRetired.map((n) => (
                                        <RetiredRow key={n.id} n={n} onDismiss={dismiss} clientID={clientID} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function Notifications() {
    const params = useParams();
    const clientID = params?.clientID as string | undefined;

    if (!clientID) return null;
    return <NotificationsPanel key={clientID} clientID={clientID} />;
}
