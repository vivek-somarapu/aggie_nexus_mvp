// Create this file at components/auth-debug.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Auth debugging component
 * Add this temporarily to your app when troubleshooting auth issues
 * <AuthDebug /> - place it in a layout or page component
 */
export default function AuthDebug() {
  const { authUser, profile, isLoading } = useAuth();
  const [sessionState, setSessionState] = useState<any>(null);
  const [userState, setUserState] = useState<any>(null);
  const [cookies, setCookies] = useState<string[]>([]);
  const [rls, setRls] = useState<string>("unknown");

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      // Check session
      const { data: sessionData } = await supabase.auth.getSession();
      setSessionState(sessionData);

      // Check user
      try {
        const { data, error } = await supabase.auth.getUser();
        setUserState({ data, error });

        // Test RLS with basic query
        if (data.user) {
          const { data: testData, error: testError } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.user.id)
            .single();

          setRls(
            testError
              ? `Failed: ${testError.code} - ${testError.message}`
              : "Working"
          );
        }
      } catch (err) {
        console.error("Auth debug error:", err);
      }

      // Check cookies
      const allCookies = document.cookie.split(";");
      setCookies(allCookies);
    };

    checkAuth();
  }, [authUser]);

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#333",
        color: "#fff",
        padding: "8px",
        fontSize: "12px",
        maxWidth: "400px",
        maxHeight: "300px",
        overflow: "auto",
        zIndex: 9999,
        borderRadius: "4px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      <div>
        <strong>Auth Debug</strong> (only visible in dev)
      </div>
      <div>Loading: {isLoading ? "true" : "false"}</div>

      <div>User: {authUser ? authUser.id.substring(0, 8) + "..." : "null"}</div>
      <div>Profile: {profile ? "loaded" : "null"}</div>
      <div>Session: {sessionState?.session ? "active" : "none"}</div>
      <div>RLS: {rls}</div>
      <div>Cookies: {cookies.filter((c) => c.includes("supabase")).length}</div>
      <button
        onClick={() =>
          console.log({ authUser, profile, sessionState, userState, cookies })
        }
        style={{ marginTop: "8px", padding: "4px", fontSize: "11px" }}
      >
        Log Details to Console
      </button>
    </div>
  );
}
