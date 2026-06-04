"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check, Loader2 } from "lucide-react";
import { fetchAdminUsers, AdminUser } from "@/actions/fetch-admin-users";

interface ChangeOwnerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentOwnerName: string;
    onSave: (userID: string, userName: string, userEmail: string) => Promise<void>;
}

export default function ChangeOwnerModal({
    open,
    onOpenChange,
    currentOwnerName,
    onSave,
}: ChangeOwnerModalProps) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUserID, setSelectedUserID] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setIsFetching(true);
        fetchAdminUsers()
            .then(setUsers)
            .finally(() => setIsFetching(false));
    }, [open]);

    const handleSave = async () => {
        setError("");
        if (!selectedUserID) {
            setError("Please select an owner");
            return;
        }
        const selected = users.find((u) => u._id === selectedUserID);
        if (!selected) return;
        setIsLoading(true);
        try {
            await onSave(selectedUserID, selected.name, selected.email);
            handleClose();
        } catch {
            setError("Failed to update owner");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUserID("");
        setError("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                showCloseButton={false}
                className="bg-white border border-[#96A5BA] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[500px] overflow-hidden"
            >
                <div className="bg-[#DFE6EC] border-b border-[#96A5BA] flex items-center justify-between h-[72px] px-6">
                    <h3 className="text-[#2D3E5C] text-xl font-bold leading-7">Change Owner</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#f9fafb] transition-colors"
                    >
                        <X className="w-5 h-5 text-[#2D3E5C]" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[#6b7280] text-base leading-6">Current Owner</label>
                        <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 flex items-center">
                            <span className="text-[#1f2937] text-base">{currentOwnerName || "Not set"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[#6b7280] text-base leading-6">New Owner</label>
                        {isFetching ? (
                            <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#6b7280]" />
                                <span className="text-[#6b7280] text-base">Loading users...</span>
                            </div>
                        ) : (
                            <select
                                value={selectedUserID}
                                onChange={(e) => setSelectedUserID(e.target.value)}
                                className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[10px] h-[46px] px-4 text-[#2D3E5C] text-base outline-none focus:border-[#d45815] transition-colors cursor-pointer"
                            >
                                <option value="">Select a user...</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>

                <div className="border-t border-[#96A5BA] flex items-center justify-end gap-3 h-[80px] px-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="bg-[#f3f4f6] border border-[#d1d5db] text-[#6b7280] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#e5e7eb] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading || isFetching}
                        className="bg-[#2D3E5C] text-white px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#1f2a44] transition-colors flex items-center gap-[9px] disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
