"use client";

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { LogOut, Save, Upload } from "lucide-react";
import { TbLockPassword } from "react-icons/tb";
import { User } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";

interface UserEditProps {
    user: User;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onProfilePictureUpdate?: () => void;
}

export default function UserEdit({ user, isOpen, onOpenChange, onProfilePictureUpdate }: UserEditProps) {
    const { update } = useSession();

    const [userDetails, setUserDetails] = useState({
        name: user.name as string,
        email: user.email as string,
        phone: user.phone as string || "",
        image: user.image as string || "",
        designation: user.designation as string || "",
    });
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
        user.image ? `${process.env.NEXT_PUBLIC_API_HOST}/uploads/profile-pictures/${user.image}` : null
    );

    const [isUserDetailsLoading, setIsUserDetailsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const handlePasswordChange = async () => {
        setIsPasswordLoading(true);
        if (passwordValue.newPassword !== passwordValue.confirmNewPassword) {
            toast.error("New password and confirm new password do not match");
            setIsPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/users/password", {
                method: "PUT",
                body: JSON.stringify({ oldPassword: passwordValue.oldPassword, newPassword: passwordValue.newPassword, confirmPassword: passwordValue.confirmNewPassword })
            });

            if (!response.ok) {
                throw new Error("Failed to update password");
            }

            toast.success("Password updated successfully");
            setTimeout(() => {
                signOut({ callbackUrl: "/" });
            }, 1500);
        } catch (error) {
            console.error("Error updating password:", error);
            toast.error("Failed to update password");
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleUserDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        try {
            setIsUserDetailsLoading(true);
            const response = await fetch("/api/users", {
                method: "PUT",
                body: JSON.stringify(userDetails)
            });

            if (!response.ok) {
                throw new Error("Failed to save changes");
            }

            await response.json();
            toast.success("Changes saved successfully");

            await update({
                name: userDetails.name,
                email: userDetails.email,
                phone: userDetails.phone,
                image: userDetails.image,
                designation: userDetails.designation,
            });
        } catch (error) {
            console.error("Error saving changes:", error);
            toast.error("Failed to save changes");
        } finally {
            setIsUserDetailsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUserDetailsLoading(true);
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await fetch('/api/users/profile-picture', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to upload image");
            }

            const data = await response.json();
            
            // Extract just the filename from the URL for session storage
            const imageUrl = data.media.url;
            const filename = imageUrl.includes('/uploads/profile-pictures/') 
                ? imageUrl.split('/uploads/profile-pictures/')[1] 
                : imageUrl.split('/').pop() || '';
            
            // Update state with filename and full URL for display
            setUserDetails(prev => ({ ...prev, image: filename }));
            setProfilePictureUrl(imageUrl); // Use full URL for immediate display
            toast.success("Profile picture updated successfully");

            // Update session with filename (NextAuth expects filename, not full URL)
            await update({
                image: filename,
            });
            
            // Notify parent component to refetch profile picture
            if (onProfilePictureUpdate) {
                onProfilePictureUpdate();
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUserDetailsLoading(false);
        }
    };

    const handlePasswordValueChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        setPasswordValue(prev => ({ ...prev, [key]: e.target.value }));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle className="text-base-4">Edit Profile</SheetTitle>
                </SheetHeader>

                <div className="px-4 flex flex-col h-full overflow-y-auto gap-4 divide-y divide-base-1">
                    <div className="flex flex-row gap-4 pb-4 items-center">
                        <div>
                            <Avatar className="h-15 w-15">
                                <AvatarImage src={profilePictureUrl || undefined} alt={userDetails.name} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="w-full">
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="imageUpload"
                                onChange={handleImageUpload}
                            />
                            <Button
                                variant="outline"
                                className="bg-base-2 text-white w-full cursor-pointer hover:bg-black hover:text-white"
                                onClick={() => document.getElementById('imageUpload')?.click()}
                            >
                                <Upload />
                                Upload Image
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pb-4">
                        <p className="text-base-4 font-semibold">1. Edit Profile</p>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                name="name"
                                value={userDetails.name}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Company Name"
                                onChange={handleUserDetailsChange}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                type="email"
                                name="email"
                                value={userDetails.email}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Email"
                                onChange={handleUserDetailsChange}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                type="tel"
                                name="phone"
                                value={userDetails.phone}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Phone"
                                onChange={handleUserDetailsChange}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                name="designation"
                                value={userDetails.designation}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Designation"
                                onChange={handleUserDetailsChange}
                            />
                        </div>

                        <div className="text-right">
                            <Button className="text-white cursor-pointer hover:bg-black hover:text-white bg-base-4 w-full" onClick={handleSaveChanges} disabled={isUserDetailsLoading}>
                                {isUserDetailsLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Saving...
                                    </div>
                                ) : (
                                    <>
                                        <Save />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pb-4">
                        <p className="text-base-4 font-semibold">2. Change Password</p>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="password"
                                name="oldPassword"
                                value={passwordValue.oldPassword}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Old Password"
                                onChange={(e) => handlePasswordValueChange(e, "oldPassword")}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                type="password"
                                name="newPassword"
                                value={passwordValue.newPassword}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="New Password"
                                onChange={(e) => handlePasswordValueChange(e, "newPassword")}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                name="confirmNewPassword"
                                value={passwordValue.confirmNewPassword}
                                className="h-12 rounded-sm border-base-2 border"
                                placeholder="Confirm New Password"
                                onChange={(e) => handlePasswordValueChange(e, "confirmNewPassword")}
                            />
                        </div>

                        <div className="text-right">
                            <Button className="bg-base-4 w-full text-white cursor-pointer hover:bg-black hover:text-white" onClick={handlePasswordChange} disabled={isPasswordLoading}>
                                <TbLockPassword />
                                Update Password
                            </Button>
                            <Button className="bg-[#D45815] mt-2 w-full text-white cursor-pointer hover:bg-black hover:text-white" onClick={() => signOut({ callbackUrl: "/" })}>
                                Logout
                                <LogOut onClick={() => signOut({ callbackUrl: "/" })} />
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}