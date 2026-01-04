"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { TbEdit } from "react-icons/tb";
import { User } from "next-auth";
import { useState } from "react";
import UserEdit from "@/app/components/UserEdit";

interface NavUserProps {
  user: User;
}

export function NavUser({
  user,
}: NavUserProps) {
  const { isMobile } = useSidebar();
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  function getInitials(name: string) {
    if (!name) return "";

    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

    return initials;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent cursor-pointer data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={`${process.env.NEXT_PUBLIC_API_HOST}/uploads/profile-pictures/${user.image}`} alt={user.name as string} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name as string)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name} <Badge variant="default" className="text-xs bg-[#D45815] text-white rounded-full">Admin</Badge></span>
                <span className="truncate text-xs mt-1">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={`${process.env.NEXT_PUBLIC_API_HOST}/uploads/profile-pictures/${user.image}`} alt={user.name as string} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name as string)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name as string}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setIsUserEditOpen(true)}>
                <TbEdit />
                Edit Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem className="cursor-pointer">
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <UserEdit user={user} isOpen={isUserEditOpen} onOpenChange={setIsUserEditOpen} />
    </SidebarMenu>
  );
}
