"use client";
import { FaRegUser } from "react-icons/fa6";
import { LuCalendarCog } from "react-icons/lu";
import { PiGearFineBold } from "react-icons/pi";
import { FiUpload } from "react-icons/fi";
import { LuHistory } from "react-icons/lu";
import { NavMain } from "@/app/components/AppSideBar/NavMain";
import { NavUser } from "@/app/components/AppSideBar/NavUser";
import { AppLogo } from "@/app/components/AppSideBar/AppLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { User } from "next-auth";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const params = useParams();
  const clientID = params?.clientID as string | undefined;

  const data = {
    navMain: [
      {
        title: "Client Overview",
        url: `/${clientID}/client-overview`,
        icon: FaRegUser,
      },
      {
        title: "Visit Details",
        url: `/${clientID}/visit-details`,
        icon: LuCalendarCog,
      },
      {
        title: "Machine Insights",
        url: `/${clientID}/machine-insights`,
        icon: PiGearFineBold,
      },
      {
        title: "Upload Photos",
        url: `/${clientID}/upload-photos`,
        icon: FiUpload,
      },
      {
        title: "Upload Videos",
        url: `/${clientID}/upload-videos`,
        icon: FiUpload,
      },
      {
        title: "Order History",
        url: `/${clientID}/order-history`,
        icon: LuHistory,
      },
    ],
  };

  return (
    <Sidebar className="bg-white" collapsible="icon" {...props}>
      <SidebarHeader className="bg-white">
        <AppLogo />
        <NavUser user={user} />
      </SidebarHeader>
      <Separator />
      <SidebarContent className="bg-white">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
