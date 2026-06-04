'use client';

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { validateImport, runImport } from "@/actions/spare-parts-inventory";

// ── Field catalogue (target schema fields the CSV columns can map to) ─────────

const TARGET_FIELDS = [
    { key: "category", label: "Category (e.g. Pulping & HDC)", required: true },
    { key: "machineName", label: "Machine name", required: true },
    { key: "sparePartName", label: "Spare part name", required: true },
    { key: "klValue", label: "KL Code", required: true },
    { key: "itemOnSpareSketch", label: "Item on spare sketch" },
    { key: "lifetimeText", label: "Lifetime (e.g. '3 Months')" },
    { key: "deliveryTimeText", label: "Delivery time (e.g. '22 weeks')" },
    { key: "comments", label: "Comments / instructions" },
    { key: "unitPriceNew", label: "Unit price (new)" },
    { key: "priceRepairPerPc", label: "Repair price / pc" },
    { key: "qtySelected", label: "Qty selected" },
    { key: "clientItemNumber", label: "Client item N°" },
    { key: "stockQuantity", label: "Parts available (stock)" },
    { key: "nbNew", label: "Nb new (yearly)" },
    { key: "nbRepair", label: "Nb repair (yearly)" },
    { key: "lastOrderRefKL", label: "KL last order ref" },
    { key: "lastOrderRefClient", label: "Client last order ref" },
    // Maintenance schedule columns are detected automatically (see WEEK_HEADER_REGEX).
];

const WEEK_HEADER_REGEX = /^\s*(\d+)\s*weeks?\b/i;
const WEEK_SLOTS = Array.from({ length: 78 }, (_, index) => index + 1);

// ── CSV parser (handles quoted fields, embedded commas/newlines) ──────────────

const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                cell += ch;
            }
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ",") {
                row.push(cell);
                cell = "";
            } else if (ch === "\n") {
                row.push(cell);
                rows.push(row);
                row = [];
                cell = "";
            } else if (ch === "\r") {
                // skip
            } else {
                cell += ch;
            }
        }
    }
    if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
};

const cleanCell = (v: string) =>
    v == null ? "" : String(v).replace(/[\r\n]+/g, " ").trim();

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientID: string;
    onImported: () => void;
}

type Step = "upload" | "map" | "preview" | "result";

