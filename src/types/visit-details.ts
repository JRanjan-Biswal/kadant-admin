export interface VisitDetails {
    lastVisitOn: string;
    engineer: string;
    clientRepresentative: string;
    designation: string;
    visitType: string[];
    nextScheduledVisit: string;
    assignedEngineer: string;
}

interface SiteVisitUser {
    _id: string;
    name: string;
    designation: string;
}

export interface MachineIssue {
    machineId?: string;
    sparePartId?: string;
    machineName?: string;
    sparePartName?: string;
    status?: string;
    optimalStateMediaUrls?: string[];
    currentVisitMediaUrls?: string[];
}

export interface SiteVisit {
    _id: string;
    client: {
        _id: string;
        name: string;
    };
    lastVisitOn: string;
    engineer: SiteVisitUser;
    clientRepresentative: string;
    clientRepresentativeDesignation: string;
    visitType: string[];
    nextScheduledVisit: string;
    assignedEngineer: SiteVisitUser;
    auditReportUrl?: string;
    machineIssues?: MachineIssue[];
}