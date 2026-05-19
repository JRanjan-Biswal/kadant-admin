import { useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface InputFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    icon?: LucideIcon;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function InputField({
    label,
    placeholder,
    value,
    onChange,
    icon: Icon,
    type = "text",
    required = false,
    disabled = false,
    className = ""
}: InputFieldProps) {
    const isPassword = type === "password";
    const [revealed, setRevealed] = useState(false);
    const effectiveType = isPassword && revealed ? "text" : type;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-[#6b7280] text-sm leading-5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="bg-white border border-[#d1d5db] rounded-lg h-[50px] flex items-center px-3 gap-2">
                {Icon && <Icon className="w-5 h-5 text-[#6b7280]" />}
                <input
                    type={effectiveType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="bg-transparent flex-1 text-gray-900 placeholder:text-[#6b7280] outline-none text-base disabled:opacity-50"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        disabled={disabled}
                        aria-label={revealed ? "Hide password" : "Show password"}
                        className="text-[#6b7280] hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        {revealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
}
