"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Video, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];
const MAX = 50 * 1024 * 1024; // 50 MB

interface VideoUploadModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    currentVideoUrl?: string | null;
    onSave: (file: File) => Promise<void>;
}

export default function VideoUploadModal({ open, onClose, title, currentVideoUrl, onSave }: VideoUploadModalProps) {
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [pickedUrl, setPickedUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const reset = useCallback(() => {
        setPickedUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
        setPickedFile(null);
    }, []);

    useEffect(() => () => { if (pickedUrl) URL.revokeObjectURL(pickedUrl); }, [pickedUrl]);

    const handlePick = useCallback((file?: File) => {
        if (!file) return;
        if (!ACCEPTED.includes(file.type)) { toast.error("Only MP4, WebM, and MOV videos are allowed."); return; }
        if (file.size > MAX) { toast.error("Video must be under 50 MB."); return; }
        setPickedFile(file);
        setPickedUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    }, []);

    const close = useCallback(() => { if (!saving) { reset(); onClose(); } }, [saving, reset, onClose]);

    const handleSave = useCallback(async () => {
        if (!pickedFile) return;
        setSaving(true);
        try {
            await onSave(pickedFile);
            reset();
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }, [pickedFile, onSave, reset, onClose]);

    if (!open) return null;
    const previewUrl = pickedUrl || currentVideoUrl || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
            <div className="bg-white border border-[#96A5BA] rounded-[12px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between bg-gradient-to-r from-[#DFE6EC] to-transparent border-b border-[#607797] px-6 py-4 shrink-0">
                    <h2 className="text-gray-900 text-[18px] font-semibold">{title}</h2>
                    <button type="button" onClick={close} disabled={saving} className="w-8 h-8 flex items-center justify-center text-gray-900 hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex flex-col gap-4">
                    {previewUrl && (
                        <div className="rounded-[8px] border border-[#d1d5db] bg-black/5 overflow-hidden">
                            <video src={previewUrl} controls className="w-full max-h-[260px] object-contain" preload="metadata" />
                        </div>
                    )}
                    <label className="border-2 border-dashed border-[#d1d5db] rounded-[10px] bg-white flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:border-[#96A5BA] transition-colors">
                        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { handlePick(e.target.files?.[0]); e.target.value = ""; }} />
                        <Video className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-foreground text-[13px]">{pickedFile ? "Choose a different video" : <>Upload <span className="text-orange font-medium">video</span></>}</span>
                        <span className="text-muted-foreground text-[11px]">MP4, WebM, MOV — max 50 MB</span>
                    </label>
                </div>

                <div className="border-t border-[#607797] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={close} disabled={saving} className="bg-[#f9fafb] text-[#1f2937] border border-[#d1d5db] px-5 py-[9px] rounded-[10px] text-sm hover:bg-[#e5e7eb] transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                    <Button type="button" onClick={handleSave} disabled={!pickedFile || saving} className="bg-[#d45815] hover:bg-[#d45815]/90 text-white rounded-[10px] px-5 gap-2 disabled:opacity-50">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
