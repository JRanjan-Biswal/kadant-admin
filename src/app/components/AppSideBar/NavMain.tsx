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
import { Lock, Loader2 } from "lucide-react";

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
  navigatingUrl,
  onNavigateStart,
}: {
  items: NavItem[];
  selectedClientId?: string;
  isOnClientManagement?: boolean;
  navigatingUrl?: string | null;
  onNavigateStart?: (url: string) => void;
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
    <div className="flex flex-col gap-[12px] pt-[16px] px-[16px] flex-1 overflow-y-auto border-t border-[#607797]">
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
                          <item.icon className="w-5 h-5 text-[#6b7280]" />
                        </div>
                      )}
                      <span className="font-lato font-semibold leading-[24px] text-[16px] text-[#6b7280]">
                        {item.title}
                      </span>
                      <Lock className="ml-auto h-3 w-3 text-[#6b7280]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    <p className="text-xs">Select a client first from Client Management</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          const isLoadingThis = navigatingUrl === item.url && !isActive;

          return (
            <Link
              key={item.title}
              href={item.url}
              className="block"
              onClick={() => onNavigateStart?.(item.url)}
            >
              <div
                className={`flex gap-[12px] h-[44px] items-center pl-[12px] rounded-[10px] w-[223px] transition-all ${isActive
                    ? 'bg-[#d45815]'
                    : 'hover:bg-sidebar-accent'
                  }`}
              >
                <div className="relative shrink-0 size-[20px]">
                  {isLoadingThis ? (
                    <Loader2 className="w-5 h-5 text-[#6b7280] animate-spin" />
                  ) : item.icon ? (
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#6b7280]'}`} />
                  ) : null}
                </div>
                <span
                  className={`font-lato font-semibold leading-[20px] text-[15px] ${isActive
                      ? 'text-white'
                      : 'text-[#6b7280]'
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
