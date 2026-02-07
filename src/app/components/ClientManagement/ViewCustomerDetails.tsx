"use client";

import { useState } from "react";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { 
    ArrowLeft,
    Building2,
    MapPin,
    Globe,
    Package,
    User,
    Gauge,
    Pencil,
    Loader2
} from "lucide-react";
import ChangeIdModal from "./modals/ChangeIdModal";
import ChangePasswordModal from "./modals/ChangePasswordModal";
import ConfirmationDialog from "./modals/ConfirmationDialog";
import { 
    updateClientUsername, 
    updateClientPassword, 
    updateClientVisibility 
} from "@/actions/update-client-credentials";

interface ViewCustomerDetailsProps {
    client: Client;
    onBack: () => void;
}

// Info Card Component
const InfoCard = ({ 
    icon: Icon, 
    label, 
    value,
    iconColor = "text-[#737373]"
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string;
    iconColor?: string;
}) => (
    <div className="bg-[rgba(38,38,38,0.5)] rounded-[10px] pt-4 px-4 pb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-[#737373] text-sm leading-5">{label}</span>
        </div>
        <p className="text-white text-base leading-6">{value || "N/A"}</p>
    </div>
);

// Section Header Component (without number)
const SectionTitle = ({ title }: { title: string }) => (
    <div className="border-b border-[#262626] px-6 pt-4 pb-4">
        <h3 className="text-white text-lg font-medium leading-7">{title}</h3>
    </div>
);

// Contact Info Row
const ContactRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[#737373] text-sm leading-5">{label}</span>
        <p className="text-white text-base leading-6">{value || "N/A"}</p>
    </div>
);

// Account Management Row
const AccountRow = ({ 
    label, 
    value, 
    onEdit,
    isEditing = false
}: { 
    label: string; 
    value: string; 
    onEdit: () => void;
    isEditing?: boolean;
}) => (
    <div className="flex items-center justify-between">
        <span className="text-[#a1a1a1] text-base leading-6">{label}</span>
        <div className="flex items-center gap-3">
            <button 
                onClick={onEdit}
                className="flex items-center gap-2 text-[#d45815] hover:text-[#d45815]/80 transition-colors"
                disabled={isEditing}
            >
                <Pencil className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
            </button>
            <span className="text-white text-xl leading-7">{value || "N/A"}</span>
        </div>
    </div>
);

