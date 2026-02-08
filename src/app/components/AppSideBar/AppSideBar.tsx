"use client";
import { FaRegUser } from "react-icons/fa6";
import { LuCalendarCog } from "react-icons/lu";
import { PiGearFineBold } from "react-icons/pi";
import { FiUpload } from "react-icons/fi";
import { LuHistory } from "react-icons/lu";
import { HiOutlineUserGroup } from "react-icons/hi";
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
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const clientID = params?.clientID as string | undefined;

  // Check if we're on a page with a selected client
  const hasSelectedClient = !!clientID;
  
  // Check if we're on client management page
  const isOnClientManagement = pathname === "/client-management";

  // Define navigation items with disabled state
  // Only "Client Management" is always enabled
  // All other tabs require a client to be selected
  const navMainItems = [
    {
      title: "Client Management",
      url: "/client-management",
      icon: HiOutlineUserGroup,
      disabled: false,
      alwaysEnabled: true,
    },
      {
        title: "Client Overview",
      url: hasSelectedClient ? `/${clientID}/client-overview` : "#",
        icon: FaRegUser,
      disabled: !hasSelectedClient,
      },
      {
        title: "Visit Details",
      url: hasSelectedClient ? `/${clientID}/visit-details` : "#",
        icon: LuCalendarCog,
      disabled: !hasSelectedClient,
      },
      {
        title: "Machine Insights",
      url: hasSelectedClient ? `/${clientID}/machine-insights` : "#",
        icon: PiGearFineBold,
      disabled: !hasSelectedClient,
      },
      {
        title: "Upload Photos",
      url: hasSelectedClient ? `/${clientID}/upload-photos` : "#",
        icon: FiUpload,
      disabled: !hasSelectedClient,
      },
      {
        title: "Upload Videos",
      url: hasSelectedClient ? `/${clientID}/upload-videos` : "#",
        icon: FiUpload,
      disabled: !hasSelectedClient,
      },
      {
        title: "Order History",
      url: hasSelectedClient ? `/${clientID}/order-history` : "#",
        icon: LuHistory,
      disabled: !hasSelectedClient,
      },
  ];

  return (
    <Sidebar className="bg-sidebar border-sidebar-border" collapsible="icon" {...props}>
      <SidebarHeader className="bg-sidebar">
        <AppLogo />
        <NavUser user={user} />
      </SidebarHeader>
      <Separator className="bg-sidebar-border" />
      <SidebarContent className="bg-sidebar">
        <NavMain 
          items={navMainItems} 
          selectedClientId={clientID} 
          isOnClientManagement={isOnClientManagement}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
