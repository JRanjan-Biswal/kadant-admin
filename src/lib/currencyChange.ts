import type { SelectedCurrency } from "@/context/CurrencyContext";

const toNumber = (value: number | string) => {
    const n = typeof value === "string" ? parseFloat(value) : value;
    return Number.isFinite(n) ? n : 0;
};

export const formatCurrency = (
    value: number | string,
    currencyType: SelectedCurrency,
    roundIt = true
) => {
    const numValue = toNumber(value);
    const roundedValue = roundIt ? Math.round(numValue) : numValue;

    const options: Intl.NumberFormatOptions = {
        style: "currency",
        currency: currencyType === "INR" ? "INR" : "EUR",
        minimumFractionDigits: roundIt ? 0 : 2,
        maximumFractionDigits: roundIt ? 0 : 2,
    };

    return new Intl.NumberFormat("en-IN", options).format(roundedValue);
};

/**
 * Converts a value between EURO and INR. 1 EURO = exchangeRate INR.
 */
export const convertCurrency = (
    value: number | string,
    fromCurrency: SelectedCurrency,
    toCurrency: SelectedCurrency,
    exchangeRate: number,
    roundIt = false
) => {
    const numValue = toNumber(value);
    if (fromCurrency === toCurrency) {
        return roundIt ? Math.round(numValue) : numValue;
    }

    const result =
        fromCurrency === "EURO" && toCurrency === "INR"
            ? numValue * exchangeRate
            : numValue / exchangeRate;

    return roundIt ? Math.round(result) : result;
};

interface CurrencyContextValue {
    selectedCurrency: SelectedCurrency;
    currencyValue: number;
}

/**
 * Converts a EUR-denominated value into the currently selected display currency
 * and formats it with the correct symbol. EUR remains the canonical stored unit.
 */
export const convertAndFormatWithContext = (
    value: number | string,
    { selectedCurrency, currencyValue }: CurrencyContextValue,
    roundIt = true
) => {
    if (selectedCurrency === "EURO") {
        return formatCurrency(value, "EURO", roundIt);
    }

    const converted = convertCurrency(value, "EURO", "INR", currencyValue, roundIt);
    return formatCurrency(converted, "INR", roundIt);
};

/**
 * Converts a EUR-denominated value into the currently selected display
 * currency as a raw number (for pre-filling an editable numeric input).
 */
export const convertEurToDisplay = (
    value: number | string,
    { selectedCurrency, currencyValue }: CurrencyContextValue
) => {
    if (selectedCurrency === "EURO") {
        return toNumber(value);
    }
    return convertCurrency(value, "EURO", "INR", currencyValue, false);
};

/**
 * Converts a value the admin entered in the currently selected currency back
 * into EUR, the canonical unit persisted to the backend.
 */
export const convertToEurFromContext = (
    value: number | string,
    { selectedCurrency, currencyValue }: CurrencyContextValue
) => {
    if (selectedCurrency === "EURO") {
        return toNumber(value);
    }
    return convertCurrency(value, "INR", "EURO", currencyValue, false);
};
