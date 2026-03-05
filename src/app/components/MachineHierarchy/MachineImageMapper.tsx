"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, GripVertical, Check, Loader2, RotateCcw, ChevronDown } from "lucide-react";

export interface MachinePosition {
    machine: string;
    left: number;
    top: number;
    width: number;
}

interface MachineInfo {
    id: string;
    name: string;
    imageUrl?: string | null;
}

interface MachineImageMapperProps {
    categoryImageUrl: string;
    machines: MachineInfo[];
    initialPositions?: MachinePosition[];
    onSave: (positions: MachinePosition[]) => Promise<void>;
    onClose: () => void;
}

const DEFAULT_WIDTH = 15;
const MIN_WIDTH = 5;
const MAX_WIDTH = 40;

const MachineMarker = memo(function MachineMarker({
    machine,
    position,
    isSelected,
    onSelect,
    onDrag,
    onWidthChange,
    containerRef,
}: {
    machine: MachineInfo;
    position: { left: number; top: number; width: number };
    isSelected: boolean;
    onSelect: () => void;
    onDrag: (left: number, top: number) => void;
    onWidthChange: (width: number) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}) {
    const markerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
            e.preventDefault();
            e.stopPropagation();
            onSelect();
            isDragging.current = true;
            const container = containerRef.current;
            if (!container || !markerRef.current) return;
            const rect = container.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - (rect.left + (position.left / 100) * rect.width),
                y: e.clientY - (rect.top + (position.top / 100) * rect.height),
            };

            const handleMove = (ev: MouseEvent) => {
                if (!isDragging.current || !container) return;
                const r = container.getBoundingClientRect();
                let newLeft = ((ev.clientX - dragOffset.current.x - r.left) / r.width) * 100;
                let newTop = ((ev.clientY - dragOffset.current.y - r.top) / r.height) * 100;
                newLeft = Math.max(0, Math.min(100 - position.width, newLeft));
                newTop = Math.max(0, Math.min(95, newTop));
                onDrag(Math.round(newLeft * 10) / 10, Math.round(newTop * 10) / 10);
            };
            const handleUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
            };
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
        },
        [containerRef, onDrag, onSelect, position.left, position.top, position.width]
    );

    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
            isResizing.current = true;
            const startX = e.clientX;
            const startWidth = position.width;
            const container = containerRef.current;

            const handleMove = (ev: MouseEvent) => {
                if (!isResizing.current || !container) return;
                const r = container.getBoundingClientRect();
                const deltaPercent = ((ev.clientX - startX) / r.width) * 100;
                let newWidth = startWidth + deltaPercent;
                newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
                onWidthChange(Math.round(newWidth * 10) / 10);
            };
            const handleUp = () => {
                isResizing.current = false;
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
            };
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
        },
        [containerRef, onSelect, onWidthChange, position.width]
    );

    return (
        <div
            ref={markerRef}
            data-machine-marker
            style={{
                position: "absolute",
                left: `${position.left}%`,
                top: `${position.top}%`,
                width: `${position.width}%`,
                zIndex: isSelected ? 30 : 20,
            }}
            onMouseDown={handleMouseDown}
        >
            <div
                className={`
                    relative cursor-grab active:cursor-grabbing rounded-lg overflow-hidden
                    border-2 transition-all duration-150
                    ${isSelected
                        ? "border-[#d45815] shadow-[0_0_20px_rgba(212,88,21,0.4)]"
                        : "border-white/50 hover:border-white/80 shadow-lg"
                    }
                `}
                style={{ aspectRatio: "4/3" }}
            >
                <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <span className="text-white text-[11px] font-medium truncate block leading-tight">
                        {machine.name}
                    </span>
                </div>
                {isSelected && (
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#d45815] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                )}
                <div
                    data-resize-handle
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center transition-opacity"
                    style={{ opacity: isSelected ? 1 : 0 }}
                    onMouseDown={handleResizeMouseDown}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                >
                    <div className="w-1 h-8 bg-white/70 rounded-full" />
                </div>
            </div>
        </div>
    );
});

