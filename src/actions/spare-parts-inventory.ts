"use server";

import getCurrentUser from "./get-current-user";

const API = process.env.NEXT_PUBLIC_API_URL;

const requireToken = async () => {
    const session = await getCurrentUser();
    if (!session?.accessToken) throw new Error("Not authenticated");
    return session.accessToken;
};

export interface MaintenanceScheduleEntry {
    week: number;
    action: string;
    description: string;
}

export interface InventorySparePart {
    _id: string;
    name: string;
    klValue: string;
    itemOnSpareSketch: string | null;
    lifetimeText: string | null;
    lifeTime: { value: number; unit: string };
    deliveryTime: { value: number; unit: string };
    unitPriceNew: { value: number; priceUnit: string };
    priceRepairPerPc: { value: number; priceUnit: string };
    maintenanceSchedule: MaintenanceScheduleEntry[];
    imageUrl: string | null;
    machines: string[];
    updatedAt?: string;
    clientMachineSparePart: {
        _id?: string;
        clientItemNumber?: string | null;
        qtySelected?: number;
        lastOrderRefKL?: string | null;
        lastOrderRefClient?: string | null;
        stockQuantity?: number;
        nbNew?: number;
        nbRepair?: number;
        totalRunningHours?: { value: number; unit: string };
        lifetimeOfRotor?: { value: number; unit: string };
        sparePartInstallationDate?: string | null;
        lastServiceDate?: string | null;
        rotorType?: "New" | "Rebuilt";
        rebuildStatus?: "None" | "Sent to Rebuild" | "Rebuilt" | "In Stock";
        isSentToRebuild?: boolean;
        rebuildSentDate?: string | null;
        rebuildDeliveryTime?: { value: number; unit: string };
        rebuildLifetime?: { value: number; unit: string };
        rebuildLifetimeText?: string | null;
        statusOverride?: "In Stock" | "Low Stocks" | "Out of Stock" | null;
        updatedAt?: string;
    } | null;
}

export interface InventoryMachine {
    _id: string;
    name: string;
    modelNumber?: string | null;
    serialNumber?: string;
    categoryId?: string | null;
    categoryName?: string | null;
    installationDate?: string | null;
}

export async function fetchInventoryMachines(clientID: string): Promise<InventoryMachine[]> {
    const token = await requireToken();
    const res = await fetch(`${API}/client/${clientID}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return [];
    const client = await res.json();
    const list = (client.machines || []) as Array<{
        _id: string;
        serialNumber?: string;
        installationDate?: string;
        machine?: {
            _id: string;
            name: string;
            modelNumber?: string | null;
            installationDate?: string;
            category?: { _id?: string; name?: string } | string | null;
        };
    }>;
    return list
        .map((cm) => {
            const cat = cm.machine?.category;
            const categoryId = typeof cat === "string" ? cat : cat?._id ?? null;
            const categoryName = typeof cat === "string" ? null : cat?.name ?? null;
            return {
                _id: cm.machine?._id || "",
                name: cm.machine?.name || "Unknown machine",
                modelNumber: cm.machine?.modelNumber ?? null,
                serialNumber: cm.serialNumber,
                categoryId,
                categoryName,
                installationDate:
                    cm.installationDate || cm.machine?.installationDate || null,
            };
        })
        .filter((m) => m._id);
}

export async function fetchInventoryForMachine(
    clientID: string,
    machineID: string
): Promise<InventorySparePart[]> {
    const token = await requireToken();
    const res = await fetch(`${API}/machines/${machineID}/spare-parts/${clientID}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.spareParts || []) as InventorySparePart[];
}

export async function saveSparePart(
    sparePartID: string,
    updates: Partial<{
        name: string;
        klValue: string;
        lifetimeText: string;
        deliveryTime: { value: number; unit: string };
        itemOnSpareSketch: string | null;
        unitPriceNew: { value: number; priceUnit: string };
        priceRepairPerPc: { value: number; priceUnit: string };
        maintenanceSchedule: MaintenanceScheduleEntry[];
        machines: string[];
    }>
): Promise<{ ok: boolean; error?: string }> {
    const token = await requireToken();
    const res = await fetch(`${API}/machines/spare-parts/${sparePartID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        let msg = "Failed to save";
        try {
            const j = await res.json();
            msg = j.message || msg;
        } catch {}
        return { ok: false, error: msg };
    }
    return { ok: true };
}

export async function saveClientSparePart(
    clientID: string,
    machineID: string,
    sparePartID: string,
    updates: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
    const token = await requireToken();
    const res = await fetch(`${API}/client-machines/spare-parts/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            clientID,
            machineID,
            sparePartID,
            updates,
        }),
    });
    if (!res.ok) {
        let msg = "Failed to save inventory row";
        try {
            const j = await res.json();
            msg = j.message || msg;
        } catch {}
        return { ok: false, error: msg };
    }
    return { ok: true };
}

export async function validateImport(
    clientID: string,
    rows: Record<string, unknown>[]
): Promise<{ valid: boolean; errors: string[]; summary: { rowCount: number; uniqueKlCodes: number } }> {
    const token = await requireToken();
    const res = await fetch(`${API}/machines/spare-parts/import/validate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientID, rows }),
    });
    return res.json();
}

export async function runImport(
    clientID: string,
    rows: Record<string, unknown>[]
): Promise<{
    categoriesCreated: number;
    machinesCreated: number;
    sparePartsCreated: number;
    sparePartsUpdated: number;
    clientRowsUpserted: number;
    errors: { row: number; error: string }[];
}> {
    const token = await requireToken();
    const res = await fetch(`${API}/machines/spare-parts/import`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientID, rows }),
    });
    return res.json();
}
