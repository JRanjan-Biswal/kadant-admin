"use client";

import { CurrencySelectorProvider } from "@/context/CurrencyContext";
import ClientIDSync from "@/app/components/ClientIDSync";

export function CurrencyWrapper({ children }: { children: React.ReactNode }) {
    return (
        <CurrencySelectorProvider>
            <ClientIDSync />
            {children}
        </CurrencySelectorProvider>
    );
}
