'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function EmailVerifiedPage() {
  // let the “waiting” tab know we’re done
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emailVerified', 'true')
      sessionStorage.removeItem('awaitingVerification')
    }
    const supabase = createClient()
    supabase.auth.getSession().catch(() => {
        
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-6">
        Your account has been verified!
      </h1>

      <Link
        href="/auth/login"
        className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
      >
        Click here to return to the login page
      </Link>
    </div>
  )
}
