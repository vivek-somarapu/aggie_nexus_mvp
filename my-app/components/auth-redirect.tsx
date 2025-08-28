"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Component that handles auth-related redirects
 * Including directing users to complete profile setup if needed
 * 
 * SIMPLIFIED (Phase 3): Removed complex timing logic and reduced API calls
 * to prevent infinite loops and improve performance
 */
export default function AuthRedirect() {
  const { authUser, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const redirectLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[AUTH REDIRECT ${timestamp}] ${message}`, data);
    } else {
      console.log(`[AUTH REDIRECT ${timestamp}] ${message}`);
    }
  };

  const redirectError = (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[AUTH REDIRECT ERROR ${timestamp}] ${message}`, error);
    } else {
      console.error(`[AUTH REDIRECT ERROR ${timestamp}] ${message}`);
    }
  };

  useEffect(() => {
    // Skip checks if no user, already on setup page, or on auth pages
    if (
      !authUser ||
      isLoading ||
      pathname === "/profile/setup" ||
      pathname.startsWith("/auth/") ||
      isChecking ||
      hasChecked
    ) {
      return;
    }

    redirectLog("Starting profile status check", { 
      userId: authUser.id,
      pathname,
      hasProfile: !!profile
    });

    const checkProfileStatus = async () => {
      setIsChecking(true);
      
      try {
        // Simplified API call without complex timing parameters
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/auth/profile-status?_t=${timestamp}`,
          {
            headers: { "Cache-Control": "no-cache" },
          }
        );

        if (!response.ok) {
          redirectError("Failed to check profile status", { 
            status: response.status,
            statusText: response.statusText 
          });
          return;
        }

        const data = await response.json();
        
        redirectLog("Profile status received", {
          shouldSetupProfile: data.shouldSetupProfile,
          hasSkippedSetup: data.hasSkippedSetup,
          hasCompletedSetup: data.hasCompletedSetup
        });

        // If user should setup profile, redirect them unless already on setup page
        if (data.shouldSetupProfile && pathname !== "/profile/setup") {
          redirectLog("Redirecting to profile setup");
          router.push("/profile/setup");
        } else {
          redirectLog("No profile setup redirect needed");
        }
      } catch (err) {
        redirectError("Error checking profile status", err);
      } finally {
        setIsChecking(false);
        setHasChecked(true); // Mark as checked to prevent repeated calls
      }
    };

    checkProfileStatus();
  }, [authUser, pathname, router, isLoading, isChecking, hasChecked, profile]);

  // Reset hasChecked when user changes (for logout/login cycles)
  useEffect(() => {
    setHasChecked(false);
  }, [authUser?.id]);

  // Return null - this component is just for handling redirects
  return null;
}
