"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AuthWaitingPage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()
  const [message, setMessage] = useState("Please verify your email to continue...")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const checkInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("lastSignupEmail")
    if (storedEmail) {
      setUserEmail(storedEmail)
      setMessage(`Please verify your email (${storedEmail}) to continue...`)
    }
  }, [])

  // Set up polling to check verification status
  useEffect(() => {
    if (!user) return
    
    // Get user email for display
    if (user.email) {
      setUserEmail(user.email)
    }
    
    // Function to check if email is verified
    const checkEmailVerification = async () => {
      const supabase = createClient()
      
      try {
        // Refresh the session to get the latest user data
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error("Error refreshing session:", error)
          return
        }
        
        // If email is confirmed, redirect based on profile status
        if (data.user?.email_confirmed_at) {
          setMessage("Email verified! Checking profile status...")
          
          // Clear the interval
          if (checkInterval.current) {
            clearInterval(checkInterval.current)
            checkInterval.current = null
          }
          
          // Check if profile is complete
          if (profile && profile.bio && profile.skills && profile.skills.length > 0) {
            router.push("/")
          } else {
            router.push("/profile/setup")
          }
        }
      } catch (err) {
        console.error("Error checking email verification:", err)
      }
    }
    
    // Check immediately and then set up interval
    checkEmailVerification()
    
    // Set up interval to check every 5 seconds
    checkInterval.current = setInterval(checkEmailVerification, 5000)
    
    // Clean up interval on unmount
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
    }
  }, [user, profile, router])

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!userEmail) return
    
    try {
      setResendLoading(true)
      setErrorMessage(null)
      
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        setErrorMessage(error.message)
      } else {
        setEmailResent(true)
        setMessage(`Verification email resent to ${userEmail}. Please check your inbox.`)
      }
    } catch (err) {
      console.error("Failed to resend verification email:", err)
      setErrorMessage("Failed to resend verification email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="container flex justify-center items-center py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Mail className="mx-auto h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {!emailResent ? (
            <Button 
              onClick={handleResendVerification} 
              className="mt-2" 
              disabled={resendLoading || !userEmail}
            >
              {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
          ) : (
            <Alert className="mt-4">
              <AlertDescription>
                Verification email resent! Please check your inbox.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Once your email is verified, you'll be automatically redirected.</p>
            <p className="mt-2">
              Having trouble?{" "}
              <a href="/auth/login" className="text-primary hover:underline">
                Return to login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 