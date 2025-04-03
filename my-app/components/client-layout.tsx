"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import LandingNavbar from "@/components/landing-navbar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, error } = useAuth()
  const [layoutReady, setLayoutReady] = useState(false)
  
  // Use a more robust approach to track auth state
  useEffect(() => {
    // Skip the redirect-loop fix - always mark as ready when auth state has loaded
    if (!authLoading) {
      console.log("Layout auth state loaded:", user ? "user exists" : "no user");
      
      // Immediately mark layout as ready once auth loading is done
      setLayoutReady(true);
      console.log("Layout marked as ready with user state:", user ? "logged in" : "not logged in");
      
      // No delay timer needed - this was causing the login loop
    }
  }, [authLoading, user]);

  // Show simplified loading indicator only during initial auth check
  if (authLoading) {
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

  // After auth state is available, render appropriate layout regardless of layoutReady state
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