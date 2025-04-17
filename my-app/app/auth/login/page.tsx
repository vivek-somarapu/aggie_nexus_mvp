"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithGitHub, isLoading, error } = useAuth()
  const router = useRouter()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      await signIn(data.email, data.password)
      // Redirect to waiting page after login attempt
      router.push("/auth/waiting")
    } catch (err: any) {
      console.error("Login error:", err)
      setLocalError(err.message || "An error occurred during login")
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      if (provider === "google") {
        await signInWithGoogle()
      } else {
        await signInWithGitHub()
      }
      // For OAuth, we'll redirect in the callback route
    } catch (err: any) {
      console.error(`${provider} login error:`, err)
      setLocalError(err.message || `An error occurred during ${provider} login`)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>

        {(error || localError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || localError}</AlertDescription>
          </Alert>
        )}

        <AuthForm
          type="login"
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error || localError}
          onOAuthLogin={handleOAuthLogin}
        />
      </div>
    </div>
  )
}