export default function CsvImportWizard({ open, onOpenChange, clientID, onImported }: Props) {
    const [step, setStep] = useState<Step>("upload");
    const [rawRows, setRawRows] = useState<string[][]>([]);
    const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    // Mapping shape: { targetFieldKey: csvColumnIndexAsString }. Week columns are auto-detected.
    const [error, setError] = useState<string | null>(null);
    const [validation, setValidation] = useState<{
        valid: boolean;
        errors: string[];
        summary: { rowCount: number; uniqueKlCodes: number };
    } | null>(null);
    const [importResult, setImportResult] = useState<{
        categoriesCreated: number;
        machinesCreated: number;
        sparePartsCreated: number;
        sparePartsUpdated: number;
        clientRowsUpserted: number;
        errors: { row: number; error: string }[];
    } | null>(null);
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setStep("upload");
        setRawRows([]);
        setHeaderRowIdx(0);
        setMapping({});
        setError(null);
        setValidation(null);
        setImportResult(null);
    };

    const handleFile = async (file: File) => {
        setError(null);
        try {
            const text = await file.text();
            const parsed = parseCsv(text);
            if (parsed.length < 2) {
                setError("CSV looks empty");
                return;
            }
            // Find the most likely header row — the first row whose cells look like
            // labels (most non-empty cells in first 10 rows).
            const candidate = parsed
                .slice(0, 10)
                .map((r, i) => ({ idx: i, score: r.filter((c) => c.trim().length > 0).length }))
                .sort((a, b) => b.score - a.score)[0];
            setHeaderRowIdx(candidate?.idx ?? 0);
            setRawRows(parsed);
            // Auto-guess mapping by header keyword.
            const headers = parsed[candidate?.idx ?? 0].map(cleanCell);
            const guess: Record<string, string> = {};
            headers.forEach((h, i) => {
                const setGuess = (key: string) => {
                    if (guess[key] === undefined) guess[key] = String(i);
                };
                const lower = h.toLowerCase();
                if (!lower) return;
                if (lower.includes("kl code") || lower === "kl code" || lower.includes("kl value"))
                    setGuess("klValue");
                else if (lower.includes("designation\n1rst") || lower.includes("1rst level"))
                    setGuess("sparePartName");
                else if (lower.includes("machine") && lower.includes("name"))
                    setGuess("machineName");
                else if (lower.includes("category")) setGuess("category");
                else if (lower.includes("life") && lower.includes("time")) setGuess("lifetimeText");
                else if (lower.includes("delivery")) setGuess("deliveryTimeText");
                else if (lower.includes("comment")) setGuess("comments");
                else if (lower.includes("item on") && lower.includes("sketch"))
                    setGuess("itemOnSpareSketch");
                else if ((lower.includes("client") || lower.includes("andal")) && lower.includes("item"))
                    setGuess("clientItemNumber");
                else if (lower.includes("qty") && lower.includes("selected")) setGuess("qtySelected");
                else if (lower.includes("unit price") && lower.includes("new"))
                    setGuess("unitPriceNew");
                else if (
                    lower.includes("price") &&
                    lower.includes("repair") &&
                    (lower.includes("/pc") || lower.includes("per pc") || lower.endsWith("pc"))
                )
                    setGuess("priceRepairPerPc");
                else if (lower.includes("price") && lower.includes("repair"))
                    setGuess("priceRepairPerPc");
                else if (lower.includes("parts") && lower.includes("available"))
                    setGuess("stockQuantity");
                else if (lower.includes("nb") && lower.includes("new")) setGuess("nbNew");
                else if (lower.includes("nb") && lower.includes("repair")) setGuess("nbRepair");
                else if (lower.includes("kl") && lower.includes("last order"))
                    setGuess("lastOrderRefKL");
                else if (lower.includes("last order") && !lower.includes("kl"))
                    setGuess("lastOrderRefClient");
            });
            setMapping(guess);
            setStep("map");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to parse CSV");
        }
    };

    const headers = useMemo(
        () => (rawRows[headerRowIdx] || []).map(cleanCell),
        [rawRows, headerRowIdx]
    );

    const dataRows = useMemo(
        () => rawRows.slice(headerRowIdx + 1).filter((r) => r.some((c) => cleanCell(c).length > 0)),
        [rawRows, headerRowIdx]
    );

    // Detect "N Weeks" columns for auto-mapping into maintenanceSchedule.
    const weekColumns = useMemo(() => {
        const cols: { columnIdx: number; week: number }[] = [];
        headers.forEach((h, i) => {
            const m = h.match(WEEK_HEADER_REGEX);
            if (m) {
                const week = Number(m[1]);
                if (WEEK_SLOTS.includes(week)) {
                    cols.push({ columnIdx: i, week });
                }
            }
        });
        return cols;
    }, [headers]);

    // Group rows under their machine/category context (CSV uses sparse rows where
    // machine name appears alone in column 1, then sub-rows fill in spare parts).
    const buildIngestRows = () => {
        const out: Record<string, unknown>[] = [];
        let currentCategory: string | null = null;
        let currentMachine: string | null = null;
        const colIdx = (k: string) =>
            mapping[k] !== undefined && mapping[k] !== "" ? Number(mapping[k]) : -1;
        const sparePartCol = colIdx("sparePartName");
        const klCol = colIdx("klValue");
        const categoryCol = colIdx("category");
        const machineCol = colIdx("machineName");

        for (const row of dataRows) {
            const cat = categoryCol >= 0 ? cleanCell(row[categoryCol]) : "";
            if (cat) currentCategory = cat;

            const sparePartCell = sparePartCol >= 0 ? cleanCell(row[sparePartCol]) : "";
            const klCell = klCol >= 0 ? cleanCell(row[klCol]) : "";
            const explicitMachine =
                machineCol >= 0 && machineCol !== sparePartCol ? cleanCell(row[machineCol]) : "";
            if (explicitMachine) currentMachine = explicitMachine;

            // Heading row: spare part column has text but KL column is empty → it's a machine name.
            if (sparePartCell && !klCell) {
                currentMachine = sparePartCell;
                continue;
            }
            if (!klCell || !sparePartCell) continue;
            const commentIdx = colIdx("comments");
            const commentText = commentIdx >= 0 ? cleanCell(row[commentIdx]) : "";

            const ingest: Record<string, unknown> = {
                category: currentCategory,
                machineName: explicitMachine || currentMachine,
                sparePartName: sparePartCell,
                klValue: klCell,
            };
            for (const f of TARGET_FIELDS) {
                if (f.key === "sparePartName" || f.key === "klValue" || f.key === "category" || f.key === "machineName")
                    continue;
                const idx = colIdx(f.key);
                if (idx >= 0) {
                    const v = cleanCell(row[idx]);
                    ingest[f.key] = v;
                }
            }
            // Maintenance schedule from week columns.
            const schedule: { week: number; action: string; description: string }[] = [];
            for (const { columnIdx, week } of weekColumns) {
                const v = cleanCell(row[columnIdx]);
                if (!v) continue;
                const lower = v.toLowerCase();
                let action = v;
                if (lower.startsWith("check")) action = "Check";
                else if (lower.startsWith("change")) action = "Change";
                schedule.push({ week, action, description: commentText });
            }
            if (schedule.length > 0) ingest.maintenanceSchedule = schedule;
            out.push(ingest);
        }
        return out;
    };

    const handleValidate = async () => {
        setBusy(true);
        setError(null);
        try {
            const rows = buildIngestRows();
            if (rows.length === 0) {
                setError("No data rows found. Check your column mapping.");
                setBusy(false);
                return;
            }
            const v = await validateImport(clientID, rows);
            setValidation(v);
            setStep("preview");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Validation failed");
        } finally {
            setBusy(false);
        }
    };

    const handleImport = async () => {
        setBusy(true);
        try {
            const rows = buildIngestRows();
            const result = await runImport(clientID, rows);
            setImportResult(result);
            setStep("result");
            onImported();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed");
        } finally {
            setBusy(false);
        }
    };

    const handleClose = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const ingestRows = step === "preview" ? buildIngestRows() : [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-[#ffffff] border-[#607797] max-w-[900px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">Import spare parts CSV</DialogTitle>
                    <p className="text-sm text-[#6b7280]">
                        Step {step === "upload" ? 1 : step === "map" ? 2 : step === "preview" ? 3 : 4} of 4 —{" "}
                        {step === "upload"
                            ? "Upload"
                            : step === "map"
                            ? "Map columns"
                            : step === "preview"
                            ? "Preview & validate"
                            : "Result"}
                    </p>
                </DialogHeader>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-md p-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* ── Step 1: Upload ── */}
                {step === "upload" && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-[#607797] rounded-md">
                        <Upload className="w-8 h-8 text-[#6b7280]" />
                        <p className="text-sm text-[#6b7280]">Drop a CSV here or pick a file</p>
                        <Input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }}
                            className="max-w-[300px] bg-white border-[#d1d5db]"
                        />
                    </div>
                )}

                {/* ── Step 2: Map ── */}
                {step === "map" && (
                    <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
                        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                            Header row:
                            <Select
                                value={String(headerRowIdx)}
                                onValueChange={(v) => setHeaderRowIdx(Number(v))}
                            >
                                <SelectTrigger className="bg-white border-[#d1d5db] h-8 w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {rawRows.slice(0, 10).map((_, i) => (
                                        <SelectItem key={i} value={String(i)}>
                                            {i + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span>•</span>
                            <span>{dataRows.length} data rows detected</span>
                            <span>•</span>
                            <span>
                                {weekColumns.length} maintenance-schedule columns auto-detected
                                {weekColumns.length > 0 &&
                                    ` (weeks ${weekColumns.map((w) => w.week).join(", ")})`}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {TARGET_FIELDS.map((f) => (
                                <div
                                    key={f.key}
                                    className="flex items-center gap-2 bg-white border border-[#96A5BA] rounded-md p-2"
                                >
                                    <span className="text-xs text-[#6b7280] w-[180px] flex-shrink-0">
                                        {f.label}
                                        {f.required && <span className="text-red-400">*</span>}
                                    </span>
                                    <Select
                                        value={mapping[f.key] ?? ""}
                                        onValueChange={(v) =>
                                            setMapping((m) => ({ ...m, [f.key]: v === "__none__" ? "" : v }))
                                        }
                                    >
                                        <SelectTrigger className="bg-[#ffffff] border-[#607797] h-8">
                                            <SelectValue placeholder="— skip —" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">— skip —</SelectItem>
                                            {headers.map((h, i) => (
                                                <SelectItem key={i} value={String(i)}>
                                                    {i + 1}. {h || `<col ${i + 1}>`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Preview ── */}
                {step === "preview" && validation && (
                    <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
                        <div
                            className={
                                "flex items-center gap-2 rounded-md p-2 text-sm " +
                                (validation.valid
                                    ? "bg-green-500/10 text-green-300 border border-green-500/40"
                                    : "bg-red-500/10 text-red-300 border border-red-500/40")
                            }
                        >
                            {validation.valid ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <AlertTriangle className="w-4 h-4" />
                            )}
                            {validation.valid
                                ? `Ready to import: ${validation.summary.rowCount} rows, ${validation.summary.uniqueKlCodes} unique KL codes.`
                                : `${validation.errors.length} validation error(s):`}
                        </div>
                        {!validation.valid && (
                            <ul className="list-disc list-inside text-xs text-red-300 space-y-0.5">
                                {validation.errors.slice(0, 20).map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        )}
                        <div className="border border-[#607797] rounded-md overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-[#ffffff] text-[#6b7280]">
                                    <tr>
                                        <th className="text-left p-2">Category</th>
                                        <th className="text-left p-2">Machine</th>
                                        <th className="text-left p-2">Spare part</th>
                                        <th className="text-left p-2">KL Code</th>
                                        <th className="text-left p-2">Lifetime</th>
                                        <th className="text-left p-2">Sched.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingestRows.slice(0, 25).map((r, i) => (
                                        <tr key={i} className="border-t border-[#607797] text-gray-900">
                                            <td className="p-2">{String(r.category || "")}</td>
                                            <td className="p-2">{String(r.machineName || "")}</td>
                                            <td className="p-2">{String(r.sparePartName || "")}</td>
                                            <td className="p-2 font-mono">{String(r.klValue || "")}</td>
                                            <td className="p-2">{String(r.lifetimeText || "")}</td>
                                            <td className="p-2">
                                                {Array.isArray(r.maintenanceSchedule)
                                                    ? `${(r.maintenanceSchedule as unknown[]).length}`
                                                    : "0"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ingestRows.length > 25 && (
                                <p className="text-xs text-[#6b7280] p-2">
                                    …and {ingestRows.length - 25} more rows
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Result ── */}
                {step === "result" && importResult && (
                    <div className="flex flex-col gap-3">
                        <div className="bg-green-500/10 border border-green-500/40 text-green-300 rounded-md p-3 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Import complete.
                        </div>
                        <ul className="text-sm text-gray-900 space-y-1">
                            <li>Categories created: {importResult.categoriesCreated}</li>
                            <li>Machines created: {importResult.machinesCreated}</li>
                            <li>Spare parts created: {importResult.sparePartsCreated}</li>
                            <li>Spare parts updated: {importResult.sparePartsUpdated}</li>
                            <li>Per-client inventory rows upserted: {importResult.clientRowsUpserted}</li>
                        </ul>
                        {importResult.errors.length > 0 && (
                            <div>
                                <p className="text-sm text-red-300 mb-1">
                                    {importResult.errors.length} row error(s):
                                </p>
                                <ul className="list-disc list-inside text-xs text-red-300 max-h-[200px] overflow-y-auto">
                                    {importResult.errors.map((e, i) => (
                                        <li key={i}>
                                            Row {e.row}: {e.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {step === "map" && (
                        <Button variant="ghost" onClick={() => setStep("upload")}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                    )}
                    {step === "preview" && (
                        <Button variant="ghost" onClick={() => setStep("map")}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                    )}

                    {step === "upload" && (
                        <Button variant="ghost" onClick={() => handleClose(false)}>
                            Cancel
                        </Button>
                    )}
                    {step === "map" && (
                        <Button
                            onClick={handleValidate}
                            disabled={busy}
                            className="bg-[#d45815] hover:bg-[#b8480f]"
                        >
                            {busy ? "Validating…" : "Validate"} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                    {step === "preview" && (
                        <Button
                            onClick={handleImport}
                            disabled={busy || !validation?.valid}
                            className="bg-[#d45815] hover:bg-[#b8480f]"
                        >
                            {busy ? "Importing…" : "Import"} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                    {step === "result" && (
                        <Button
                            onClick={() => handleClose(false)}
                            className="bg-[#d45815] hover:bg-[#b8480f]"
                        >
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
