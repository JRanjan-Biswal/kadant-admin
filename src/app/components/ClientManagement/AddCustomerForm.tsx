"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addClient, AddClientFormData, MachineData } from "@/actions/add-client";
import { toast } from "sonner";
import { 
    Loader2, 
    ArrowLeft, 
    Save, 
    User, 
    Lock, 
    Upload, 
    MapPin, 
    Package, 
    Clock, 
    Zap, 
    Leaf, 
    Plus, 
    Trash2,
    Link as LinkIcon,
    Calendar,
    X
} from "lucide-react";

// Import reusable components
import SectionHeader from "@/components/SectionHeader";
import UploadBox from "@/components/UploadBox";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";

interface AddCustomerFormProps {
    onBack: () => void;
    existingRegions: string[];
}

interface MachineComponent {
    id: string;
    componentName: string;
    klCode: string;
    partDrawingLink: string;
    installationDate: string;
    endOfLife: string;
    componentImage: File | null;
}

interface Machine {
    id: string;
    category: string;
    machineName: string;
    productSummary: string;
    machineImage: File | null;
    components: MachineComponent[];
}

// Component Image Upload with Preview
const ComponentImageUpload = ({ 
    file, 
    onFileChange 
}: { 
    file: File | null; 
    onFileChange: (file: File | null) => void;
}) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreview(null);
        }
    }, [file]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
    };

    return (
        <label className="border border-dashed border-[#404040] rounded-lg min-h-[74px] flex flex-col items-center justify-center cursor-pointer hover:border-[#505050] transition-colors relative overflow-hidden">
            <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            {preview ? (
                <>
                    <div className="relative w-full h-full min-h-[74px] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-w-full max-h-[74px] object-contain rounded"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-[#262626] hover:bg-[#404040] text-white rounded-full p-1 transition-colors z-10"
                            aria-label="Remove image"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <Upload className="w-6 h-6 text-[#737373]" />
                    <span className="text-[#737373] text-xs">Upload</span>
                </>
            )}
        </label>
    );
};

