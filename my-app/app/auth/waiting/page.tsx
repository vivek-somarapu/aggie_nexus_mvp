"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, AlertCircle, LogOut, Home, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

// Maximum waiting time (2 minutes) in milliseconds
const MAX_WAIT_TIME = 120000

export default function AuthWaitingPage() {
  const router = useRouter()
  const { user, profile, isLoading, signOut } = useAuth()
  const [message, setMessage] = useState("Please verify your email to continue...")
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastSignupEmail")
    }
    return null
  })
  const [resendLoading, setResendLoading] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [timeoutExceeded, setTimeoutExceeded] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const checkInterval = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Initialize verification flag in sessionStorage and set timeout
  useEffect(() => {
    if (userEmail) {
      setMessage(`Please verify your email (${userEmail}) to continue...`)
    }
    
    // Set verification flag in sessionStorage to handle tab redirection
    sessionStorage.setItem("awaitingVerification", "true")
    
    // Set timeout to prevent endless waiting
    timeoutRef.current = setTimeout(() => {
      setTimeoutExceeded(true)
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
        checkInterval.current = null
      }
    }, MAX_WAIT_TIME)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Handle manual verification check
  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        // Ignore AuthSessionMissingError as it's expected when session is being created
        if (error.name !== "AuthSessionMissingError") {
          console.error("Error refreshing session:", error)
        } else {
          setMessage("Please sign in first to verify your email")
        }
        return
      }
      
      if (data.user?.email_confirmed_at) {
        setIsVerified(true)
        setMessage("Email verified! Redirecting you...")
        setIsRedirecting(true)
        
        // Signal to other tabs that verification is complete
        localStorage.setItem("emailVerified", "true")
        
        // Remove verification flag from sessionStorage
        sessionStorage.removeItem("awaitingVerification")
        
        setTimeout(() => {
          if (profile && profile.bio && profile.skills?.length) {
            router.push("/")
          } else {
            router.push("/profile/setup")
          }
        }, 1500)
      } else {
        setMessage(`Email not verified yet. Please check your inbox.`)
      }
    } catch (err) {
      console.error("Error checking verification:", err)
    } finally {
      setIsChecking(false)
    }
  }

  // Set up polling to check verification status
  useEffect(() => {
    let startTime = Date.now()
    let isMounted = true
    
    // Check for inbound verification from another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emailVerified" && e.newValue === "true" && isMounted) {
        setIsVerified(true)
        setMessage("Email verified! Redirecting you...")
        setIsRedirecting(true)
        
        if (checkInterval.current) {
          clearInterval(checkInterval.current)
          checkInterval.current = null
        }
        
        // Short delay then redirect
        setTimeout(() => {
          router.push(profile && profile.bio && profile.skills?.length ? "/" : "/profile/setup")
        }, 1500)
      }
    }
    
    // Add storage listener for cross-tab communication
    window.addEventListener("storage", handleStorageChange)
    
    if (!user && !userEmail) {
      // If no user and no email, redirect to login
      router.push("/auth/login")
      return () => {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
    
    // Get user email for display if available from user object
    if (user && user.email && !userEmail) {
      setUserEmail(user.email)
    }
    
    // Function to check if email is verified
    const checkEmailVerification = async () => {
      // Update elapsed time for UI feedback
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      
      try {
        const supabase = createClient()
        
        // Refresh the session to get the latest user data
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          // Ignore AuthSessionMissingError as it's expected when session is being created
          if (error.name !== "AuthSessionMissingError") {
            console.error("Error refreshing session:", error)
          }
          return
        }
        
        // If email is confirmed, redirect based on profile status
        if (data.user?.email_confirmed_at) {
          setIsVerified(true)
          setMessage("Email verified! Redirecting you...")
          setIsRedirecting(true)
          
          // Clear the interval
          if (checkInterval.current) {
            clearInterval(checkInterval.current)
            checkInterval.current = null
          }
          
          // Signal to other tabs that verification is complete
          localStorage.setItem("emailVerified", "true")
          
          // Remove verification flag from sessionStorage
          sessionStorage.removeItem("awaitingVerification")
          
          // Check if profile is complete
          setTimeout(() => {
            if (profile && profile.bio && profile.skills && profile.skills.length > 0) {
              router.push("/")
            } else {
              router.push("/profile/setup")
            }
          }, 1500) // Small delay for better UX
        }
      } catch (err) {
        console.error("Error checking email verification:", err)
      }
    }
    
    // Check immediately and then set up interval
    checkEmailVerification()
    
    // Set up interval to check every 3 seconds (slightly faster than before)
    checkInterval.current = setInterval(checkEmailVerification, 3000)
    
    // Clean up on unmount
    return () => {
      isMounted = false
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [user, profile, router, userEmail])

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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      // Remove verification flags
      sessionStorage.removeItem("awaitingVerification")
      localStorage.removeItem("emailVerified")
      
      await signOut()
      // Clear local storage
      localStorage.removeItem("lastSignupEmail")
      // Redirect to home page after sign out
      router.push("/")
    } catch (err) {
      console.error("Error signing out:", err)
      setErrorMessage("Error signing out. Please try again.")
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 12 }
    }
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const
      }
    }
  }

  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  }

  // Get a tailored message based on elapsed time
  const getTimeMessage = () => {
    if (elapsedTime < 30) {
      return "This usually takes less than a minute..."
    } else if (elapsedTime < 60) {
      return "Still waiting for verification..."
    } else {
      return "Taking longer than expected. Make sure to check your spam folder."
    }
  }

  return (
    <motion.div 
      className="container flex justify-center items-center min-h-[80vh] py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AnimatePresence mode="wait">
        {timeoutExceeded ? (
          <motion.div 
            className="w-full max-w-md"
            key="timeout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-border/50 shadow-md">
              <CardContent className="pt-6 pb-6 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Verification Timeout</h1>
                <p className="text-muted-foreground mb-6">
                  We haven't detected your email verification yet. You can:
                </p>
                <div className="space-y-4">
                  <Button className="w-full" onClick={handleResendVerification}>
                    Try Resending the Email
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    Sign Out and Try Again Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : isVerified ? (
          <motion.div 
            className="w-full max-w-md"
            key="verified"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-border/50 shadow-md overflow-hidden">
              <motion.div 
                className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1 }}
              />
              <CardContent className="pt-6 pb-6 text-center">
                <motion.div 
                  className="rounded-full p-2 bg-green-100 dark:bg-green-900/30 w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: 1 }}
                >
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-6">
                  Redirecting you to set up your profile...
                </p>
                <motion.div 
                  className="flex justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="w-full max-w-md"
            key="waiting"
            variants={containerVariants}
          >
            <Card className="border-border/50 shadow-md">
              <CardContent className="pt-6 pb-6 text-center">
                <motion.div variants={itemVariants}>
                  <motion.div 
                    className="rounded-full p-3 bg-primary/10 w-24 h-24 mx-auto mb-4 flex items-center justify-center"
                    variants={pulseVariants}
                    animate="pulse"
                  >
                    <Mail className="h-12 w-12 text-primary" />
                  </motion.div>
                  <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-muted-foreground mb-2">
                    {message}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {getTimeMessage()}
                  </p>
                </motion.div>
                
                {errorMessage && (
                  <motion.div variants={itemVariants}>
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                
                <motion.div variants={itemVariants} className="space-y-4">
                  {!emailResent ? (
                    <Button 
                      onClick={handleResendVerification} 
                      className="w-full" 
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
                  
                  <div className="flex gap-4 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Return Home
                      </Link>
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleManualCheck} 
                    variant="secondary" 
                    className="w-full mt-4" 
                    disabled={isChecking || !userEmail}
                  >
                    {isChecking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Check Verification Status
                  </Button>
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  className="mt-8 text-sm text-muted-foreground"
                >
                  <div className="flex justify-center mb-4">
                    <div className="relative h-1 w-32 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute left-0 top-0 h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(100, (elapsedTime / (MAX_WAIT_TIME/1000)) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  <p>Once your email is verified, you'll be automatically redirected.</p>
                  <p className="mt-2">
                    Make sure to check your spam folder if you don't see the email.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 