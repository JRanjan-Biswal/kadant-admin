"use client";

import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface UploadBoxProps {
    label: string;
    sublabel: string;
    file: File | null;
    onFileChange: (file: File | null) => void;
    className?: string;
    accept?: string;
}

export default function UploadBox({ 
    label, 
    sublabel, 
    file, 
    onFileChange,
    className = "",
    accept = "image/*"
}: UploadBoxProps) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            // Cleanup function to revoke the object URL
            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        } else {
            setPreview(null);
        }
    }, [file]);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
    };

    return (
        <label className={`border-2 border-dashed border-[#404040] rounded-[10px] flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:border-[#505050] transition-colors relative overflow-hidden ${className}`}>
            <input 
                type="file" 
                className="hidden" 
                accept={accept}
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            
            {preview ? (
                <>
                    {/* Image Preview */}
                    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-w-full max-h-[200px] object-contain rounded-lg"
                        />
                        {/* Remove Button */}
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-[#262626] hover:bg-[#404040] text-white rounded-full p-1.5 transition-colors z-10"
                            aria-label="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {/* File Name */}
                    <p className="text-orange text-sm mt-2 truncate max-w-full">{file?.name}</p>
                </>
            ) : (
                <>
                    <Upload className="w-12 h-12 text-[#737373] mb-2" />
                    <p className="text-white text-base text-center">{label}</p>
                    <p className="text-[#737373] text-sm text-center">{sublabel}</p>
                </>
            )}
        </label>
    );
}
