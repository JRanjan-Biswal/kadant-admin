"use client";

import { ChevronRight, type LucideIcon, Lock } from "lucide-react";
import { IconType } from "react-icons";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon | IconType;
  isActive?: boolean;
  disabled?: boolean;
  alwaysEnabled?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({
  items,
  selectedClientId,
  isOnClientManagement,
}: {
  items: NavItem[];
  selectedClientId?: string;
  isOnClientManagement?: boolean;
}) {
  const pathname = usePathname();

  const isActiveRoute = (url: string) => {
    if (url === "/client-management") {
      return pathname === "/client-management";
    }
    if (url === "#") return false;
    return pathname?.includes(url);
  };

  return (
    <SidebarGroup className="pl-0">
      <SidebarGroupLabel className="font-montserrat text-muted-foreground mb-[10px] mt-[10px] pl-4 uppercase text-xs font-semibold tracking-wider">
        Main Menu
      </SidebarGroupLabel>

      {/* Show message when no client is selected */}
      {!selectedClientId && !isOnClientManagement && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-orange/10 border border-orange/20">
          <p className="text-xs text-orange font-medium">No Client Selected</p>
          <p className="text-xs text-muted-foreground mt-1">
            Select a client from Client Management to access all features.
          </p>
        </div>
      )}

      {/* Show selected client info */}
      {selectedClientId && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-400 font-medium">Client Selected</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            ID: {selectedClientId.slice(0, 12)}...
          </p>
        </div>
      )}

      <SidebarMenu className="gap-[4px]">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items ? (
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span className="font-montserrat text-sm">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              ) : item.disabled ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <SidebarMenuButton
                          className="h-[42px] pl-4 cursor-not-allowed opacity-40 hover:bg-transparent hover:opacity-40"
                          tooltip={item.title}
                        >
                          {item.icon && <item.icon className="text-muted-foreground" />}
                          <span className="font-montserrat text-sm text-muted-foreground">{item.title}</span>
                          <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                        </SidebarMenuButton>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                      <p className="text-xs">Select a client first from Client Management</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Link href={item.url} className="block">
                  <SidebarMenuButton
                    className={`h-[42px] pl-4 cursor-pointer transition-all duration-200 ${
                      isActiveRoute(item.url)
                        ? 'bg-orange text-white rounded-r-full hover:bg-orange hover:text-white'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon className={isActiveRoute(item.url) ? 'text-white' : ''} />}
                    <span className="font-montserrat text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              )}

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <Link href={subItem.url}>
                        <SidebarMenuSubButton
                          asChild
                          className={pathname === subItem.url ? 'bg-orange text-white' : ''}
                        >
                          <span className="font-montserrat text-sm">{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
