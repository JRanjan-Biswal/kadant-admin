import { Admin } from "./admin";

export interface Client {
    _id: string;
    name: string;
    isActive: boolean;
    clientOwnership: Admin;
    /** Legacy string region field (old data). Use `getClientRegion(client)` helper to resolve. */
    region?: string;
    /** ObjectId ref to Regions collection (new data). Resolved to string via helper. */
    regions?: string;
    customer?: string;
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
    facilityImageUrl?: string;
    facilityImagePath?: string;
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
