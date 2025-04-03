"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading, error } = useAuth()
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (data: { email: string }) => {
    try {
      await requestPasswordReset(data.email)
      setSuccess(true)
    } catch (err) {
      // Error is handled by the auth context
      console.error("Password reset request error:", err)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Reset Your Password</h1>

        {success ? (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              If an account exists with that email, we've sent a password reset link. Please check your inbox.
            </AlertDescription>
          </Alert>
        ) : (
          <AuthForm 
            type="forgotPassword" 
            onSubmit={handleSubmit} 
            loading={isLoading} 
            error={error} 
          />
        )}
      </div>
    </div>
  )
}

