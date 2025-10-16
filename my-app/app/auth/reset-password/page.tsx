"use client"

import { useEffect } from "react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/lib/auth"

export default function ResetPasswordPage() {
  const { resetPassword, isLoading, error } = useAuth()

  // Prevent auth context from redirecting away from this page
  useEffect(() => {
    // Set a flag to prevent redirects during password reset
    window.isPasswordResetPage = true
    
    return () => {
      window.isPasswordResetPage = false
    }
  }, [])

  const handleSubmit = async (data: { password: string }) => {
    try {
      await resetPassword(data.password)
    } catch (err) {
      // Error is handled by the auth context
      console.error("Password reset error:", err)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Set New Password</h1>

        <AuthForm 
          type="resetPassword" 
          onSubmit={handleSubmit} 
          loading={isLoading} 
          error={error} 
        />
      </div>
    </div>
  )
}

