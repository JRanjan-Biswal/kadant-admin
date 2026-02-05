"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import NextLink from "next/link";

export function AppLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NextLink href="/client-management">
          <div
            className="data-[state=open]:bg-sidebar-accent pl-[15px] pt-[18px] pb-[20px] data-[state=open]:text-sidebar-accent-foreground"
          >
            {/* Using white logo for dark theme */}
            <Image
              src="/kadant-logo.svg"
              alt="Kadant Logo"
              width={135}
              height={20}
              className="brightness-0 invert"
            />
          </div>
        </NextLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