export default function AddCustomerForm({ onBack, existingRegions }: AddCustomerFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // Login Credentials
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Onboarding Images
    const [onboardingImages, setOnboardingImages] = useState<(File | null)[]>([null, null, null]);
    
    // Business Details
    const [region, setRegion] = useState("");
    const [customerName, setCustomerName] = useState("");
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
    
    // Machines
    const [machines, setMachines] = useState<Machine[]>([
        {
            id: "1",
            category: "",
            machineName: "",
            productSummary: "",
            machineImage: null,
            components: [
                {
                    id: "1",
                    componentName: "",
                    klCode: "",
                    partDrawingLink: "",
                    installationDate: "",
                    endOfLife: "",
                    componentImage: null,
                }
            ]
        }
    ]);

    const addMachine = () => {
        const newMachine: Machine = {
            id: Date.now().toString(),
            category: "",
            machineName: "",
            productSummary: "",
            machineImage: null,
            components: []
        };
        setMachines([...machines, newMachine]);
    };

    const removeMachine = (machineId: string) => {
        setMachines(machines.filter(m => m.id !== machineId));
    };

    const updateMachine = (machineId: string, field: keyof Machine, value: string | File | null | MachineComponent[]) => {
        setMachines(machines.map(m => 
            m.id === machineId ? { ...m, [field]: value } : m
        ));
    };

    const addComponent = (machineId: string) => {
        const newComponent: MachineComponent = {
            id: Date.now().toString(),
            componentName: "",
            klCode: "",
            partDrawingLink: "",
            installationDate: "",
            endOfLife: "",
            componentImage: null,
        };
        setMachines(machines.map(m => 
            m.id === machineId 
                ? { ...m, components: [...m.components, newComponent] }
                : m
        ));
    };

    const removeComponent = (machineId: string, componentId: string) => {
        setMachines(machines.map(m => 
            m.id === machineId 
                ? { ...m, components: m.components.filter(c => c.id !== componentId) }
                : m
        ));
    };

    const updateComponent = (machineId: string, componentId: string, field: keyof MachineComponent, value: string | File | null) => {
        setMachines(machines.map(m => 
            m.id === machineId 
                ? { 
                    ...m, 
                    components: m.components.map(c => 
                        c.id === componentId ? { ...c, [field]: value } : c
                    )
                }
                : m
        ));
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

        // Validate passwords match if provided
        if (password && password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            // Prepare machines data (without images for now)
            const machinesData: MachineData[] = machines.map(m => ({
                category: m.category,
                machineName: m.machineName,
                productSummary: m.productSummary,
            })).filter(m => m.category || m.machineName); // Only include machines with data

            const formData: AddClientFormData = {
                // Login credentials
                username: username || undefined,
                password: password || undefined,
                
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
                
                // Machines
                machines: machinesData.length > 0 ? machinesData : undefined,
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
        <div className="min-h-screen bg-[#0a0a0a] pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-5 px-6 pt-6">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors w-fit"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-base">Back to Admin Dashboard</span>
                    </button>

                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-normal text-white leading-8">Add New Client</h1>
                            <p className="text-[#a1a1a1] text-base leading-6">Complete client onboarding process</p>
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
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                    <SectionHeader number={1} title="Create Login Credentials" />
                    <div className="p-6 flex gap-3">
                        <div className="flex-1">
                            <InputField
                                label="Username"
                                placeholder="Enter username"
                                value={username}
                                onChange={setUsername}
                                icon={User}
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
                                icon={User}
                                type="password"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Onboarding Images */}
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
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
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                    <SectionHeader number={3} title="Business Details" />
                    <div className="p-6 flex flex-col gap-6">
                        {/* Row 1 */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <SelectField
                                    label="Region"
                                    placeholder="Select region"
                                    value={region}
                                    onChange={setRegion}
                                    icon={MapPin}
                                    options={existingRegions.map(r => ({ value: r, label: r }))}
                                />
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
                                    label="Location"
                                    placeholder="City, State, Country"
                                    value={location}
                                    onChange={setLocation}
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

                        {/* Business Image */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#a1a1a1] text-sm leading-5">Business Image</label>
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
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
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
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
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

                {/* Section 6: Add Machine Details */}
                <div className="mx-6 bg-[#171717] border border-[#262626] rounded-[10px] overflow-hidden">
                    <div className="bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#262626] px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-normal text-white">
                            6. Add Machine Details
                        </h2>
                        <Button
                            type="button"
                            onClick={addMachine}
                            className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-4 py-2 h-auto flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Machine</span>
                        </Button>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        {machines.map((machine, machineIndex) => (
                            <div key={machine.id} className="bg-[rgba(38,38,38,0.3)] border border-[#404040] rounded-[10px] p-6 flex flex-col gap-5">
                                {/* Machine Header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white text-base font-normal">Machine {machineIndex + 1}</h3>
                                    {machines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMachine(machine.id)}
                                            className="text-[#737373] hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Machine Category & Name */}
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <InputField
                                            label="Machine Category"
                                            placeholder="Pulping and Detrashing"
                                            value={machine.category}
                                            onChange={(val) => updateMachine(machine.id, "category", val)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <InputField
                                            label="Machine Name"
                                            placeholder="Hydrapulper"
                                            value={machine.machineName}
                                            onChange={(val) => updateMachine(machine.id, "machineName", val)}
                                        />
                                    </div>
                                </div>

                                {/* Product Summary */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[#a1a1a1] text-sm leading-5">Product Summary (250 words)</label>
                                    <Textarea
                                        value={machine.productSummary}
                                        onChange={(e) => updateMachine(machine.id, "productSummary", e.target.value)}
                                        placeholder="Enter detailed product summary..."
                                        className="bg-[#262626] border-[#404040] rounded-[10px] min-h-[122px] text-white placeholder:text-[#737373] resize-none"
                                    />
                                </div>

                                {/* Machine Image */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[#a1a1a1] text-sm leading-5">Machine Image</label>
                                    <UploadBox
                                        label="Click to upload Machine image"
                                        sublabel="Upload multiple images (PNG, JPG, GIF)"
                                        file={machine.machineImage}
                                        onFileChange={(file) => updateMachine(machine.id, "machineImage", file)}
                                    />
                                </div>

                                {/* Machine Components */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-white text-base">Machine Components</h4>
                                        <Button
                                            type="button"
                                            onClick={() => addComponent(machine.id)}
                                            className="bg-[#404040] hover:bg-[#505050] text-white rounded-[10px] px-3 py-2 h-9 flex items-center gap-2 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Component</span>
                                        </Button>
                                    </div>

                                    {machine.components.map((component, componentIndex) => (
                                        <div key={component.id} className="bg-[rgba(38,38,38,0.5)] border border-[#404040] rounded-[10px] p-4 flex flex-col gap-4">
                                            {/* Component Header */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-base">Component {componentIndex + 1}</span>
                                                {machine.components.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeComponent(machine.id, component.id)}
                                                        className="text-[#737373] hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Row 1: Component Name & KL Code */}
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <InputField
                                                        label="Component Name"
                                                        placeholder="e.g., Rotor Blade"
                                                        value={component.componentName}
                                                        onChange={(val) => updateComponent(machine.id, component.id, "componentName", val)}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <InputField
                                                        label="KL Code"
                                                        placeholder="e.g., KL-5000"
                                                        value={component.klCode}
                                                        onChange={(val) => updateComponent(machine.id, component.id, "klCode", val)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Part Drawing Link & Installation Date */}
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <InputField
                                                        label="Part Drawing Link"
                                                        placeholder="https://..."
                                                        value={component.partDrawingLink}
                                                        onChange={(val) => updateComponent(machine.id, component.id, "partDrawingLink", val)}
                                                        icon={LinkIcon}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[#a1a1a1] text-sm leading-5">Installation Date</label>
                                                        <div className="bg-[#262626] border border-[#404040] rounded-lg h-[50px] flex items-center px-3">
                                                            <Calendar className="w-4 h-4 text-[#737373] mr-2" />
                                                            <input
                                                                type="date"
                                                                value={component.installationDate}
                                                                onChange={(e) => updateComponent(machine.id, component.id, "installationDate", e.target.value)}
                                                                className="bg-transparent flex-1 text-white outline-none [color-scheme:dark]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: End of Life & Component Image */}
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[#a1a1a1] text-sm leading-5">End of Life</label>
                                                        <div className="bg-[#262626] border border-[#404040] rounded-lg h-[50px] flex items-center px-3">
                                                            <Calendar className="w-4 h-4 text-[#737373] mr-2" />
                                                            <input
                                                                type="date"
                                                                value={component.endOfLife}
                                                                onChange={(e) => updateComponent(machine.id, component.id, "endOfLife", e.target.value)}
                                                                className="bg-transparent flex-1 text-white outline-none [color-scheme:dark]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[#a1a1a1] text-sm leading-5">Component Image</label>
                                                        <ComponentImageUpload
                                                            file={component.componentImage}
                                                            onFileChange={(file) => updateComponent(machine.id, component.id, "componentImage", file)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
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
