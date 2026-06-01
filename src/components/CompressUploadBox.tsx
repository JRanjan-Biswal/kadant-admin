"use client";

import React, { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import ImageUploadModal from "@/app/components/MachineHierarchy/ImageUploadModal";

interface CompressUploadBoxProps {
    label: string;
    sublabel: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    className?: string;
}

/**
 * Drop-in replacement for <UploadBox> that routes the pick through the
 * compression modal (original-vs-compressed, transparency-safe, any size). The
 * chosen File is staged via onFileChange; the actual direct-to-S3 upload happens
 * on form submit (see uploadClientImageDirect).
 */
export default function CompressUploadBox({
    label,
    sublabel,
    file,
    onFileChange,
    className = "",
}: CompressUploadBoxProps) {
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);
    }, [file]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
    };

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className={`border-2 border-dashed border-[#d1d5db] rounded-[10px] flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:border-[#505050] transition-colors relative overflow-hidden min-h-[200px] ${className}`}
            >
                {preview ? (
                    <div className="relative w-full h-full min-h-[180px] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[180px] max-w-full object-contain"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-700 hover:text-red-600 shadow"
                            aria-label="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="w-7 h-7 text-[#9ca3af] mb-2" />
                        <span className="text-foreground text-sm text-center">{label}</span>
                        <span className="text-muted-foreground text-xs text-center mt-1">
                            {sublabel}
                        </span>
                    </>
                )}
            </div>
            <ImageUploadModal
                open={open}
                onClose={() => setOpen(false)}
                title={label}
                currentImageUrl={preview}
                onSave={async (f) => {
                    onFileChange(f);
                }}
            />
        </>
    );
}
