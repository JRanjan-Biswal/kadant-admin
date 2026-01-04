"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
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

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon | IconType;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="pl-0">
      <SidebarGroupLabel className="font-montserrat text-[#2D3E5C] mb-[10px] mt-[10px] pl-4 uppercase text-base font-semibold">Main Menu</SidebarGroupLabel>
      <SidebarMenu className="gap-[15px]">
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
                    <span className="font-montserrat text-base">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              ) : (
                <Link href={item.url} className="my-6">
                  <SidebarMenuButton
                    className={`h-[46px] pl-4 cursor-pointer ${pathname?.includes(item.url) ? 'bg-base-4 rounded-r-full text-white hover:bg-base-4 hover:text-white' : ''}`}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span className="font-montserrat text-base">{item.title}</span>
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
                          className={pathname === subItem.url ? 'bg-black text-white' : ''}
                        >
                          <span className="font-montserrat text-base">{subItem.title}</span>
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
