"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

export default function AuthRedirect() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user || isChecking) return
      
      try {
        setIsChecking(true)
        
        // Call our API to check if the user needs profile setup
        const response = await fetch("/api/auth/profile-status")
        const data = await response.json()
        
        if (data.shouldSetupProfile) {
          // User needs to complete their profile
          router.push("/profile/setup")
        }
      } catch (error) {
        console.error("Error checking profile status:", error)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkProfileStatus()
  }, [user, router, isChecking])
  
  // This component doesn't render anything visible
  return null
} 