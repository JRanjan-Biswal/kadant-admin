"use client";

import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Machine, SparePart } from '@/types/machine';
import { toast } from 'sonner';
import { ClientMachineSparePart } from '@/types/machine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EditSparePartInsights from './Modals/EditSparePartInsights';
import { Client } from '@/types/client';

interface Category {
    _id: string;
    name: string;
    slug: string;
    machines: Machine[];
    isActive?: boolean;
}

interface BreadcrumbItem {
    type: 'category' | 'subcategory';
    name: string;
    isActive?: boolean;
    isExpanded?: boolean;
    onClick: () => void;
}

interface MachineInsightSelectorProps {
    clientId: string;
}

const defaultClientMachineSparePartData: ClientMachineSparePart = {
    _id: '',
    machine: '',
    client: '',
    sparePart: '',
    capacityOfLine: { value: 0, unit: 'TPD' },
    lifetimeOfRotor: { value: 0, unit: 'Hrs' },
    totalRunningHours: { value: 0, unit: 'Hrs' },
    exceededLife: { value: 0, unit: 'Hrs' },
    dailyRunningHours: { value: 0, unit: 'Hrs' },
    totalProduction: { value: 0, unit: 'TPD' },
    totalFiberLoss: { value: 0, unit: 'TPD' },
    fiberLossRanges: [],
    fiberCost: { value: 0, priceUnit: 'EUR', perUnit: 'Ton' },
    actualMotorPowerConsumption: {
        healthy: { value: 0, unit: '%' },
        wornout: { value: 0, unit: '%' },
    },
    powerConsumption: {
        healthy: { value: 0, unit: 'kWhr' },
        wornout: { value: 0, unit: 'kWhr' },
    },
    powerCost: { value: 0, priceUnit: 'EUR', perUnit: 'kWhr' },
    installedMotorPower: { value: 0, unit: 'kW' },
}

