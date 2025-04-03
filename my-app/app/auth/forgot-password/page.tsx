"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading, error } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (data: { email: string }) => {
    try {
      await requestPasswordReset(data.email)
      setSuccess(true)
    } catch (err) {
      console.error("Failed to send reset email:", err)
    }
  }

  if (success) {
    return (
      <div className="container flex justify-center items-center py-16 mt-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Check Your Email</h1>
          
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              We&apos;ve sent a password reset link to your email address. Please check your inbox.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex justify-center items-center py-16 mt-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Reset Your Password</h1>

        <AuthForm 
          type="forgotPassword" 
          onSubmit={handleSubmit} 
          loading={isLoading} 
          error={error} 
        />
      </div>
    </div>
  )
}