function MachineImageMapperContent({
    categoryImageUrl,
    machines,
    initialPositions = [],
    onSave,
    onClose,
}: MachineImageMapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [positions, setPositions] = useState<Map<string, { left: number; top: number; width: number }>>(
        () => {
            const map = new Map<string, { left: number; top: number; width: number }>();
            for (const pos of initialPositions) {
                map.set(pos.machine, { left: pos.left, top: pos.top, width: pos.width });
            }
            return map;
        }
    );
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const unplacedMachines = machines.filter((m) => !positions.has(m.id));
    const allPlaced = unplacedMachines.length === 0 && machines.length > 0;

    useEffect(() => {
        if (unplacedMachines.length > 0 && !selectedMachine) {
            setSelectedMachine(unplacedMachines[0].id);
        }
    }, [unplacedMachines, selectedMachine]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if ((e.target as HTMLElement).closest("[data-machine-marker]")) return;
            if (!selectedMachine) return;
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const left = ((e.clientX - rect.left) / rect.width) * 100;
            const top = ((e.clientY - rect.top) / rect.height) * 100;
            const width = DEFAULT_WIDTH;
            const clampedLeft = Math.max(0, Math.min(100 - width, left - width / 2));
            const clampedTop = Math.max(0, Math.min(95, top));

            setPositions((prev) => {
                const next = new Map(prev);
                next.set(selectedMachine, {
                    left: Math.round(clampedLeft * 10) / 10,
                    top: Math.round(clampedTop * 10) / 10,
                    width,
                });
                return next;
            });

            const currentIdx = unplacedMachines.findIndex((m) => m.id === selectedMachine);
            const nextUnplaced = unplacedMachines[currentIdx + 1];
            setSelectedMachine(nextUnplaced?.id ?? null);
        },
        [selectedMachine, unplacedMachines]
    );

    const handleDrag = useCallback((machineId: string, left: number, top: number) => {
        setPositions((prev) => {
            const next = new Map(prev);
            const existing = next.get(machineId);
            if (existing) next.set(machineId, { ...existing, left, top });
            return next;
        });
    }, []);

    const handleWidthChange = useCallback((machineId: string, width: number) => {
        setPositions((prev) => {
            const next = new Map(prev);
            const existing = next.get(machineId);
            if (existing) next.set(machineId, { ...existing, width });
            return next;
        });
    }, []);

    const handleRemovePosition = useCallback((machineId: string) => {
        setPositions((prev) => {
            const next = new Map(prev);
            next.delete(machineId);
            return next;
        });
        setSelectedMachine(machineId);
    }, []);

    const handleReset = useCallback(() => {
        setPositions(new Map());
        setSelectedMachine(machines[0]?.id ?? null);
    }, [machines]);

    const handleSave = useCallback(async () => {
        const posArray: MachinePosition[] = [];
        positions.forEach((pos, machineId) => {
            posArray.push({ machine: machineId, left: pos.left, top: pos.top, width: pos.width });
        });
        setSaving(true);
        try {
            await onSave(posArray);
        } finally {
            setSaving(false);
        }
    }, [positions, onSave]);

    return (
        /* All critical layout uses inline styles — no Tailwind z-index that could be purged */
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 2147483647,
                background: "#000",
                display: "flex",
                flexDirection: "column",
                isolation: "isolate",
                pointerEvents: "auto",
            }}
        >
            {/* Header */}
            <div
                className="shrink-0 flex items-center justify-between px-5 border-b border-[#262626] absolute top-0 left-0 right-0"
                style={{ height: 56, background: "#171717", zIndex: 10 }}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <h2 className="text-white text-base font-semibold whitespace-nowrap">Map Machine Positions</h2>
                    <div className="h-5 w-px bg-[#404040] shrink-0" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg border border-[#404040] bg-[#1f1f1f] px-3 py-2 text-sm text-white hover:bg-[#262626] hover:border-[#525252] transition-colors min-w-0"
                            >
                                <span className="text-[#a1a1a1] shrink-0">Machines ({positions.size}/{machines.length})</span>
                                <span className="truncate font-medium text-[#d45815]">
                                    {machines.find((m) => m.id === selectedMachine)?.name ?? "Select a machine"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-[#737373] shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="max-h-[min(60vh,400px)] w-[280px] overflow-y-auto border-[#262626] bg-[#141414] p-1"
                        >
                            {machines.map((m) => {
                                const isPlaced = positions.has(m.id);
                                const isActive = selectedMachine === m.id;
                                return (
                                    <DropdownMenuItem
                                        key={m.id}
                                        onSelect={() => setSelectedMachine(m.id)}
                                        className={`
                                            flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm cursor-pointer
                                            ${isActive
                                                ? "bg-[#d45815]/15 text-[#d45815] ring-1 ring-[#d45815]/40"
                                                : isPlaced
                                                    ? "bg-[#1f1f1f] text-white focus:bg-[#262626]"
                                                    : "text-[#a1a1a1] focus:bg-[#1f1f1f] focus:text-white"
                                            }
                                        `}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                                isPlaced ? "bg-[#22c55e] text-white" : "bg-[#333] text-[#737373]"
                                            }`}
                                        >
                                            {isPlaced ? <Check className="w-3.5 h-3.5" /> : "?"}
                                        </div>
                                        <span className="truncate flex-1 font-medium">{m.name}</span>
                                        {isPlaced && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemovePosition(m.id);
                                                }}
                                                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[#737373] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                                                title="Remove placement"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-[#737373] text-sm hidden sm:inline">
                        {allPlaced
                            ? "All placed — drag to adjust, then save."
                            : "Click on the image to place the selected machine."}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleReset}
                        className="text-[#a1a1a1] hover:bg-[#262626] h-8 gap-1.5"
                        disabled={positions.size === 0}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={!allPlaced || saving}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white h-8 px-5"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Positions"}
                    </Button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#a1a1a1] hover:text-white rounded-md hover:bg-[#262626] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Body: image takes entire area */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0a0a0a",
                }}
            >
                <div
                    ref={containerRef}
                    onClick={handleImageClick}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        cursor: "crosshair",
                        userSelect: "none",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={categoryImageUrl}
                        alt="Category"
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />

                    {machines.map((m) => {
                        const pos = positions.get(m.id);
                        if (!pos) return null;
                        return (
                            <MachineMarker
                                key={m.id}
                                machine={m}
                                position={pos}
                                isSelected={selectedMachine === m.id}
                                onSelect={() => setSelectedMachine(m.id)}
                                onDrag={(left, top) => handleDrag(m.id, left, top)}
                                onWidthChange={(w) => handleWidthChange(m.id, w)}
                                containerRef={containerRef}
                            />
                        );
                    })}

                    {selectedMachine && !positions.has(selectedMachine) && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-8 py-5 text-center border border-[#333] shadow-2xl">
                                <GripVertical className="w-10 h-10 text-[#d45815] mx-auto mb-3" />
                                <p className="text-white text-base font-semibold">
                                    Click anywhere to place &quot;{machines.find((m) => m.id === selectedMachine)?.name}&quot;
                                </p>
                                <p className="text-[#737373] text-sm mt-1.5">
                                    You can drag to reposition and resize the width after placing
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Renders the mapper as a portal directly into a fresh div appended to document.body,
 * completely outside any Dialog/modal DOM hierarchy.
 */
export default function MachineImageMapper(props: MachineImageMapperProps) {
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.createElement("div");
        el.id = "machine-image-mapper-portal";
        // pointer-events:auto is critical — Radix Dialog sets pointer-events:none on <body>
        el.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:100vw;height:100vh;z-index:2147483647;pointer-events:auto;";
        document.body.appendChild(el);

        const prevOverflow = document.body.style.overflow;
        const prevPointerEvents = document.body.style.pointerEvents;
        document.body.style.overflow = "hidden";

        setPortalTarget(el);

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.pointerEvents = prevPointerEvents;
            if (el.parentNode) el.parentNode.removeChild(el);
        };
    }, []);

    if (!portalTarget) return null;

    return createPortal(
        <MachineImageMapperContent {...props} />,
        portalTarget
    );
}
