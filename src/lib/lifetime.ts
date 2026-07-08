/**
 * Client-side mirror of the backend lifetime rule (kadant-api/utils/lifetimeParser.js).
 * A lifetime string is valid when it is blank (the field is optional) or is a
 * number + a recognised unit, optionally a range. Bare numbers like "3" are
 * rejected because they cannot be converted to hours and silently break health.
 *
 * Accepts: "3 Months", "1 Year", "2 Years", "12 weeks", "1,5 year",
 *          "1 to 2 Years", "6 to 8 Months", "1-2 years".
 */
const UNIT = "(day|days|week|weeks|month|months|year|years)";
const NUM = "\\d+(?:[.,]\\d+)?";
const SIMPLE = new RegExp(`^${NUM}\\s*${UNIT}$`, "i");
const RANGE = new RegExp(`^${NUM}\\s*(?:to|-|–)\\s*${NUM}\\s*${UNIT}$`, "i");

export function isValidLifetimeText(text: string | null | undefined): boolean {
    const trimmed = String(text ?? "").trim().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "");
    if (!trimmed) return true;
    return SIMPLE.test(trimmed) || RANGE.test(trimmed);
}

export const LIFETIME_HINT =
    'Add a unit, e.g. "3 Months", "1 Year" or "1 to 2 Years".';
