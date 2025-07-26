/**
 * TEMPORARY fix: If Supabase sends the user to "/?code=…", forward them
 * to "/auth/callback?code=…" so the new session logic runs.
 *
 * We can remove this once the Supabase redirect URL list includes
 *   …/auth/callback
 */
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RootCodeRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const search = useSearchParams();
  const code = search.get("code");

  useEffect(() => {
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [code, router]);

  return <>{children}</>;
}
