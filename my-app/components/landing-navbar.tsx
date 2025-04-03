"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown, Home } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background py-1">
      <div className="max-w-4xl mx-auto px-2">
        <div className="rounded-full bg-zinc-800/90 backdrop-blur px-2 py-1 flex items-center">
          <div className="flex-1 flex items-center justify-start space-x-2">
            {/* Home Link */}
            <Link href="/" className="text-white/90 hover:text-white px-2 py-1 text-sm font-medium flex items-center">
              <Home className="mr-1 h-3 w-3" />
              Home
            </Link>
            
            {/* Projects Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-white/90 hover:text-white px-2 py-1 text-sm font-medium flex items-center focus:outline-none">
                Projects
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem>
                  <Link href="/projects" className="w-full">
                    Browse All Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/projects?filter=featured" className="w-full">
                    Featured Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/projects?filter=recent" className="w-full">
                    Recently Added
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Funding Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-white/90 hover:text-white px-2 py-1 text-sm font-medium flex items-center focus:outline-none">
                Funding
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem>
                  <Link href="/funding/opportunities" className="w-full">
                    Opportunities
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/funding/investors" className="w-full">
                    Investors
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/funding/grants" className="w-full">
                    Grants
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Builders Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-white/90 hover:text-white px-2 py-1 text-sm font-medium flex items-center focus:outline-none">
                Builders
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem>
                  <Link href="/users" className="w-full">
                    Find Collaborators
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/users?filter=developers" className="w-full">
                    Developers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/users?filter=designers" className="w-full">
                    Designers
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 flex items-center justify-end space-x-2">
            {/* Login */}
            <Link href="/auth/login" className="text-white/90 hover:text-white px-2 py-1 text-sm font-medium">
              Log In
            </Link>

            {/* Sign Up */}
            <Button size="sm" className="bg-white text-zinc-900 hover:bg-white/90 h-7 px-2 text-xs" asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

