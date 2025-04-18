"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

/**
 * Component that automatically handles auth redirects
 * This should be used in layouts that need to check profile status
 * and redirect accordingly
 */
export default function AuthRedirect() {
  const { user, profile, isLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [checkAttempts, setCheckAttempts] = useState(0)

  useEffect(() => {
    // Skip if not authenticated, still loading, or already checking
    if (!user || isLoading || isChecking) {
      return
    }
    
    // Prevent infinite loops - only try checking profile status 3 times
    if (checkAttempts >= 3) {
      console.error("Max profile check attempts reached, stopping to prevent infinite loop")
      return
    }
    
    const checkProfileStatus = async () => {
      try {
        setIsChecking(true)
        
        // If we have the profile data in context, use it
        if (profile) {
          // Check if profile needs setup
          if (!profile.bio || !profile.skills || profile.skills.length === 0) {
            router.push("/profile/setup")
            return
          }
          return
        }
        
        // Try refreshing the profile if we don't have it
        if (!profile) {
          await refreshProfile()
          setCheckAttempts(prev => prev + 1)
          return
        }
        
        // Fallback: Call API to check profile status if profile not in context
        const response = await fetch("/api/auth/profile-status")
        
        if (!response.ok) {
          console.error("Error fetching profile status:", await response.text())
          return
        }
        
        const data = await response.json()
        
        if (data.shouldSetupProfile) {
          router.push("/profile/setup")
        }
      } catch (error) {
        console.error("Error checking profile status:", error)
      } finally {
        setIsChecking(false)
      }
    }
    
    // Set timeout to prevent blocking the UI
    const timeoutId = setTimeout(checkProfileStatus, 100)
    
    return () => clearTimeout(timeoutId)
  }, [user, profile, router, isLoading, isChecking, refreshProfile, checkAttempts])
  
  // This component doesn't render anything visible
  return null
} 