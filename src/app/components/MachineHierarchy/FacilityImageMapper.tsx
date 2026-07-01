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
import Image from "next/image";
import { coverRect, pointsToPx, pxToPoint, pxDeltaToNorm, type CoverRect } from "./coverGeometry";

export interface QuadPoint {
    x: number; // 0-100, normalized to image width
    y: number; // 0-100, normalized to image height
}

export interface CategoryPosition {
    category: string;
    /** Exactly 4 corners (normalized 0-100%), in any order the admin dragged them into. */
    points: QuadPoint[];
}

interface CategoryInfo {
    id: string;
    name: string;
}

interface FacilityImageMapperProps {
    facilityImageUrl: string;
    categories: CategoryInfo[];
    initialPositions?: CategoryPosition[];
    onSave: (positions: CategoryPosition[]) => Promise<void>;
    onClose: () => void;
}

const DEFAULT_QUAD_SIZE = 15;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function buildDefaultQuad(cx: number, cy: number, size = DEFAULT_QUAD_SIZE): QuadPoint[] {
    const halfW = size / 2;
    const halfH = (size * 0.75) / 2;
    return [
        { x: cx - halfW, y: cy - halfH }, // top-left
        { x: cx + halfW, y: cy - halfH }, // top-right
        { x: cx + halfW, y: cy + halfH }, // bottom-right
        { x: cx - halfW, y: cy + halfH }, // bottom-left
    ].map((p) => ({ x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100) }));
}

const QuadMarker = memo(function QuadMarker({
    category,
    points,
    rect,
    isSelected,
    onSelect,
    onDrag,
    onCornerDrag,
}: {
    category: CategoryInfo;
    points: QuadPoint[];
    rect: CoverRect | null;
    isSelected: boolean;
    onSelect: () => void;
    onDrag: (points: QuadPoint[]) => void;
    onCornerDrag: (cornerIndex: number, x: number, y: number) => void;
}) {
    const isDragging = useRef(false);
    const draggingCorner = useRef<number | null>(null);

    const handleBodyMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest("[data-corner-handle]")) return;
            e.preventDefault();
            e.stopPropagation();
            onSelect();
            if (!rect) return;
            isDragging.current = true;
            const startX = e.clientX;
            const startY = e.clientY;
            const startPoints = points.map((p) => ({ ...p }));

            const handleMove = (ev: MouseEvent) => {
                if (!isDragging.current) return;
                const { dLeft, dTop } = pxDeltaToNorm(rect, ev.clientX - startX, ev.clientY - startY);
                const newPoints = startPoints.map((p) => ({
                    x: Math.round(clamp(p.x + dLeft, 0, 100) * 10) / 10,
                    y: Math.round(clamp(p.y + dTop, 0, 100) * 10) / 10,
                }));
                onDrag(newPoints);
            };
            const handleUp = () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
            };
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
        },
        [rect, onDrag, onSelect, points]
    );

    const handleCornerMouseDown = useCallback(
        (cornerIndex: number) => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
            if (!rect) return;
            draggingCorner.current = cornerIndex;
            const startX = e.clientX;
            const startY = e.clientY;
            const startPoint = points[cornerIndex];

            const handleMove = (ev: MouseEvent) => {
                if (draggingCorner.current !== cornerIndex) return;
                const { dLeft, dTop } = pxDeltaToNorm(rect, ev.clientX - startX, ev.clientY - startY);
                const newX = Math.round(clamp(startPoint.x + dLeft, 0, 100) * 10) / 10;
                const newY = Math.round(clamp(startPoint.y + dTop, 0, 100) * 10) / 10;
                onCornerDrag(cornerIndex, newX, newY);
            };
            const handleUp = () => {
                draggingCorner.current = null;
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
            };
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
        },
        [rect, onSelect, onCornerDrag, points]
    );

    if (!rect) return null;

    const pxPoints = pointsToPx(rect, points);
    const centroid = {
        x: pxPoints.reduce((sum, p) => sum + p.xPx, 0) / pxPoints.length,
        y: pxPoints.reduce((sum, p) => sum + p.yPx, 0) / pxPoints.length,
    };

    return (
        <div
            data-category-marker
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: isSelected ? 30 : 20 }}
        >
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <polygon
                    points={pxPoints.map((p) => `${p.xPx},${p.yPx}`).join(" ")}
                    fill={isSelected ? "rgba(212,88,21,0.25)" : "rgba(0,0,0,0.5)"}
                    stroke={isSelected ? "#d45815" : "rgba(255,255,255,0.6)"}
                    strokeWidth={isSelected ? 2.5 : 2}
                    style={{ pointerEvents: "auto", cursor: "grab" }}
                    onMouseDown={handleBodyMouseDown}
                />
            </svg>

            <div
                style={{
                    position: "absolute",
                    left: `${centroid.x}px`,
                    top: `${centroid.y}px`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}
                className="px-2 max-w-[140px]"
            >
                <span className="text-white text-[11px] font-bold text-center leading-tight drop-shadow-lg block">
                    {category.name}
                </span>
            </div>

            {isSelected && (
                <div
                    className="absolute w-5 h-5 rounded-full bg-[#d45815] flex items-center justify-center"
                    style={{
                        left: `${pxPoints[0].xPx}px`,
                        top: `${pxPoints[0].yPx}px`,
                        transform: "translate(-50%, -150%)",
                        pointerEvents: "none",
                    }}
                >
                    <Check className="w-3 h-3 text-gray-900" />
                </div>
            )}

            {isSelected &&
                pxPoints.map((p, i) => (
                    <div
                        key={i}
                        data-corner-handle
                        onMouseDown={handleCornerMouseDown(i)}
                        className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-[#d45815] cursor-move"
                        style={{
                            left: `${p.xPx}px`,
                            top: `${p.yPx}px`,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "auto",
                        }}
                    />
                ))}
        </div>
    );
});

