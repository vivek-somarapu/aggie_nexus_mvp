"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

/**
 * Hook to protect routes that require email verification
 * Redirects unverified users to the existing waiting page
 */
export function useEmailVerification(redirectTo: string = "/auth/waiting") {
  const { authUser, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't check if still loading auth
    if (isLoading) return;

    // If no auth user, they'll be handled by other auth logic
    if (!authUser) return;

    // Check if user has verified email - redirect if no profile OR email not verified
    if (!profile || !profile.email_verified) {
      console.log("User needs email verification, redirecting to waiting page...", {
        hasProfile: !!profile,
        emailVerified: profile?.email_verified
      });
      router.push(redirectTo);
      return;
    }
  }, [authUser, profile, isLoading, router, redirectTo]);

  return {
    isEmailVerified: profile?.email_verified || false,
    needsEmailVerification: profile ? !profile.email_verified : false,
  };
}

/**
 * Hook to check email verification status without redirecting
 */
export function useEmailVerificationStatus() {
  const { profile } = useAuth();
  
  return {
    isEmailVerified: profile?.email_verified || false,
    needsEmailVerification: profile ? !profile.email_verified : false,
  };
}