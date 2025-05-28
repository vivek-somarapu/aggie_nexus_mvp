"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import AuthRedirect from "@/components/auth-redirect";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, isLoading: authLoading, error } = useAuth();
  const [showLoadingUI, setShowLoadingUI] = useState(true);

  // Only show loading UI for up to 3 seconds to prevent infinite loading state
  useEffect(() => {
    if (!authLoading) {
      setShowLoadingUI(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShowLoadingUI(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [authLoading]);

  // During initial auth check show loading state, but only for a limited time
  if (authLoading && showLoadingUI) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading your session...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we confirm your authentication status
          </p>
        </div>
      </div>
    );
  }

  // Even if there's an error with full profile loading, we can still show the UI
  // as long as we have the minimal user data
  const hasMinimalUserData = !!authUser && !!authUser.id && !!authUser.email;

  // Show error message only if it's a critical auth error (not just profile fetch issues)
  // and we don't have minimal user data
  if (error && !hasMinimalUserData && !authLoading) {
    console.error("Auth error in layout:", error);
    // Return fallback UI for critical auth errors
    return (
      <div className="flex flex-col">
        <div className="flex-1 container mx-auto py-5 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Authentication Error
            </h2>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <a href="/" className="text-primary hover:underline block mt-2">
              Return to home page
            </a>
          </div>
          {children}
        </div>
      </div>
    );
  }

  // After auth state is resolved, render appropriate layout
  return (
    <div className="flex flex-col">
      {/* Include the AuthRedirect component to check profile status */}
      {hasMinimalUserData && <AuthRedirect />}

      {hasMinimalUserData ? (
        <>
          {error && (
            <div className="container mx-auto mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm rounded">
              <p>Notice: {error}</p>
            </div>
          )}
          <main className="flex-1 container mx-auto py-5 px-4">{children}</main>
        </>
      ) : (
        <>
          <main className="flex-1 container mx-auto py-5 px-4">{children}</main>
        </>
      )}
      <ThemeToggle />
    </div>
  );
}
