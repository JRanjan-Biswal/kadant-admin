"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ClientMachineSparePart, SparePart } from "@/types/machine";
import { TbEdit } from "react-icons/tb";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Client } from "@/types/client";
import { useSession } from "next-auth/react";

interface EditSparePartInsightsProps {
    clientMachineSparePart: ClientMachineSparePart | null;
    sparePart: SparePart | null;
    clientID: string;
    machineID: string;
    onClose: (sparePartId: string) => void;
}

export default function EditSparePartInsights({ clientMachineSparePart, sparePart, clientID, machineID, onClose }: EditSparePartInsightsProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [clientMachineSparePartData, setClientMachineSparePartData] = useState<ClientMachineSparePart | null>(clientMachineSparePart);
    const [sparePartData, setSparePartData] = useState<SparePart | null>(sparePart);
    const [clientDetails, setClientDetails] = useState<Client | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        setIsReadOnly(session?.user?.isReadOnly || false);
    }, [session]);

    useEffect(() => {
        if (clientDetails?.capacity && clientMachineSparePartData?.dailyRunningHours?.value) {
            const capacity = Number(clientDetails.capacity);
            const totalProduction = (capacity / 24) * clientMachineSparePartData.dailyRunningHours.value;
            setClientMachineSparePartData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    totalProduction: {
                        value: totalProduction,
                        unit: 'TPD'
                    }
                };
            });
        }
    }, [clientDetails?.capacity, clientMachineSparePartData?.dailyRunningHours?.value]);

    useEffect(() => {
        const installedMotorPower = clientMachineSparePartData?.installedMotorPower?.value || 0;
        const healthyPowerConsumption = clientMachineSparePartData?.actualMotorPowerConsumption?.healthy?.value || sparePartData?.actualMotorPowerConsumption?.healthy?.value || 0;
        const wornoutPowerConsumption = clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.value || sparePartData?.actualMotorPowerConsumption?.wornout?.value || 0;

        const healthyPowerConsumptionValue = (installedMotorPower *
            healthyPowerConsumption) / 100;

        const wornoutPowerConsumptionValue = (installedMotorPower *
            wornoutPowerConsumption) / 100;

        setClientMachineSparePartData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                powerConsumption: {
                    healthy: { value: healthyPowerConsumptionValue, unit: 'kWhr' },
                    wornout: { value: wornoutPowerConsumptionValue, unit: 'kWhr' }
                }
            };
        });
    }, [
        clientMachineSparePartData?.installedMotorPower?.value,
        clientMachineSparePartData?.actualMotorPowerConsumption?.healthy?.value,
        clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.value,
        sparePartData?.actualMotorPowerConsumption?.healthy?.value,
        sparePartData?.actualMotorPowerConsumption?.wornout?.value
    ]);

    const fetchClientDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/clients/${clientID}`);
            const data = await response.json();
            setClientDetails(data);
        } catch (error) {
            console.error('Error fetching client details:', error);
            toast.error('Error fetching client details');
        }
    }, [clientID]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    useEffect(() => {
        if (clientMachineSparePart && sparePart) {
            const initializedData = {
                ...clientMachineSparePart,
                lifetimeOfRotor: clientMachineSparePart.lifetimeOfRotor || { value: sparePart.lifeTime?.value || 0, unit: 'Hrs' },
                totalRunningHours: clientMachineSparePart.totalRunningHours || { value: 0, unit: 'Hrs' },
                dailyRunningHours: clientMachineSparePart.dailyRunningHours || { value: 0, unit: 'Hrs' },
                fiberLossRanges: clientMachineSparePart.fiberLossRanges || sparePart.fiberLossRanges.map(range => ({ ...range })),
                fiberCost: clientMachineSparePart.fiberCost || { ...sparePart.fiberCost },
                actualMotorPowerConsumption: clientMachineSparePart.actualMotorPowerConsumption || {
                    healthy: {
                        value: sparePart.actualMotorPowerConsumption?.healthy?.value || 0,
                        unit: sparePart.actualMotorPowerConsumption?.healthy?.unit || '%'
                    },
                    wornout: {
                        value: sparePart.actualMotorPowerConsumption?.wornout?.value || 0,
                        unit: sparePart.actualMotorPowerConsumption?.wornout?.unit || '%'
                    }
                },
                powerConsumption: clientMachineSparePart.powerConsumption || {
                    healthy: { ...sparePart.powerConsumption?.healthy },
                    wornout: { ...sparePart.powerConsumption?.wornout }
                },
                powerCost: clientMachineSparePart.powerCost || { value: 0, priceUnit: 'EUR', perUnit: 'kWhr' },
                installedMotorPower: clientMachineSparePart.installedMotorPower || { value: 0, unit: 'kW' }
            };
            setClientMachineSparePartData(initializedData);
        } else {
            setClientMachineSparePartData(clientMachineSparePart);
        }
        setSparePartData(sparePart);
    }, [clientMachineSparePart, sparePart]);

    const handleSparePartDataChange = (field: string, value: string | number) => {
        if (!clientMachineSparePartData) return;

        setClientMachineSparePartData(prev => {
            if (!prev) return null;

            const newData = { ...prev };
            if (field.includes('.')) {
                const [parentField, ...rest] = field.split('.');

                if (parentField === 'fiberLossRanges') {
                    const [indexStr, subField] = rest;
                    const index = parseInt(indexStr);

                    if (!newData.fiberLossRanges) {
                        newData.fiberLossRanges = [...(sparePartData?.fiberLossRanges || [])];
                    }

                    if (newData.fiberLossRanges[index]) {
                        newData.fiberLossRanges = [...newData.fiberLossRanges];
                        newData.fiberLossRanges[index] = {
                            ...newData.fiberLossRanges[index],
                            [subField]: Number(value)
                        };
                    }
                } else if (parentField === 'actualMotorPowerConsumption') {
                    const [condition, subField] = rest; // condition = 'healthy' or 'wornout'
                    if (!newData.actualMotorPowerConsumption) {
                        newData.actualMotorPowerConsumption = {
                            healthy: { value: 0, unit: 'kWhr' },
                            wornout: { value: 0, unit: 'kWhr' }
                        };
                    }
                    newData.actualMotorPowerConsumption = {
                        ...newData.actualMotorPowerConsumption,
                        [condition]: {
                            ...newData.actualMotorPowerConsumption[condition as 'healthy' | 'wornout'],
                            [subField]: Number(value)
                        }
                    };
                } else if (parentField === 'powerConsumption') {
                    const [condition, subField] = rest; // condition = 'healthy' or 'wornout'
                    if (!newData.powerConsumption) {
                        newData.powerConsumption = {
                            healthy: { value: 0, unit: 'kWhr' },
                            wornout: { value: 0, unit: 'kWhr' }
                        };
                    }
                    newData.powerConsumption = {
                        ...newData.powerConsumption,
                        [condition]: {
                            ...newData.powerConsumption[condition as 'healthy' | 'wornout'],
                            [subField]: Number(value)
                        }
                    };
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fieldData = newData[parentField as keyof ClientMachineSparePart] as any;
                    if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                        newData[parentField as keyof ClientMachineSparePart] = {
                            ...fieldData,
                            value: Number(value)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any;
                    }
                }
            } else {
                const fieldData = newData[field as keyof ClientMachineSparePart] as { value: number; unit: string };
                if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                    newData[field as keyof ClientMachineSparePart] = {
                        ...fieldData,
                        value: Number(value)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any;
                }
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updateData = {
                clientID: clientID,
                machineID: machineID,
                sparePartID: sparePartData?._id,
                updates: {
                    capacityOfLine: {
                        value: clientDetails?.capacity || 0,
                        unit: 'TPD'
                    },
                    lifetimeOfRotor: clientMachineSparePartData?.lifetimeOfRotor || sparePartData?.lifeTime?.value || 0,
                    totalRunningHours: clientMachineSparePartData?.totalRunningHours,
                    dailyRunningHours: clientMachineSparePartData?.dailyRunningHours,
                    totalProduction: clientMachineSparePartData?.totalProduction,
                    fiberLossRanges: clientMachineSparePartData?.fiberLossRanges && clientMachineSparePartData?.fiberLossRanges.length > 0 ? clientMachineSparePartData?.fiberLossRanges : sparePartData?.fiberLossRanges,
                    fiberCost: clientMachineSparePartData?.fiberCost,
                    actualMotorPowerConsumption: clientMachineSparePartData?.actualMotorPowerConsumption,
                    powerConsumption: clientMachineSparePartData?.powerConsumption,
                    powerCost: clientMachineSparePartData?.powerCost,
                    installedMotorPower: clientMachineSparePartData?.installedMotorPower,
                }
            }

            const response = await fetch('/api/clients/clientID/client-machines/spare-parts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();
            toast.success('Data updated successfully');
            router.refresh();
            setIsOpen(false);
            onClose(sparePartData?._id || '');
        } catch (error) {
            console.error('Error submitting data:', error);
            toast.error('Error submitting data');
        } finally {
            setIsLoading(false);
        }
    };

    const getRangeLabel = (range: { min: number; max: number | null; value: number }) => {
        if (range.max === null) {
            return `Above ${range.min} Hrs`;
        }
        return `${range.min} - ${range.max} Hrs`;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button disabled={isReadOnly} variant="ghost" className="text-base-4 cursor-pointer">
                        <TbEdit className="ml-2" /> Edit Details
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[70%] sm:w-[70%] sm:max-w-[70%]" showCloseButton={true}>
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle>Update Machine Insights ({sparePart?.name || 'No Spare Part Selected'})</DialogTitle>
                    </DialogHeader>

                    {sparePart ? (
                        <form onSubmit={handleSubmit} className="divide-y divide-base-1">
                            <div className='grid grid-cols-5 gap-4 pb-[40px]'>
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
                                            onChange={(e) => handleSparePartDataChange('lifetimeOfRotor', e.target.value)}
                                            value={clientMachineSparePartData?.lifetimeOfRotor?.value && clientMachineSparePartData?.lifetimeOfRotor?.value > 0 ? clientMachineSparePartData?.lifetimeOfRotor?.value : sparePartData?.lifeTime?.value || 0}
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
                                            min={0}
                                            className='h-12 rounded-sm border-base-2 border pr-12'
                                            type="number"
                                            onChange={(e) => handleSparePartDataChange('totalRunningHours', e.target.value)}
                                            value={clientMachineSparePartData?.totalRunningHours?.value || 0}
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
                                            min={0}
                                            max={24}
                                            className='h-12 rounded-sm border-base-2 border pr-12'
                                            type="number"
                                            onChange={(e) => handleSparePartDataChange('dailyRunningHours', e.target.value)}
                                            value={clientMachineSparePartData?.dailyRunningHours?.value}
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
                                            value={clientMachineSparePartData?.totalProduction?.value !== undefined && clientMachineSparePartData.totalProduction.value % 1 !== 0 ? clientMachineSparePartData.totalProduction.value.toFixed(2) : clientMachineSparePartData?.totalProduction?.value || 0}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-sm text-muted-foreground">TPD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pb-[40px]">
                                <h2 className='text-base-4 font-semibold text-lg'>Fiber Loss Calculation</h2>

                                <div className='mt-6'>
                                    <h2 className='text-base-4 font-semibold text-sm'>Fiber Loss</h2>

                                    <div className='flex flex-row gap-4'>
                                        <div className="grid grid-cols-4 mt-3 gap-4">
                                            {
                                                sparePartData?.fiberLossRanges.map((range, index) => (
                                                    <div className="col-span-1" key={`fiber-loss-range-${index}`}>
                                                        <Label className="text-base-3 text-xs mb-[5px]">{getRangeLabel(range)}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                onChange={(e) => handleSparePartDataChange(`fiberLossRanges.${index}.value`, e.target.value)}
                                                                value={clientMachineSparePartData?.fiberLossRanges?.[index]?.value ?? range.value}
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
                                                        onChange={(e) => handleSparePartDataChange('fiberCost.value', e.target.value)}
                                                        // value={clientMachineSparePartData?.fiberCost?.value && clientMachineSparePartData?.fiberCost?.value > 0 ? clientMachineSparePartData?.fiberCost?.value : sparePartData?.fiberCost?.value || 0}
                                                        value={clientDetails?.fiberCost?.value || 0}
                                                        placeholder="Cost"
                                                        className='h-12 rounded-sm border-base-2 border pr-12'
                                                        type="number"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-sm text-muted-foreground">{new Intl.NumberFormat(undefined, { style: 'currency', currency: clientMachineSparePartData?.fiberCost?.priceUnit || sparePartData?.fiberCost?.priceUnit || 'EUR' }).format(0).slice(0, 1)}/{clientMachineSparePartData?.fiberCost?.perUnit || sparePartData?.fiberCost?.perUnit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <Label className="text-base-3 text-xs mb-[5px]">Total Fiber Loss</Label>
                                                <div className="relative">
                                                    <Input
                                                        readOnly
                                                        onChange={(e) => handleSparePartDataChange('totalFiberLoss.value', e.target.value)}
                                                        value={clientMachineSparePartData?.totalFiberLoss?.value && clientMachineSparePartData?.totalFiberLoss?.value > 0 ? clientMachineSparePartData?.totalFiberLoss?.value : 0}
                                                        placeholder="Loss"
                                                        className='h-12 rounded-sm border-base-2 border pr-12'
                                                        type="number"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-sm text-muted-foreground">{clientMachineSparePartData?.totalFiberLoss?.unit || "Tons"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='pb-[40px] mt-6'>
                                <h2 className='text-base-4 font-semibold text-lg'>Power Loss Calculation</h2>

                                <div className='mt-6'>
                                    <div className='flex flex-row gap-4'>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className='col-span-1'>
                                                <h2 className='text-base-4 font-semibold text-sm'>Actual Motor Power Consumption</h2>
                                                <div className="grid grid-cols-2 mt-3 gap-4">
                                                    <div className='col-span-1'>
                                                        <Label className="text-base-3 text-xs mb-[5px]">Healthy {sparePartData?.name}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                onChange={(e) => handleSparePartDataChange(`actualMotorPowerConsumption.healthy.value`, e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                value={clientMachineSparePartData?.actualMotorPowerConsumption?.healthy?.value && clientMachineSparePartData?.actualMotorPowerConsumption?.healthy?.value > 0 ? clientMachineSparePartData?.actualMotorPowerConsumption?.healthy?.value : sparePartData?.actualMotorPowerConsumption?.healthy?.value || 0}
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{sparePartData?.actualMotorPowerConsumption?.healthy?.unit || '%'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-span-1'>
                                                        <Label className="text-base-3 text-xs mb-[5px]">Wornout {sparePartData?.name}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                onChange={(e) => handleSparePartDataChange(`actualMotorPowerConsumption.wornout.value`, e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                value={clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.value && clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.value > 0 ? clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.value : sparePartData?.actualMotorPowerConsumption?.wornout?.value || 0}
                                                            />

                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{clientMachineSparePartData?.actualMotorPowerConsumption?.wornout?.unit || sparePartData?.actualMotorPowerConsumption?.wornout?.unit || '%'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-span-1'>
                                                <h2 className='text-base-4 font-semibold text-sm'>Power Consumption</h2>
                                                <div className="grid grid-cols-2 mt-3 gap-4">
                                                    <div className='col-span-1'>
                                                        <Label className="text-base-3 text-xs mb-[5px]">Healthy {sparePartData?.name}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                readOnly
                                                                onChange={(e) => handleSparePartDataChange(`powerConsumption.healthy.value`, e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                value={clientMachineSparePartData?.powerConsumption?.healthy?.value && clientMachineSparePartData?.powerConsumption?.healthy?.value > 0 ? clientMachineSparePartData?.powerConsumption?.healthy?.value : sparePartData?.powerConsumption?.healthy?.value || 0}
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{clientMachineSparePartData?.powerConsumption?.healthy?.unit || sparePartData?.powerConsumption?.healthy?.unit || '%'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-span-1'>
                                                        <Label className="text-base-3 text-xs mb-[5px]">Wornout {sparePartData?.name}</Label>
                                                        <div className="relative">
                                                            <Input
                                                                readOnly
                                                                onChange={(e) => handleSparePartDataChange(`powerConsumption.wornout.value`, e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                value={clientMachineSparePartData?.powerConsumption?.wornout?.value && clientMachineSparePartData?.powerConsumption?.wornout?.value > 0 ? clientMachineSparePartData?.powerConsumption?.wornout?.value : sparePartData?.powerConsumption?.wornout?.value || 0}
                                                            />

                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{clientMachineSparePartData?.powerConsumption?.wornout?.unit || sparePartData?.powerConsumption?.wornout?.unit || '%'}</span>
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
                                                                readOnly
                                                                onChange={(e) => handleSparePartDataChange('powerCost.value', e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                // value={clientMachineSparePartData?.powerCost?.value || 0}
                                                                value={clientDetails?.powerCost?.value || 0}
                                                            />
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{new Intl.NumberFormat(undefined, { style: 'currency', currency: clientMachineSparePartData?.powerCost?.priceUnit || 'EUR' }).format(0).slice(0, 1)}/{clientMachineSparePartData?.powerCost?.perUnit || 'kWhr'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='col-span-1'>
                                                        <Label className="text-base-3 text-xs mb-[5px]">Installed Motor Power</Label>
                                                        <div className="relative">
                                                            <Input
                                                                onChange={(e) => handleSparePartDataChange('installedMotorPower.value', e.target.value)}
                                                                className='h-12 rounded-sm border-base-2 border pr-12'
                                                                type="number"
                                                                value={clientMachineSparePartData?.installedMotorPower?.value || 0}
                                                            />

                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                <span className="text-sm text-muted-foreground">{clientMachineSparePartData?.installedMotorPower?.unit || 'kW'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading}
                                        className="w-full bg-base-4 text-white uppercase font-semibold cursor-pointer w-[250px]"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No spare part data available
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}