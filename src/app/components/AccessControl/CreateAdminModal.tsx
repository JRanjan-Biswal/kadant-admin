"use client";

import { useState } from "react";
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
import { createAdmin } from "@/actions/access-control";
import MultiSelectChips from "./MultiSelectChips";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    regions: { _id: string; region: string }[];
    clients: { _id: string; name: string }[];
}

export default function CreateAdminModal({
    open,
    onOpenChange,
    regions,
    clients,
}: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [phone, setPhone] = useState("");
    const [designation, setDesignation] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [assignedRegions, setAssignedRegions] = useState<string[]>([]);
    const [assignedClients, setAssignedClients] = useState<string[]>([]);
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setName("");
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirm("");
        setPhone("");
        setDesignation("");
        setIsActive(true);
        setAssignedRegions([]);
        setAssignedClients([]);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            toast.error("Name, email, and password are required");
            return;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setSubmitting(true);
        const res = await createAdmin({
            name,
            email,
            username,
            password,
            passwordConfirmation: confirm,
            phone: phone || undefined,
            designation: designation || undefined,
            isActive,
            assignedRegions,
            assignedClients,
        });
        setSubmitting(false);
        if (!res.success) {
            toast.error(res.error || "Failed to create admin");
            return;
        }
        toast.success("Admin created");
        reset();
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-[16px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-[18px] font-semibold text-gray-900">
                        Create New Admin
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="px-6 pt-4 pb-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Full Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter Full Name"
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@kadant.com"
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
                                placeholder="Username"
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
                                    placeholder="Enter new password"
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
                                    placeholder="Enter new password"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Phone (optional)</Label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 90000 00000"
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Designation (optional)</Label>
                            <Input
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                placeholder="Regional Manager"
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Assign Regions</Label>
                        <MultiSelectChips
                            options={regions.map((r) => ({ _id: r._id, label: r.region }))}
                            value={assignedRegions}
                            onChange={setAssignedRegions}
                            placeholder="Select regions"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Assign Clients</Label>
                        <MultiSelectChips
                            options={clients.map((c) => ({ _id: c._id, label: c.name }))}
                            value={assignedClients}
                            onChange={setAssignedClients}
                            placeholder="Select clients"
                        />
                    </div>
                    <p className="text-[11px] text-[#9ca3af]">
                        Password must be 8+ chars with upper, lower, number, and symbol.
                    </p>
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
