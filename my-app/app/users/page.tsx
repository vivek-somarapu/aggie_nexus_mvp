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
import { Bookmark, GraduationCap, Loader2, Info } from "lucide-react"
import { User } from "@/lib/models/users"
import { userService, UserSearchParams } from "@/lib/services/user-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { useAuth } from "@/lib"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

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

const cardVariants = {
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
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
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
  const [userTypeFilter, setUserTypeFilter] = useState("all")

  // Fetch users once auth state is resolved
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    // Check if we already fetched data
    if (dataFetched) return;
    
    const fetchUsers = async () => {
      try {
        console.log("Fetching users data...");
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
    
    fetchUsers();
  }, [authLoading, dataFetched, searchQuery, tamuFilter, skillFilter]);
  
  // Re-fetch when filters change
  useEffect(() => {
    // Skip if auth is still loading or we haven't done initial data fetch
    if (authLoading || !dataFetched) return;
    
    const fetchFilteredUsers = async () => {
      try {
        console.log("Fetching filtered users data...");
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
      } catch (err) {
        console.error("Error fetching users with filters:", err);
        setError("Failed to apply filters. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilteredUsers();
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
  const industries = Array.from(new Set(users.flatMap((user) => user.industry || [])));
  const skills = Array.from(new Set(users.flatMap((user) => user.skills || [])));

  // Filter users based on filters
  const filteredUsers = users.filter((user: User) => {
    // Filter by industry
    const matchesIndustry = 
      industryFilter === "all" || 
      (user.industry && user.industry.includes(industryFilter));
    
    // No longer filter by user type since we removed that UI
    // Just match by industry
    return matchesIndustry;
  });
  
  // Log filtering results for debugging
  useEffect(() => {
    if (dataFetched) {
      console.log(`Filtering users: ${users.length} total, ${filteredUsers.length} after filters`);
      console.log(`Filters: tamu=${tamuFilter}, industry=${industryFilter}, skill=${skillFilter}`);
    }
  }, [filteredUsers, users, tamuFilter, industryFilter, skillFilter, dataFetched]);

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
        >
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Find collaborators, builders, and funders for your projects</p>
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
            Note: Only users with complete profiles (including bio and skills) are displayed here.
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

      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Tabs value={tamuFilter} onValueChange={setTamuFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tamu">TAMU</TabsTrigger>
                <TabsTrigger value="non-tamu">Non-TAMU</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry: string) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map((skill: string) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <div className="mt-0">
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
                <span className="ml-2">Loading users...</span>
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
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="users"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  <Avatar className={`h-12 w-12 ${user.is_texas_am_affiliate ? "ring-4 ring-[#500000]" : ""}`}>
                                    <AvatarImage src={user.avatar ?? ''} alt={user.full_name} />
                                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
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
                            <CardContent className="pb-2">
                              <div className="mb-2">
                                <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                {user.is_texas_am_affiliate && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>Texas A&M Affiliate</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-muted-foreground line-clamp-3 mb-4">{user.bio}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {user.industry?.map((ind) => (
                                  <Badge key={ind} variant="secondary" className="text-xs">
                                    {ind}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                              {user.skills?.slice(0, 4).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {user.skills?.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.skills.length - 4}
                                </Badge>
                              )}
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