// Activate/Deactivate Toggle
const VisibilityToggle = ({ 
    isActive, 
    onToggle,
    isLoading = false
}: { 
    isActive: boolean; 
    onToggle: () => void;
    isLoading?: boolean;
}) => (
    <div className="bg-[#0d0d0d] rounded-[50px] p-3 flex items-center gap-3">
        <button
            onClick={() => !isActive && onToggle()}
            disabled={isLoading}
            className={`px-3 py-2 rounded-[50px] text-base font-semibold capitalize transition-colors ${
                isActive 
                    ? "bg-[#00a82d] text-white" 
                    : "bg-transparent text-[#717171] hover:text-white"
            }`}
        >
            {isLoading && isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate"}
        </button>
        <button
            onClick={() => isActive && onToggle()}
            disabled={isLoading}
            className={`px-3 py-2 rounded-[50px] text-base font-semibold capitalize transition-colors ${
                !isActive 
                    ? "bg-[#404040] text-white" 
                    : "bg-transparent text-[#717171] hover:text-white"
            }`}
        >
            {isLoading && !isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deactivate"}
        </button>
    </div>
);

export default function ViewCustomerDetails({ client, onBack }: ViewCustomerDetailsProps) {
    const [isActive, setIsActive] = useState(client.isActive);
    const [currentUsername, setCurrentUsername] = useState(
        typeof client.clientOwnership === 'object' 
            ? client.clientOwnership.email 
            : "N/A"
    );
    
    // Modal states
    const [showChangeIdModal, setShowChangeIdModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showVisibilityConfirmation, setShowVisibilityConfirmation] = useState(false);
    const [pendingVisibilityChange, setPendingVisibilityChange] = useState<boolean | null>(null);
    
    // Loading states
    const [isToggling, setIsToggling] = useState(false);

    const handleEditId = () => {
        setShowChangeIdModal(true);
    };

    const handleEditPassword = () => {
        setShowChangePasswordModal(true);
    };

    const handleSaveId = async (newId: string) => {
        const result = await updateClientUsername(client._id, newId);
        if (result.success) {
            setCurrentUsername(newId);
            toast.success(result.message || "Username updated successfully");
        } else {
            toast.error(result.error || "Failed to update username");
            throw new Error(result.error);
        }
    };

    const handleSavePassword = async (currentPassword: string, newPassword: string) => {
        const result = await updateClientPassword(client._id, currentPassword, newPassword);
        if (result.success) {
            toast.success(result.message || "Password updated successfully");
        } else {
            toast.error(result.error || "Failed to update password");
            throw new Error(result.error);
        }
    };

    const handleToggleVisibilityClick = () => {
        setPendingVisibilityChange(!isActive);
        setShowVisibilityConfirmation(true);
    };

    const handleConfirmVisibility = async () => {
        if (pendingVisibilityChange === null) return;
        
        setIsToggling(true);
        try {
            const result = await updateClientVisibility(client._id, pendingVisibilityChange);
            if (result.success) {
                setIsActive(pendingVisibilityChange);
                toast.success(result.message || `Client ${pendingVisibilityChange ? 'activated' : 'deactivated'} successfully`);
            } else {
                toast.error(result.error || "Failed to update client status");
            }
        } catch {
            toast.error("Failed to update client status");
        } finally {
            setIsToggling(false);
            setShowVisibilityConfirmation(false);
            setPendingVisibilityChange(null);
        }
    };

    // Get owner info
    const ownerName = typeof client.clientOwnership === 'object' 
        ? client.clientOwnership.name 
        : "N/A";
    const ownerEmail = typeof client.clientOwnership === 'object' 
        ? client.clientOwnership.email 
        : "N/A";

    return (
        <>
            <div className="min-h-screen bg-[#0a0a0a] p-6">
                <div className="flex flex-col gap-6">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors w-fit"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-base leading-6">Back to Admin Dashboard</span>
                    </button>

                    {/* Title Section */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-2xl font-normal leading-8">Client Overview</h1>
                        <p className="text-[#a1a1a1] text-base leading-6">
                            Detailed information about {client.name}
                        </p>
                    </div>

                    {/* Business Information Section */}
                    <div className="bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                        <div className="bg-[#262626] border-b border-[#262626] px-6 pt-4 pb-4">
                            <h2 className="text-white text-xl font-normal leading-7">Business Information</h2>
                        </div>
                        
                        <div className="p-6">
                            {/* Grid of Info Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                {/* Row 1 */}
                                <InfoCard 
                                    icon={Building2} 
                                    label="Company Name" 
                                    value={client.name}
                                    iconColor="text-[#d45815]"
                                />
                                <InfoCard 
                                    icon={MapPin} 
                                    label="Location" 
                                    value={client.location?.address}
                                    iconColor="text-[#d45815]"
                                />
                                <InfoCard 
                                    icon={Globe} 
                                    label="Region" 
                                    value={client.region || "N/A"}
                                    iconColor="text-[#d45815]"
                                />
                                
                                {/* Row 2 */}
                                <InfoCard 
                                    icon={Package} 
                                    label="End Product" 
                                    value={client.endProduct}
                                    iconColor="text-[#d45815]"
                                />
                                <InfoCard 
                                    icon={User} 
                                    label="Owner" 
                                    value={ownerName}
                                />
                                <InfoCard 
                                    icon={Gauge} 
                                    label="Capacity" 
                                    value={client.capacity}
                                    iconColor="text-[#d45815]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Two Column Section: Contact Info & Account Management */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                            <SectionTitle title="Contact Information" />
                            <div className="p-6 flex flex-col gap-4">
                                <ContactRow label="Primary Contact" value={ownerName} />
                                <ContactRow label="Email" value={ownerEmail} />
                                <ContactRow label="Phone" value="+91 0000000000" />
                            </div>
                        </div>

                        {/* Account Management */}
                        <div className="bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                            <SectionTitle title="Account Management" />
                            <div className="p-6 flex flex-col gap-4">
                                <AccountRow 
                                    label="Change ID" 
                                    value={currentUsername}
                                    onEdit={handleEditId}
                                />
                                <AccountRow 
                                    label="Change Password" 
                                    value="••••••••••"
                                    onEdit={handleEditPassword}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[#a1a1a1] text-base leading-6">Account Visibility</span>
                                    <VisibilityToggle 
                                        isActive={isActive}
                                        onToggle={handleToggleVisibilityClick}
                                        isLoading={isToggling}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ChangeIdModal
                open={showChangeIdModal}
                onOpenChange={setShowChangeIdModal}
                currentId={currentUsername}
                onSave={handleSaveId}
            />

            <ChangePasswordModal
                open={showChangePasswordModal}
                onOpenChange={setShowChangePasswordModal}
                onSave={handleSavePassword}
            />

            <ConfirmationDialog
                open={showVisibilityConfirmation}
                onOpenChange={setShowVisibilityConfirmation}
                type="visibility"
                onConfirm={handleConfirmVisibility}
                onCancel={() => {
                    setShowVisibilityConfirmation(false);
                    setPendingVisibilityChange(null);
                }}
                isLoading={isToggling}
            />
        </>
    );
}
