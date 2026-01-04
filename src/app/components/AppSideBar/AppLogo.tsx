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
        <NextLink href="/dashboard">
          <div
            className="data-[state=open]:bg-sidebar-accent pl-[15px] pt-[18px] pb-[20px] data-[state=open]:text-sidebar-accent-foreground"
          >
            <Image
              src="/kadant-logo-black.svg"
              alt="Kadant Logo"
              width={135}
              height={20}
            />
          </div>
        </NextLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
