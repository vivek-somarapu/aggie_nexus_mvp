"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { hasJustLoggedIn } from "@/lib/profile-utils"

/**
 * Component that handles auth-related redirects
 * Including directing users to complete profile setup if needed
 */
export default function AuthRedirect() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // Skip checks if no user or already on setup page
    if (!user || pathname === '/profile/setup' || pathname.startsWith('/auth/')) {
      setIsChecking(false)
      return
    }
    
    const checkProfileStatus = async () => {
      try {
        // Check if user just logged in - this is critical for determining if we should show
        // the profile setup page again for users who previously skipped it
        const justLoggedIn = hasJustLoggedIn(user);
        
        // Add cache-busting parameter to avoid stale data
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/auth/profile-status?_t=${timestamp}&just_logged_in=${justLoggedIn}`, {
          headers: { 'Cache-Control': 'no-cache' },
        })
        
        if (!response.ok) {
          console.error('Failed to check profile status:', response.statusText)
          setIsChecking(false)
          return
        }
        
        const data = await response.json()
        
        // If user should setup profile, redirect them unless already on setup page
        if (data.shouldSetupProfile && pathname !== '/profile/setup') {
          router.push('/profile/setup')
        } else {
          setIsChecking(false)
        }
      } catch (err) {
        console.error('Error checking profile status:', err)
        setIsChecking(false)
      }
    }
    
    checkProfileStatus()
  }, [user, pathname, router])
  
  // Return null - this component is just for handling redirects
  return null
} 