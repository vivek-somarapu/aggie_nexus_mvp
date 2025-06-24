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
  title: "Aggie Nexus MVP",
  description: "Connect and collaborate with fellow Aggies",
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
