"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [success, setSuccess] = useState(false)
  const [emailNotFound, setEmailNotFound] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to check email')
      }
      
      const data = await response.json()
      return data.exists
    } catch (err) {
      console.error('Error checking email:', err)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      return
    }

    setCheckingEmail(true)
    setEmailNotFound(false)
    setSuccess(false)

    try {
      // First check if email exists in the users table
      const emailExists = await checkEmailExists(email.trim())
      
      if (!emailExists) {
        setEmailNotFound(true)
        setCheckingEmail(false)
        return
      }

      // If email exists, send reset password link
      await requestPasswordReset(email.trim())
      setSuccess(true)
    } catch (err) {
      console.error("Failed to send reset email:", err)
    } finally {
      setCheckingEmail(false)
    }
  }

  // Show loading state while checking email or sending reset
  if (checkingEmail || isLoading) {
    return (
      <div className="container flex justify-center items-center py-16 mt-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Checking Your Account</h1>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>
              {checkingEmail ? "Checking if account exists..." : "Sending reset email..."}
            </span>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  // Show success state
  if (success) {
    return (
      <div className="container flex justify-center items-center py-16 mt-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Check Your Email</h1>
          
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/login')}
              className="mr-2"
            >
              Back to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSuccess(false)
                setEmail("")
              }}
            >
              Reset Another Email
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show email not found state
  if (emailNotFound) {
    return (
      <div className="container flex justify-center items-center py-16 mt-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Account Not Found</h1>
          
          <Alert className="bg-blue-50 border-blue-200">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-600">
              No account found with email <strong>{email}</strong>. You may need to create a new account instead.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/login')}
              className="mr-2"
            >
              Back to Login
            </Button>
            <Button 
              onClick={() => {
                setEmailNotFound(false)
                setEmail("")
              }}
            >
              Try Different Email
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/auth/signup" className="text-primary hover:underline">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show main form
  return (
    <div className="container flex justify-center items-center py-16 mt-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Reset Your Password</h1>
        
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Enter your email address and we&apos;ll check if you have an account, then send you a password reset link.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!email.trim() || checkingEmail}
            >
              Check Account & Send Reset Link
            </Button>
          </form>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <a href="/auth/login" className="text-primary hover:underline">
                Back to login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}