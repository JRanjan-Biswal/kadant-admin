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
            className="bg-[#2D3E5C] pl-[15px] pt-[18px] pb-[20px] border-b border-[#1f2a3d] h-16 flex items-center"
          >
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
