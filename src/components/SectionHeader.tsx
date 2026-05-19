interface SectionHeaderProps {
    number: number;
    title: string;
}

export default function SectionHeader({ number, title }: SectionHeaderProps) {
    return (
        <div className="bg-[#DFE6EC] border-b border-[#96A5BA] px-6 py-4">
            <h2 className="text-lg font-bold text-[#2D3E5C]">
                {number}. {title}
            </h2>
        </div>
    );
}
