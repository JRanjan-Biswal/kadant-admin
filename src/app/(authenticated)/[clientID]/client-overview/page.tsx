export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { HiOutlineLink } from "react-icons/hi";
import getCurrentUser from "@/actions/get-current-user";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClientMachine } from "@/types/machine";
import EditClientDetails from "@/app/components/Modals/EditClientDetails";

const fetchClientDetails = async (clientID: string) => {
    const currentUser = await getCurrentUser();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/${clientID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser?.accessToken}`,
        },
        cache: 'no-store'
    });
    const data = await response.json();
    return data;
}

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function ClientOverview({ params }: PageProps) {
    const { clientID } = await params;
    const clientDetails = await fetchClientDetails(clientID);

    return (
        <div className="relative mt-4">
            <div className="flex flex-row items-center justify-between border-b pb-4 px-4">
                <div className="text-left">
                    <h1 className="text-2xl text-base-4 font-bold">Client & Machine Overview</h1>
                </div>
                <div className="text-right">
                    <EditClientDetails client={clientDetails} machines={clientDetails?.machines || []} />
                </div>
            </div>

            <div className="block pb-4 px-4 border-b">
                <table className="w-2/4">
                    <tbody>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Company Name</td>
                            <td className="py-4 text-sm font-medium text-base-3">{clientDetails?.name || "NA"}</td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Location</td>
                            <td className="py-4 text-sm font-medium text-base-3 flex flex-row gap-2">{clientDetails?.location?.address || "NA"} <span>
                                {
                                    clientDetails?.location?.mapLink && (
                                        <Link href={clientDetails?.location?.mapLink}>
                                            <Badge variant="outline" className="cursor-pointer">
                                                <HiOutlineLink size={20} />
                                                Map Link
                                            </Badge>
                                        </Link>
                                    )
                                }
                            </span></td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">End Product</td>
                            <td className="py-4 text-sm font-medium text-base-3">{clientDetails?.endProduct || "NA"} </td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Owner</td>
                            <td className="py-4 text-sm font-medium text-base-3">{clientDetails?.clientOwnership?.name || "NA"}</td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Capacity</td>
                            <td className="py-4 text-sm font-medium text-base-3">{clientDetails?.capacity ? `${clientDetails?.capacity} BDMTPD` : "NA"}</td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Power Cost</td>
                            <td className="py-4 text-sm font-medium text-base-3">
                                {clientDetails?.powerCost?.value && clientDetails?.powerCost?.priceUnit && clientDetails?.powerCost?.perUnit ?
                                    new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: clientDetails.powerCost.priceUnit
                                    }).format(clientDetails.powerCost.value) + " / " + clientDetails.powerCost.perUnit
                                    : "NA"}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Fiber Cost</td>
                            <td className="py-4 text-sm font-medium text-base-3">
                                {clientDetails?.fiberCost?.value && clientDetails?.fiberCost?.priceUnit && clientDetails?.fiberCost?.perUnit ?
                                    new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: clientDetails.fiberCost.priceUnit
                                    }).format(clientDetails.fiberCost.value) + " / " + clientDetails.fiberCost.perUnit
                                    : "NA"}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-4 text-sm font-semibold text-base-4">Facility Image</td>
                            <td className="py-4 text-sm font-medium text-base-3">
                                {clientDetails?.facilityImage ? (
                                    <div className="w-48 h-32 border border-base-2 rounded-md overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={clientDetails.facilityImage.startsWith('/') 
                                                ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')}${clientDetails.facilityImage}` 
                                                : clientDetails.facilityImage}
                                            alt="Facility"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : "No image uploaded"}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="block pb-4 px-4 mt-4">
                <h2 className="text-lg font-semibold text-base-4">Total Machines</h2>
                <Table className="border-[#96A5BA] border mt-4">
                    <TableHeader className="bg-base-1 text-base-4">
                        <TableRow>
                            <TableHead className="border-[#96A5BA] border font-semibold">Machine Name</TableHead>
                            <TableHead className="text-center border-[#96A5BA] border font-semibold">Serial Number</TableHead>
                            <TableHead className="text-center border-[#96A5BA] border font-semibold">Installation Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            clientDetails?.machines?.map((machine: ClientMachine) => (
                                <TableRow key={machine._id}>
                                    <TableCell className="font-medium border-[#96A5BA] border">{machine?.machine?.name || "NA"}</TableCell>
                                    <TableCell className="text-center border-[#96A5BA] border">{machine?.serialNumber || "NA"}</TableCell>
                                    <TableCell className="text-center border-[#96A5BA] border">{machine?.installationDate ? format(new Date(machine.installationDate), "dd MMMM yyyy") : "NA"}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>

            <div className="w-full bg-white px-4 mb-4 text-right">
                <p className="text-sm text-base-2">Last updated on: {clientDetails?.updatedAt ? format(new Date(clientDetails.updatedAt), "dd MMMM yyyy") : "NA"}</p>
            </div>
        </div>
    );
}