export interface Machine {
    _id: string;
    name: string;
    category: string;
    isActive: boolean;
    status?: "healthy" | "warning" | "critical";
    healthPercentage?: number;
    description?: string;
    installationDate?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientMachine {
    _id: string;
    machine: Machine;
    serialNumber: string;
    installationDate: string;
}

export interface SparePart {
    _id: string;
    name: string;
    machine: Machine | string;
    lifeTime: {
        value: number;
        unit: string;
    };
    lifetimeText?: string | null;
    clientMachineSparePart?: ClientMachineSparePart;
    fiberLossRanges: {
        _id: string;
        min: number;
        max: number | null;
        value: number;
    }[];
    fiberCost: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    actualMotorPowerConsumption: {
        healthy: {
            value: number;
            unit: string;
        },
        wornout: {
            value: number;
            unit: string;
        },
    };
    powerConsumption: {
        healthy: {
            value: number;
            unit: string;
        },
        wornout: {
            value: number;
            unit: string;
        },
    };
    createdAt: string;
    updatedAt: string;
}

export interface ReplacementPartSnapshot {
    sparePart?: string | null;
    name?: string | null;
    klValue?: string | null;
    itemOnSpareSketch?: string | null;
    lifetimeText?: string | null;
    lifeTime?: { value: number; unit: string };
    deliveryTime?: { value: number; unit: string };
    unitPriceNew?: { value: number; priceUnit: string };
    priceRepairPerPc?: { value: number; priceUnit: string };
    imageUrl?: string | null;
    imageUrls?: string[];
    optimalStateVideoUrl?: string | null;
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    sourceMachine?: string | null;
    sourceMachineName?: string | null;
    sourceMachineSerialNumber?: string | null;
    sourceCategory?: string | null;
    sourceCategoryName?: string | null;
}

export interface ClientMachineSparePart {
    _id: string;
    machine: string;
    client: string;
    sparePart: string;
    capacityOfLine: {
        value: number;
        unit: string;
    };
    lifetimeOfRotor: {
        value: number;
        unit: string;
    };
    lifetimeText?: string | null;
    totalRunningHours: {
        value: number;
        unit: string;
    };
    exceededLife: {
        value: number;
        unit: string;
    };
    dailyRunningHours: {
        value: number;
        unit: string;
    };
    totalProduction: {
        value: number;
        unit: string;
    };
    totalFiberLoss: {
        value: number;
        unit: string;
    };
    fiberLossRanges: {
        _id: string;
        min: number;
        max: number | null;
        value: number;
    }[];
    fiberCost: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    actualMotorPowerConsumption: {
        healthy: {
            value: number;
            unit: string;
        },
        wornout: {
            value: number;
            unit: string;
        },
    };
    powerConsumption: {
        healthy: {
            value: number;
            unit: string;
        },
        wornout: {
            value: number;
            unit: string;
        },
    };
    powerCost: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    installedMotorPower: {
        value: number;
        unit: string;
    };
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    rebuildLifetime?: { value: number; unit: string };
    rebuildLifetimeText?: string | null;
    rebuildStatus?: "None" | "Sent to Rebuild" | "Rebuilt" | "In Stock";
    isSentToRebuild?: boolean;
    rebuildSentDate?: string | null;
    orderNewStatus?: "None" | "Ordered New" | "Received" | "In Stock";
    isOrderedNew?: boolean;
    orderNewRequestedDate?: string | null;
    replacementSource?: "Rebuild" | "Order New" | null;
    replacementDate?: string | null;
    replacementRecordedAt?: string | null;
    replacementSparePart?: string | null;
    replacementPartSnapshot?: ReplacementPartSnapshot | null;
    replacementPartName?: string | null;
    replacementPartKlValue?: string | null;
    replacementPartSerialNumber?: string | null;
    replacementNotes?: string | null;
    replacementLifetimeText?: string | null;
    replacementMediaUrls?: string[];
    replacementHistory?: Array<{
        source?: "Rebuild" | "Order New" | null;
        replacementDate?: string | null;
        recordedAt?: string | null;
        oldPartName?: string | null;
        oldPartKlValue?: string | null;
        oldTotalRunningHours?: { value: number; unit: string } | null;
        oldLifetimeOfRotor?: { value: number; unit: string } | null;
        oldLifetimeText?: string | null;
        oldSparePartInstallationDate?: string | null;
        oldLastServiceDate?: string | null;
        newPartName?: string | null;
        newPartKlValue?: string | null;
        newPartSerialNumber?: string | null;
        newPartSparePart?: string | null;
        newPartSnapshot?: ReplacementPartSnapshot | null;
        newLifetimeText?: string | null;
        notes?: string | null;
        mediaUrls?: string[];
    }>;
    replacementHistoryEntry?: {
        source?: "Rebuild" | "Order New" | null;
        replacementDate?: string | null;
        recordedAt?: string | null;
        oldPartName?: string | null;
        oldPartKlValue?: string | null;
        oldTotalRunningHours?: { value: number; unit: string } | null;
        oldLifetimeOfRotor?: { value: number; unit: string } | null;
        oldLifetimeText?: string | null;
        oldSparePartInstallationDate?: string | null;
        oldLastServiceDate?: string | null;
        newPartName?: string | null;
        newPartKlValue?: string | null;
        newPartSerialNumber?: string | null;
        newPartSparePart?: string | null;
        newPartSnapshot?: ReplacementPartSnapshot | null;
        newLifetimeText?: string | null;
        notes?: string | null;
        mediaUrls?: string[];
    } | null;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
