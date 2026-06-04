"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Upload, X, Loader2, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX = 100 * 1024 * 1024;      // accept large originals — the Original uploads straight to S3
const MAX_EDGE = 2600;              // longest side (px) for the downscaled *compressed* copy
// The /api/compress-image PREVIEW still runs as a Vercel function (request bodies
// capped at ~4.5 MB), so the copy we POST there must stay small. The actual SAVE
// no longer goes through a function — it's a direct-to-S3 presigned PUT — so the
// Original can be any size.
const COMPRESS_INPUT_CAP = Math.floor(3.8 * 1024 * 1024); // target size for the compress request

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
        if (res.status === 413) {
            throw new Error("Couldn't build a compressed preview for this image — you can still upload the Original.");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Compression failed");
    }
    const blob = await res.blob();
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}-q${quality}.webp`, { type: "image/webp" });
}

/**
 * Returns a transport-safe COPY of the file to feed the compress endpoint, always
 * kept under the serverless body cap (Vercel rejects >4.5 MB request bodies). The
 * passed-in original is NEVER mutated — this only affects the *compressed* output.
 *
 * Earlier this downscaled by *dimension* only, so a heavy 5 MB image whose longest
 * side was already ≤ MAX_EDGE slipped through at full size and 413'd on Vercel. Now
 * we bound by *bytes*: re-encode (shrinking dimensions and/or quality) until it fits.
 * Small files pass through untouched (the server still applies the final quality + resize).
 */
async function shrinkForCompression(file: File): Promise<File> {
    if (file.size <= COMPRESS_INPUT_CAP) return file;

    let bmp: ImageBitmap;
    try {
        bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        return file; // undecodable here — let the server attempt the original
    }

    // PNG/WebP can carry transparency; encoding the shrunk copy as JPEG would
    // flatten the alpha channel onto black. Keep an alpha-capable format (WebP)
    // for those — JPEG stays for opaque sources (smaller for photos).
    const hasAlpha = file.type === "image/png" || file.type === "image/webp";
    const outType = hasAlpha ? "image/webp" : "image/jpeg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const toFile = (blob: Blob): File => {
        const t = blob.type || outType;
        const ext = t === "image/webp" ? ".webp" : t === "image/png" ? ".png" : ".jpg";
        return new File([blob], `${base}${ext}`, { type: t });
    };
    const encode = (scale: number, q: number): Promise<Blob | null> => {
        const w = Math.max(1, Math.round(bmp.width * scale));
        const h = Math.max(1, Math.round(bmp.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return Promise.resolve(null);
        ctx.drawImage(bmp, 0, 0, w, h); // canvas starts transparent — alpha is preserved
        return new Promise((resolve) => canvas.toBlob(resolve, outType, q));
    };

    try {
        const longest = Math.max(bmp.width, bmp.height);
        // Bound the long side to MAX_EDGE, then step dimensions + quality down until
        // the encoded copy fits under the transport cap.
        let scale = Math.min(1, MAX_EDGE / longest);
        for (const q of [0.9, 0.8, 0.72, 0.65]) {
            const blob = await encode(scale, q);
            if (blob && blob.size <= COMPRESS_INPUT_CAP) {
                return toFile(blob);
            }
            scale *= 0.8; // shrink further next round
        }
        const last = await encode(scale, 0.6);
        if (last) return toFile(last);
        return file;
    } finally {
        bmp.close();
    }
}

interface ImageUploadModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    currentImageUrl?: string | null;
    onSave: (file: File) => Promise<void>;
    maxSavedBytes?: number;
    maxSavedLabel?: string;
}

export default function ImageUploadModal({
    open,
    onClose,
    title,
    currentImageUrl,
    onSave,
    maxSavedBytes,
    maxSavedLabel = "5 MB",
}: ImageUploadModalProps) {
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [pickedUrl, setPickedUrl] = useState<string | null>(null);
    const [quality, setQuality] = useState(70);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [choice, setChoice] = useState<"original" | "compressed">("compressed");
    const [compressing, setCompressing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [viewerImage, setViewerImage] = useState<{ src: string; label: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pickedUrlRef = useRef<string | null>(null);
    const compressedUrlRef = useRef<string | null>(null);
    const compressInputRef = useRef<File | null>(null); // (possibly downscaled) copy fed to the compressor

    useEffect(() => {
        setMounted(true);
        return () => {
            if (pickedUrlRef.current) URL.revokeObjectURL(pickedUrlRef.current);
            if (compressedUrlRef.current) URL.revokeObjectURL(compressedUrlRef.current);
        };
    }, []);

    const reset = useCallback(() => {
        setPickedUrl((p) => {
            if (p) URL.revokeObjectURL(p);
            pickedUrlRef.current = null;
            return null;
        });
        setCompressedUrl((p) => {
            if (p) URL.revokeObjectURL(p);
            compressedUrlRef.current = null;
            return null;
        });
        setPickedFile(null);
        setCompressedFile(null);
        setQuality(70);
        setChoice("compressed");
        setViewerImage(null);
        compressInputRef.current = null;
    }, []);

    useEffect(() => {
        if (!viewerImage) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setViewerImage(null);
            }
        };
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [viewerImage]);

    const runCompress = useCallback(async (file: File, q: number) => {
        setCompressing(true);
        try {
            const out = await compressViaServer(file, q);
            const nextCompressedUrl = URL.createObjectURL(out);
            setCompressedFile(out);
            setCompressedUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                compressedUrlRef.current = nextCompressedUrl;
                return nextCompressedUrl;
            });
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
        // The Original is kept EXACTLY as the user picked it — never altered.
        const nextPickedUrl = URL.createObjectURL(file);
        setPickedFile(file);
        setPickedUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            pickedUrlRef.current = nextPickedUrl;
            return nextPickedUrl;
        });
        setChoice("compressed");
        // Only the *compressed* preview is derived. For large originals we compress
        // from a downscaled, transport-safe copy (cached so the slider can re-compress
        // without re-shrinking). The original above is untouched.
        const input = await shrinkForCompression(file);
        compressInputRef.current = input;
        runCompress(input, quality);
    }, [quality, runCompress]);

    const onSlider = useCallback((q: number) => {
        setQuality(q);
        const input = compressInputRef.current;
        if (!input) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runCompress(input, q), 300);
    }, [runCompress]);

    const close = useCallback(() => { if (!saving) { reset(); onClose(); } }, [saving, reset, onClose]);

    const handleSave = useCallback(async () => {
        const file = choice === "compressed" && compressedFile ? compressedFile : pickedFile;
        if (!file) return;
        if (maxSavedBytes && file.size > maxSavedBytes) {
            toast.error(`Selected image must be ${maxSavedLabel} or smaller. Use the compressed option or lower the quality.`);
            return;
        }
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
    }, [choice, compressedFile, pickedFile, maxSavedBytes, maxSavedLabel, onSave, reset, onClose]);

    if (!open || !mounted) return null;
    // Original is savable the moment it's picked; Compressed needs its result ready.
    const selectedFile = choice === "compressed" && compressedFile ? compressedFile : pickedFile;
    const selectedFitsLimit = !maxSavedBytes || !selectedFile || selectedFile.size <= maxSavedBytes;
    const originalFitsLimit = !maxSavedBytes || !pickedFile || pickedFile.size <= maxSavedBytes;
    const compressedFitsLimit = !maxSavedBytes || !compressedFile || compressedFile.size <= maxSavedBytes;
    const canSave = (choice === "original" ? !!pickedFile : (!!compressedFile && !compressing)) && selectedFitsLimit;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 pointer-events-auto" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
                <div className="bg-white border border-[#96A5BA] rounded-[12px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] w-full max-w-[960px] max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                            <div className="group relative rounded-[8px] border border-[#d1d5db] bg-white h-[260px] flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={currentImageUrl} alt="current" className="max-h-full max-w-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => setViewerImage({ src: currentImageUrl, label: "Current image" })}
                                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[8px] bg-white/95 border border-[#d1d5db] px-2.5 py-1.5 text-[12px] font-medium text-gray-900 shadow-sm hover:bg-white transition-colors"
                                    aria-label="View current image"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    View
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(e) => {
                            handlePick(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#d1d5db] rounded-[10px] bg-white flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:border-[#96A5BA] transition-colors"
                    >
                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-foreground text-[13px]">
                            {pickedFile ? "Choose a different image" : <>Upload <span className="text-orange font-medium">new image</span></>}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                            PNG, JPG, WebP{maxSavedBytes ? ` — saved image max ${maxSavedLabel}` : " — Original is kept full size"}
                        </span>
                    </button>

                    {pickedFile && (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#6b7280] text-[12px]">Compression quality</span>
                                    <span className="text-orange text-[13px] font-semibold">{quality}%</span>
                                </div>
                                <input type="range" min={1} max={100} value={quality} onChange={(e) => onSlider(parseInt(e.target.value, 10))} className="w-full accent-[#d45815] cursor-pointer" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Original */}
                                <div
                                    role="button"
                                    tabIndex={originalFitsLimit ? 0 : -1}
                                    onClick={() => {
                                        if (originalFitsLimit) setChoice("original");
                                    }}
                                    onKeyDown={(event) => {
                                        if (!originalFitsLimit) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            setChoice("original");
                                        }
                                    }}
                                    aria-pressed={choice === "original"}
                                    aria-disabled={!originalFitsLimit}
                                    className={`text-left rounded-[10px] border-2 overflow-hidden bg-white transition-colors ${!originalFitsLimit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${choice === "original" ? "border-orange" : "border-[#d1d5db] hover:border-[#96A5BA]"}`}
                                >
                                    <div
                                        className="group relative h-[260px] md:h-[340px] w-full flex items-center justify-center bg-[#f9fafb]"
                                        aria-label="Select original image"
                                    >
                                        {pickedUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={pickedUrl} alt="original" className="max-h-full max-w-full object-contain" />
                                        )}
                                        {pickedUrl && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setViewerImage({ src: pickedUrl, label: "Original image" });
                                                }}
                                                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-[8px] bg-white/95 border border-[#d1d5db] px-2.5 py-1.5 text-[12px] font-medium text-gray-900 shadow-sm hover:bg-white transition-colors"
                                                aria-label="View original image"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between gap-3 border-t border-[#d1d5db]">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setChoice("original");
                                            }}
                                            disabled={!originalFitsLimit}
                                            className="text-gray-900 text-[12px] font-medium flex items-center gap-1 disabled:cursor-not-allowed disabled:text-[#6b7280]"
                                            aria-pressed={choice === "original"}
                                        >
                                            {choice === "original" && <Check className="w-3.5 h-3.5 text-orange" />}Original
                                        </button>
                                        <span className={`text-[11px] ${originalFitsLimit ? "text-[#6b7280]" : "text-red-600"}`}>
                                            {fmtSize(pickedFile.size)}{!originalFitsLimit ? ` > ${maxSavedLabel}` : ""}
                                        </span>
                                    </div>
                                </div>

                                {/* Compressed */}
                                <div
                                    role="button"
                                    tabIndex={compressedFile && compressedFitsLimit ? 0 : -1}
                                    onClick={() => {
                                        if (compressedFile && compressedFitsLimit) setChoice("compressed");
                                    }}
                                    onKeyDown={(event) => {
                                        if (!compressedFile || !compressedFitsLimit) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            setChoice("compressed");
                                        }
                                    }}
                                    aria-pressed={choice === "compressed"}
                                    aria-disabled={!compressedFile || !compressedFitsLimit}
                                    className={`text-left rounded-[10px] border-2 overflow-hidden bg-white transition-colors ${!compressedFile || !compressedFitsLimit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${choice === "compressed" ? "border-orange" : "border-[#d1d5db] hover:border-[#96A5BA]"}`}
                                >
                                    <div
                                        className="group relative h-[260px] md:h-[340px] w-full flex items-center justify-center bg-[#f9fafb]"
                                        aria-label="Select compressed image"
                                    >
                                        {compressing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                                <Loader2 className="w-6 h-6 animate-spin text-orange" />
                                            </div>
                                        )}
                                        {compressedUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={compressedUrl} alt="compressed" className="max-h-full max-w-full object-contain" />
                                        )}
                                        {compressedUrl && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setViewerImage({ src: compressedUrl, label: "Compressed image" });
                                                }}
                                                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-[8px] bg-white/95 border border-[#d1d5db] px-2.5 py-1.5 text-[12px] font-medium text-gray-900 shadow-sm hover:bg-white transition-colors"
                                                aria-label="View compressed image"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between gap-3 border-t border-[#d1d5db]">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setChoice("compressed");
                                            }}
                                            disabled={!compressedFile || !compressedFitsLimit}
                                            className="text-gray-900 text-[12px] font-medium flex items-center gap-1 disabled:cursor-not-allowed disabled:text-[#6b7280]"
                                            aria-pressed={choice === "compressed"}
                                        >
                                            {choice === "compressed" && <Check className="w-3.5 h-3.5 text-orange" />}Compressed
                                        </button>
                                        <span className={`text-[11px] ${compressedFitsLimit ? "text-[#6b7280]" : "text-red-600"}`}>
                                            {compressedFile ? `${fmtSize(compressedFile.size)}${!compressedFitsLimit ? ` > ${maxSavedLabel}` : ""}` : "…"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[#6b7280] text-[11px]">
                                Pick the version to keep, then Save. The other is discarded.
                                {maxSavedBytes ? ` Saved image must be ${maxSavedLabel} or smaller.` : ""}
                            </p>
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
            {viewerImage && (
                <div
                    className="fixed inset-0 z-[2147483647] bg-black/85 p-4 pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${viewerImage.label} preview`}
                    onClick={() => setViewerImage(null)}
                >
                    <div className="mx-auto flex h-full w-full max-w-[min(96vw,1400px)] flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3 text-white">
                            <h3 className="min-w-0 truncate text-[16px] font-semibold">{viewerImage.label}</h3>
                            <button
                                type="button"
                                onClick={() => setViewerImage(null)}
                                className="h-10 w-10 shrink-0 rounded-[8px] border border-white/25 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                                aria-label="Close image preview"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 rounded-[12px] border border-white/20 bg-black/35 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={viewerImage.src} alt={viewerImage.label} className="max-h-full max-w-full object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
