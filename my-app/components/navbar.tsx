"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Menu, Settings, User, ClipboardCheck, Calendar, Users, FileText, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { inquiryService } from "@/lib/services/inquiry-service"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, isManager } = useAuth()
  const [pendingInquiries, setPendingInquiries] = useState(0)

  const handleLogout = async () => {
    try {
      await signOut()
      // No need to add a router.push as the signOut function already handles navigation
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Fetch pending inquiries count
  useEffect(() => {
    if (!user) return
    
    const fetchPendingInquiries = async () => {
      try {
        const count = await inquiryService.getPendingInquiriesCount(user.id)
        setPendingInquiries(count)
      } catch (err) {
        console.error("Error fetching pending inquiries:", err)
      }
    }
    
    fetchPendingInquiries()
    
    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('project_applications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_applications'
      }, () => {
        fetchPendingInquiries()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const routes = [
    {
      href: "/projects",
      label: "Projects",
      active: pathname === "/projects" || pathname.startsWith("/projects/"),
    },
    {
      href: "/users",
      label: "Users",
      active: pathname === "/users" || pathname.startsWith("/users/"),
    },
    {
      href: "/calendar",
      label: "Calendar",
      active: pathname === "/calendar" || pathname.startsWith("/calendar/"),
    },
  ]

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 w-full items-center px-4">
        <div className="flex flex-1 items-center justify-between md:justify-start">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2">
                  <img 
                    src="/images/logo_png_white.png" 
                    alt="Aggie Nexus" 
                    width="110" 
                    height="28" 
                    className="object-contain dark:block hidden" 
                  />
                  <img 
                    src="/images/AggieNexus_LogoHorizontal.png" 
                    alt="Aggie Nexus" 
                    width="110" 
                    height="28" 
                    className="object-contain dark:hidden block" 
                  />
                </Link>
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn("flex items-center gap-2 text-muted-foreground", route.active && "text-foreground")}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/images/logo_png_white.png" 
              alt="Aggie Nexus" 
              width="120" 
              height="30" 
              className="object-contain dark:block hidden" 
            />
            <img 
              src="/images/AggieNexus_LogoHorizontal.png" 
              alt="Aggie Nexus" 
              width="120" 
              height="30" 
              className="object-contain dark:hidden block" 
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
          <ul className="flex items-center space-x-1">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    route.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/projects/new">Create Project</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar || ""} alt={profile?.full_name || ""} />
                  <AvatarFallback>
                    {profile?.full_name ? profile.full_name.charAt(0) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || ""}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {/* Project Inquiries for all users - now in profile page */}
              <DropdownMenuItem asChild>
                <Link href="/profile?tab=inquiries" className="cursor-pointer flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Project Inquiries
                  </div>
                  {pendingInquiries > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                      {pendingInquiries}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
              {isManager && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/manager/events" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      Event Management
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/manager/users" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      User Management
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/manager/projects" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      Project Management
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}