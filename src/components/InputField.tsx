import { LucideIcon } from "lucide-react";

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
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-[#a1a1a1] text-sm leading-5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="bg-[#262626] border border-[#404040] rounded-lg h-[50px] flex items-center px-3 gap-2">
                {Icon && <Icon className="w-5 h-5 text-[#737373]" />}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="bg-transparent flex-1 text-white placeholder:text-[#737373] outline-none text-base disabled:opacity-50"
                />
            </div>
        </div>
    );
}
