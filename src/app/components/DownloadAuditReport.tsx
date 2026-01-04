"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface DownloadAuditReportProps {
    auditReportUrl: string;
}

export default function DownloadAuditReport({ auditReportUrl }: DownloadAuditReportProps) {
    const handleDownload = async () => {
        try {
            const response = await fetch(auditReportUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-report-${new Date().toISOString().split('T')[0]}.pdf`; // You can customize the filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        }
    };

    return (
        <Button
            onClick={handleDownload}
            variant="ghost"
            className="text-base-4 cursor-pointer"
        >
            <Download className="ml-2" /> Audit Report
        </Button>
    );
}