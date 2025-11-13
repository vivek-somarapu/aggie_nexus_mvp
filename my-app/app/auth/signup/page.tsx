"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, signInWithGitHub, isLoading, error: authError } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Use a single error state that prioritizes local errors over context errors
  const error = localError || authError

  const handleSubmit = async (data: { fullName: string; email: string; password: string }) => {
    try {
      setLocalError(null)
      const success = await signUp(data.email, data.password, data.fullName)
      if (success) {
        // Store email in localStorage for the waiting page
        localStorage.setItem("lastSignupEmail", data.email)
        
        // Redirect to waiting page
        router.push("/auth/waiting")
      }
    } catch (err: any) {
      setLocalError(err.message || "An error occurred during signup")
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
      setLocalError(err.message || `An error occurred during ${provider} signup`)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Join AggieX</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AuthForm
          type="signup"
          onSubmit={handleSubmit}
          loading={isLoading}
          error={null} // Remove duplicate error from form component
          onOAuthLogin={handleOAuthLogin}
        />
      </div>
    </div>
  )
}

