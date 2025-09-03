"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function OrganizationUserManagement() {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Redirect to organization selector
  useEffect(() => {
    if (!authLoading) {
      router.push('/manager/organizations');
    }
  }, [authLoading, router]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Redirecting to organization selector...</p>
      </div>
    </div>
  );
} 