export interface Machine {
    _id: string;
    name: string;
    category: string;
    isActive: boolean;
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
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}