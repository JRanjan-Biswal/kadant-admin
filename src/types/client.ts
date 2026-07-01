import { Admin } from "./admin";

export interface ClientAccountUser {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    designation?: string;
    role?: string;
    image?: string;
    isActive?: boolean;
    isBlocked?: boolean;
    fullAccess?: boolean;
    assignedRegions?: string[];
    assignedClients?: string[];
}

export interface Client {
    _id: string;
    name: string;
    isActive: boolean;
    loginUser?: ClientAccountUser | string | null;
    clientOwnership: Admin | string | null;
    /** Legacy string region field (old data). Use `getClientRegion(client)` helper to resolve. */
    region?: string;
    /** ObjectId ref to Regions collection (new data). Resolved to string via helper. */
    regions?: string;
    phone?: string;
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
    facilityLayout?: Array<{
        category: { _id: string; name: string } | string;
        /** Exactly 4 corners (normalized 0-100%). */
        points: Array<{ x: number; y: number }>;
    }>;
    homeImage?: string;
    homeImageUrl?: string;
    homeImagePath?: string;
    businessImage?: string;
    businessImageUrl?: string;
    flowsheetImage?: string;
    flowsheetImageUrl?: string;
    stockPrepImage?: string;
    stockPrepImageUrl?: string;
    onboardingImages?: string[];
    onboardingImageUrls?: string[];
    quoteCsvData?: {
        fileName?: string | null;
        uploadedAt?: string | null;
        headers?: string[];
        rows?: string[][];
        sections?: Array<{
            title: string;
            headers: string[];
            rows: string[][];
            subtotal?: {
                label: string;
                value: string;
            };
        }>;
        grandTotals?: Array<{
            label: string;
            value: string;
        }>;
        summaryRows?: Array<{
            label: string;
            value: string;
            note?: string;
        }>;
    };
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
