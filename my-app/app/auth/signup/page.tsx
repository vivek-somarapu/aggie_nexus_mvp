"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const { signUp, signInWithGoogle, signInWithGitHub, isLoading, error } = useAuth()
  const [customError, setCustomError] = useState<string | null>(null)

  const handleSubmit = async (data: { fullName: string; email: string; password: string }) => {
    try {
      await signUp(data.email, data.password, data.fullName)
    } catch (err) {
      // Most errors are handled by the auth context, but we can add custom ones here
      console.error("Signup error:", err)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      if (provider === "google") {
        await signInWithGoogle()
      } else {
        await signInWithGitHub()
      }
    } catch (err) {
      // Error is handled by the auth context
      console.error(`${provider} signup error:`, err)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Join Aggie Nexus</h1>

        {customError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{customError}</AlertDescription>
          </Alert>
        )}

        <AuthForm
          type="signup"
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error || customError}
          onOAuthLogin={handleOAuthLogin}
        />
      </div>
    </div>
  )
}

