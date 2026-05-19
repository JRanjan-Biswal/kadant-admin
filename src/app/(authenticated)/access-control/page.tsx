export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import getCurrentUser from "@/actions/get-current-user";
import AccessControlPage from "@/app/components/AccessControl/AccessControlPage";
import type {
    AccessAdmin,
    AccessStats,
} from "@/actions/access-control";

interface RegionOption {
    _id: string;
    region: string;
}

interface ClientOption {
    _id: string;
    name: string;
}

const fetchJson = async <T,>(
    url: string,
    accessToken: string,
    fallback: T
): Promise<T> => {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });
        if (!response.ok) {
            console.error(
                `Access Control fetch failed: ${url} → ${response.status} ${response.statusText}`
            );
            return fallback;
        }
        return (await response.json()) as T;
    } catch (error) {
        console.error(`Access Control fetch error (${url}):`, error);
        return fallback;
    }
};

export default async function AccessControlRoute() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/");
    }
    if (currentUser.user?.role !== "superadmin") {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
                <div className="bg-white border border-[#96A5BA] rounded-[10px] p-10 max-w-md text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-[#6b7280]">
                        Only the super admin can manage access control.
                    </p>
                </div>
            </div>
        );
    }

    const base = process.env.NEXT_PUBLIC_API_URL;
    const token = currentUser.accessToken;

    const [statsRes, superRes, adminsRes, optionsRes] = await Promise.all([
        fetchJson<AccessStats>(`${base}/access-control/stats`, token, {
            totalAdmin: 0,
            activeAdmins: 0,
            totalRegions: 0,
            regionsAssigned: 0,
        }),
        fetchJson<{ superAdmin: AccessAdmin | null }>(
            `${base}/access-control/super-admin`,
            token,
            { superAdmin: null }
        ),
        fetchJson<{ admins: AccessAdmin[]; total: number }>(
            `${base}/access-control/admins`,
            token,
            { admins: [], total: 0 }
        ),
        fetchJson<{ regions: RegionOption[]; clients: ClientOption[] }>(
            `${base}/access-control/options`,
            token,
            { regions: [], clients: [] }
        ),
    ]);

    return (
        <AccessControlPage
            stats={statsRes}
            superAdmin={superRes.superAdmin}
            admins={adminsRes.admins}
            regions={optionsRes.regions}
            clients={optionsRes.clients}
        />
    );
}
