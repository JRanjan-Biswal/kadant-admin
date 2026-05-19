import { LucideIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    icon?: LucideIcon;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function SelectField({ 
    label, 
    placeholder, 
    value, 
    onChange,
    options,
    icon: Icon,
    required = false,
    disabled = false,
    className = ""
}: SelectFieldProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className="text-[#6b7280] text-sm leading-5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="bg-white border border-[#d1d5db] rounded-lg h-[50px] flex items-center px-3">
                {Icon && <Icon className="w-5 h-5 text-[#6b7280] mr-2" />}
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger className="border-0 bg-transparent h-full p-0 focus:ring-0 text-gray-900 flex-1">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#e5e7eb] border-[#d1d5db]">
                        {options.map(opt => (
                            <SelectItem 
                                key={opt.value} 
                                value={opt.value}
                                className="text-gray-900 hover:bg-[#d1d5db] cursor-pointer"
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
