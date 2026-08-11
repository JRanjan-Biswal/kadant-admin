// Cross-page memory of the last Category/Machine picked on the Inventory
// Management "All Machines" tab, so other per-client pages (e.g. Assign
// References) can default to the same machine instead of "All" (which is
// slow — it means no filter, i.e. the full unfiltered list).

interface StoredSelection {
    categoryId?: string;
    machineId?: string;
}

const storageKey = (clientID: string) => `kadant:lastCategoryMachine:${clientID}`;

export const getStoredCategoryMachine = (clientID: string): StoredSelection => {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(storageKey(clientID));
        return raw ? (JSON.parse(raw) as StoredSelection) : {};
    } catch {
        return {};
    }
};

export const setStoredCategoryMachine = (clientID: string, selection: StoredSelection) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(storageKey(clientID), JSON.stringify(selection));
    } catch {
        // localStorage unavailable (private mode, quota, etc.) — non-critical, ignore.
    }
};
