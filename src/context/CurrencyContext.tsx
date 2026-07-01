"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

export type SelectedCurrency = "EURO" | "INR";

interface CurrencyContextValue {
    selectedCurrency: SelectedCurrency;
    currencyValue: number;
    updateCurrency: (currency: SelectedCurrency, value: number) => void;
}

const DEFAULT_STATE: { selectedCurrency: SelectedCurrency; currencyValue: number } = {
    selectedCurrency: "EURO",
    currencyValue: 97.44,
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencySelectorProvider({ children }: { children: React.ReactNode }) {
    const [selectedCurrency, setSelectedCurrency] = useState<SelectedCurrency>(
        DEFAULT_STATE.selectedCurrency
    );
    const [currencyValue, setCurrencyValue] = useState<number>(DEFAULT_STATE.currencyValue);
    const initialized = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || initialized.current) return;
        initialized.current = true;

        const savedCurrency = localStorage.getItem("selectedCurrency");
        const savedValue = localStorage.getItem("currencyValue");

        if (savedCurrency === "EURO" || savedCurrency === "INR") {
            setSelectedCurrency(savedCurrency);
        }
        if (savedValue) {
            setCurrencyValue(parseFloat(savedValue));
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "selectedCurrency") {
                setSelectedCurrency(e.newValue === "INR" ? "INR" : "EURO");
            }
            if (e.key === "currencyValue") {
                setCurrencyValue(e.newValue ? parseFloat(e.newValue) : DEFAULT_STATE.currencyValue);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const updateCurrency = useCallback(
        (currency: SelectedCurrency, value: number) => {
            if (currency === selectedCurrency && value === currencyValue) {
                return;
            }
            setSelectedCurrency(currency);
            setCurrencyValue(value);
            localStorage.setItem("selectedCurrency", currency);
            localStorage.setItem("currencyValue", value.toString());
        },
        [selectedCurrency, currencyValue]
    );

    return (
        <CurrencyContext.Provider value={{ selectedCurrency, currencyValue, updateCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrency must be used within a CurrencySelectorProvider");
    }
    return context;
}
