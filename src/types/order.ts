export interface Order {
    _id?: string;
    orderNumber: string;
    type: string;
    rotor: string;
    installedDate: string;
    replacedDate: string;
    runningHrs: number;
    remarks: string;
    machineName?: string;
    date?: string;
    doneBy?: string;
    status?: string;
    createdAt?: string;
}