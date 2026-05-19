"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addClient, AddClientFormData } from "@/actions/add-client";
import { toast } from "sonner";
import { 
    Loader2,
    ArrowLeft,
    Save,
    User,
    Lock,
    Mail,
    MapPin,
    Package,
    Clock,
    Zap,
    Leaf
} from "lucide-react";

// Import reusable components
import SectionHeader from "@/components/SectionHeader";
import UploadBox from "@/components/UploadBox";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import AddCategoryMachineFlow from "@/app/components/MachineHierarchy/AddCategoryMachineFlow";

interface AddCustomerFormProps {
    onBack: () => void;
    existingRegions: string[];
}

export default function AddCustomerForm({ onBack, existingRegions }: AddCustomerFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // Login Credentials
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Onboarding Images
    const [onboardingImages, setOnboardingImages] = useState<(File | null)[]>([null, null, null]);
    
    // Business Details
    const [region, setRegion] = useState("");
    const [creatingRegion, setCreatingRegion] = useState(false);
    const NEW_REGION_SENTINEL = "__new_region__";

    const handleRegionSelect = (value: string) => {
        if (value === NEW_REGION_SENTINEL) {
            setRegion("");
            setCreatingRegion(true);
        } else {
            setRegion(value);
        }
    };
    const [customerName, setCustomerName] = useState("");
    const [customerCode, setCustomerCode] = useState("");
    const [endProduct, setEndProduct] = useState("");
    const [location, setLocation] = useState("");
    const [currentCapacity, setCurrentCapacity] = useState("");
    const [capacityOfLine, setCapacityOfLine] = useState("");
    const [dailyRunningHours, setDailyRunningHours] = useState("");
    const [powerCost, setPowerCost] = useState("");
    const [fiberCost, setFiberCost] = useState("");
    const [businessImage, setBusinessImage] = useState<File | null>(null);
    
    // Flowsheet & Stock Preparation Images
    const [flowsheetImage, setFlowsheetImage] = useState<File | null>(null);
    const [stockPrepImage, setStockPrepImage] = useState<File | null>(null);

    // Machine IDs created via AddCategoryMachineFlow — linked to the client on submit
    const [createdMachineIds, setCreatedMachineIds] = useState<string[]>([]);
    const handleMachinesCreated = (ids: string[]) => {
        setCreatedMachineIds(ids);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (!location.trim()) {
            toast.error("Location is required");
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
            toast.error("Password must be 8+ chars with upper, lower, number, symbol");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const formData: AddClientFormData = {
                // Login credentials
                email: email.trim().toLowerCase(),
                password,
                
                // Business details
                name: customerName,
                region: region || undefined,
                customer: customerName,
                address: location,
                endProduct: endProduct,
                capacity: currentCapacity,
                capacityOfLine: capacityOfLine || undefined,
                dailyRunningHours: dailyRunningHours || undefined,
                
                // Cost information
                fiberCost: {
                    value: parseFloat(fiberCost) || 0,
                    priceUnit: "INR",
                    perUnit: "ton",
                },
                powerCost: {
                    value: parseFloat(powerCost) || 0,
                    priceUnit: "INR",
                    perUnit: "kWh",
                },

                // Linked machines (created via AddCategoryMachineFlow above)
                machineIds: createdMachineIds,
            };

            const result = await addClient(formData);

            if (result.success) {
                toast.success("Client added successfully!");
                router.refresh();
                onBack();
            } else {
                toast.error(result.error || "Failed to add client");
            }
        } catch (error) {
            console.error("Error adding client:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ffffff] pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-5 px-6 pt-6">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#6b7280] hover:text-gray-900 transition-colors w-fit"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-base">Back to Admin Dashboard</span>
                    </button>

                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#2D3E5C] leading-8">Add New Client</h1>
                            <p className="text-[#6b7280] text-base leading-6">Complete client onboarding process</p>
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
                            <span className="font-semibold">Save & Submit</span>
                        </Button>
                    </div>
                </div>

                {/* Section 1: Create Login Credentials */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={1} title="Create Login Credentials" />
                    <div className="p-6 flex gap-3">
                        <div className="flex-1">
                            <InputField
                                label="Username"
                                placeholder="Enter email"
                                value={email}
                                onChange={setEmail}
                                icon={User}
                                type="email"
                            />
                        </div>
                        <div className="flex-1">
                            <InputField
                                label="Password"
                                placeholder="Enter password"
                                value={password}
                                onChange={setPassword}
                                icon={Lock}
                                type="password"
                            />
                        </div>
                        <div className="flex-1">
                            <InputField
                                label="Confirm Password"
                                placeholder="Enter password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                icon={Lock}
                                type="password"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Onboarding Images */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={2} title="Onboarding Images" />
                    <div className="p-6 flex gap-4">
                        {[0, 1, 2].map(index => (
                            <UploadBox
                                key={index}
                                label="Click to upload onboarding images"
                                sublabel="Upload multiple images (PNG, JPG, GIF)"
                                file={onboardingImages[index]}
                                onFileChange={(file) => {
                                    const newImages = [...onboardingImages];
                                    newImages[index] = file;
                                    setOnboardingImages(newImages);
                                }}
                                className="flex-1"
                            />
                        ))}
                    </div>
                </div>

                {/* Section 3: Business Details */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={3} title="Business Details" />
                    <div className="p-6 flex flex-col gap-6">
                        {/* Row 1 */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                {creatingRegion ? (
                                    <div className="flex flex-col gap-2">
                                        <InputField
                                            label="Region"
                                            placeholder="Enter new region"
                                            value={region}
                                            onChange={setRegion}
                                            icon={MapPin}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setCreatingRegion(false); setRegion(""); }}
                                            className="text-[#6b7280] hover:text-gray-900 text-xs self-start"
                                        >
                                            Use existing region instead
                                        </button>
                                    </div>
                                ) : (
                                    <SelectField
                                        label="Region"
                                        placeholder="Select region"
                                        value={region}
                                        onChange={handleRegionSelect}
                                        icon={MapPin}
                                        options={[
                                            ...existingRegions.map(r => ({ value: r, label: r })),
                                            { value: NEW_REGION_SENTINEL, label: "+ Create new region" },
                                        ]}
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <InputField
                                    label="Customer Name"
                                    placeholder="Enter customer name"
                                    value={customerName}
                                    onChange={setCustomerName}
                                    icon={User}
                                />
                            </div>
                            <div className="flex-1">
                                <InputField
                                    label="End Product"
                                    placeholder="e.g., Kraft Paper"
                                    value={endProduct}
                                    onChange={setEndProduct}
                                    icon={Package}
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <InputField
                                    label="Customer Code"
                                    placeholder="e.g., A20254"
                                    value={customerCode}
                                    onChange={setCustomerCode}
                                />
                            </div>
                            <div className="flex-1">
                                <InputField
                                    label="Current Capacity"
                                    placeholder="e.g., 800 BDMTPD"
                                    value={currentCapacity}
                                    onChange={setCurrentCapacity}
                                />
                            </div>
                            <div className="flex-1">
                                <InputField
                                    label="Capacity of Line"
                                    placeholder="e.g., 1000 TPD"
                                    value={capacityOfLine}
                                    onChange={setCapacityOfLine}
                                />
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <SelectField
                                    label="Daily Running Hours"
                                    placeholder="e.g., 24 hours"
                                    value={dailyRunningHours}
                                    onChange={setDailyRunningHours}
                                    icon={Clock}
                                    options={[
                                        { value: "8", label: "8 hours" },
                                        { value: "12", label: "12 hours" },
                                        { value: "16", label: "16 hours" },
                                        { value: "20", label: "20 hours" },
                                        { value: "24", label: "24 hours" },
                                    ]}
                                />
                            </div>
                            <div className="flex-1">
                                <SelectField
                                    label="Power Cost"
                                    placeholder="e.g., ₹8/kWh"
                                    value={powerCost}
                                    onChange={setPowerCost}
                                    icon={Zap}
                                    options={[
                                        { value: "5", label: "₹5/kWh" },
                                        { value: "6", label: "₹6/kWh" },
                                        { value: "7", label: "₹7/kWh" },
                                        { value: "8", label: "₹8/kWh" },
                                        { value: "9", label: "₹9/kWh" },
                                        { value: "10", label: "₹10/kWh" },
                                    ]}
                                />
                            </div>
                            <div className="flex-1">
                                <SelectField
                                    label="Fiber Cost"
                                    placeholder="e.g., ₹5000/ton"
                                    value={fiberCost}
                                    onChange={setFiberCost}
                                    icon={Leaf}
                                    options={[
                                        { value: "4000", label: "₹4000/ton" },
                                        { value: "4500", label: "₹4500/ton" },
                                        { value: "5000", label: "₹5000/ton" },
                                        { value: "5500", label: "₹5500/ton" },
                                        { value: "6000", label: "₹6000/ton" },
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Row 4: Location (full width) */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <InputField
                                    label="Location"
                                    placeholder="City, State, Country"
                                    value={location}
                                    onChange={setLocation}
                                    icon={MapPin}
                                />
                            </div>
                        </div>

                        {/* Business Image */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#6b7280] text-sm leading-5">Business Image</label>
                            <UploadBox
                                label="Click to upload business image"
                                sublabel="Upload multiple images (PNG, JPG, GIF)"
                                file={businessImage}
                                onFileChange={setBusinessImage}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Flowsheet Image */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={4} title="Flowsheet Image" />
                    <div className="p-6">
                        <UploadBox
                            label="Click to upload flowsheet diagram"
                            sublabel="PNG, JPG (Max 10MB)"
                            file={flowsheetImage}
                            onFileChange={setFlowsheetImage}
                        />
                    </div>
                </div>

                {/* Section 5: Stock Preparation Image */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={5} title="Stock Preparation Image" />
                    <div className="p-6">
                        <UploadBox
                            label="Click to upload stock preparation diagram"
                            sublabel="PNG, JPG (Max 10MB)"
                            file={stockPrepImage}
                            onFileChange={setStockPrepImage}
                        />
                    </div>
                </div>

                {/* Section 6: Add Machine Details (Category → Machine → Spare Parts → Parts) */}
                <div className="mx-6 bg-white border border-[#96A5BA] rounded-[10px] overflow-hidden">
                    <SectionHeader number={6} title="Add Machine Details" />
                    <div className="p-6">
                        <AddCategoryMachineFlow
                            compact={true}
                            onSuccess={() => {}}
                            onMachinesCreated={handleMachinesCreated}
                        />
                    </div>
                </div>

                {/* Bottom Submit Button */}
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
                        <span className="text-base">Save & Submit Client Onboarding</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
