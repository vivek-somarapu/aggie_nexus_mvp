/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles both OAuth and magic-link redirects.
 * – Exchanges ?code=… for a session in the browser.
 * – Broadcasts "emailVerified" so the waiting page knows instantly.
 * – Redirects to "/" (AuthProvider will take the user to /profile/setup
 *   if their profile is incomplete).
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const finishAuth = async () => {
      // Supabase v2: no arg needed; grabs code from window.location
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        // land on login with a friendly error message
        router.replace(`/auth/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      // Tell any open /auth/waiting tab that we've verified
      localStorage.setItem("emailVerified", "true");

      // Go to the app root; AuthProvider will route further
      router.replace("/");
    };

    finishAuth();
  }, []);

  return (
    <main className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Finishing sign-in…</p>
    </main>
  );
}
