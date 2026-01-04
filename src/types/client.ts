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
    createdAt: string;
    updatedAt: string;
}

export interface ClientSelectorProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    clients: Client[];
} 