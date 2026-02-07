"use server";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./get-current-user";

// Machine Component Interface
export interface MachineComponentData {
    componentName: string;
    klCode: string;
    partDrawingLink: string;
    installationDate: string;
    endOfLife: string;
}

// Machine Interface
export interface MachineData {
    category: string;
    machineName: string;
    productSummary: string;
}

export interface AddClientFormData {
    // Login Credentials
    username?: string;
    password?: string;
    
    // Business Details
    name: string;
    region?: string;
    customer?: string;
    address: string;
    mapLink?: string;
    endProduct: string;
    capacity: string;
    capacityOfLine?: string;
    dailyRunningHours?: string;
    
    // Cost Information
    fiberCost?: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    powerCost?: {
        value: number;
        priceUnit: string;
        perUnit: string;
    };
    
    // Machines (without images for now - images handled separately)
    machines?: MachineData[];
}

export interface AddClientResult {
    success: boolean;
    error?: string;
    client?: any;
}

export async function addClient(formData: AddClientFormData): Promise<AddClientResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        // Prepare the data for the API
        const apiData = {
            // Login credentials
            username: formData.username,
            password: formData.password,
            
            // Business details
            name: formData.name,
            region: formData.region,
            customer: formData.customer,
            endProduct: formData.endProduct,
            capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
            capacityOfLine: formData.capacityOfLine,
            dailyRunningHours: formData.dailyRunningHours ? parseInt(formData.dailyRunningHours) : undefined,
            
            // Location
            location: {
                address: formData.address,
                mapLink: formData.mapLink,
            },
            
            // Cost information
            fiberCost: formData.fiberCost,
            powerCost: formData.powerCost,
            
            // Machines
            machines: formData.machines,
        };

        // Call the external API directly
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`,
            },
            body: JSON.stringify(apiData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to create client' }));
            return {
                success: false,
                error: errorData.error || errorData.message || 'Failed to create client',
            };
        }

        const data = await response.json();
        
        // Revalidate the client management page
        revalidatePath('/client-management');
        
        return {
            success: true,
            client: data.client || data,
        };
    } catch (error) {
        console.error('Error adding client:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
