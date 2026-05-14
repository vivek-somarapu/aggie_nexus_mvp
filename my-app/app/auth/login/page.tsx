"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithGitHub, isLoading, error: authError } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // The middleware appends ?redirect=<path> when it blocks an unauthenticated
  // request. We pass this straight through to signIn() so it can do a hard
  // navigation there after login — keeping the user on the right domain and
  // letting server components (AcceleratorLayout etc.) handle further routing.
  const redirectAfterLogin = searchParams.get("redirect") ?? undefined

  const error = localError || authError

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      setLocalError(null)
      const success = await signIn(data.email, data.password, redirectAfterLogin)
      if (!success && !authError) {
        setLocalError("Login failed. Please check your credentials.")
      }
    } catch (err: any) {
      setLocalError(err.message || "An error occurred during login")
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setLocalError(null)
      if (provider === "google") {
        await signInWithGoogle()
      } else {
        await signInWithGitHub()
      }
    } catch (err: any) {
      setLocalError(err.message || `An error occurred during ${provider} login`)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AuthForm
          type="login"
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error}
          onOAuthLogin={handleOAuthLogin}
        />
      </div>
    </div>
  )
}
