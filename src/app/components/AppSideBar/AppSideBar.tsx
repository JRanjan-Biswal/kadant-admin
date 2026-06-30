"use client";

import { useState, useEffect } from "react";
import { FaRegUser } from "react-icons/fa6";
import { LuCalendarCog, LuBookOpen, LuPackage } from "react-icons/lu";
import { PiGearFineBold } from "react-icons/pi";
import { LuHistory } from "react-icons/lu";
import { HiOutlineUserGroup } from "react-icons/hi";
import { LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/app/components/AppSideBar/NavMain";
import { NavUser } from "@/app/components/AppSideBar/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";
import { AppLogo } from "./AppLogo";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const clientID = params?.clientID as string | undefined;
  const [navigatingUrl, setNavigatingUrl] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingUrl(null);
  }, [pathname]);

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
      title: "Maintenance Manual",
      url: hasSelectedClient ? `/${clientID}/maintenance-manual` : "#",
      icon: LuBookOpen,
      disabled: !hasSelectedClient,
    },
    {
      title: "Inventory Management",
      url: hasSelectedClient ? `/${clientID}/spare-parts-inventory` : "#",
      icon: LuPackage,
      disabled: !hasSelectedClient,
    },
    {
      title: "Forecasting",
      url: hasSelectedClient ? `/${clientID}/forecasting` : "#",
      icon: LineChart,
      disabled: !hasSelectedClient,
    },
    {
      title: "Order History",
      url: hasSelectedClient ? `/${clientID}/order-history` : "#",
      icon: LuHistory,
      disabled: !hasSelectedClient,
    },
    // {
    //   title: "Upload Images",
    //   url: hasSelectedClient ? `/${clientID}/upload-photos` : "#",
    //   icon: FiUpload,
    //   disabled: !hasSelectedClient,
    // },
  ];

  return (
    <Sidebar className="bg-sidebar border-r border-[#607797] w-[255px] flex flex-col" collapsible="icon" {...props}>
      <SidebarHeader className="bg-sidebar p-0 shrink-0">
        <AppLogo />
        <NavUser user={user} />
      </SidebarHeader>
      <SidebarContent className="bg-sidebar p-0 flex-1 overflow-hidden">
        <NavMain
          items={navMainItems}
          selectedClientId={clientID}
          isOnClientManagement={isOnClientManagement}
          navigatingUrl={navigatingUrl}
          onNavigateStart={(url: string) => setNavigatingUrl(url)}
        />
      </SidebarContent>
      {/* Bottom Section: Access Control (super admin + full-access admins only) */}
      {(user?.role === "superadmin" ||
        (user?.role === "admin" && user?.fullAccess)) && (
        <div className="border-t border-[#607797] flex shrink-0 flex-col items-start justify-center p-[16px]">
          <Link
            href="/access-control"
            className="block w-full"
            onClick={() => setNavigatingUrl("/access-control")}
          >
            <div
              className={`flex gap-[12px] h-[44px] items-center pl-[12px] rounded-[10px] w-[223px] transition-all ${
                pathname === "/access-control"
                  ? "bg-[#d45815]"
                  : "bg-[#d45815] hover:bg-[#b8480e]"
              }`}
            >
              <div className="relative shrink-0 size-[20px]">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-lato font-semibold leading-[20px] text-[15px] text-white">
                Access Control
              </span>
            </div>
          </Link>
        </div>
      )}
    </Sidebar>
  );
}
