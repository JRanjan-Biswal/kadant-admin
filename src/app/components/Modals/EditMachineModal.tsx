"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

async function uploadEntityImage(type: string, id: string, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("type", type);
    fd.append("id", id);
    const res = await fetch("/api/upload/entity-image", { method: "POST", body: fd });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Image upload failed");
    }
    return res.json();
}

interface EditMachineModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machineId: string;
    initialName: string;
    initialImageUrl?: string | null;
    onSuccess?: () => void;
}

export default function EditMachineModal({
    open,
    onOpenChange,
    machineId,
    initialName,
    initialImageUrl,
    onSuccess,
}: EditMachineModalProps) {
    const [name, setName] = useState(initialName);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = useCallback(async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Machine name is required");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/machines/${machineId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update machine");
            }
            if (imageFile) {
                await uploadEntityImage("machine", machineId, imageFile);
            }
            toast.success("Machine updated.");
            onSuccess?.();
            onOpenChange(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update");
        } finally {
            setLoading(false);
        }
    }, [machineId, name, imageFile, onSuccess, onOpenChange]);

    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!imageFile) {
            setFilePreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setFilePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);
    const showPreview = imageFile || initialImageUrl;
    const previewSrc = filePreviewUrl || initialImageUrl || null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#171717] border-[#262626] rounded-[10px] p-6 max-w-md">
                <h3 className="text-white text-lg font-medium">Edit Machine</h3>
                <div className="flex flex-col gap-3 mt-2">
                    <div>
                        <Label className="text-[#a1a1a1] text-sm">Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-[#262626] border-[#404040] text-white mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-[#a1a1a1] text-sm">Image (optional – leave empty to keep current)</Label>
                        <label className="mt-1 flex flex-col items-center justify-center min-h-[80px] border border-dashed border-[#404040] rounded-lg bg-[#262626] cursor-pointer hover:border-[#505050]">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            />
                            {showPreview && previewSrc ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={previewSrc} alt="Preview" className="max-h-20 object-contain" />
                            ) : null}
                            {!showPreview && (
                                <span className="text-[#a1a1a1] text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Upload</span>
                            )}
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#a1a1a1]">
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={loading} className="bg-[#d45815] hover:bg-[#d45815]/90">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
