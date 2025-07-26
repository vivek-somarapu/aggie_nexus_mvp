"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Settings,
  User as UserIcon,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { inquiryService } from "@/lib/services/inquiry-service";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, signOut, isLoading, isManager } = useAuth();
  const [pendingInquiries, setPendingInquiries] = useState(0);
  const [openNavigation, setOpenNavigation] = useState(false);
  const toggleNavigation = () => {
    setOpenNavigation(!openNavigation);
  };

  // Load pending inquiries
  useEffect(() => {
    if (!authUser) return;
    const supabase = createClient();

    const fetchCount = async () => {
      try {
        const count = await inquiryService.getPendingInquiriesCount(
          authUser.id
        );
        setPendingInquiries(count);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCount();
    const channel = supabase
      .channel("project_applications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_applications" },
        fetchCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  const handleLogout = async () => {
    setOpenNavigation(false);

    await signOut();

    router.push("/");
  };

  // Common routes for signed-in users
  const routes = [
    { href: "/projects", label: "Projects" },
    { href: "/users", label: "Community" },
    { href: "/calendar", label: "Events" },
  ];

  const hasResolvedOnce = useRef(false);
  if (!hasResolvedOnce.current && !isLoading) {
    hasResolvedOnce.current = true;
  }
  // Block *only* before the first auth check finishes
  if (!hasResolvedOnce.current) {
    return null; // or a full-screen spinner if you prefer
  }

  // AUTHENTICATED navbar
  return (
    <>
      {/* ---------- TOP BAR ---------- */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 dark:bg-[#0e0e0e]/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#262626] px-4 py-3">
        <div className="flex w-full items-center justify-between px-0 sm:px-4 text-muted-foreground dark:text-white">
          {/* Left: Logo + menu */}
          <div className="flex items-center gap-0 md:gap-4">
            {/* Menu Button (mobile only) */}
            <button
              className="flex items-center justify-center w-10 h-10 md:hidden text-muted-foreground dark:text-white"
              onClick={toggleNavigation}
            >
              <svg
                className="overflow-visible"
                width="20"
                height="20"
                viewBox="0 0 20 12"
              >
                <rect
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                  className={`transition-transform fill-current ${
                    openNavigation ? "rotate-45 translate-y-2" : ""
                  }`}
                  y="0"
                  width="20"
                  height="2"
                  rx="1"
                />
                <rect
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                  className={`transition-transform fill-current ${
                    openNavigation ? "-rotate-45 -translate-y-0.5" : ""
                  }`}
                  y="10"
                  width="20"
                  height="2"
                  rx="1"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              {/* dark-mode logo */}
              <div className="relative w-24 sm:w-28 md:w-32 h-6 sm:h-7 md:h-8 dark:block hidden">
                <Image
                  src="/images/logo_png_white.png"
                  alt="Aggie Nexus"
                  fill
                  priority
                  sizes="(max-width: 640px) 96px,
                    (max-width: 768px) 112px,
                    128px"
                  className="object-contain"
                />
              </div>

              {/* light-mode logo */}
              <div className="relative w-24 sm:w-28 md:w-32 h-6 sm:h-7 md:h-8 dark:hidden block">
                <Image
                  src="/images/AggieNexus_LogoHorizontal.png"
                  alt="Aggie Nexus"
                  fill
                  priority
                  sizes="(max-width: 640px) 96px,
                    (max-width: 768px) 112px,
                    128px"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Center nav (md+) */}
          {!authUser ? (
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <Link
                href="/calendar"
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                  "text-muted-foreground dark:text-white dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-accent-foreground"
                )}
              >
                Events
              </Link>
            </nav>
          ) : (
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <ul className="flex gap-6">
                {routes.map((route) => {
                  const isActive =
                    pathname === route.href ||
                    pathname.startsWith(route.href + "/");
                  return (
                    <li key={route.href}>
                      <Link
                        href={route.href}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          isActive
                            ? "bg-accent text-accent-foreground dark:bg-[#262626] dark:text-white"
                            : "text-muted-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-accent-foreground dark:hover:text-white"
                        )}
                      >
                        {route.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Right side */}
          {!authUser ? (
            <div className="flex-1 uppercase flex justify-end space-x-4">
              <Button variant="ghost" size="sm" className="px-5" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="
                  bg-gradient-to-r 
                  from-[#c80404] to-[#100404]
                  dark:from-[#440404] dark:to-[#940404] 
                  hover:from-[#d91515] hover:to-[#1a0a0a]
                  dark:hover:from-[#550505] dark:hover:to-[#a50505]
                  text-white
                  font-semibold
                  transition-colors
                  px-5
                "
              >
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-end space-x-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden md:inline-flex bg-[#500000] text-white hover:bg-[#500000]/90 hover:text-white"
              >
                <Link href="/projects/new">Create Project</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar || ""}
                        alt={profile?.full_name || ""}
                      />
                      <AvatarFallback>
                        {profile?.full_name ? (
                          profile.full_name.charAt(0)
                        ) : (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {authUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile?tab=inquiries"
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <MessageSquare className="mr-4 h-4 w-4" />
                        Project Inquiries
                      </div>
                      {pendingInquiries > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 px-1 py-0 h-5 min-w-5 flex items-center justify-center rounded-full"
                        >
                          {pendingInquiries}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=bookmarks" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=events" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      Events
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
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
                        <Link
                          href="/manager/projects"
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Project Management
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* ---------- MOBILE OVERLAY ---------- */}
      {openNavigation && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#0e0e0e] md:hidden flex flex-col">
          <button
            onClick={toggleNavigation}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-muted-foreground dark:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <line
                x1="0"
                y1="0"
                x2="20"
                y2="20"
                className="stroke-current dark:stroke-current"
                strokeWidth="2"
              />
              <line
                x1="20"
                y1="0"
                x2="0"
                y2="20"
                className="stroke-current dark:stroke-current"
                strokeWidth="2"
              />
            </svg>
          </button>

          <nav className="flex flex-1 items-center justify-center">
            <ul className="flex flex-col items-center gap-8 text-lg">
              {!authUser ? (
                <li key="/calendar">
                  <Link
                    href="/calendar"
                    className={cn(
                      "px-6 py-3 rounded-md font-medium transition-colors hover:text-primary focus:outline-none focus:ring-1",
                      pathname === "/calendar"
                        ? "bg-accent text-accent-foreground dark:bg-[#262626] dark:text-white"
                        : "text-muted-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-accent-foreground dark:hover:text-white"
                    )}
                    onClick={() => setOpenNavigation(false)}
                  >
                    Events
                  </Link>
                </li>
              ) : (
                <>
                  <li key="create-project">
                    <Link
                      href="/projects/new"
                      className={cn(
                        "px-6 py-3 rounded-md font-medium transition-colors",
                        "text-muted-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-accent-foreground dark:hover:text-white"
                      )}
                      onClick={() => setOpenNavigation(false)}
                    >
                      Create Project
                    </Link>
                  </li>
                  {routes.map((route) => {
                    const isActive =
                      pathname === route.href ||
                      pathname.startsWith(route.href + "/");
                    return (
                      <li key={route.href}>
                        <Link
                          href={route.href}
                          className={cn(
                            "px-6 py-3 rounded-md font-medium transition-colors focus:outline-none focus:ring-1",
                            isActive
                              ? "bg-accent text-accent-foreground dark:bg-[#262626] dark:text-white"
                              : "text-muted-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-accent-foreground dark:hover:text-white"
                          )}
                          onClick={() => setOpenNavigation(false)}
                        >
                          {route.label}
                        </Link>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
