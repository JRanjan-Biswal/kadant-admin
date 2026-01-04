import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getSession() {
    return await getServerSession(authOptions);
}

export default async function getCurrentUser() {
    try {
        const session = await getSession();
        if (!session?.user || !session?.accessToken) {
            return null;
        }

        return session;
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        return null;
    }
}