"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import LandingNavbar from "@/components/landing-navbar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, error } = useAuth()
  const [layoutReady, setLayoutReady] = useState(false)
  
  // Use a more robust approach to track auth state
  useEffect(() => {
    console.log("Layout auth state change:", authLoading ? "loading" : "ready", user ? "user exists" : "no user");
    
    // Don't mark as ready until auth loading is complete
    if (!authLoading) {
      // Add a small delay to ensure state is fully propagated
      const stabilizeTimer = setTimeout(() => {
        setLayoutReady(true);
        console.log("Layout fully stabilized, user state:", user ? "logged in" : "not logged in");
      }, 250); // Added delay to ensure state stability
      
      return () => clearTimeout(stabilizeTimer);
    }
  }, [authLoading, user]);

  // During initial auth check or while stabilizing, show loading state
  if (authLoading || !layoutReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading your session...</p>
          <p className="text-sm text-muted-foreground">Please wait while we confirm your authentication status</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed
  if (error) {
    console.error("Auth error in layout:", error);
  }

  // After auth state is stable, render appropriate layout
  return (
    <div className="min-h-screen flex flex-col">
      {user ? (
        <>
          <Navbar />
          <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
        </>
      ) : (
        <>
          <LandingNavbar />
          <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
        </>
      )}
      <ThemeToggle />
    </div>
  )
}