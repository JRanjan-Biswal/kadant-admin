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
            <label className="text-[#a1a1a1] text-sm leading-5">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="bg-[#262626] border border-[#404040] rounded-lg h-[50px] flex items-center px-3">
                {Icon && <Icon className="w-5 h-5 text-[#737373] mr-2" />}
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger className="border-0 bg-transparent h-full p-0 focus:ring-0 text-white flex-1">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#262626] border-[#404040]">
                        {options.map(opt => (
                            <SelectItem 
                                key={opt.value} 
                                value={opt.value}
                                className="text-white hover:bg-[#404040] cursor-pointer"
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
