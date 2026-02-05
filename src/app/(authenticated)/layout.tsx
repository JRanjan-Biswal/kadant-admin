import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import "../globals.css";
import getCurrentUser from "@/actions/get-current-user";
import AuthProvider from "@/app/providers/SessionProvider";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSideBar/AppSideBar";
import Providers from "@/app/Providers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import Notifications from "../components/Notifications";

const lato = Lato({
    subsets: ["latin"],
    weight: ["100", "300", "400", "700", "900"],
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Kadant Admin",
    description: "Kadant Admin",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/");
    }

    return (
        <html lang="en" className={`${lato.className} ${montserrat.className}`}>
            <body className="antialiased bg-background text-foreground">
                <AuthProvider>
                    <SidebarProvider>
                        <AppSidebar user={currentUser.user} />
                        <SidebarInset>
                            <header className="flex h-16 shrink-0 justify-between items-center gap-2 border-b border-border px-4 bg-background">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="on-visit" className="uppercase cursor-pointer text-xs font-semibold text-muted-foreground">On Visit</Label>
                                    <Switch className="cursor-pointer data-[state=checked]:bg-orange" id="on-visit" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Notifications />
                                </div>
                            </header>
                            <main className="bg-background min-h-[calc(100vh-4rem)]">
                                <Providers>{children}</Providers>
                            </main>
                        </SidebarInset>
                    </SidebarProvider>
                </AuthProvider>
                <Toaster 
                    richColors 
                    position="top-right" 
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                        },
                    }}
                />
            </body>
        </html>
    );
}
