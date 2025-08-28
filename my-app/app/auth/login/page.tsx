"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Enhanced logging for login page
const loginLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[LOGIN PAGE ${timestamp}] ${message}`, data);
  } else {
    console.log(`[LOGIN PAGE ${timestamp}] ${message}`);
  }
};

const loginError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[LOGIN PAGE ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[LOGIN PAGE ERROR ${timestamp}] ${message}`);
  }
};

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithGitHub, isLoading, error: authError } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  
  loginLog("LoginPage: Component rendered", {
    isLoading,
    hasAuthError: !!authError,
    hasLocalError: !!localError
  });
  
  // Use a single error state that prioritizes local errors over context errors
  const error = localError || authError

  const handleSubmit = async (data: { email: string; password: string }) => {
    loginLog("LoginPage: Form submitted", { email: data.email });
    try {
      setLocalError(null)
      loginLog("LoginPage: Calling signIn function");
      const success = await signIn(data.email, data.password)
      loginLog("LoginPage: signIn completed", { success, hasAuthError: !!authError });
      
      if (!success && !authError) {
        loginError("LoginPage: Sign in failed without specific error");
        setLocalError("Login failed. Please check your credentials.")
      }
    } catch (err: any) {
      loginError("LoginPage: Exception during form submission", err);
      setLocalError(err.message || "An error occurred during login")
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    loginLog("LoginPage: OAuth login initiated", { provider });
    try {
      setLocalError(null)
      if (provider === "google") {
        loginLog("LoginPage: Starting Google OAuth");
        await signInWithGoogle()
      } else {
        loginLog("LoginPage: Starting GitHub OAuth");
        await signInWithGitHub()
      }
      loginLog("LoginPage: OAuth flow initiated successfully", { provider });
    } catch (err: any) {
      loginError("LoginPage: OAuth login failed", { provider, error: err });
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

