import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.className} ${montserrat.className}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
