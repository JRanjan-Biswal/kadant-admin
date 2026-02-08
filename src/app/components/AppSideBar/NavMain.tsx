"use client";

import { IconType } from "react-icons";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface NavItem {
    title: string;
    url: string;
    icon?: IconType | React.ComponentType<{ className?: string }>;
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
    <div className="flex flex-col gap-[12px] pt-[16px] px-[16px] flex-1 overflow-y-auto">
      {/* Main Menu Label */}
      <div className="h-[20px] px-[12px]">
        <p className="flex-1 font-lato font-black leading-[20px] text-[14px] text-[#607797] tracking-[0.7px] uppercase">
          Main Menu
        </p>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-[8px] w-full">
        {items.map((item) => {
          const isActive = isActiveRoute(item.url);
          
          if (item.disabled) {
            return (
              <TooltipProvider key={item.title}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex gap-[12px] h-[44px] items-center pl-[12px] rounded-[10px] w-[223px] cursor-not-allowed opacity-40">
                      {item.icon && (
                        <div className="relative shrink-0 size-[20px]">
                          <item.icon className="w-5 h-5 text-[#6a7282]" />
                        </div>
                      )}
                      <span className="font-lato font-normal leading-[24px] text-[16px] text-[#6a7282]">
                        {item.title}
                      </span>
                      <Lock className="ml-auto h-3 w-3 text-[#6a7282]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    <p className="text-xs">Select a client first from Client Management</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <Link key={item.title} href={item.url} className="block">
              <div
                className={`flex gap-[12px] h-[44px] items-center pl-[12px] rounded-[10px] w-[223px] transition-all ${
                  isActive
                    ? 'bg-[#d45815]'
                    : 'hover:bg-sidebar-accent'
                }`}
              >
                {item.icon && (
                  <div className="relative shrink-0 size-[20px]">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#6a7282]'}`} />
                  </div>
                )}
                <span
                  className={`font-lato leading-[24px] text-[16px] ${
                    isActive
                      ? 'font-bold text-white'
                      : 'font-normal text-[#6a7282]'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
