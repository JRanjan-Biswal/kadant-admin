"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateAdmin, type AccessAdmin } from "@/actions/access-control";
import MultiSelectChips from "./MultiSelectChips";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AccessAdmin | null;
    regions: { _id: string; region: string }[];
    clients: { _id: string; name: string; region?: string | null; regionId?: string | null }[];
}

export default function EditAdminModal({ open, onOpenChange, admin, regions, clients }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [assignedRegions, setAssignedRegions] = useState<string[]>([]);
    const [assignedClients, setAssignedClients] = useState<string[]>([]);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (admin) {
            setName(admin.name || "");
            setEmail(admin.email || "");
            setUsername(admin.username || "");
            setIsActive(!!admin.isActive);
            setIsAdmin(!!admin.fullAccess);
            const clientIds = (admin.assignedClients || []).map((c) => c._id);
            setAssignedClients(clientIds);
            // Seed the region selector. Region-scoped users → their regions. Customer-scoped
            // users (no regions, but clients set) → derive the assigned clients' regions so the
            // customer cascade is enabled and shows them.
            const seededRegions =
                admin.assignedRegions && admin.assignedRegions.length
                    ? admin.assignedRegions
                    : [
                          ...new Set(
                              clients
                                  .filter((c) => clientIds.includes(c._id) && c.region)
                                  .map((c) => c.region as string)
                          ),
                      ];
            setAssignedRegions(seededRegions);
            setPassword("");
            setConfirm("");
        }
    }, [admin, clients]);

    if (!admin) return null;

    // Customers cascade off the selected region(s).
    const selectedRegionNames = new Set(
        regions.filter((r) => assignedRegions.includes(r._id)).map((r) => r.region)
    );
    const filteredClients = clients.filter(
        (c) =>
            (c.regionId && assignedRegions.includes(c.regionId)) ||
            (c.region && selectedRegionNames.has(c.region))
    );

    const handleRegionsChange = (next: string[]) => {
        setAssignedRegions(next);
        const allowedNames = new Set(
            regions.filter((r) => next.includes(r._id)).map((r) => r.region)
        );
        const allowed = new Set(
            clients
                .filter(
                    (c) =>
                        (c.regionId && next.includes(c.regionId)) ||
                        (c.region && allowedNames.has(c.region))
                )
                .map((c) => c._id)
        );
        setAssignedClients((prev) => prev.filter((id) => allowed.has(id)));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setSubmitting(true);
        // Full-access admin → no scoping. Otherwise: specific customers if chosen,
        // else the selected region(s) (region-based).
        const res = await updateAdmin(admin._id, {
            name,
            email,
            username,
            isActive,
            password: password || undefined,
            fullAccess: isAdmin,
            assignedRegions: isAdmin ? [] : assignedClients.length ? [] : assignedRegions,
            assignedClients: isAdmin ? [] : assignedClients,
        });
        setSubmitting(false);
        if (!res.success) {
            toast.error(res.error || "Failed to update user");
            return;
        }
        toast.success("User updated");
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-[16px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-[18px] font-semibold text-gray-900">
                        Edit User — {admin.name}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="px-6 pt-4 pb-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Full Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Username</Label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Status</Label>
                            <Select
                                value={isActive ? "active" : "inactive"}
                                onValueChange={(v) => setIsActive(v === "active")}
                            >
                                <SelectTrigger className="rounded-[10px] border-[#96A5BA] h-11 w-full">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep"
                                    className="rounded-[10px] border-[#96A5BA] h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="Leave blank to keep"
                                    className="rounded-[10px] border-[#96A5BA] h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin toggle — full access vs region/customer scoped */}
                    <div className="flex items-center justify-between rounded-[10px] border border-[#96A5BA] px-4 py-3">
                        <div className="space-y-0.5 pr-4">
                            <Label className="text-sm font-medium text-gray-900">Admin</Label>
                            <p className="text-[11px] text-[#6b7280]">
                                Full access to everything. Turn off to scope this user to a region or customer.
                            </p>
                        </div>
                        <Switch
                            checked={isAdmin}
                            onCheckedChange={setIsAdmin}
                            className="data-[state=unchecked]:bg-[#96A5BA] data-[state=checked]:bg-[#d45815]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Region</Label>
                        <MultiSelectChips
                            options={regions.map((r) => ({ _id: r._id, label: r.region }))}
                            value={assignedRegions}
                            onChange={handleRegionsChange}
                            placeholder="Select region(s)"
                            disabled={isAdmin}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">
                            Customer{" "}
                            <span className="text-[#9ca3af]">
                                (optional — leave empty to assign the whole region)
                            </span>
                        </Label>
                        <MultiSelectChips
                            options={filteredClients.map((c) => ({ _id: c._id, label: c.name }))}
                            value={assignedClients}
                            onChange={setAssignedClients}
                            placeholder={
                                assignedRegions.length === 0
                                    ? "Select a region first"
                                    : "Select customer(s)"
                            }
                            disabled={isAdmin || assignedRegions.length === 0}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="rounded-[10px] h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-[#2D3E5C] hover:bg-[#1f2c44] text-white rounded-[10px] h-10 px-5"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {submitting ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
