"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    ArrowLeft,
    Save,
    User,
    Mail,
    Lock,
    Phone,
    Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import SectionHeader from "@/components/SectionHeader";
import InputField from "@/components/InputField";
import { addTeamMember } from "@/actions/add-team-member";

interface AddTeamMemberFormProps {
    onBack: () => void;
}

export default function AddTeamMemberForm({ onBack }: AddTeamMemberFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [designation, setDesignation] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email.trim())) {
            toast.error("Email is invalid");
            return;
        }
        if (!password) {
            toast.error("Password is required");
            return;
        }
        const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!strongPw.test(password)) {
            toast.error(
                "Password must be 8+ chars with upper, lower, number, symbol"
            );
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const result = await addTeamMember({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone.trim() || undefined,
                designation: designation.trim() || undefined,
            });

            if (result.success) {
                toast.success("Team member added successfully!");
                router.refresh();
                onBack();
            } else {
                toast.error(result.error || "Failed to add team member");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ffffff] pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-5 px-6 pt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#6b7280] hover:text-gray-900 transition-colors w-fit"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-base">Back to Team Management</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-normal text-gray-900 leading-8">
                                Add Team Member
                            </h1>
                            <p className="text-[#6b7280] text-base leading-6">
                                Create a new kadant team account
                            </p>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-6 py-3 h-auto flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            <span className="font-semibold">Save</span>
                        </Button>
                    </div>
                </div>

                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={1} title="Account Credentials" />
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InputField
                            label="Name *"
                            placeholder="Full name"
                            value={name}
                            onChange={setName}
                            icon={User}
                            required
                        />
                        <InputField
                            label="Email *"
                            placeholder="name@kadant.com"
                            value={email}
                            onChange={setEmail}
                            icon={Mail}
                            type="email"
                            required
                        />
                        <InputField
                            label="Password *"
                            placeholder="Enter password"
                            value={password}
                            onChange={setPassword}
                            icon={Lock}
                            type="password"
                            required
                        />
                        <InputField
                            label="Confirm Password *"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            icon={Lock}
                            type="password"
                            required
                        />
                    </div>
                </div>

                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={2} title="Optional Details" />
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InputField
                            label="Phone"
                            placeholder="+91 9XXXXXXXXX"
                            value={phone}
                            onChange={setPhone}
                            icon={Phone}
                        />
                        <InputField
                            label="Designation"
                            placeholder="e.g., Field Engineer"
                            value={designation}
                            onChange={setDesignation}
                            icon={Briefcase}
                        />
                    </div>
                </div>

                <div className="mx-6 flex justify-end">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-8 py-3 h-auto flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span className="text-base">Save Team Member</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