function FacilityImageMapperContent({
    facilityImageUrl,
    categories,
    initialPositions = [],
    onSave,
    onClose,
}: FacilityImageMapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [natural, setNatural] = useState<{ iw: number; ih: number } | null>(null);
    const [containerSize, setContainerSize] = useState<{ cw: number; ch: number } | null>(null);
    const [dropdownContainer, setDropdownContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setContainerSize({ cw: el.clientWidth, ch: el.clientHeight });
        update();
        const img = el.querySelector("img");
        if (img && img.complete && img.naturalWidth && img.naturalHeight) {
            setNatural({ iw: img.naturalWidth, ih: img.naturalHeight });
        }
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Facility image uses object-center (py=0.5, px=0.5)
    const rect: CoverRect | null =
        natural && containerSize
            ? coverRect(containerSize.cw, containerSize.ch, natural.iw, natural.ih, 0.5, 0.5)
            : null;

    const [positions, setPositions] = useState<Map<string, QuadPoint[]>>(() => {
        const map = new Map<string, QuadPoint[]>();
        for (const pos of initialPositions) {
            if (Array.isArray(pos.points) && pos.points.length === 4) {
                map.set(pos.category, pos.points.map((p) => ({ ...p })));
            }
        }
        return map;
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const unplacedCategories = categories.filter((c) => !positions.has(c.id));
    const allPlaced = unplacedCategories.length === 0 && categories.length > 0;

    useEffect(() => {
        if (unplacedCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(unplacedCategories[0].id);
        }
    }, [unplacedCategories, selectedCategory]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if ((e.target as HTMLElement).closest("[data-category-marker]")) return;
            if (!selectedCategory) return;
            if (positions.has(selectedCategory)) return; // already placed — only drag adjusts it, a stray click must not reset it
            const container = containerRef.current;
            if (!container) return;
            const r = container.getBoundingClientRect();
            if (!rect) return;
            const xPx = e.clientX - r.left;
            const yPx = e.clientY - r.top;
            const { x: cx, y: cy } = pxToPoint(rect, xPx, yPx);
            const quad = buildDefaultQuad(cx, cy);

            setPositions((prev) => {
                const next = new Map(prev);
                next.set(selectedCategory, quad);
                return next;
            });

            const currentIdx = unplacedCategories.findIndex((c) => c.id === selectedCategory);
            const nextUnplaced = unplacedCategories[currentIdx + 1];
            setSelectedCategory(nextUnplaced?.id ?? null);
        },
        [selectedCategory, unplacedCategories, rect, positions]
    );

    const handleDrag = useCallback((categoryId: string, points: QuadPoint[]) => {
        setPositions((prev) => {
            const next = new Map(prev);
            next.set(categoryId, points);
            return next;
        });
    }, []);

    const handleCornerDrag = useCallback((categoryId: string, cornerIndex: number, x: number, y: number) => {
        setPositions((prev) => {
            const existing = prev.get(categoryId);
            if (!existing) return prev;
            const next = new Map(prev);
            const points = existing.map((p, i) => (i === cornerIndex ? { x, y } : p));
            next.set(categoryId, points);
            return next;
        });
    }, []);

    const handleRemovePosition = useCallback((categoryId: string) => {
        setPositions((prev) => {
            const next = new Map(prev);
            next.delete(categoryId);
            return next;
        });
        setSelectedCategory(categoryId);
    }, []);

    const handleReset = useCallback(() => {
        setPositions(new Map());
        setSelectedCategory(categories[0]?.id ?? null);
    }, [categories]);

    const handleSave = useCallback(async () => {
        const posArray: CategoryPosition[] = [];
        positions.forEach((points, categoryId) => {
            posArray.push({ category: categoryId, points });
        });
        setSaving(true);
        try {
            await onSave(posArray);
        } finally {
            setSaving(false);
        }
    }, [positions, onSave]);

    return (
        <div
            ref={(el) => { if (el && !dropdownContainer) setDropdownContainer(el); }}
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
                className="shrink-0 flex items-center justify-between px-5 border-b border-[#607797] absolute top-0 left-0 right-0"
                style={{ height: 56, background: "#ffffff", zIndex: 10 }}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <h2 className="text-gray-900 text-base font-semibold whitespace-nowrap">Map Facility Sections</h2>
                    <div className="h-5 w-px bg-[#d1d5db] shrink-0" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-[#ffffff] px-3 py-2 text-sm text-gray-900 hover:bg-[#e5e7eb] hover:border-[#4b5563] transition-colors min-w-0"
                            >
                                <span className="text-[#6b7280] shrink-0">Sections ({positions.size}/{categories.length})</span>
                                <span className="truncate font-medium text-[#d45815]">
                                    {categories.find((c) => c.id === selectedCategory)?.name ?? "Select a section"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-[#6b7280] shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="max-h-[min(60vh,400px)] w-[280px] overflow-y-auto border-[#607797] bg-[#141414] p-1"
                            container={dropdownContainer}
                        >
                            {categories.map((c) => {
                                const isPlaced = positions.has(c.id);
                                const isActive = selectedCategory === c.id;
                                return (
                                    <DropdownMenuItem
                                        key={c.id}
                                        onSelect={() => setSelectedCategory(c.id)}
                                        className={`
                                            flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm cursor-pointer
                                            ${isActive
                                                ? "bg-[#d45815]/15 text-[#d45815] ring-1 ring-[#d45815]/40"
                                                : isPlaced
                                                    ? "bg-[#ffffff] text-gray-900 focus:bg-[#e5e7eb]"
                                                    : "text-[#6b7280] focus:bg-[#ffffff] focus:text-gray-900"
                                            }
                                        `}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                                isPlaced ? "bg-[#22c55e] text-gray-900" : "bg-[#333] text-[#6b7280]"
                                            }`}
                                        >
                                            {isPlaced ? <Check className="w-3.5 h-3.5" /> : "?"}
                                        </div>
                                        <span className="truncate flex-1 font-medium">{c.name}</span>
                                        {isPlaced && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemovePosition(c.id);
                                                }}
                                                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
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
                    <span className="text-[#6b7280] text-sm hidden sm:inline">
                        {allPlaced
                            ? "All sections placed — drag the shape or its corners to adjust, then save."
                            : positions.size > 0
                            ? `${positions.size}/${categories.length} placed — save now or place the rest.`
                            : "Click on the facility image to place the selected section."}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleReset}
                        className="text-[#6b7280] hover:bg-[#e5e7eb] h-8 gap-1.5"
                        disabled={positions.size === 0}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={positions.size === 0 || saving}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white h-8 px-5"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Positions"}
                    </Button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:text-gray-900 rounded-md hover:bg-[#e5e7eb] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
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
                    <Image
                        width={1500}
                        height={1500}
                        src={facilityImageUrl}
                        alt="Facility"
                        draggable={false}
                        onLoad={(e) => {
                            const img = e.currentTarget;
                            if (img.naturalWidth && img.naturalHeight) {
                                setNatural({ iw: img.naturalWidth, ih: img.naturalHeight });
                            }
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />

                    {rect && categories.map((c) => {
                        const points = positions.get(c.id);
                        if (!points) return null;
                        return (
                            <QuadMarker
                                key={c.id}
                                category={c}
                                points={points}
                                rect={rect}
                                isSelected={selectedCategory === c.id}
                                onSelect={() => setSelectedCategory(c.id)}
                                onDrag={(newPoints) => handleDrag(c.id, newPoints)}
                                onCornerDrag={(cornerIndex, x, y) => handleCornerDrag(c.id, cornerIndex, x, y)}
                            />
                        );
                    })}

                    {selectedCategory && !positions.has(selectedCategory) && (
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
                                    Click anywhere to place &quot;{categories.find((c) => c.id === selectedCategory)?.name}&quot;
                                </p>
                                <p className="text-[#6b7280] text-sm mt-1.5">
                                    Drag the shape or its 4 corners to match the section after placing
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FacilityImageMapper(props: FacilityImageMapperProps) {
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.createElement("div");
        el.id = "facility-image-mapper-portal";
        el.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:100vw;height:100vh;z-index:2147483647;pointer-events:auto;";
        document.body.appendChild(el);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        setPortalTarget(el);

        return () => {
            document.body.style.overflow = prevOverflow;
            if (el.parentNode) el.parentNode.removeChild(el);
        };
    }, []);

    if (!portalTarget) return null;

    return createPortal(
        <FacilityImageMapperContent {...props} />,
        portalTarget
    );
}
