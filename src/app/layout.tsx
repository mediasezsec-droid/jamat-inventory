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
  icons: {
    icon: "/favicon.ico",
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
import { CommandMenu } from "@/components/command-menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#6A1B1B" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#6A1B1B" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="#C6A868" showSpinner={false} />
        <Providers>
          <CommandMenu />
          {children}
        </Providers>
      </body>
    </html >
  );
}
