"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Bookmark, ExternalLink, GraduationCap, Linkedin, Loader2, Pencil, Save, User, Plus, PenLine, MessageSquare, Clock, CalendarIcon, MapPin, Filter, Search, Trash2, Eye, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { userService } from "@/lib/services/user-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { User as UserType } from "@/lib/models/users"
import { Project, projectService } from "@/lib/services/project-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { hasJustLoggedIn, profileSetupStatus } from "@/lib/profile-utils"
import { inquiryService, ProjectInquiry } from "@/lib/services/inquiry-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
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
      staggerChildren: 0.1
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

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.4 } 
  }
}

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [inquiriesLoading, setInquiriesLoading] = useState(true)
  
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([])
  const [bookmarkedUsers, setBookmarkedUsers] = useState<UserType[]>([])
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [receivedInquiries, setReceivedInquiries] = useState<ProjectInquiry[]>([])
  const [sentInquiries, setSentInquiries] = useState<ProjectInquiry[]>([])
  
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletionBanner, setShowCompletionBanner] = useState(false)
  
  // Filtering state for inquiries
  const [inquiryType, setInquiryType] = useState<"received" | "sent">("received")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredInquiries, setFilteredInquiries] = useState<ProjectInquiry[]>([])
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    linkedin_url: '',
    website_url: '',
    graduation_year: 0,
    is_texas_am_affiliate: false,
    avatar: '',
    skills: [] as string[],
  })
  
  useEffect(() => {
    if (tabFromUrl) {
      const validTabs = ['profile', 'projects', 'inquiries', 'bookmarks']
      if (validTabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl)
      }
    }
  }, [tabFromUrl])
  
  // Check if profile needs completion
  useEffect(() => {
    if (!currentUser) return;
    
    const status = profileSetupStatus(currentUser);
    setShowCompletionBanner(status.shouldSetupProfile);
  }, [currentUser]);

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || '',
        email: currentUser.email,
        bio: currentUser.bio || '',
        linkedin_url: currentUser.linkedin_url || '',
        website_url: currentUser.website_url || '',
        graduation_year: currentUser.graduation_year || 0,
        is_texas_am_affiliate: currentUser.is_texas_am_affiliate || false,
        avatar: currentUser.avatar || '',
        skills: currentUser.skills || [],
      })
      setIsLoading(false)
    }
  }, [currentUser])
  
  // Load bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!currentUser) return
      
      try {
        setBookmarksLoading(true)
        const bookmarks = await bookmarkService.getAllBookmarks(currentUser.id)
        setBookmarkedProjects(bookmarks.projects)
        setBookmarkedUsers(bookmarks.users)
      } catch (err) {
        console.error("Error fetching bookmarks:", err)
        setError("Failed to load bookmarks. Please try again later.")
      } finally {
        setBookmarksLoading(false)
      }
    }
    
    fetchBookmarks()
  }, [currentUser])
  
  // Load user's projects
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!currentUser) return
      
      try {
        setProjectsLoading(true)
        const projects = await projectService.getProjectsByOwnerId(currentUser.id)
        setUserProjects(projects)
      } catch (err) {
        console.error("Error fetching user projects:", err)
        setError("Failed to load your projects. Please try again later.")
      } finally {
        setProjectsLoading(false)
      }
    }
    
    fetchUserProjects()
  }, [currentUser])
  
  // Load inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      if (!currentUser) return
      
      try {
        setInquiriesLoading(true)
        const [received, sent] = await Promise.all([
          inquiryService.getReceivedInquiries(currentUser.id),
          inquiryService.getSentInquiries(currentUser.id)
        ])
        
        setReceivedInquiries(received)
        setSentInquiries(sent)
      } catch (err) {
        console.error("Error fetching inquiries:", err)
        setError("Failed to load inquiries. Please try again later.")
      } finally {
        setInquiriesLoading(false)
      }
    }
    
    fetchInquiries()
  }, [currentUser])
  
  // Filter inquiries when inquiry type, status filter, or search query changes
  useEffect(() => {
    const inquiriesToFilter = inquiryType === "received" ? receivedInquiries : sentInquiries
    let filtered = [...inquiriesToFilter]
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter)
    }
    
    // Apply search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(inquiry => 
        inquiry.project_title.toLowerCase().includes(query) ||
        (inquiryType === "received" && inquiry.applicant_name.toLowerCase().includes(query)) ||
        inquiry.note.toLowerCase().includes(query)
      )
    }
    
    setFilteredInquiries(filtered)
  }, [inquiryType, statusFilter, searchQuery, receivedInquiries, sentInquiries])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Update user via API
      await userService.updateUser(currentUser.id, formData)
      setIsEditing(false)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!currentUser) return
    
    try {
      setDeleteInProgress(inquiryId)
      await inquiryService.deleteInquiry(inquiryId)
      
      // Update the inquiries lists
      setReceivedInquiries(receivedInquiries.filter(inq => inq.id !== inquiryId))
      setSentInquiries(sentInquiries.filter(inq => inq.id !== inquiryId))
    } catch (err) {
      console.error("Error deleting inquiry:", err)
      setError("Failed to delete inquiry. Please try again.")
    } finally {
      setDeleteInProgress(null)
    }
  }
  
  const handleUpdateInquiryStatus = async (inquiryId: string, status: 'accepted' | 'rejected') => {
    if (!currentUser) return
    
    try {
      await inquiryService.updateInquiryStatus(inquiryId, status)
      
      // Update the received inquiries list
      setReceivedInquiries(receivedInquiries.map(inq => 
        inq.id === inquiryId ? {...inq, status} : inq
      ))
    } catch (err) {
      console.error("Error updating inquiry status:", err)
      setError("Failed to update inquiry status. Please try again.")
    }
  }
  
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Profile Completion Banner - only shown if needed */}
      <AnimatePresence>
        {showCompletionBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <AlertDescription className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-300">Your profile is incomplete</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Complete your profile to connect with others and showcase your skills.</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push('/profile/setup')}
                >
                  Complete Profile
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile, projects, inquiries and bookmarks</p>
        </div>
      </motion.div>
      
      <AnimatePresence>
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
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="inquiries">Project Inquiries</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-2">Loading your profile...</span>
              </motion.div>
            ) : (
              <motion.div 
                key="profile-content"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="flex justify-center"
              >
                <div className="w-full max-w-4xl">
                  <Card className="shadow-md border border-border/50 overflow-hidden">
                    <div className="relative h-40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
                      <div className="absolute top-4 right-4">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="shadow-sm"
                          onClick={() => router.push('/profile/settings')}
                        >
                          <Pencil className="h-4 w-4 mr-1.5" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                    <div className="px-6 -mt-16 relative">
                      <motion.div 
                        className="flex flex-col md:flex-row gap-6 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-border/40 shadow-md">
                            <AvatarImage 
                              src={currentUser?.avatar || ""} 
                              className="object-cover"
                              alt={currentUser?.full_name || "User"}
                            />
                            <AvatarFallback className="text-3xl bg-muted">
                              {currentUser?.full_name ? currentUser.full_name.charAt(0) : <User className="h-16 w-16" />}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        
                        <div className="flex-1 space-y-1.5">
                          <motion.h2 
                            className="text-2xl font-bold tracking-tight"
                            variants={itemVariants}
                          >
                            {currentUser?.full_name || ""}
                          </motion.h2>
                          
                          <motion.div 
                            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                            variants={itemVariants}
                          >
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              <span>0 profile views</span>
                            </div>
                            
                            {currentUser?.is_texas_am_affiliate && (
                              <div className="flex items-center">
                                <Separator orientation="vertical" className="h-4 mx-2" />
                                <GraduationCap className="h-4 w-4 mr-1" />
                                <span>Texas A&M Affiliate</span>
                              </div>
                            )}
                            
                            {currentUser?.graduation_year && currentUser.graduation_year > 0 && (
                              <div className="flex items-center">
                                <Separator orientation="vertical" className="h-4 mx-2" />
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>Class of {currentUser.graduation_year}</span>
                              </div>
                            )}
                          </motion.div>
                          
                          {currentUser?.industry && currentUser.industry.length > 0 && (
                            <motion.div 
                              className="flex flex-wrap gap-2 mt-2"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {currentUser.industry.map((ind) => (
                                <motion.div key={ind} variants={itemVariants}>
                                  <Badge variant="secondary">
                                    {ind}
                                  </Badge>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      
                      <Separator />
                      
                      <motion.div 
                        className="grid md:grid-cols-3 gap-8 py-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.div className="md:col-span-2 space-y-6" variants={itemVariants}>
                          {/* About */}
                          <div>
                            <h3 className="font-semibold mb-2 text-lg">About</h3>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                              {currentUser?.bio || "No bio provided yet."}
                            </p>
                          </div>
                          
                          {/* Skills */}
                          {currentUser?.skills && currentUser.skills.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 text-lg">Skills</h3>
                              <div className="flex flex-wrap gap-2">
                                {currentUser.skills.map((skill) => (
                                  <Badge key={skill} variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                        
                        <motion.div className="space-y-5" variants={itemVariants}>
                          {/* Contact */}
                          <div>
                            <h3 className="font-semibold mb-2 text-lg">Contact</h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{currentUser?.email}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Links */}
                          {(currentUser?.linkedin_url || currentUser?.website_url) && (
                            <div>
                              <h3 className="font-semibold mb-2 text-lg">Links</h3>
                              <div className="space-y-3">
                                {currentUser?.linkedin_url && (
                                  <div className="flex items-center gap-3 group">
                                    <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <a 
                                      href={currentUser.linkedin_url}
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-sm text-primary hover:underline"
                                    >
                                      LinkedIn
                                    </a>
                                  </div>
                                )}
                                {currentUser?.website_url && (
                                  <div className="flex items-center gap-3 group">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <a 
                                      href={currentUser.website_url}
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-sm text-primary hover:underline truncate max-w-[200px]"
                                    >
                                      {currentUser.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    <CardFooter className="border-t py-5 flex justify-center bg-muted/30">
                      <motion.div 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          asChild
                          variant="outline" 
                          className="px-8"
                          size="lg"
                        >
                          <Link href={currentUser ? `/users/${currentUser.id}` : "#"}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Public Profile
                          </Link>
                        </Button>
                      </motion.div>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* My Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Projects</h2>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {projectsLoading ? (
              <motion.div 
                key="loading"
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-2">Loading your projects...</span>
              </motion.div>
            ) : userProjects.length === 0 ? (
              <motion.div
                key="no-projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any projects yet. Get started by creating your first project.
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild>
                        <Link href="/projects/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="projects"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {userProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card className="shadow-sm h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {project.is_idea ? (
                            <Badge variant="outline">Idea</Badge>
                          ) : (
                            <Badge variant="outline">Project</Badge>
                          )}
                          <Badge variant="outline">{project.project_status}</Badge>
                          <Badge variant="outline">{project.recruitment_status}</Badge>
                        </div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>
                          Created on {formatDate(project.created_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {project.industry.slice(0, 3).map((ind) => (
                            <Badge key={ind} variant="secondary" className="text-xs">
                              {ind}
                            </Badge>
                          ))}
                          {project.industry.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.industry.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-3 flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projects/${project.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projects/edit/${project.id}`}>
                            <PenLine className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Project Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-6">
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <h2 className="text-xl font-semibold">Project Inquiries</h2>
              <p className="text-muted-foreground">Manage inquiries for your projects and track your applications</p>
            </div>
            <Select value={inquiryType} onValueChange={(value: "received" | "sent") => setInquiryType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received Inquiries</SelectItem>
                <SelectItem value="sent">Sent Inquiries</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Filtering controls */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {inquiriesLoading ? (
              <motion.div 
                key="loading"
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-2">Loading inquiries...</span>
              </motion.div>
            ) : filteredInquiries.length === 0 ? (
              <motion.div
                key="no-inquiries"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-medium mb-2">No inquiries found</h3>
                    <p className="text-muted-foreground">
                      {(inquiryType === "received" ? receivedInquiries : sentInquiries).length > 0 
                        ? "Try adjusting your search filters"
                        : inquiryType === "received" 
                          ? "When users express interest in your projects, they'll appear here"
                          : "You haven't submitted any project inquiries yet"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="inquiries"
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredInquiries.map((inquiry) => (
                  <motion.div
                    key={inquiry.id}
                    variants={cardVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  >
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{inquiry.project_title}</CardTitle>
                            <CardDescription>
                              {inquiryType === "received" 
                                ? `Inquiry received ${new Date(inquiry.created_at).toLocaleDateString()}`
                                : `Submitted on ${new Date(inquiry.created_at).toLocaleDateString()}`}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={
                              inquiry.status === "pending" ? "outline" : 
                              inquiry.status === "accepted" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-6">
                        {inquiryType === "received" ? (
                          <>
                            <div className="md:col-span-1">
                              <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={inquiry.applicant_avatar || ''} alt={inquiry.applicant_name} />
                                  <AvatarFallback>{inquiry.applicant_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-center sm:text-left md:text-center">
                                  <h3 className="font-medium">{inquiry.applicant_name}</h3>
                                  <p className="text-sm text-muted-foreground">{inquiry.applicant_email}</p>
                                  <Button variant="outline" size="sm" className="mt-2" asChild>
                                    <Link href={`/users/${inquiry.user_id}`}>
                                      <User className="h-3 w-3 mr-1" />
                                      View Profile
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <h3 className="font-medium mb-2">Note from Applicant:</h3>
                              <blockquote className="text-muted-foreground border-l-2 pl-4 italic">
                                {inquiry.note}
                              </blockquote>
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-3">
                            <h3 className="font-medium mb-2">Your Note:</h3>
                            <blockquote className="text-muted-foreground border-l-2 pl-4 italic mb-4">
                              {inquiry.note}
                            </blockquote>
                            <div className="flex gap-2 flex-wrap">
                              <div className="flex items-center gap-2 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Submitted:</span>
                                <span>{formatDate(inquiry.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Status:</span>
                                <span>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t pt-4 flex justify-between">
                        {inquiryType === "received" ? (
                          <>
                            <Button variant="outline" asChild>
                              <a href={`mailto:${inquiry.applicant_email}`}>
                                Reply via Email
                              </a>
                            </Button>
                            <div className="flex gap-2">
                              {inquiry.status === "pending" && (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleUpdateInquiryStatus(inquiry.id, 'accepted')}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => handleUpdateInquiryStatus(inquiry.id, 'rejected')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={deleteInProgress === inquiry.id}
                                onClick={() => handleDeleteInquiry(inquiry.id)}
                              >
                                {deleteInProgress === inquiry.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" asChild>
                              <Link href={`/projects/${inquiry.project_id}`}>
                                View Project
                              </Link>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deleteInProgress === inquiry.id}
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                            >
                              {deleteInProgress === inquiry.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Withdraw Inquiry
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-6">
          <motion.div 
            className="flex justify-between items-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold">My Bookmarks</h2>
          </motion.div>

          <AnimatePresence mode="wait">
            {bookmarksLoading ? (
              <motion.div 
                key="loading"
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-2">Loading your bookmarks...</span>
              </motion.div>
            ) : (bookmarkedProjects.length === 0 && bookmarkedUsers.length === 0) ? (
              <motion.div
                key="no-bookmarks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
                    <p className="text-muted-foreground">
                      Bookmark projects and users to keep track of interesting content.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <>
                {bookmarkedProjects.length > 0 && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold">Bookmarked Projects</h3>
                    <motion.div 
                      className="grid gap-4 md:grid-cols-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {bookmarkedProjects.map((project) => (
                        <motion.div
                          key={project.id}
                          variants={cardVariants}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                          <Card className="shadow-sm h-full hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {project.is_idea ? (
                                  <Badge variant="outline">Idea</Badge>
                                ) : (
                                  <Badge variant="outline">Project</Badge>
                                )}
                                <Badge variant="outline">{project.recruitment_status}</Badge>
                              </div>
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {project.description}
                              </p>
                            </CardContent>
                            <CardFooter className="border-t pt-3">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full">
                                <Button className="w-full" variant="outline" asChild>
                                  <Link href={`/projects/${project.id}`}>
                                    View Project
                                  </Link>
                                </Button>
                              </motion.div>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {bookmarkedUsers.length > 0 && (
                  <motion.div 
                    className="space-y-4 mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold">Bookmarked Users</h3>
                    <motion.div 
                      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {bookmarkedUsers.map((user) => (
                        <motion.div
                          key={user.id}
                          variants={cardVariants}
                          whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                          <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center text-center gap-4">
                                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar || ''} alt={user.full_name} />
                                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div>
                                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {user.bio}
                                  </p>
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="outline" size="sm" className="mt-4" asChild>
                                      <Link href={`/users/${user.id}`}>
                                        View Profile
                                      </Link>
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

