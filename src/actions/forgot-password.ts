"use server";

export interface ForgotPasswordResult {
    success: boolean;
    error?: string;
    message?: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
    try {
        // Validate email format
        if (!email || !email.includes("@")) {
            return {
                success: false,
                error: "Please enter a valid email address",
            };
        }

        // Check if API URL is configured
        if (!process.env.NEXT_PUBLIC_API_URL) {
            return {
                success: false,
                error: "API URL is not configured",
            };
        }

        // Call the forgot password API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                message: "Failed to send reset email" 
            }));
            
            // Handle validation errors from the API
            if (response.status === 400) {
                return {
                    success: false,
                    error: errorData.message || errorData.error || "Invalid email address",
                };
            }

            return {
                success: false,
                error: errorData.message || errorData.error || "Failed to send reset email",
            };
        }

        // Success - API returns empty response on success
        return {
            success: true,
            message: "Reset password link has been sent to your email",
        };
    } catch (error) {
        console.error("Error in forgotPassword action:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        };
    }
}
