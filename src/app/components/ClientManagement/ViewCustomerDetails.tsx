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
import ChangeRegionModal from "./modals/ChangeRegionModal";
import ChangeCustomerModal from "./modals/ChangeCustomerModal";
import ConfirmationDialog from "./modals/ConfirmationDialog";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";
import {
    updateClientEmail,
    updateClientPassword,
    updateClientVisibility,
    updateClientRegion,
    updateClientCustomer,
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
    iconColor = "text-[#6b7280]"
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string;
    iconColor?: string;
}) => (
    <div className="bg-white border border-[#96A5BA] rounded-[10px] pt-4 px-4 pb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-[#6b7280] text-sm leading-5">{label}</span>
        </div>
        <p className="text-[#2D3E5C] text-base font-bold leading-6">{value || "N/A"}</p>
    </div>
);

// Section Header Component (without number) — light blue-gray strip with bold navy
const SectionTitle = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div className="bg-[#DFE6EC] border-b border-[#96A5BA] px-6 py-4 flex items-center justify-between">
        <h3 className="text-[#2D3E5C] text-lg font-bold leading-7">{title}</h3>
        {action}
    </div>
);

// Contact Info Row
const ContactRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[#6b7280] text-sm leading-5">{label}</span>
        <p className="text-[#2D3E5C] text-base font-bold leading-6">{value || "N/A"}</p>
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
        <span className="text-[#6b7280] text-base leading-6">{label}</span>
        <div className="flex items-center gap-3">
            <button
                onClick={onEdit}
                className="flex items-center gap-1.5 text-[#d45815] hover:text-[#d45815]/80 transition-colors"
                disabled={isEditing}
            >
                <Pencil className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
            </button>
            <span className="text-[#2D3E5C] text-base font-bold leading-6">{value || "N/A"}</span>
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
    <div className="bg-[#DFE6EC] border border-[#96A5BA] rounded-[50px] p-1 flex items-center gap-1">
        <button
            onClick={() => !isActive && onToggle()}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-[50px] text-sm font-semibold capitalize transition-colors ${
                isActive
                    ? "bg-[#00a82d] text-white"
                    : "bg-transparent text-[#6b7280] hover:text-[#2D3E5C]"
            }`}
        >
            {isLoading && isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate"}
        </button>
        <button
            onClick={() => isActive && onToggle()}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-[50px] text-sm font-semibold capitalize transition-colors ${
                !isActive
                    ? "bg-white border border-[#96A5BA] text-[#2D3E5C]"
                    : "bg-transparent text-[#6b7280] hover:text-[#2D3E5C]"
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
    const [currentRegion, setCurrentRegion] = useState(client.region || "");
    const [currentCustomer, setCurrentCustomer] = useState(client.customer || "");

    // Modal states
    const [showChangeIdModal, setShowChangeIdModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showChangeRegionModal, setShowChangeRegionModal] = useState(false);
    const [showChangeCustomerModal, setShowChangeCustomerModal] = useState(false);
    const [showEditBusinessModal, setShowEditBusinessModal] = useState(false);
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
        const result = await updateClientEmail(client._id, newId);
        if (result.success) {
            setCurrentUsername(newId);
            toast.success(result.message || "Email updated successfully");
        } else {
            toast.error(result.error || "Failed to update email");
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

    const handleSaveRegion = async (region: string) => {
        const result = await updateClientRegion(client._id, region);
        if (result.success) {
            setCurrentRegion(region);
            toast.success(result.message || "Region updated successfully");
        } else {
            toast.error(result.error || "Failed to update region");
            throw new Error(result.error);
        }
    };

    const handleSaveCustomer = async (customer: string) => {
        const result = await updateClientCustomer(client._id, customer);
        if (result.success) {
            setCurrentCustomer(customer);
            toast.success(result.message || "Customer updated successfully");
        } else {
            toast.error(result.error || "Failed to update customer");
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
            <div className="min-h-screen bg-[#ffffff] p-6">
                <div className="flex flex-col gap-6">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#6b7280] hover:text-gray-900 transition-colors w-fit"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-base leading-6">Back to Admin Dashboard</span>
                    </button>

                    {/* Title Section */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[#2D3E5C] text-2xl font-bold leading-8">Client Details</h1>
                        <p className="text-[#6b7280] text-base leading-6">
                            Detailed information about {client.name}
                        </p>
                    </div>

                    {/* Business Information Section */}
                    <div className="bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                        <SectionTitle
                            title="Business Information"
                            action={
                                <button
                                    type="button"
                                    onClick={() => setShowEditBusinessModal(true)}
                                    className="flex items-center gap-1.5 text-[#d45815] hover:text-[#d45815]/80 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    <span className="text-sm font-medium">Edit</span>
                                </button>
                            }
                        />
                        
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
                                    value={currentRegion || "N/A"}
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
                        <div className="bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                            <SectionTitle title="Contact Information" />
                            <div className="p-6 flex flex-col gap-4">
                                <ContactRow label="Primary Contact" value={ownerName} />
                                <ContactRow label="Email" value={ownerEmail} />
                                <ContactRow label="Phone" value="+91 0000000000" />
                            </div>
                        </div>

                        {/* Account Management */}
                        <div className="bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
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
                                <AccountRow
                                    label="Change Region"
                                    value={currentRegion || "Not set"}
                                    onEdit={() => setShowChangeRegionModal(true)}
                                />
                                <AccountRow
                                    label="Change Customer"
                                    value={currentCustomer || "Not set"}
                                    onEdit={() => setShowChangeCustomerModal(true)}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[#6b7280] text-base leading-6">Account Status</span>
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
            <EditClientDetails
                client={client}
                machines={[]}
                open={showEditBusinessModal}
                onOpenChange={setShowEditBusinessModal}
            />

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

            <ChangeRegionModal
                open={showChangeRegionModal}
                onOpenChange={setShowChangeRegionModal}
                currentRegion={currentRegion}
                onSave={handleSaveRegion}
            />

            <ChangeCustomerModal
                open={showChangeCustomerModal}
                onOpenChange={setShowChangeCustomerModal}
                currentCustomer={currentCustomer}
                onSave={handleSaveCustomer}
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
