"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX = 40 * 1024 * 1024;       // accept up to 40 MB; oversized ones are downscaled in-browser first
const MAX_EDGE = 2600;              // longest side (px) after client-side downscale
const SAFE_BYTES = 4 * 1024 * 1024; // at/under this and within MAX_EDGE → upload as-is

function fmtSize(bytes?: number): string {
    if (bytes == null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Sends the file to the sharp-backed compress endpoint and returns a WebP File. */
async function compressViaServer(file: File, quality: number): Promise<File> {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("quality", String(quality));
    const res = await fetch("/api/compress-image", { method: "POST", body: fd });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Compression failed");
    }
    const blob = await res.blob();
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}-q${quality}.webp`, { type: "image/webp" });
}

/**
 * Downscale very large / high-resolution images in the browser *before* they're
 * uploaded. This keeps the request body small (so it never hits the server's
 * sharp pixel limit or a platform body cap — e.g. Vercel's 4.5 MB function limit)
 * and avoids decoding a 100+ megapixel file server-side. Returns the original
 * file untouched when it's already within limits.
 */
async function prepareForUpload(file: File): Promise<{ file: File; resized: boolean }> {
    let bmp: ImageBitmap;
    try {
        bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        return { file, resized: false }; // undecodable here — let the server attempt it
    }
    const longest = Math.max(bmp.width, bmp.height);
    if (longest <= MAX_EDGE && file.size <= SAFE_BYTES) { bmp.close(); return { file, resized: false }; }

    const scale = MAX_EDGE / longest < 1 ? MAX_EDGE / longest : 1;
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return { file, resized: false }; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return { file, resized: false };
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return { file: new File([blob], `${base}.jpg`, { type: "image/jpeg" }), resized: true };
}

interface ImageUploadModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    currentImageUrl?: string | null;
    onSave: (file: File) => Promise<void>;
}

export default function ImageUploadModal({ open, onClose, title, currentImageUrl, onSave }: ImageUploadModalProps) {
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [pickedUrl, setPickedUrl] = useState<string | null>(null);
    const [quality, setQuality] = useState(70);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [choice, setChoice] = useState<"original" | "compressed">("compressed");
    const [compressing, setCompressing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset = useCallback(() => {
        setPickedUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
        setCompressedUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
        setPickedFile(null);
        setCompressedFile(null);
        setQuality(70);
        setChoice("compressed");
        setNotice(null);
    }, []);

    useEffect(() => () => {
        if (pickedUrl) URL.revokeObjectURL(pickedUrl);
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    }, [pickedUrl, compressedUrl]);

    const runCompress = useCallback(async (file: File, q: number) => {
        setCompressing(true);
        try {
            const out = await compressViaServer(file, q);
            setCompressedFile(out);
            setCompressedUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(out); });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Compression failed");
        } finally {
            setCompressing(false);
        }
    }, []);

    const handlePick = useCallback(async (file?: File) => {
        if (!file) return;
        if (!ACCEPTED.includes(file.type)) { toast.error("Only PNG, JPG, and WebP images are allowed."); return; }
        if (file.size > MAX) { toast.error("Image must be under 40 MB."); return; }
        // Downscale huge / high-resolution images in-browser first so the upload
        // stays small and reliable (avoids the server pixel limit + prod body caps).
        const { file: prepared, resized } = await prepareForUpload(file);
        setNotice(resized ? `Large image resized to ${MAX_EDGE}px for a faster, reliable upload.` : null);
        setPickedFile(prepared);
        setPickedUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(prepared); });
        setChoice("compressed");
        runCompress(prepared, quality);
    }, [quality, runCompress]);

    const onSlider = useCallback((q: number) => {
        setQuality(q);
        if (!pickedFile) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runCompress(pickedFile, q), 300);
    }, [pickedFile, runCompress]);

    const close = useCallback(() => { if (!saving) { reset(); onClose(); } }, [saving, reset, onClose]);

    const handleSave = useCallback(async () => {
        const file = choice === "compressed" && compressedFile ? compressedFile : pickedFile;
        if (!file) return;
        setSaving(true);
        try {
            await onSave(file);
            reset();
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }, [choice, compressedFile, pickedFile, onSave, reset, onClose]);

    if (!open) return null;
    const canSave = !!pickedFile && !compressing;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
            <div className="bg-white border border-[#96A5BA] rounded-[12px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] px-6 py-4 shrink-0">
                    <h2 className="text-gray-900 text-[18px] font-semibold">{title}</h2>
                    <button type="button" onClick={close} disabled={saving} className="w-8 h-8 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex flex-col gap-4">
                    {currentImageUrl && !pickedFile && (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[#6b7280] text-[12px]">Current image</span>
                            <div className="rounded-[8px] border border-[#d1d5db] bg-white h-[180px] flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={currentImageUrl} alt="current" className="max-h-full max-w-full object-contain" />
                            </div>
                        </div>
                    )}

                    <label className="border-2 border-dashed border-[#d1d5db] rounded-[10px] bg-white flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:border-[#96A5BA] transition-colors">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handlePick(e.target.files?.[0]); e.target.value = ""; }} />
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-foreground text-[13px]">
                            {pickedFile ? "Choose a different image" : <>Upload <span className="text-orange font-medium">new image</span></>}
                        </span>
                        <span className="text-muted-foreground text-[11px]">PNG, JPG, WebP — large images are auto-resized</span>
                    </label>

                    {notice && (
                        <p className="text-[#6b7280] text-[11px] bg-[#f3f4f6] border border-[#e5e7eb] rounded-[6px] px-2.5 py-1.5">{notice}</p>
                    )}

                    {pickedFile && (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#6b7280] text-[12px]">Compression quality</span>
                                    <span className="text-orange text-[13px] font-semibold">{quality}%</span>
                                </div>
                                <input type="range" min={1} max={100} value={quality} onChange={(e) => onSlider(parseInt(e.target.value, 10))} className="w-full accent-[#d45815] cursor-pointer" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Original */}
                                <button type="button" onClick={() => setChoice("original")} className={`text-left rounded-[10px] border-2 overflow-hidden bg-white cursor-pointer transition-colors ${choice === "original" ? "border-orange" : "border-[#d1d5db] hover:border-[#96A5BA]"}`}>
                                    <div className="h-[150px] flex items-center justify-center bg-[#f9fafb]">
                                        {pickedUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={pickedUrl} alt="original" className="max-h-full max-w-full object-contain" />
                                        )}
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between border-t border-[#d1d5db]">
                                        <span className="text-gray-900 text-[12px] font-medium flex items-center gap-1">
                                            {choice === "original" && <Check className="w-3.5 h-3.5 text-orange" />}Original
                                        </span>
                                        <span className="text-[#6b7280] text-[11px]">{fmtSize(pickedFile.size)}</span>
                                    </div>
                                </button>

                                {/* Compressed */}
                                <button type="button" onClick={() => setChoice("compressed")} disabled={!compressedFile} className={`text-left rounded-[10px] border-2 overflow-hidden bg-white cursor-pointer transition-colors disabled:opacity-60 ${choice === "compressed" ? "border-orange" : "border-[#d1d5db] hover:border-[#96A5BA]"}`}>
                                    <div className="h-[150px] flex items-center justify-center bg-[#f9fafb] relative">
                                        {compressing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                                <Loader2 className="w-6 h-6 animate-spin text-orange" />
                                            </div>
                                        )}
                                        {compressedUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={compressedUrl} alt="compressed" className="max-h-full max-w-full object-contain" />
                                        )}
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between border-t border-[#d1d5db]">
                                        <span className="text-gray-900 text-[12px] font-medium flex items-center gap-1">
                                            {choice === "compressed" && <Check className="w-3.5 h-3.5 text-orange" />}Compressed
                                        </span>
                                        <span className="text-[#6b7280] text-[11px]">{compressedFile ? fmtSize(compressedFile.size) : "…"}</span>
                                    </div>
                                </button>
                            </div>
                            <p className="text-[#6b7280] text-[11px]">Pick the version to keep, then Save. The other is discarded.</p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-[#607797] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={close} disabled={saving} className="bg-[#f9fafb] text-[#1f2937] border border-[#d1d5db] px-5 py-[9px] rounded-[10px] text-sm hover:bg-[#e5e7eb] transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                    <Button type="button" onClick={handleSave} disabled={!canSave || saving} className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-5 gap-2 disabled:opacity-50">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
