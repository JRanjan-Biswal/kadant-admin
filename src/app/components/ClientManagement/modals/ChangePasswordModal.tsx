"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { X, Check, Loader2, Eye, EyeOff } from "lucide-react";
import ConfirmationDialog from "./ConfirmationDialog";

interface ChangePasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}

export default function ChangePasswordModal({
    open,
    onOpenChange,
    onSave
}: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSaveClick = () => {
        setError("");
        
        if (!currentPassword.trim()) {
            setError("Current password is required");
            return;
        }
        
        if (!newPassword.trim()) {
            setError("New password is required");
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }
        
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onSave(currentPassword, newPassword);
            setShowConfirmation(false);
            handleClose();
        } catch {
            setError("Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setError("");
        setShowConfirmation(false);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        onOpenChange(false);
    };

    const PasswordInput = ({ 
        value, 
        onChange, 
        placeholder,
        show,
        onToggleShow
    }: { 
        value: string; 
        onChange: (value: string) => void; 
        placeholder: string;
        show: boolean;
        onToggleShow: () => void;
    }) => (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded-[10px] h-[46px] px-4 pr-12 text-[#f3f4f6] text-base placeholder:text-[#4a4a4a] outline-none focus:border-[#d45815] transition-colors"
            />
            <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6a7282] hover:text-[#f3f4f6] transition-colors"
            >
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
    );

    return (
        <>
            <Dialog open={open && !showConfirmation} onOpenChange={handleClose}>
                <DialogContent 
                    showCloseButton={false}
                    className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-[14px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] p-0 max-w-[500px]"
                >
                    {/* Header */}
                    <div className="border-b border-[#1a1a1a] flex items-center justify-between h-[85px] px-6">
                        <h3 className="text-[#f3f4f6] text-2xl leading-8">Change your Password</h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#1a1a1a] transition-colors"
                        >
                            <X className="w-5 h-5 text-[#f3f4f6]" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col gap-5">
                        {/* Current Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6a7282] text-base leading-6">Current Password</label>
                            <PasswordInput
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                placeholder="Enter current password"
                                show={showCurrentPassword}
                                onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                            />
                        </div>

                        {/* New Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6a7282] text-base leading-6">New Password</label>
                            <PasswordInput
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="Enter new password"
                                show={showNewPassword}
                                onToggleShow={() => setShowNewPassword(!showNewPassword)}
                            />
                        </div>

                        {/* Confirm New Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6a7282] text-base leading-6">Confirm New Password</label>
                            <PasswordInput
                                value={confirmNewPassword}
                                onChange={setConfirmNewPassword}
                                placeholder="Confirm new password"
                                show={showConfirmPassword}
                                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#1a1a1a] flex items-center justify-end gap-3 h-[93px] px-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="bg-[#1a1a1a] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base leading-6 hover:bg-[#262626] transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveClick}
                            disabled={isLoading}
                            className="bg-[#d45815] text-[#f3f4f6] px-5 py-[10px] rounded-[10px] text-base font-bold leading-6 hover:bg-[#d45815]/90 transition-colors flex items-center gap-[9px] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                type="password"
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirmation(false)}
                isLoading={isLoading}
            />
        </>
    );
}
