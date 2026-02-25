"use client";

import { LogOut } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { TbEdit } from "react-icons/tb";
import { User } from "next-auth";
import { useState, useEffect } from "react";
import UserEdit from "@/app/components/UserEdit";

interface NavUserProps {
  user: User;
}

export function NavUser({
  user,
}: NavUserProps) {
  const { isMobile } = useSidebar();
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch the latest profile picture on component mount and when refresh is triggered
  useEffect(() => {
    if (!isMounted) return;

    const fetchProfilePicture = async () => {
      try {
        const response = await fetch('/api/users/profile-picture', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store' // Always fetch fresh data for profile picture
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profilePictureUrl) {
            setProfilePictureUrl(data.profilePictureUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        // Keep the existing profile picture URL on error
      }
    };

    fetchProfilePicture();
  }, [refreshKey, isUserEditOpen, isMounted]); // Refetch when refreshKey changes or modal closes

  // Callback to trigger profile picture refetch
  const handleProfilePictureUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

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
    <>
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="border-b border-[#1a1a1a] pb-px pl-[16px] pr-[24px] pt-[24px] h-[97px] flex flex-col cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
              <div className="flex gap-[12px] items-center w-full">
                <div className="relative rounded-full shrink-0 size-[48px] overflow-hidden">
                  <Avatar className="h-full w-full rounded-full border-0">
                    <AvatarImage src={profilePictureUrl || undefined} alt={user.name as string} />
                    <AvatarFallback className="rounded-full bg-orange/10 text-orange font-semibold text-base">
                      {getInitials(user.name as string)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 h-[48px] flex flex-col gap-[3px] min-w-0">
                  <div className="flex gap-[8px] h-[24px] items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="h-[24px] font-lato font-normal leading-[24px] text-[#f3f4f6] text-[16px] truncate max-w-[120px]">
                          {user.name as string}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover border-border">
                        <p className="text-sm">{user.name as string}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge className="h-[24px] bg-[rgba(255,105,0,0.2)] text-[#ff8904] rounded-[4px] px-[8px] py-[2px] text-[14px] leading-[20px] font-lato font-normal border-0 shrink-0">
                      Admin
                    </Badge>
                  </div>
                  <div className="h-[19px] min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-lato font-normal leading-[20px] text-[14px] text-[#607797] truncate block">
                          {user.email}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-popover border-border">
                        <p className="text-sm">{user.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-popover border-border"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg border-2 border-orange/30">
                  <AvatarImage src={profilePictureUrl || undefined} alt={user.name as string} />
                  <AvatarFallback className="rounded-lg bg-orange/10 text-orange font-semibold">
                    {getInitials(user.name as string)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">{user.name as string}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-foreground hover:bg-accent focus:bg-accent"
                onClick={() => setIsUserEditOpen(true)}
              >
                <TbEdit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
      <UserEdit
        user={user}
        isOpen={isUserEditOpen}
        onOpenChange={setIsUserEditOpen}
        onProfilePictureUpdate={handleProfilePictureUpdate}
      />
    </>
  );
}
