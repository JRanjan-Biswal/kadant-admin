"use client";

import { useState } from "react";
import { Plus, Mail, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddTeamMemberForm from "./AddTeamMemberForm";

interface TeamMember {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    image?: string;
    createdAt?: string;
}

interface TeamManagementPageProps {
    teamMembers: TeamMember[];
    total: number;
}

export default function TeamManagementPage({
    teamMembers,
    total,
}: TeamManagementPageProps) {
    const [showAddForm, setShowAddForm] = useState(false);

    if (showAddForm) {
        return <AddTeamMemberForm onBack={() => setShowAddForm(false)} />;
    }

    return (
        <div className="min-h-screen bg-[#ffffff] p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-normal text-gray-900 leading-8">
                        Team Management
                    </h1>
                    <p className="text-[#6b7280] text-base leading-6">
                        {total} kadant team {total === 1 ? "member" : "members"}
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-6 py-3 h-auto flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Add Team Member</span>
                </Button>
            </div>

            {teamMembers.length === 0 ? (
                <div className="bg-white border border-[#96A5BA] rounded-[10px] p-10 text-center text-[#6b7280]">
                    No team members yet. Click &quot;Add Team Member&quot; to create one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((m) => (
                        <div
                            key={m._id}
                            className="bg-white border border-[#96A5BA] rounded-[10px] p-5 flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#e5e7eb] flex items-center justify-center text-gray-900 text-lg font-semibold">
                                    {m.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 text-base font-medium truncate">
                                        {m.name}
                                    </p>
                                    {m.designation && (
                                        <p className="text-[#6b7280] text-sm truncate">
                                            {m.designation}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm">
                                <div className="flex items-center gap-2 text-[#6b7280]">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{m.email}</span>
                                </div>
                                {m.phone && (
                                    <div className="flex items-center gap-2 text-[#6b7280]">
                                        <Phone className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{m.phone}</span>
                                    </div>
                                )}
                                {m.designation && (
                                    <div className="flex items-center gap-2 text-[#6b7280]">
                                        <Briefcase className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{m.designation}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
