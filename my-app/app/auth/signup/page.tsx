"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const { signUp, signInWithGoogle, signInWithGitHub, isLoading, error } = useAuth()
  const router = useRouter()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (data: { fullName: string; email: string; password: string }) => {
    try {
      // Store email in localStorage for potential resend functionality
      localStorage.setItem("lastSignupEmail", data.email)
      
      await signUp(data.email, data.password, data.fullName)
      // Redirect to waiting page after signup attempt
      router.push("/auth/waiting")
    } catch (err: any) {
      console.error("Signup error:", err)
      setLocalError(err.message || "An error occurred during signup")
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
      console.error(`${provider} signup error:`, err)
      setLocalError(err.message || `An error occurred during ${provider} signup`)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Join Aggie Nexus</h1>

        {(error || localError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || localError}</AlertDescription>
          </Alert>
        )}

        <AuthForm
          type="signup"
          onSubmit={handleSubmit}
          loading={isLoading}
          error={error || localError}
          onOAuthLogin={handleOAuthLogin}
        />
      </div>
    </div>
  )
}

