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

export interface ReplacementHistoryEntry {
    source?: "Rebuild" | "Order New" | null;
    replacementDate?: string | null;
    recordedAt?: string | null;
    oldPartName?: string | null;
    oldPartKlValue?: string | null;
    oldTotalRunningHours?: { value: number; unit: string } | null;
    oldLifetimeOfRotor?: { value: number; unit: string } | null;
    oldLifetimeText?: string | null;
    oldSparePartInstallationDate?: string | null;
    oldLastServiceDate?: string | null;
    newPartName?: string | null;
    newPartKlValue?: string | null;
    newPartSerialNumber?: string | null;
    newPartSparePart?: string | null;
    newPartSnapshot?: ReplacementPartSnapshot | null;
    newLifetimeText?: string | null;
    notes?: string | null;
    mediaUrls?: string[];
}

export interface ReplacementPartSnapshot {
    sparePart?: string | null;
    name?: string | null;
    klValue?: string | null;
    itemOnSpareSketch?: string | null;
    lifetimeText?: string | null;
    lifeTime?: { value: number; unit: string };
    deliveryTime?: { value: number; unit: string };
    unitPriceNew?: { value: number; priceUnit: string };
    priceRepairPerPc?: { value: number; priceUnit: string };
    imageUrl?: string | null;
    imageUrls?: string[];
    optimalStateVideoUrl?: string | null;
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    sourceMachine?: string | null;
    sourceMachineName?: string | null;
    sourceMachineSerialNumber?: string | null;
    sourceCategory?: string | null;
    sourceCategoryName?: string | null;
}

export interface ReplacementOption {
    _id: string;
    replacementSparePartID: string;
    replacementSourceMachineID: string;
    name: string;
    originalName?: string | null;
    klValue?: string | null;
    itemOnSpareSketch?: string | null;
    lifetimeText?: string | null;
    lifeTime?: { value: number; unit: string };
    deliveryTime?: { value: number; unit: string };
    unitPriceNew?: { value: number; priceUnit: string };
    priceRepairPerPc?: { value: number; priceUnit: string };
    imageUrl?: string | null;
    imageUrls?: string[];
    optimalStateVideoUrl?: string | null;
    rotorType?: "New" | "Rebuilt";
    rebuildsPossible?: number;
    sourceMachine?: {
        _id: string;
        name: string;
        serialNumber?: string | null;
        categoryId?: string | null;
        categoryName?: string | null;
    };
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
        lifetimeText?: string | null;
        sparePartInstallationDate?: string | null;
        lastServiceDate?: string | null;
        rotorType?: "New" | "Rebuilt";
        rebuildsPossible?: number;
        rebuildStatus?: "None" | "Sent to Rebuild" | "Rebuilt" | "In Stock";
        isSentToRebuild?: boolean;
        rebuildSentDate?: string | null;
        rebuildDeliveryTime?: { value: number; unit: string };
        rebuildLifetime?: { value: number; unit: string };
        rebuildLifetimeText?: string | null;
        orderNewStatus?: "None" | "Ordered New" | "Received" | "In Stock";
        isOrderedNew?: boolean;
        orderNewRequestedDate?: string | null;
        orderNewDeliveryTime?: { value: number; unit: string };
        replacementSource?: "Rebuild" | "Order New" | null;
        replacementDate?: string | null;
        replacementRecordedAt?: string | null;
        replacementSparePart?: string | null;
        replacementPartSnapshot?: ReplacementPartSnapshot | null;
        replacementPartName?: string | null;
        replacementPartKlValue?: string | null;
        replacementPartSerialNumber?: string | null;
        replacementNotes?: string | null;
        replacementLifetimeText?: string | null;
        replacementMediaUrls?: string[];
        replacementHistory?: ReplacementHistoryEntry[];
        replacementHistoryEntry?: ReplacementHistoryEntry | null;
        statusOverride?: "In Stock" | "Low Stocks" | "Out of Stock" | null;
        isActive?: boolean;
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

export type InventoryQueueType = "rebuild" | "orderedNew" | "replaced";

export interface InventoryQueueItem {
    queueType: InventoryQueueType;
    machine: InventoryMachine;
    part: InventorySparePart;
}

export interface InventoryQueueResponse {
    items: InventoryQueueItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ReplacementOptionsResponse {
    items: ReplacementOption[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

export async function fetchInventoryQueue(
    clientID: string,
    type: InventoryQueueType,
    page = 1,
    limit = 10,
    filters: { categoryID?: string; machineID?: string } = {}
): Promise<InventoryQueueResponse> {
    const token = await requireToken();
    const params = new URLSearchParams({
        type,
        page: String(page),
        limit: String(limit),
    });
    if (filters.categoryID) params.set("categoryID", filters.categoryID);
    if (filters.machineID) params.set("machineID", filters.machineID);
    const res = await fetch(`${API}/client-machines/spare-parts/queue/${clientID}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) {
        let message = "Failed to load tracked spare parts";
        try {
            const body = await res.json();
            message = body.message || message;
        } catch {}
        throw new Error(message);
    }
    return res.json();
}

export async function fetchReplacementOptions(
    clientID: string,
    filters: {
        page?: number;
        limit?: number;
        categoryID?: string;
        machineID?: string;
        search?: string;
    } = {}
): Promise<ReplacementOptionsResponse> {
    const token = await requireToken();
    const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 10),
    });
    if (filters.categoryID) params.set("categoryID", filters.categoryID);
    if (filters.machineID) params.set("machineID", filters.machineID);
    if (filters.search) params.set("search", filters.search);
    const res = await fetch(`${API}/client-machines/spare-parts/replacement-options/${clientID}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) {
        let message = "Failed to load replacement options";
        try {
            const body = await res.json();
            message = body.message || message;
        } catch {}
        throw new Error(message);
    }
    return res.json();
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
