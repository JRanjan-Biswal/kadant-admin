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
    updateSuperAdminCredentials,
    type AccessAdmin,
} from "@/actions/access-control";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    superAdmin: AccessAdmin | null;
}

export default function UpdateSuperAdminModal({
    open,
    onOpenChange,
    superAdmin,
}: Props) {
    const router = useRouter();
    const [name, setName] = useState(superAdmin?.name || "");
    const [email, setEmail] = useState(superAdmin?.email || "");
    const [username, setUsername] = useState(superAdmin?.username || "");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setSubmitting(true);
        const res = await updateSuperAdminCredentials({
            name,
            email,
            username,
            password: password || undefined,
        });
        setSubmitting(false);
        if (!res.success) {
            toast.error(res.error || "Failed to update super admin");
            return;
        }
        toast.success("Super admin credentials updated");
        setPassword("");
        setConfirm("");
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-[16px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-[18px] font-semibold text-gray-900">
                        Update Super Admin Credentials
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="px-6 pt-4 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Full Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Feroz Khan"
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-[#6b7280]">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="feroz.khan@kadant.com"
                                className="rounded-[10px] border-[#96A5BA] h-11"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-[#6b7280]">Username</Label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="feroz.khan"
                            className="rounded-[10px] border-[#96A5BA] h-11"
                        />
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
                    <p className="text-[11px] text-[#9ca3af]">
                        Leave password fields blank to keep the existing password. New
                        password must be 8+ chars with upper, lower, number, and symbol.
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
