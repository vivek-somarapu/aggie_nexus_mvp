import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import ClientLayout from "@/components/client-layout";
import Navbar from "@/components/navbar";
import { Toaster } from "sonner";
import RootCodeRedirect from "./root-code-redirect"; // already imported

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aggie Nexus",
  description: "Connect builders, funders, and commercializers",
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
            <ClientLayout>
              {/* *** TEMP NEW *** — wrap site content so "/?code=…" forwards
                   to "/auth/callback?code=…" until Supabase redirect
                   URLs are updated */}
              <RootCodeRedirect>{children}</RootCodeRedirect>
            </ClientLayout>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
