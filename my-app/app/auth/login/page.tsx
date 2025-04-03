"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithGitHub, isLoading, error } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loginAttempt, setLoginAttempt] = useState(false)

  useEffect(() => {
    // Check for success messages from URL parameters
    const signup = searchParams.get("signup")
    const reset = searchParams.get("reset")
    const redirectPath = searchParams.get("redirect")

    if (signup === "success") {
      setSuccessMessage("Account created successfully! Please check your email to verify your account.")
    } else if (reset === "success") {
      setSuccessMessage("Password reset successfully! You can now log in with your new password.")
    } else {
      setSuccessMessage(null)
    }
  }, [searchParams])

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      console.log("Login form submitted");
      setLoginAttempt(true);
      await signIn(data.email, data.password)
      
      // If login is successful, we'll get here
      console.log("Login successful");
      
      // Get the redirect path if any
      const redirectPath = searchParams.get("redirect");
      
      // Use a timeout to ensure auth state is fully updated before redirecting
      setTimeout(() => {
        if (redirectPath) {
          console.log("Redirecting to:", redirectPath);
          router.push(redirectPath);
        } else {
          console.log("Redirecting to home");
          router.push('/');
        }
      }, 500);
    } catch (err) {
      console.error("Login error:", err)
      setLoginAttempt(false);
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setLoginAttempt(true);
      if (provider === "google") {
        await signInWithGoogle()
      } else {
        await signInWithGitHub()
      }
    } catch (err) {
      console.error(`${provider} login error:`, err)
      setLoginAttempt(false);
    }
  }

  // If login attempt is in progress and not loading anymore, we were likely redirected by the auth system
  if (loginAttempt && !isLoading) {
    return (
      <div className="container flex justify-center items-center py-16 mt-8">
        <div className="w-full max-w-md text-center flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h1 className="text-2xl font-bold">Logging you in...</h1>
          <p className="text-muted-foreground">Just a moment while we complete your login</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex justify-center items-center py-16 mt-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Aggie Nexus</h1>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
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

