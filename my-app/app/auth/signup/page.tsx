"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SignupPage() {
  const { signUp, signInWithGoogle, signInWithGitHub, isLoading, error } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (data: { fullName: string; email: string; password: string }) => {
    try {
      const success = await signUp(data.email, data.password, data.fullName)
      if (success) {
        setEmailSent(true)
      }
    } catch (err: any) {
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
    } catch (err: any) {
      setLocalError(err.message || `An error occurred during ${provider} signup`)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Join Aggie Nexus</h1>

        {emailSent ? (
          <Alert className="mb-6">
            <AlertDescription>
              Verification email sent! Please check your inbox and click the link to complete registration.
            </AlertDescription>
          </Alert>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

