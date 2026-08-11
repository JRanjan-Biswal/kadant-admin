"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Layers, ChevronRight, Tag, Loader2 } from "lucide-react";
import { fetchReferenceOverview } from "@/actions/spare-parts-inventory";
import type { ReferenceOverviewItem } from "@/actions/spare-parts-inventory";

interface Props {
    clientID: string;
    categoryId?: string;
    machineId?: string;
}

const StatBadge = ({ value, color }: { value: number; color: string }) => (
    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        {value}
    </span>
);

export default function ReferenceRollupTable({ clientID, categoryId, machineId }: Props) {
    const router = useRouter();
    const [overview, setOverview] = useState<ReferenceOverviewItem[]>([]);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchReferenceOverview(clientID, { categoryId, machineId });
            setOverview(data);
        } finally {
            setLoading(false);
        }
    }, [clientID, categoryId, machineId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Loading reference rollup…" : `${overview.length} reference${overview.length === 1 ? "" : "s"}`}
                </div>
                <Link href={`/${clientID}/spare-parts-reference/assign`}>
                    <Button className="bg-[#d45815] hover:bg-[#b84a12] text-white shrink-0">
                        <Tag className="h-4 w-4 mr-2" />
                        Assign References
                    </Button>
                </Link>
            </div>

            {!loading && overview.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-[10px] border border-[#607797] bg-[#DFE6EC]">
                    <Layers className="h-12 w-12 text-[#9ca3af] mb-4" />
                    <p className="text-gray-900 font-medium">No references match the current filters</p>
                    <p className="text-sm text-[#6b7280] mt-1 max-w-sm">
                        Set a Reference value on a spare part, or try a different category or machine.
                    </p>
                </div>
            ) : (
                <div className="rounded-[10px] border border-[#607797] bg-[#DFE6EC] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#e5e7eb] border-b border-[#607797]">
                                <th className="text-left px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Reference</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Total</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">In Use</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Rebuilding</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Active</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Inactive</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-900 text-xs uppercase tracking-wider">Retired</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {overview.map((item, idx) => (
                                <tr
                                    key={item.reference}
                                    onClick={() => {
                                        const params = new URLSearchParams();
                                        if (categoryId) params.set("categoryId", categoryId);
                                        if (machineId) params.set("machineId", machineId);
                                        const qs = params.toString();
                                        router.push(
                                            `/${clientID}/spare-parts-reference/${encodeURIComponent(item.reference)}${qs ? `?${qs}` : ""}`
                                        );
                                    }}
                                    className={`cursor-pointer border-b border-[#607797]/40 transition-colors hover:bg-[#96A5BA]/20 ${
                                        idx % 2 === 0 ? "bg-transparent" : "bg-black/[0.02]"
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-[#d45815] shrink-0" />
                                            <span className="font-semibold text-gray-900">{item.reference}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-bold text-gray-900">{item.total}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatBadge value={item.inUse} color="bg-green-100 text-green-700" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatBadge value={item.sentForRebuild} color="bg-orange-100 text-orange-700" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-green-700 font-medium">{item.active}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-[#6b7280]">{item.inactive}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-red-600">{item.retired}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight className="h-4 w-4 text-[#9ca3af] ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
