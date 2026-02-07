"use server";

import { revalidatePath } from "next/cache";
import getCurrentUser from "./get-current-user";

export interface UpdateCredentialsResult {
    success: boolean;
    error?: string;
    message?: string;
}

// Update client username (login ID)
export async function updateClientUsername(
    clientId: string,
    newUsername: string
): Promise<UpdateCredentialsResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientId}/credentials/username`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify({ newUsername }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update username' }));
            return {
                success: false,
                error: errorData.message || 'Failed to update username',
            };
        }

        const data = await response.json();
        
        revalidatePath('/client-management');
        
        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('Error updating client username:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

// Update client password
export async function updateClientPassword(
    clientId: string,
    currentPassword: string,
    newPassword: string
): Promise<UpdateCredentialsResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientId}/credentials/password`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update password' }));
            return {
                success: false,
                error: errorData.message || 'Failed to update password',
            };
        }

        const data = await response.json();
        
        revalidatePath('/client-management');
        
        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('Error updating client password:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

// Toggle client visibility (active status)
export async function updateClientVisibility(
    clientId: string,
    isActive: boolean
): Promise<UpdateCredentialsResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return {
                success: false,
                error: 'Unauthorized',
            };
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/client/${clientId}/visibility`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.accessToken}`,
                },
                body: JSON.stringify({ isActive }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update visibility' }));
            return {
                success: false,
                error: errorData.message || 'Failed to update visibility',
            };
        }

        const data = await response.json();
        
        revalidatePath('/client-management');
        
        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('Error updating client visibility:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
