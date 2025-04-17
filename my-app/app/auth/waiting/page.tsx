"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { userService } from "@/lib/services/user-service"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/db"

// Define a type for error objects
type ErrorWithMessage = {
  message: string;
}

// Type guard to check if an object is an ErrorWithMessage
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

// Function to extract error message
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (isErrorWithMessage(error)) {
    return error.message
  }
  return "Unknown error occurred"
}

export default function AuthWaitingPage() {
  const router = useRouter()
  const { user, isLoading, error } = useAuth()
  const [waitTime, setWaitTime] = useState(0)
  const [message, setMessage] = useState("Please verify your email to continue...")
  const [emailResent, setEmailResent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(false)
  const profileChecked = useRef(false)
  
  // Initialize last email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("lastSignupEmail")
    if (storedEmail) {
      console.log("Found stored email from signup:", storedEmail)
      setUserEmail(storedEmail)
      setMessage(`Please verify your email (${storedEmail}) to continue...`)
    } else {
      console.log("No stored email found, user may have navigated here directly")
    }
  }, [])

  // Only run checkProfile once to avoid infinite loops when user exists
  useEffect(() => {
    if (isLoading || profileChecked.current) return
    
    console.log("Auth state check - User:", !!user, "Loading:", isLoading)
    
    if (user) {
      // Get user email for resend functionality
      setUserEmail(user.email)
      
      if (!profileChecked.current) {
        profileChecked.current = true
        
        // User is authenticated, now check if profile is complete
        const checkProfile = async () => {
          try {
            setMessage("Authentication successful. Checking profile...")
            console.log("User authenticated, checking profile completion")
            const userData = await userService.getUser(user.id)
            
            // Redirect based on profile status
            if (!userData || !userData.bio || !userData.skills || userData.skills.length === 0) {
              console.log("Profile incomplete, redirecting to setup")
              setMessage("Redirecting to profile setup...")
              router.push("/profile/setup")
            } else {
              console.log("Profile complete, redirecting to home")
              setMessage("Redirecting to home page...")
              router.push("/")
            }
          } catch (err) {
            console.error("Error checking profile:", err)
            // Default to home page if there's an error
            setMessage("Error checking profile. Redirecting to home...")
            router.push("/")
          }
        }
        
        checkProfile()
      }
    }
  }, [user, isLoading, router])
  
  // Active polling for authentication status
  useEffect(() => {
    if (user || isLoading) return
    
    console.log("Starting polling for auth status")
    
    // Manual check for active session every 3 seconds
    const checkInterval = setInterval(async () => {
      if (checkingSession) return
      
      try {
        setCheckingSession(true)
        
        // Check supabase session directly
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error in automatic session check:", error)
        }
        
        if (data.session) {
          console.log("Automatic check - Session detected")
          setMessage("Email verified! Loading profile...")
          // Force a page reload to trigger auth state update
          window.location.reload()
        }
      } catch (err) {
        console.error("Error in automatic session check:", err)
      } finally {
        setCheckingSession(false)
      }
    }, 2000)
    
    // Normal wait time counter for UI updates
    const counterInterval = setInterval(() => {
      setWaitTime(prev => {
        const newTime = prev + 1
        
        // Update message based on wait time
        if (newTime > 5 && newTime < 15) {
          setMessage("Waiting for email verification... Please check your inbox and spam folder.")
        } else if (newTime >= 15 && newTime < 30) {
          setMessage("Please check your email for a verification link. Click it to continue.")
        } else if (newTime >= 30) {
          setMessage("Email verification is taking longer than expected. Try resending the email or return to login.")
        }
        
        return newTime
      })
    }, 1000)
    
    return () => {
      clearInterval(checkInterval)
      clearInterval(counterInterval)
    }
  }, [user, isLoading, checkingSession])

  // Function to manually check auth status
  const checkAuthStatus = async () => {
    setMessage("Checking authentication status...")
    try {
      setCheckingSession(true)
      
      // Check supabase session directly
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error checking session:", error)
        setMessage(`Authentication error: ${error.message}`)
        return
      }
      
      console.log("Session check result:", data)
      
      if (data.session) {
        setMessage("Session detected. Loading profile...")
        
        // For debugging - log the current user details
        console.log("User in session:", data.session.user)
        
        // Force a page reload to trigger auth state update
        window.location.reload()
      } else {
        console.log("No active session found")
        setMessage("No active session found. Please check your email for verification link.")
      }
    } catch (err) {
      console.error("Error checking session:", err)
      setMessage("Error checking authentication status.")
    } finally {
      setCheckingSession(false)
    }
  }

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    let emailToUse = userEmail
    
    if (!emailToUse) {
      // Try to extract email from session storage or local storage
      const lastEmail = localStorage.getItem("lastSignupEmail")
      if (!lastEmail) {
        setMessage("Email address not found. Please try logging in again.")
        return
      }
      emailToUse = lastEmail
      setUserEmail(lastEmail)
    }
    
    try {
      setResendLoading(true)
      console.log(`Attempting to resend verification email to: ${emailToUse}`)
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Error resending verification email:', error)
        setMessage(`Failed to resend verification email: ${error.message}`)
      } else {
        console.log(`Verification email successfully resent to ${emailToUse}`)
        setEmailResent(true)
        setMessage(`Verification email resent to ${emailToUse}. Please check your inbox.`)
      }
    } catch (err) {
      console.error('Exception resending verification email:', err)
      setMessage("An error occurred while resending the verification email.")
    } finally {
      setResendLoading(false)
    }
  }

  // Display database error if present
  useEffect(() => {
    if (error) {
      console.log("Auth error detected:", error)
      
      const errorMessage = getErrorMessage(error)
      
      if (errorMessage.includes("Database error")) {
        console.log("Database error detected during sign up, checking user auth status")
        // If we got a database error during signup, we should check if the user exists in auth
        // but just couldn't be added to the profiles table
        checkUserAfterDatabaseError()
      } else {
        // For any other errors, redirect to error page
        router.push(`/auth/error?error=${encodeURIComponent(errorMessage)}`)
      }
    }
  }, [error, router])

  const checkUserAfterDatabaseError = async () => {
    try {
      console.log("Starting check for user after database error")
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error checking session after database error:", sessionError)
        return
      }
      
      console.log("Session check result after database error:", sessionData)
      
      if (sessionData?.session?.user) {
        // The user exists in auth but had a profile error
        console.log("User exists in auth despite database error, redirecting to profile setup")
        
        // Set flag in localStorage to indicate auth error
        if (typeof window !== 'undefined') {
          localStorage.setItem("auth_profile_error", "true")
        }
        router.push('/profile/setup')
      } else {
        console.log("No authenticated user found after database error")
        setMessage("Please verify your email to continue.")
      }
    } catch (err) {
      console.error("Exception in checkUserAfterDatabaseError:", err)
    }
  }

  // Get error message for display
  const errorDisplayMessage = error ? getErrorMessage(error) : ""
  // Check if error message has special flags
  const isWarningError = errorDisplayMessage.includes("Note:") || 
                        errorDisplayMessage.includes("Database error") || 
                        errorDisplayMessage.includes("profile")

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authenticating</CardTitle>
          <CardDescription>
            Please wait while we authenticate your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">{message}</p>
          
          {error && (
            <div className={`w-full p-3 ${isWarningError ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"} rounded-md text-sm`}>
              {errorDisplayMessage}
              {!isWarningError && (
                <Button 
                  className="mt-2 w-full" 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/auth/signup")}
                >
                  Return to signup
                </Button>
              )}
              {(errorDisplayMessage.includes("Database error") || errorDisplayMessage.includes("profile")) && (
                <p className="mt-2 font-semibold">You'll be redirected to complete your profile in a moment.</p>
              )}
            </div>
          )}
          
          {waitTime > 8 && !user && (
            <div className="w-full mt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={checkAuthStatus}
                disabled={checkingSession}
              >
                {checkingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Authentication Status
                  </>
                )}
              </Button>
              
              {waitTime > 12 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resendVerificationEmail}
                  disabled={resendLoading || emailResent}
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : emailResent ? (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {waitTime > 20 && (
            <Button 
              variant="link"
              onClick={() => router.push("/auth/login")}
              className="text-sm"
            >
              Return to login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 