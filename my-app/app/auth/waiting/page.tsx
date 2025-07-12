"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import {
  Alert,
  AlertDescription
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Mail,
  AlertCircle,
  LogOut,
  Home,
  CheckCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  motion,
  AnimatePresence,
  Variants,
  Transition
} from "framer-motion"
import type {
  AuthChangeEvent,
  Session
} from "@supabase/supabase-js"
import { Card, CardContent } from "@/components/ui/card"
import { set } from "date-fns"

const MAX_WAIT_TIME = 120000 // 2 min

export default function AuthWaitingPage() {
  const router = useRouter()
  const { authUser, profile, signOut } = useAuth()

  /* ─────────────────── Local state ─────────────────── */
  const [message, setMessage] = useState(
    "Please verify your email to continue..."
  )
  const [userEmail, setUserEmail] = useState<string | null>(
    null
  )
  const [resendLoading, setResendLoading] = useState(false)
  const [emailResent, setEmailResent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  )
  const [isVerified, setIsVerified] = useState(false)
  const [timeoutExceeded, setTimeoutExceeded] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const checkInterval = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  /* ───────────── First-mount initialisation ─────────── */
  useEffect(() => {
    localStorage.removeItem("emailVerified") 
    sessionStorage.setItem("awaitingVerification", "true")

    const storedEmail = localStorage.getItem("lastSignupEmail")
    if (storedEmail) {
      setUserEmail(storedEmail)
      setMessage(
        `Please verify your email (${storedEmail}) to continue...`
      )
    }

    timeoutRef.current = setTimeout(() => {
      setTimeoutExceeded(true)
      if (checkInterval.current) clearInterval(checkInterval.current)
    }, MAX_WAIT_TIME)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  /* ───────────── Auth-state listener (no UI change) ───────────── */
  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, _session: Session | null) => {
        
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  /* ─────────── Manual “check verification” button ─────────── */
  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession() 

      if (
        data.session?.user?.email_confirmed_at &&
        data.session.user.email === userEmail 
      ) {
        localStorage.setItem("emailVerified", "true") 
        setIsVerified(true)
        setMessage(
          "Email verified! Click below to continue to profile setup."
        )
      } else {
        setMessage("Email not verified yet. Please check your inbox.")
      }
    } catch (err) {
      console.error("Error checking verification:", err)
    } finally {
      setIsChecking(false)
    }
  }

  /* ─────────── Polling + storage-event listener ─────────── */
  useEffect(() => {
    let startTime = Date.now()
    let mounted = true

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "emailVerified" &&
        e.newValue === "true" &&
        mounted
      ) {
        setIsVerified(true)
        setMessage(
          "Email verified! Click below to continue to profile setup."
        )
      }
    }

    window.addEventListener("storage", handleStorageChange)

    const poll = async () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession() 

        if (
          data.session?.user?.email_confirmed_at &&
          data.session.user.email === userEmail 
        ) {
          localStorage.setItem("emailVerified", "true") 
          setIsVerified(true)
          setMessage(
            "Email verified! Click below to continue to profile setup."
          )
        }
      } catch {
        /* ignore */
      }
    }

    poll()
    checkInterval.current = setInterval(poll, 3000)

    return () => {
      mounted = false
      if (checkInterval.current) clearInterval(checkInterval.current)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [userEmail])

  /* ─────────── Resend + sign-out helpers  ─────────── */
  const handleResendVerification = async () => {
    if (!userEmail) return
    try {
      setResendLoading(true)
      setErrorMessage(null)

      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) setErrorMessage(error.message)
      else {
        setEmailResent(true)
        setMessage(
          `Verification email resent to ${userEmail}. Please check your inbox.`
        )
      }
    } catch {
      setErrorMessage("Failed to resend verification email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignOut = async () => {
    sessionStorage.removeItem("awaitingVerification")
    localStorage.removeItem("emailVerified")
    await signOut()
    localStorage.removeItem("lastSignupEmail")
    router.push("/")
  }

  /* ─────────── Animation helpers ─────────── */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  }
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 12 } as Transition
    }
  }
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 2, repeat: Infinity, repeatType: "loop" as const }
    }
  }

  const getTimeMessage = () =>
    elapsedTime < 30
      ? "This usually takes less than a minute..."
      : elapsedTime < 60
      ? "Still waiting for verification..."
      : "Taking longer than expected. Make sure to check your spam folder."

  /* ─────────── Render UI ─────────── */
  return (
    <motion.div
      className="container flex justify-center items-center min-h-[80vh] py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <AnimatePresence mode="wait">
        {/* TIMEOUT CARD */}
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
                <h1 className="text-2xl font-bold mb-2">
                  Verification Timeout
                </h1>
                <p className="text-muted-foreground mb-6">
                  We haven't detected your email verification yet. You can:
                </p>
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={handleResendVerification}
                  >
                    Try Resending the Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sign Out and Try Again Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : isVerified ? (
          /* VERIFIED CARD */
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
                <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
                <p className="text-muted-foreground mb-6">
                  Great! Click below to continue to profile setup.
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = "/profile/setup") /* CHANGED */
                  }
                >
                  Go to Profile Setup
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* WAITING CARD */
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
                  <h1 className="text-2xl font-bold mb-2">
                    Verify Your Email
                  </h1>
                  <p className="text-muted-foreground mb-2">{message}</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {getTimeMessage()}
                  </p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground mb-4">
                      💡 You'll need to verify your email before you can access
                      all features.
                    </p>
                  )}
                </motion.div>

                {errorMessage && (
                  <motion.div variants={itemVariants}>
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errorMessage}
                      </AlertDescription>
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
                      {resendLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
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

                    <Button variant="outline" className="flex-1" asChild>
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
                        animate={{
                          width: `${Math.min(
                            100,
                            (elapsedTime / (MAX_WAIT_TIME / 1000)) * 100
                          )}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <p>
                    Once your email is verified, you'll be automatically
                    redirected.
                  </p>
                  <p className="mt-2">
                    Make sure to check your spam folder if you don't see the
                    email.
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