const MachineInsightSelector = ({ clientId }: MachineInsightSelectorProps) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
    const [spareParts, setSpareParts] = useState<SparePart[]>([]);
    const [activeSparePart, setActiveSparePart] = useState<string | null>(null);
    const [activeClientSparePartData, setActiveClientSparePartData] = useState<ClientMachineSparePart | null>(defaultClientMachineSparePartData);
    const [activeSparePartData, setActiveSparePartData] = useState<SparePart | null>(null);
    const [clientDetails, setClientDetails] = useState<Client | null>(null);

    const handleCategoryClick = (categoryName: string) => {
        if (expandedCategory === categoryName) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(categoryName);
        }
        setActiveCategory(categoryName);
    };

    const handleMachineClick = (machineId: string) => {
        fetchSpareParts(machineId);
    };

    const buildBreadcrumbItems = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [];

        categories.forEach((category) => {
            const isExpanded = expandedCategory === category.name;
            const isActive = activeCategory === category.name;

            items.push({
                type: 'category',
                name: category.name,
                isActive: isActive,
                isExpanded: isExpanded,
                onClick: () => handleCategoryClick(category.name)
            });

            if (isExpanded) {
                category.machines.forEach((machine) => {
                    items.push({
                        type: 'subcategory',
                        name: machine.name,
                        isActive: false,
                        onClick: () => handleMachineClick(machine._id)
                    });
                });
            }
        });

        return items;
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/products/categories/with-machines');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching product categories');
        }
    };

    const fetchClientDetails = async () => {
        try {
            const response = await fetch(`/api/clients/${clientId}`);
            const data = await response.json();
            setClientDetails(data);
        } catch (error) {
            console.error('Error fetching client details:', error);
            toast.error('Error fetching client details');
        }
    };

    const fetchSpareParts = async (machineId: string, setActive: boolean = true) => {
        try {
            const response = await fetch(`/api/products/${clientId}/spare-parts/${machineId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch spare parts');
            }

            const data = await response.json();
            setSpareParts(data);
            if (data.length > 0 && setActive) {
                setActiveSparePart(data[0]._id);
                setActiveSparePartData(data[0]);
                setActiveClientSparePartData(data[0].clientMachineSparePart || defaultClientMachineSparePartData);
            }
            return data;
        } catch (error) {
            console.error('Error fetching spare parts:', error);
            toast.error('Error fetching spare parts');
        }
    };

    const handleSparePartClick = (sparePartId: string) => {
        setActiveSparePart(sparePartId);
        setActiveSparePartData(spareParts.find(part => part._id === sparePartId) || null);
        setActiveClientSparePartData(spareParts.find(part => part._id === sparePartId)?.clientMachineSparePart || defaultClientMachineSparePartData);
    };

    const getRangeLabel = (range: { min: number; max: number | null; value: number }) => {
        if (range.max === null) {
            return `Above ${range.min} Hrs`;
        }
        return `${range.min} - ${range.max} Hrs`;
    };

    const calculateExceededLife = () => {
        if (!activeClientSparePartData) return 0;
        const totalRunningHours = activeClientSparePartData?.totalRunningHours?.value || 0;
        const lifetimeOfRotor = activeSparePartData?.lifeTime?.value || 0;
        const exceededLife = totalRunningHours - lifetimeOfRotor;
        return exceededLife > 0 ? exceededLife : 0;
    };

    const handleSparePartDataChange = (field: keyof ClientMachineSparePart, value: string) => {
        if (!activeClientSparePartData) return;
        const fieldData = activeClientSparePartData[field] as { value: number; unit: string };
        setActiveClientSparePartData({
            ...activeClientSparePartData,
            [field]: {
                ...fieldData,
                value: Number(value)
            }
        });
    };

    const formatNumber = (value: number) => {
        console.log(value);

        if (value % 1 === 0) {
            return value;
        }
        return value.toFixed(2);
    };

    useEffect(() => {
        fetchCategories();
        fetchClientDetails();
    }, []);

    useEffect(() => {
        setBreadcrumbItems(buildBreadcrumbItems());
    }, [categories, expandedCategory, activeCategory]);

    const handleDialogClose = async (sparePartId: string) => {
        const machineId = typeof activeSparePartData?.machine === 'object' ? activeSparePartData.machine._id : activeSparePartData?.machine || '';
        const updatedSpareParts = await fetchSpareParts(machineId, false);

        const updatedSparePart = updatedSpareParts.find((part: SparePart) => part._id === sparePartId);
        if (updatedSparePart) {
            setActiveSparePart(sparePartId);
            setActiveSparePartData(updatedSparePart);
            setActiveClientSparePartData(
                updatedSparePart.clientMachineSparePart || defaultClientMachineSparePartData
            );
        }
    };

    return (
        categories.length > 0 && (
            <>
                <div className="flex flex-row items-center justify-between border-b pb-4 px-4">
                    <div className="text-left">
                        <h1 className="text-2xl text-base-4 font-bold">Machine Insights</h1>
                    </div>
                    <div className="text-right">
                        <EditSparePartInsights
                            clientMachineSparePart={activeClientSparePartData || null}
                            sparePart={activeSparePartData || null}
                            clientID={clientId}
                            machineID={typeof activeSparePartData?.machine === 'object' ? activeSparePartData.machine._id : activeSparePartData?.machine || ''}
                            onClose={(sparePartId: string) => handleDialogClose(sparePartId)}
                        />
                    </div>
                </div>
                <div className="w-full bg-white">
                    <div className="relative w-full">
                        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 bg-gray-50 border-b scrollbar-track-transparent">
                            <div className="inline-flex items-center px-4 py-4 w-full">
                                <div className="flex items-center space-x-2">
                                    {breadcrumbItems.map((item, index) => (
                                        <React.Fragment key={`${item.type}-${item.name}-${index}`}>
                                            <button
                                                onClick={item.onClick}
                                                className={`px-3 py-2 text-sm cursor-pointer font-semibold rounded-md transition-all duration-200 flex items-center gap-1 flex-shrink-0 ${item.isActive
                                                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                                    : item.type === 'subcategory'
                                                        ? 'text-base-2 font-normal hover:text-base-4 hover:bg-gray-50'
                                                        : 'text-base-4 font-normal hover:text-base-4 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {item.name}
                                                {item.type === 'category' && (
                                                    item.isExpanded ? (
                                                        <ChevronLeft className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )
                                                )}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {
                    spareParts.length > 0 && (
                        <div className='flex flex-row w-full bg-base-3 gap-[25px]'>
                            <div className="bg-base-4 text-white flex-grow flex-1 px-6 py-3 font-medium text-sm tracking-wide whitespace-nowrap"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)' }}>
                                Spare Parts
                            </div>
                            <div className='flex flex-row w-full'>
                                {spareParts.map((part) => (
                                    <div
                                        key={part._id}
                                        onClick={() => handleSparePartClick(part._id)}
                                        className={`h-full flex items-center justify-center px-4 cursor-pointer transition-colors duration-200 ${activeSparePart === part._id
                                            ? 'bg-[#D45815] text-white'
                                            : 'text-white hover:bg-base-4'
                                            }`}
                                    >
                                        {part.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    activeSparePartData && (
                        <>
                            <div className='px-6 pt-6'>
                                <div className='grid grid-cols-6 gap-4'>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Capacity of Line</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                value={clientDetails?.capacity || 0}
                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                type="number"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">TPD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Lifetime of Rotor</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                onChange={(e) => handleSparePartDataChange('lifetimeOfRotor', e.target.value)}
                                                value={activeClientSparePartData?.lifetimeOfRotor?.value && activeClientSparePartData?.lifetimeOfRotor?.value > 0 ? activeClientSparePartData?.lifetimeOfRotor?.value : activeSparePartData?.lifeTime?.value}
                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                type="number"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">Hrs</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Total Running Hours</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                type="number"
                                                onChange={(e) => handleSparePartDataChange('totalRunningHours', e.target.value)}
                                                value={activeClientSparePartData?.totalRunningHours?.value || 0}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">Hrs</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Exceeded Life</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                className='h-12 cursor-not-allowed rounded-sm border-base-2 border pr-12'
                                                type="number"
                                                onChange={(e) => handleSparePartDataChange('exceededLife', e.target.value)}
                                                value={calculateExceededLife()}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">Hrs</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Daily Running Hours</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                type="number"
                                                onChange={(e) => handleSparePartDataChange('dailyRunningHours', e.target.value)}
                                                value={activeClientSparePartData?.dailyRunningHours?.value || 0}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">Hrs</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-base-4 mb-[10px]">Total Production</Label>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                type="number"
                                                onChange={(e) => handleSparePartDataChange('totalProduction', e.target.value)}
                                                value={formatNumber(activeClientSparePartData?.totalProduction?.value || 0)}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">TPD</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='divide-y divide-base-1'>
                                <div className='px-6 py-6 bg-[#F4FAFF] mt-6'>
                                    <h2 className='text-base-4 font-semibold text-lg'>Fiber Loss Calculation</h2>

                                    <div className='mt-6'>
                                        <h2 className='text-base-4 font-semibold text-sm'>Fiber Loss</h2>

                                        <div className='flex flex-row gap-4'>
                                            <div className="grid grid-cols-4 mt-3 gap-4">
                                                {
                                                    activeSparePartData?.fiberLossRanges.map((range, index) => (
                                                        <div className="col-span-1" key={`fiber-loss-range-${index}`}>
                                                            <Label className="text-base-3 text-xs mb-[5px]">{getRangeLabel(range)}</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    readOnly
                                                                    value={activeClientSparePartData?.fiberLossRanges?.[index]?.value || range.value}
                                                                    placeholder="Loss %"
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                />
                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                            <div className="grid grid-cols-2 border-l border-base-1 pl-4 mt-3 gap-4">
                                                <div className="col-span-1">
                                                    <Label className="text-base-3 text-xs mb-[5px]">Fiber Cost</Label>
                                                    <div className="relative">
                                                        <Input
                                                            readOnly
                                                            value={activeClientSparePartData?.fiberCost?.value && activeClientSparePartData?.fiberCost?.value > 0 ? activeClientSparePartData?.fiberCost?.value : activeSparePartData?.fiberCost?.value}
                                                            placeholder="Cost"
                                                            className='h-12 rounded-sm border-base-2 border pr-12'
                                                            type="number"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                            <span className="text-sm text-muted-foreground">{new Intl.NumberFormat(undefined, { style: 'currency', currency: activeClientSparePartData?.fiberCost?.priceUnit || activeSparePartData?.fiberCost?.priceUnit || 'EUR' }).format(0).slice(0, 1)}/{activeClientSparePartData?.fiberCost?.perUnit || activeSparePartData?.fiberCost?.perUnit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-base-3 text-xs mb-[5px]">Total Fiber Loss</Label>
                                                    <div className="relative">
                                                        <Input
                                                            readOnly
                                                            value={activeClientSparePartData?.totalFiberLoss?.value && activeClientSparePartData?.totalFiberLoss?.value > 0 ? activeClientSparePartData?.totalFiberLoss?.value : 0}
                                                            placeholder="Loss"
                                                            className='h-12 rounded-sm border-base-2 border pr-12'
                                                            type="number"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                            <span className="text-sm text-muted-foreground">{activeClientSparePartData?.totalFiberLoss?.unit || "Tons"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='px-6 py-6 bg-[#F4FAFF]'>
                                    <h2 className='text-base-4 font-semibold text-lg'>Power Loss Calculation</h2>

                                    <div className='mt-6'>
                                        <div className='flex flex-row gap-4'>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className='col-span-1'>
                                                    <h2 className='text-base-4 font-semibold text-sm'>Actual Motor Power Consumption</h2>
                                                    <div className="grid grid-cols-2 mt-3 gap-4">
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Healthy {activeSparePartData?.name}</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    readOnly
                                                                    value={activeClientSparePartData?.actualMotorPowerConsumption?.healthy?.value ? activeClientSparePartData?.actualMotorPowerConsumption?.healthy?.value : activeSparePartData?.actualMotorPowerConsumption?.healthy?.value}
                                                                />
                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{activeClientSparePartData?.actualMotorPowerConsumption?.healthy?.unit || activeSparePartData?.actualMotorPowerConsumption?.healthy?.unit || '%'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Wornout {activeSparePartData?.name}</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    value={activeClientSparePartData?.actualMotorPowerConsumption?.wornout?.value ? activeClientSparePartData?.actualMotorPowerConsumption?.wornout?.value : activeSparePartData?.actualMotorPowerConsumption?.wornout?.value}
                                                                    readOnly
                                                                />

                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{activeClientSparePartData?.actualMotorPowerConsumption?.wornout?.unit || activeSparePartData?.actualMotorPowerConsumption?.wornout?.unit || '%'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-span-1'>
                                                    <h2 className='text-base-4 font-semibold text-sm'>Power Consumption</h2>
                                                    <div className="grid grid-cols-2 mt-3 gap-4">
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Healthy {activeSparePartData?.name}</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    readOnly
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    value={activeClientSparePartData?.powerConsumption?.healthy?.value || 0}
                                                                />
                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{activeClientSparePartData?.powerConsumption?.healthy?.unit || activeSparePartData?.powerConsumption?.healthy?.unit || '%'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Wornout {activeSparePartData?.name}</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    value={activeClientSparePartData?.powerConsumption?.wornout?.value || 0}
                                                                    readOnly
                                                                />

                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{activeClientSparePartData?.powerConsumption?.wornout?.unit || activeSparePartData?.powerConsumption?.wornout?.unit || '%'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-span-1'>
                                                    <h2 className='text-base-4 font-semibold text-sm opacity-0'>Power Consumption</h2>
                                                    <div className="grid grid-cols-2 mt-3 gap-4">
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Power Cost</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    readOnly
                                                                    value={activeClientSparePartData?.powerCost?.value ? activeClientSparePartData?.powerCost?.value : 0}
                                                                />
                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{new Intl.NumberFormat(undefined, { style: 'currency', currency: activeClientSparePartData?.powerCost?.priceUnit || 'EUR' }).format(0).slice(0, 1)}/{activeClientSparePartData?.powerCost?.perUnit || 'kWhr'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='col-span-1'>
                                                            <Label className="text-base-3 text-xs mb-[5px]">Installed Motor Power</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    className='h-12 rounded-sm border-base-2 border pr-12'
                                                                    type="number"
                                                                    value={activeClientSparePartData?.installedMotorPower?.value ? activeClientSparePartData?.installedMotorPower?.value : 0}
                                                                    readOnly
                                                                />

                                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                    <span className="text-sm text-muted-foreground">{activeClientSparePartData?.installedMotorPower?.unit || 'kW'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                }
            </>
        )
    );
};

export default MachineInsightSelector;