import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const preferredRegion = ["sin1"];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jamaat Inventory Management System",
    template: "%s | Jamaat Inventory",
  },
  description: "Comprehensive inventory and event management system for Jamaat organizations. Manage events, track inventory, user roles, and system logs with ease.",
  keywords: ["jamaat", "inventory", "event management", "inventory management", "audit logs", "RBAC"],
  authors: [{ name: "AL AQMAR" }],
  creator: "AL AQMAR",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Jamaat Inventory",
    title: "Jamaat Inventory Management System",
    description: "Comprehensive inventory and event management system for Jamaat organizations",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jamaat Inventory Management System",
    description: "Comprehensive inventory and event management system for Jamaat organizations",
  },
  robots: {
    index: false,
    follow: false,
  },
};

import { Providers } from "@/components/providers";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="#d97706" showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
