import { Admin } from "./admin";

export interface Client {
    _id: string;
    name: string;
    isActive: boolean;
    clientOwnership: Admin;
    location: {
        address: string;
        mapLink: string;
    };
    endProduct: string;
    capacity: string;
    powerCost: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    fiberCost: {
        value: number;
        priceUnit: string;
        perUnit: string;
    }
    facilityImage?: string;
    createdAt: string;
    updatedAt: string;
    // Extended properties from backend
    lastVisited?: string | null;
    nextScheduledVisit?: string | null;
    nextScheduledVisitType?: string[];
    dailyRunningHours?: {
        value: number;
        unit: string;
    };
    lineHealth?: {
        percentage: number;
        status: string;
        totalParts: number;
        healthyParts: number;
        warningParts: number;
        criticalParts: number;
    };
}

export interface ClientSelectorProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    clients: Client[];
}
