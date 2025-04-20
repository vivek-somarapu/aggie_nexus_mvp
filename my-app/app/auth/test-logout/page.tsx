"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function TestLogoutPage() {
  const { user, profile, signOut } = useAuth()
  const [logoutStatus, setLogoutStatus] = useState("")
  
  const handleLogout = async () => {
    try {
      setLogoutStatus("Logging out...")
      await signOut()
      setLogoutStatus("Logout complete! Redirecting...")
    } catch (error) {
      console.error("Error during logout:", error)
      setLogoutStatus(`Logout failed: ${error}`)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Logout Functionality</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Current Auth State:</h2>
        <p>User ID: {user?.id || "Not logged in"}</p>
        <p>Email: {user?.email || "N/A"}</p>
        <p>Profile Name: {profile?.full_name || "N/A"}</p>
      </div>
      
      <Button onClick={handleLogout} variant="destructive" className="mt-4">
        Test Sign Out
      </Button>
      
      {logoutStatus && (
        <div className="mt-4 p-4 bg-slate-100 rounded">
          <p>{logoutStatus}</p>
        </div>
      )}
    </div>
  )
} 