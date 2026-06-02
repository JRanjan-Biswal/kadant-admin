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

export interface SparePartMediaEntry {
    sparePartId: string;
    sparePartName: string;
    mediaUrls: string[];
}

export interface MachineIssue {
    machineId?: string;
    sparePartId?: string;
    machineName?: string;
    sparePartName?: string;
    categoryName?: string;
    status?: string;
    conditionAlert?: string;
    actionNeeded?: string;
    optimalStateMediaUrls?: string[];
    currentVisitMediaUrls?: string[];
    sparePartMedia?: SparePartMediaEntry[];
    subPartLastVisitPhotos?: { [partId: string]: string[] };
    subPartCurrentVisitPhotos?: { [partId: string]: string[] };
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
    // Free-text engineer name (was a populated user ref). Old docs may emit
    // an ObjectId hex string, but the field is treated as plain text.
    assignedEngineer: string;
    auditReportUrl?: string;
    machineIssues?: MachineIssue[];
}