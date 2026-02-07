interface SectionHeaderProps {
    number: number;
    title: string;
}

export default function SectionHeader({ number, title }: SectionHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-[rgba(255,105,0,0.1)] to-transparent border-b border-[#262626] px-6 py-4">
            <h2 className="text-xl font-normal text-white">
                {number}. {title}
            </h2>
        </div>
    );
}
