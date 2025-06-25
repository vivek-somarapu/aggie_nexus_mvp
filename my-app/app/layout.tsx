import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import ClientLayout from "@/components/client-layout";
import Navbar from "@/components/navbar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aggie Nexus",
  description: "Connect builders, funders, and commercializers",
  openGraph: {
    title: "Aggie Nexus",
    description:
      "Connect builders, funders, and commercializers within the Aggie community",
    url: "https://aggienexus.com",
    siteName: "Aggie Nexus",
    images: [
      {
        url: "/images/circles-logo.png",
        width: 1200,
        height: 630,
        alt: "Aggie Nexus logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            <ClientLayout>{children}</ClientLayout>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
