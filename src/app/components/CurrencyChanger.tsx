"use client";

import { useCallback, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrency, type SelectedCurrency } from "@/context/CurrencyContext";

export default function CurrencyChanger() {
    const { selectedCurrency, currencyValue, updateCurrency } = useCurrency();
    const [rateInput, setRateInput] = useState(currencyValue);

    const handleCurrencyChange = useCallback(
        (currency: SelectedCurrency, value: number) => {
            if (currency === selectedCurrency && value === currencyValue) {
                return;
            }
            updateCurrency(currency, value);
            toast.success("Currency updated.");
        },
        [updateCurrency, selectedCurrency, currencyValue]
    );

    return (
        <div className="flex min-w-[190px] flex-col gap-2">
            <label className="text-[13px] leading-[20px] text-[#6b7280]">Currency</label>
            <div className="flex h-11 items-center gap-1 rounded-[8px] border border-[#C5D1DC] bg-[#DFE6EC] p-1">
                <button
                    type="button"
                    onClick={() => handleCurrencyChange("EURO", rateInput)}
                    className={`h-full flex-1 rounded-[6px] text-sm font-medium transition-colors ${
                        selectedCurrency === "EURO"
                            ? "bg-[#d45815] text-white"
                            : "text-[#2D3E5C] hover:bg-white/70"
                    }`}
                >
                    EUR
                </button>
                <button
                    type="button"
                    onClick={() => handleCurrencyChange("INR", rateInput)}
                    className={`h-full flex-1 rounded-[6px] text-sm font-medium transition-colors ${
                        selectedCurrency === "INR"
                            ? "bg-[#d45815] text-white"
                            : "text-[#2D3E5C] hover:bg-white/70"
                    }`}
                >
                    INR
                </button>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            title="Edit exchange rate"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#607797] transition-colors hover:bg-white/70"
                        >
                            <Settings2 className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64">
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#607797]">
                                Exchange rate
                            </p>
                            <div className="flex items-center gap-2 text-sm text-[#2D3E5C]">
                                <span className="whitespace-nowrap">1 EUR =</span>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={rateInput}
                                    onChange={(event) => setRateInput(Number(event.target.value) || 0)}
                                    className="h-8 w-[90px]"
                                />
                                <span className="whitespace-nowrap">INR</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCurrencyChange(selectedCurrency, rateInput)}
                                className="rounded-[6px] bg-[#d45815] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b8480f]"
                            >
                                Update
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
