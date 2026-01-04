"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagePrint() {
    return (
        <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => window.print()}
        >
            <FileDown />
            Export
        </Button>
    );
}