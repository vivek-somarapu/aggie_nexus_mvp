"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, error } = useAuth()
  
  // During initial auth check show loading state
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

  // Even if there's an error with full profile loading, we can still show the UI
  // as long as we have the minimal user data
  const hasMinimalUserData = !!user && !!user.id && !!user.email;

  // Show error message only if it's a critical auth error (not just profile fetch issues)
  // and we don't have minimal user data
  if (error && !hasMinimalUserData) {
    console.error("Auth error in layout:", error);
    // Return fallback UI for critical auth errors
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto py-6 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">Authentication Error</h2>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <a href="/" className="text-primary hover:underline block mt-2">Return to home page</a>
          </div>
          {children}
        </div>
      </div>
    )
  }

  // After auth state is resolved, render appropriate layout
  return (
    <div className="min-h-screen flex flex-col">
      {hasMinimalUserData ? (
        <>
          <Navbar />
          {error && (
            <div className="container mx-auto mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm rounded">
              <p>Notice: {error}</p>
            </div>
          )}
          <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
        </>
      ) : (
        <>
          <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
        </>
      )}
      <ThemeToggle />
    </div>
  )
}