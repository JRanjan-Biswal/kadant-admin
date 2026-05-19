"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    UserPlus,
    MapPin,
    Users,
    CheckCircle2,
    ShieldCheck,
    Pencil,
    Trash2,
    KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AccessAdmin, AccessStats } from "@/actions/access-control";
import { deleteAdmin } from "@/actions/access-control";
import UpdateSuperAdminModal from "./UpdateSuperAdminModal";
import CreateAdminModal from "./CreateAdminModal";
import EditAdminModal from "./EditAdminModal";
import AssignAccessModal from "./AssignAccessModal";

interface Props {
    stats: AccessStats;
    superAdmin: AccessAdmin | null;
    admins: AccessAdmin[];
    regions: { _id: string; region: string }[];
    clients: { _id: string; name: string }[];
}

const formatDate = (s?: string) => {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "—";
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${date} ${time}`;
};

const initials = (name?: string) =>
    (name || "?")
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

export default function AccessControlPage({
    stats,
    superAdmin,
    admins,
    regions,
    clients,
}: Props) {
    const router = useRouter();
    const [openSuper, setOpenSuper] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [editAdmin, setEditAdmin] = useState<AccessAdmin | null>(null);
    const [accessAdmin, setAccessAdmin] = useState<AccessAdmin | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AccessAdmin | null>(null);
    const [deleting, setDeleting] = useState(false);

    const regionsCountLabel = useMemo(
        () => `${stats.regionsAssigned}/${stats.totalRegions || 0}`,
        [stats]
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const res = await deleteAdmin(deleteTarget._id);
        setDeleting(false);
        if (!res.success) {
            toast.error(res.error || "Failed to delete admin");
            return;
        }
        toast.success("Admin deleted");
        setDeleteTarget(null);
        router.refresh();
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white p-6 flex flex-col gap-5">
            <div>
                <h1 className="text-[22px] font-semibold text-gray-900 leading-7">
                    Admin Access Control
                </h1>
                <p className="text-[#6b7280] text-sm leading-6">
                    Manage super admin and admin access with region-wise control
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Total Admin"
                    value={stats.totalAdmin}
                    icon={<Users className="w-6 h-6 text-[#2D3E5C]" />}
                />
                <StatCard
                    label="Active Admins"
                    value={stats.activeAdmins}
                    icon={<CheckCircle2 className="w-6 h-6 text-[#2D3E5C]" />}
                />
                <StatCard
                    label="Region Assigned"
                    value={regionsCountLabel}
                    icon={<MapPin className="w-6 h-6 text-[#2D3E5C]" />}
                />
            </div>

            <section className="bg-white border border-[#dbe3ec] rounded-[12px] overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 bg-[#eef2f6] border-b border-[#dbe3ec]">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#2D3E5C]" />
                        <h2 className="text-base font-semibold text-gray-900">Super Admin</h2>
                    </div>
                    <Button
                        onClick={() => setOpenSuper(true)}
                        disabled={!superAdmin}
                        className="bg-[#2D3E5C] hover:bg-[#1f2c44] text-white rounded-[10px] h-10 px-4"
                    >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Update Credentials
                    </Button>
                </header>
                {superAdmin ? (
                    <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-white">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-11 h-11">
                                <AvatarImage src={superAdmin.image || undefined} alt={superAdmin.name} />
                                <AvatarFallback className="bg-[#fef3ec] text-[#d45815] text-sm font-semibold">
                                    {initials(superAdmin.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {superAdmin.name}
                                </p>
                                <span className="inline-block mt-0.5 text-[10px] font-semibold text-white bg-[#d45815] rounded-full px-2 py-0.5 uppercase tracking-wide">
                                    Super Admin
                                </span>
                            </div>
                        </div>
                        <Field label="Email" value={superAdmin.email} />
                        <Field label="User Name" value={superAdmin.username || "—"} />
                        <Field label="Last Login" value={formatDate(superAdmin.lastLoginAt)} />
                    </div>
                ) : (
                    <div className="px-5 py-6 text-sm text-[#6b7280] bg-white">
                        No super admin found.
                    </div>
                )}
            </section>

            <section className="bg-white border border-[#dbe3ec] rounded-[12px] overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 bg-[#eef2f6] border-b border-[#dbe3ec]">
                    <h2 className="text-base font-semibold text-gray-900">Admin Management</h2>
                    <Button
                        onClick={() => setOpenCreate(true)}
                        className="bg-[#2D3E5C] hover:bg-[#1f2c44] text-white rounded-[10px] h-10 px-4"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create New Admin
                    </Button>
                </header>

                <div className="overflow-x-auto bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[#6b7280] text-xs border-b border-[#f3f4f6]">
                                <Th>Admin Details</Th>
                                <Th>Contact</Th>
                                <Th className="text-center">Status</Th>
                                <Th className="text-center">Assigned Regions</Th>
                                <Th>Assigned Clients</Th>
                                <Th>Last Login</Th>
                                <Th className="text-right pr-5">Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-[#6b7280]">
                                        No admins yet. Click &quot;Create New Admin&quot; to add one.
                                    </td>
                                </tr>
                            ) : (
                                admins.map((a) => (
                                    <tr key={a._id} className="border-t border-[#f3f4f6] hover:bg-[#fafafa]">
                                        <Td>
                                            <div className="flex items-center gap-2.5">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={a.image || undefined} alt={a.name} />
                                                    <AvatarFallback className="bg-[#d1d5db] text-gray-900 text-xs font-semibold">
                                                        {initials(a.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-gray-900 font-medium truncate">{a.name}</p>
                                                    <p className="text-[11px] text-[#6b7280] truncate">
                                                        @{a.username || a.email.split("@")[0]}
                                                    </p>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <p className="text-gray-900 truncate">{a.email}</p>
                                            {a.phone && (
                                                <p className="text-[11px] text-[#6b7280] truncate">{a.phone}</p>
                                            )}
                                        </Td>
                                        <Td className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    a.isActive
                                                        ? "bg-transparent border-emerald-500 text-emerald-600 rounded-full font-medium px-3"
                                                        : "bg-transparent border-rose-500 text-rose-600 rounded-full font-medium px-3"
                                                }
                                            >
                                                {a.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </Td>
                                        <Td className="text-center">
                                            <ChipList
                                                items={(a.assignedRegions || []).map((r) => r.region)}
                                                emptyLabel="—"
                                            />
                                        </Td>
                                        <Td>
                                            {(a.assignedClients || []).length > 0 ? (
                                                <span className="text-gray-900">
                                                    {a.assignedClients!.length}{" "}
                                                    {a.assignedClients!.length === 1 ? "Client" : "Clients"}
                                                </span>
                                            ) : (
                                                <span className="text-[#9ca3af]">—</span>
                                            )}
                                        </Td>
                                        <Td>
                                            <span className="text-[12px] text-[#6b7280] whitespace-pre">
                                                {formatDate(a.lastLoginAt)}
                                            </span>
                                        </Td>
                                        <Td className="text-right pr-5">
                                            <div className="inline-flex items-center gap-2">
                                                <IconBtn
                                                    title="Assign Access"
                                                    onClick={() => setAccessAdmin(a)}
                                                    className="text-[#2563eb] hover:bg-[#dbeafe]"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </IconBtn>
                                                <IconBtn
                                                    title="Edit Admin"
                                                    onClick={() => setEditAdmin(a)}
                                                    className="text-[#2563eb] hover:bg-[#dbeafe]"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </IconBtn>
                                                <IconBtn
                                                    title="Delete Admin"
                                                    onClick={() => setDeleteTarget(a)}
                                                    className="text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </IconBtn>
                                            </div>
                                        </Td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <UpdateSuperAdminModal
                open={openSuper}
                onOpenChange={setOpenSuper}
                superAdmin={superAdmin}
            />
            <CreateAdminModal
                open={openCreate}
                onOpenChange={setOpenCreate}
                regions={regions}
                clients={clients}
            />
            <EditAdminModal
                open={!!editAdmin}
                onOpenChange={(v) => !v && setEditAdmin(null)}
                admin={editAdmin}
            />
            <AssignAccessModal
                open={!!accessAdmin}
                onOpenChange={(v) => !v && setAccessAdmin(null)}
                admin={accessAdmin}
                regions={regions}
                clients={clients}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(v) => !v && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete admin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {deleteTarget?.name} and revoke their
                            access. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {deleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-[#eef2f6] border border-[#dbe3ec] rounded-[12px] px-5 py-4 flex items-center justify-between">
            <div>
                <p className="text-sm text-[#4b5563] font-medium">{label}</p>
                <p className="text-[32px] font-semibold text-gray-900 leading-10 mt-1">
                    {value}
                </p>
            </div>
            <div className="shrink-0">{icon}</div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-wide text-[#6b7280] font-semibold">
                {label}
            </p>
            <p className="text-sm text-gray-900 mt-1 break-words">{value}</p>
        </div>
    );
}

function Th({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th className={`text-left font-semibold px-5 py-3 ${className || ""}`}>
            {children}
        </th>
    );
}

function Td({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <td className={`px-5 py-3 align-middle ${className || ""}`}>{children}</td>;
}

function ChipList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
    if (!items.length) return <span className="text-[#9ca3af]">{emptyLabel}</span>;
    const visible = items.slice(0, 2);
    const overflow = items.length - visible.length;
    return (
        <div className="inline-flex flex-wrap gap-1 justify-center">
            {visible.map((t) => (
                <span
                    key={t}
                    className="bg-white border border-[#cbd5e1] text-[#374151] text-[11px] font-medium px-3 py-0.5 rounded-full"
                >
                    {t}
                </span>
            ))}
            {overflow > 0 && (
                <span className="bg-white border border-[#cbd5e1] text-[#374151] text-[11px] font-medium px-2 py-0.5 rounded-full">
                    +{overflow}
                </span>
            )}
        </div>
    );
}

function IconBtn({
    children,
    onClick,
    className,
    title,
}: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition ${className || ""}`}
        >
            {children}
        </button>
    );
}
