import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import type { Metadata } from "next";
import ClientLayout from "@/components/client-layout";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import RootCodeRedirect from "./root-code-redirect"; // already imported
import AuthDebug from "@/components/auth-debug"; // Import the debug component
import AuthStateSync from "../components/auth-state-sync";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="aggie-nexus-theme"
        >
          <AuthProvider>
            <Navbar />
            <ClientLayout>
              <RootCodeRedirect>{children}</RootCodeRedirect>
            </ClientLayout>
            <Toaster />
            <AuthDebug />
            <AuthStateSync />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
