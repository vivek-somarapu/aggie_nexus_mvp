"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, GraduationCap, Loader2, Info, Building2, ExternalLink, UsersIcon, Filter } from "lucide-react"
import { User } from "@/lib/models/users"
import { userService, UserSearchParams } from "@/lib/services/user-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { organizationService, Organization } from "@/lib/services/organization-service"
import { useAuth } from "@/lib"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { CardTitle } from "@/components/ui/card"
import { industryOptions } from "@/lib/constants"

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 } 
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      damping: 15, 
      stiffness: 100
    } 
  }
}

export default function UsersPage() {
  const { authUser: currentUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // Email verification is now handled server-side in middleware
  
  const [users, setUsers] = useState<User[]>([])
  const [bookmarkedUsers, setBookmarkedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [skillFilter, setSkillFilter] = useState("all")
  const [tamuFilter, setTamuFilter] = useState("all")
  const [filtersOpen, setFiltersOpen] = useState(true)

  // Organizations state for carousel
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])

  // Fetch organizations for carousel
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await organizationService.getOrganizations({ sort: 'name', order: 'asc' });
        setAllOrganizations(orgs);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        // Don't show error for organizations, just log it
      }
    };

    fetchOrganizations();
  }, []);

  // Fetch users once auth state is resolved
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    // Check if we already fetched data
    if (dataFetched) return;
    
    const fetchUsersAndOrganizations = async () => {
      try {
        console.log("Fetching users and organizations data...");
        setIsLoading(true);
        setError(null);
        
        const searchParams: UserSearchParams = {};
        
        if (tamuFilter === "tamu") {
          searchParams.tamu = true;
        } else if (tamuFilter === "non-tamu") {
          searchParams.tamu = false;
        }
        
        if (searchQuery) {
          searchParams.search = searchQuery;
        }
        
        if (skillFilter !== "all") {
          searchParams.skill = skillFilter;
        }
        
        const fetchedUsers = await userService.getUsers(searchParams);
        setUsers(fetchedUsers);
        setDataFetched(true);
        console.log(`Successfully loaded ${fetchedUsers.length} users`);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsersAndOrganizations();
  }, [authLoading, dataFetched, searchQuery, tamuFilter, skillFilter]);
  
  // Re-fetch when filters change
  useEffect(() => {
    // Skip if auth is still loading or we haven't done initial data fetch
    if (authLoading || !dataFetched) return;
    
    const fetchFilteredData = async () => {
      try {
        console.log("Fetching filtered users and organizations data...");
        setIsLoading(true);
        setError(null);
        
        const searchParams: UserSearchParams = {};
        
        if (tamuFilter === "tamu") {
          searchParams.tamu = true;
        } else if (tamuFilter === "non-tamu") {
          searchParams.tamu = false;
        }
        
        if (searchQuery) {
          searchParams.search = searchQuery;
        }
        
        if (skillFilter !== "all") {
          searchParams.skill = skillFilter;
        }
        
        const fetchedUsers = await userService.getUsers(searchParams);
        setUsers(fetchedUsers);
        
        // Filter organizations
        const orgSearchParams: { search?: string; sort?: string; order?: 'asc' | 'desc' } = {
          sort: 'name',
          order: 'asc'
        };
        
        if (searchQuery) {
          orgSearchParams.search = searchQuery;
        }
        
        const fetchedOrgs = await organizationService.getOrganizations(orgSearchParams);
        setAllOrganizations(fetchedOrgs);
      } catch (err) {
        console.error("Error fetching data with filters:", err);
        setError("Failed to apply filters. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilteredData();
  }, [searchQuery, tamuFilter, skillFilter, authLoading, dataFetched]);
  
  // Fetch bookmarked users if user is logged in
  useEffect(() => {
    // Skip if no user or auth still loading
    if (!currentUser || authLoading) return;
    
    const fetchBookmarks = async () => {
      try {
        console.log("Fetching user bookmarks...");
        const bookmarks = await bookmarkService.getUserBookmarks(currentUser.id);
        setBookmarkedUsers(bookmarks.map(bookmark => bookmark.bookmarked_user_id));
        console.log(`Loaded ${bookmarks.length} bookmarked users`);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        // Don't set the main error as this is not critical
      }
    };
    
    fetchBookmarks();
  }, [currentUser, authLoading]);
  
  const handleBookmarkToggle = async (userId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigating to user detail
    
    if (!currentUser) {
      // If not logged in, redirect to login
      router.push('/auth/login?redirect=/users');
      return;
    }
    
    try {
      setIsBookmarkLoading(true);
      const isBookmarked = await bookmarkService.toggleUserBookmark(currentUser.id, userId);
      
      if (isBookmarked) {
        setBookmarkedUsers(prev => [...prev, userId]);
      } else {
        setBookmarkedUsers(prev => prev.filter(id => id !== userId));
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // Get all unique industries and skills from users
  const industries = industryOptions;
  const skills = Array.from(new Set(users.flatMap((user) => user.skills || [])));

  // Filter users based on filters
  const filteredUsers = users.filter((user: User) => {
    // Filter by industry
    const matchesIndustry = 
      industryFilter === "all" || 
      (user.industry && user.industry.includes(industryFilter));
    
    return matchesIndustry;
  });

  // Filter organizations based on filters
  const filteredOrganizations = allOrganizations.filter((org: Organization) => {
    // Filter by TAMU affiliation
    const matchesTamu = 
      tamuFilter === "all" || 
      (tamuFilter === "tamu" && org.is_texas_am_affiliate) ||
      (tamuFilter === "non-tamu" && !org.is_texas_am_affiliate);
    
    // Filter by industry
    const matchesIndustry = 
      industryFilter === "all" || 
      (org.industry && org.industry.includes(industryFilter));
    
    return matchesTamu && matchesIndustry;
  });
  
  // Log filtering results for debugging
  useEffect(() => {
    if (dataFetched) {
      console.log(`Filtering users: ${users.length} total, ${filteredUsers.length} after filters`);
      console.log(`Filters: tamu=${tamuFilter}, industry=${industryFilter}, skill=${skillFilter}`);
    }
  }, [filteredUsers, users, tamuFilter, industryFilter, skillFilter, dataFetched]);

  // If auth is still loading or user is not authenticated, show loading state
  if (authLoading || !currentUser) {
    return (
      <motion.div
        className="flex flex-col justify-center items-center py-12 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-lg font-medium">Checking authentication...</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative"
        >
          {/* Blue accent background for talent */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent rounded-lg -m-4 p-4"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground">Connect with talented Aggies, industry experts, and potential mentors to grow your network</p>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Alert variant="info" className="mb-6 bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Note: Only people with complete profiles (including bio and skills) are displayed here.
          </AlertDescription>
        </Alert>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Filters Section - Collapsible and Prominent */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="border-l-4 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="h-8"
              >
                {filtersOpen ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </CardHeader>
          {filtersOpen && (
            <CardContent className="space-y-4 pt-0">
              {/* Search Bar */}
              <div>
                <Input
                  placeholder="Search community, users, and organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filter Row 1: Affiliation */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Affiliation</label>
                  <Tabs value={tamuFilter} onValueChange={setTamuFilter}>
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="tamu" className="flex-1">TAMU</TabsTrigger>
                      <TabsTrigger value="non-tamu" className="flex-1">Non-TAMU</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Filter Row 2: Industry and Skill */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map((industry: string, index: number) => (
                        <SelectItem key={`${industry}-${index}`} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Skill</label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skills</SelectItem>
                      {skills.map((skill: string, index: number) => (
                        <SelectItem key={`${skill}-${index}`} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Organizations Carousel */}
      {filteredOrganizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mb-6 rounded-lg p-[2px] bg-gradient-to-b from-blue-200 via-blue-100 to-blue-200 dark:from-blue-900/40 dark:via-blue-950/20 dark:to-blue-900/40"
          >
            <div className="bg-background dark:bg-background rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Organizations</CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">
                Explore organizations and connect with their members
              </p>
            </div>
            <Carousel
              opts={{ loop: true }}
              plugins={[
                Autoplay({ delay: 5000, stopOnInteraction: false }),
              ]}
              className="w-full relative"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {filteredOrganizations.map((org) => (
                  <CarouselItem
                    key={org.id}
                    className="pl-2 md:pl-4 max-w-[400px] basis-full sm:basis-1/2 rounded-lg p-4"
                  >
                    <Link href={`/users/organizations/${org.id}`}>
                      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow bg-red-50/30 dark:bg-red-950/10">
                        <CardHeader className="pb-0 pt-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-10 w-10 ${org.logo_url ? "" : ""}`}>
                              <AvatarImage src={org.logo_url ?? ''} alt={org.name} />
                              <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-base">{org.name}</h3>
                              {org.is_texas_am_affiliate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <GraduationCap className="h-3 w-3" />
                                  <span>TAMU</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          {org.description && (
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-2">{org.description}</p>
                          )}
                          {org.website_url && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ExternalLink className="w-4 h-4" />
                              <span className="truncate">{org.website_url}</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="border-t pt-2 pb-2 px-4 flex flex-wrap gap-1">
                          {org.industry?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </CardFooter>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
              <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
            </Carousel>
            </div>
          </motion.div>
      )}

      <div className="mt-0 rounded-lg p-[2px] bg-gradient-to-b from-blue-200 via-blue-100 to-blue-200 dark:from-blue-900/40 dark:via-blue-950/20 dark:to-blue-900/40">
        <div className="bg-background dark:bg-background rounded-lg p-4">
          <AnimatePresence mode="wait">
            {isLoading || authLoading ? (
              <motion.div 
                key="loading"
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-2">Loading community...</span>
              </motion.div>
            ) : (
              <>
                {filteredUsers.length === 0 ? (
                  <motion.div 
                    key="empty"
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-lg font-medium">No talent found</p>
                    <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="mb-10">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-2xl">Talent</CardTitle>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Explore talented Aggies and connect with them
                      </p>
                    </div>

                    <motion.div 
                    key="users"
                    className="mb-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
              
                    {filteredUsers.map((user: User, index: number) => (
                      <motion.div 
                        key={user.id}
                        variants={cardVariants}
                        custom={index}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <Link href={`/users/${user.id}`}>
                          <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-0 pt-3 px-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                  >
                                    <Avatar className={`h-10 w-10 ${user.is_texas_am_affiliate ? "ring-2 ring-[#500000]" : ""}`}>
                                      <AvatarImage src={user.avatar ?? ''} alt={user.full_name} />
                                      <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <div>
                                    <h3 className="font-semibold text-base">{user.full_name}</h3>
                                    {user.is_texas_am_affiliate && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <GraduationCap className="h-3 w-3" />
                                        <span>TAMU</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={(e) => handleBookmarkToggle(user.id, e)}
                                    disabled={isBookmarkLoading}
                                  >
                                    {isBookmarkLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Bookmark 
                                        className={`h-4 w-4 ${bookmarkedUsers.includes(user.id) ? "fill-primary" : ""}`} 
                                      />
                                    )}
                                    <span className="sr-only">Bookmark user</span>
                                  </Button>
                                </motion.div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                              <p className="text-muted-foreground text-sm line-clamp-3 mb-2">{user.bio}</p>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {user.industry?.slice(0, 2).map((ind, indIndex) => (
                                  <Badge key={`${user.id}-industry-${indIndex}`} variant="secondary" className="text-xs px-1.5 py-0">
                                    {ind}
                                  </Badge>
                                ))}
                                {user.industry?.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    +{user.industry.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="border-t pt-2 pb-2 px-4 flex flex-wrap gap-1">
                              {user.skills?.slice(0, 3).map((skill, skillIndex) => (
                                <Badge key={`${user.id}-skill-${skillIndex}`} variant="outline" className="text-xs px-1.5 py-0">
                                  {skill}
                                </Badge>
                              ))}
                              {user.skills?.length > 3 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  +{user.skills.length - 3}
                                </Badge>
                              )}
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                  </>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

