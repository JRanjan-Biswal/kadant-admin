"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import NextLink from "next/link";
import { Loader2 } from "lucide-react";

interface AppLogoProps {
  isLoading?: boolean;
  onNavigateStart?: () => void;
}

export function AppLogo({ isLoading = false, onNavigateStart }: AppLogoProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NextLink href="/client-management" onClick={() => onNavigateStart?.()}>
          <div
            className="data-[state=open]:bg-sidebar-accent pl-[15px] pt-[18px] pb-[20px] data-[state=open]:text-sidebar-accent-foreground border-b h-16 flex items-center"
          >
            {isLoading ? (
              <Loader2
                className="w-5 h-5 text-[#6a7282] animate-spin shrink-0"
                aria-label="Loading"
              />
            ) : (
              <Image
                src="/kadant-logo.svg"
                alt="Kadant Logo"
                width={135}
                height={20}
                className="brightness-0 invert"
              />
            )}
          </div>
        </NextLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
