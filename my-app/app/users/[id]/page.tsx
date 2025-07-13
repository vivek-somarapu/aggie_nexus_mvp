"use client"

import { useState, useEffect, use } from "react"
import { useParams, notFound, redirect, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Bookmark,
  ChevronLeft,
  ExternalLink,
  Eye,
  GraduationCap,
  Linkedin,
  Mail,
  MessageSquare,
  Share2,
  Loader2,
  Home,
  Pencil,
  Phone,
} from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { projectService } from "@/lib/services/project-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { useAuth } from "@/lib"
import { User } from "@/lib/models/users"
import { Project } from "@/lib/services/project-service"
import { createClient } from "@/lib/supabase/client"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ProfileAvatarEdit } from "@/components/profile/profile-avatar"
import { TexasAMAffiliation, TexasAMAffiliationData } from "@/components/profile/tamu-affiliate"
import { TagSelector } from "@/components/profile/tag-selector"
import { industryOptions } from "@/lib/constants"

// Simple Alert component
function Alert({ variant, className, children }: { 
  variant?: "default" | "destructive", 
  className?: string, 
  children: React.ReactNode 
}) {
  return (
    <div className={`rounded-lg border p-4 ${variant === "destructive" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50"} ${className || ""}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

export default function UserPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { authUser: currentUser, isLoading: authLoading } = useAuth()
  
  const [user, setUser] = useState<User | null>(null)
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)

  // Message dialog state
  const [messageNote, setMessageNote] = useState("")
  const [isMessageOpen, setIsMessageOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState(false)

  // editing profile
  const pathname = usePathname();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    avatar: user?.avatar || '',
    full_name: user?.full_name || '',
    is_texas_am_affiliate: user?.is_texas_am_affiliate || false,
    graduation_year: user?.graduation_year
  });
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(user?.industry || []);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingUser(true)
        setError(null)
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setError("Loading timeout. Please refresh the page.")
          setIsLoadingUser(false)
        }, 10000) // 10 second timeout
        
        const userData = await userService.getUser(id);
        clearTimeout(timeoutId)
        
        if (!userData) {
          return notFound();
        }
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    fetchUser();
  }, [id]);
  
  // Fetch user's projects
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProjects(true);
        // Ideally, there would be an API endpoint like /api/users/{id}/projects
        // For now, we'll filter all projects by owner_id
        const projects = await projectService.getProjects();
        const filteredProjects = projects.filter(p => p.owner_id === user.id);
        setUserProjects(filteredProjects);
      } catch (err) {
        console.error("Error fetching user projects:", err);
        // Don't set the main error as this is not critical
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchUserProjects();
  }, [user]);

  // Check if user can edit
  useEffect(() => {
    if (user) {
      setFormData({
        avatar: user.avatar || '',
        full_name: user.full_name || '',
        is_texas_am_affiliate: user.is_texas_am_affiliate || false,
        graduation_year: user.graduation_year
      });
      setSelectedIndustries(user.industry || []);
    }
  }, [user]);

  const handleEdit = () => {
    router.push(`/profile/settings?from=${encodeURIComponent(pathname)}`);
  };

  // Form change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAffiliationChange = (data: TexasAMAffiliationData) => {
    setFormData(prev => ({
      ...prev,
      is_texas_am_affiliate: data.is_texas_am_affiliate,
      graduation_year: data.graduation_year
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({
            ...prev,
            avatar: event.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      // Update the user data
      await userService.updateUser(currentUser.id, {
        ...formData,
        industry: selectedIndustries
      });
      
      // Refresh user data
      const updatedUser = await userService.getUser(id);
      setUser(updatedUser);
      
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user is bookmarked
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!currentUser || !user) return;
      
      try {
        setIsLoadingBookmark(true);
        const isBookmarked = await bookmarkService.isUserBookmarked(currentUser.id, id);
        setIsBookmarked(isBookmarked);
      } catch (err) {
        console.error("Error checking bookmark status:", err);
        // Don't set the main error as this is not critical
      } finally {
        setIsLoadingBookmark(false);
      }
    };
    
    checkBookmarkStatus();
  }, [currentUser, id, user]);
  
  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
    
    try {
      setBookmarkError(null);
      const newBookmarkStatus = await bookmarkService.toggleUserBookmark(currentUser.id, id);
      setIsBookmarked(newBookmarkStatus);
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      setBookmarkError("Failed to update bookmark. Please try again.");
    }
  };
  
  // Handle message submission
  const handleMessageSubmit = async () => {
    if (!currentUser || !user) {
      setMessageError("You must be logged in to send a message")
      return
    }
    
    if (!messageNote.trim()) {
      setMessageError("Please provide a message")
      return
    }
    
    try {
      setIsSubmitting(true)
      setMessageError(null)
      
      const supabase = createClient()
      
      // Create new message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: user.id,
          content: messageNote,
          status: 'unread'
        })
      
      if (error) throw error
      
      // Show success message and reset form
      setMessageSuccess(true)
      setMessageNote("")
      
      // Close dialog after a delay
      setTimeout(() => {
        setIsMessageOpen(false)
        setMessageSuccess(false)
      }, 2000)
      
    } catch (err: any) {
      console.error("Error sending message:", err)
      setMessageError(err?.message || "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading user profile...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </Button>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - User Profile */}
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar || undefined} alt={user.full_name} />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      {user.is_texas_am_affiliate && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <GraduationCap className="h-4 w-4" />
                          Texas A&M Affiliate
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {bookmarkError && (
                    <span className="text-destructive text-sm mr-2">{bookmarkError}</span>
                  )}
                  {currentUser?.id == user?.id && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleEdit}
                      // onClick={() => setIsEditOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit profile</span>
                    </Button>
                    
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                      <DialogContent className="flex flex-col max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted flex-1">
                          {/* Avatar + Name + Affiliation */}
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-full flex justify-center sm:w-auto sm:shrink-0">
                              <ProfileAvatarEdit
                                avatar={formData.avatar}
                                fullName={formData.full_name}
                                onAvatarChange={handleAvatarChange}
                                onAvatarDelete={handleDeleteAvatar}
                              />
                            </div>
                            <div className="w-full sm:flex-1 space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                  id="full_name"
                                  name="full_name"
                                  value={formData.full_name}
                                  onChange={handleChange}
                                />
                              </div>
                              <TexasAMAffiliation
                                value={{
                                  is_texas_am_affiliate: formData.is_texas_am_affiliate,
                                  graduation_year: Number(formData.graduation_year)
                                }}
                                onChange={handleAffiliationChange}
                              />
                            </div>
                          </div>

                          {/* Industry edit */}
                          <div className="space-y-2">
                            <Label>Industries (select up to 10)</Label>
                            <TagSelector
                              label="Industries"
                              options={industryOptions}
                              selected={selectedIndustries}
                              onChange={setSelectedIndustries}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            disabled={isSaving}
                            onClick={handleSaveProfile}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleBookmarkToggle}
                    disabled={isLoadingBookmark}
                  >
                    {isLoadingBookmark ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                    )}
                    <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Bookmark user"}</span>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share profile</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-line">{user.bio}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Industry</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.industry.map((ind, indIndex) => (
                        <Badge key={`user-${id}-industry-${indIndex}`} variant="secondary">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, skillIndex) => (
                        <Badge key={`user-${id}-skill-${skillIndex}`} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="min-w-0 break-all">{user.email}</span>
                      </div>
                      {user.contact?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Links</h3>
                    <div className="space-y-2">
                      {user.linkedin_url && (
                        <a
                          href={user.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {user.website_url && (
                        <a
                          href={user.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {user.additional_links && user.additional_links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Message to {user.full_name}</DialogTitle>
                    <DialogDescription>
                      Your message will be sent directly to the user. They will be able to see your profile details and reply to you.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {messageSuccess ? (
                    <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                      <AlertDescription>
                        Your message has been sent successfully! The user will reply to you soon.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {messageError && (
                        <Alert variant="destructive">
                          <AlertDescription>{messageError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Textarea
                        placeholder="Write your message here. Introduce yourself and explain why you're reaching out..."
                        value={messageNote}
                        onChange={(e) => setMessageNote(e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsMessageOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleMessageSubmit}
                          disabled={isSubmitting || !messageNote.trim() || !currentUser}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send Message'
                          )}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column - User Information and Similar Users */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.graduation_year && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>Graduation Year: {user.graduation_year}</span>
                </div>
              )}
              <Button className="w-full mt-2" onClick={() => setIsMessageOpen(true)} disabled={!currentUser}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Similar Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2">Loading similar users...</span>
                </div>
              ) : (
                <SimilarUsers userId={user.id} industries={user.industry} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects section - Full width in mobile, spans columns in desktop */}
        <div className="md:col-span-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>User's Projects</CardTitle>
              <CardDescription>Projects created or owned by {user.full_name}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading projects...</span>
                </div>
              ) : userProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userProjects.map((project) => (
                    <div key={project.id} className="border rounded-md p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.title}
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {project.is_idea ? (
                              <Badge variant="outline">
                                Idea
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Project
                              </Badge>
                            )}
                            <Badge variant="outline">{project.project_status}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/projects/${project.id}`}>View</Link>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{project.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No projects found for this user's profile.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Component to fetch and display similar users
function SimilarUsers({ userId, industries }: { userId: string, industries: string[] }) {
  const [similarUsers, setSimilarUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchSimilarUsers = async () => {
      try {
        setIsLoading(true)
        
        // Fetch users with similar industries
        // In a real implementation, there could be a dedicated endpoint for similar users
        // For now, we'll get all users and filter on the client side
        const allUsers = await userService.getUsers()
        const filtered = allUsers
          .filter(u => 
            u.id !== userId && 
            u.industry.some(i => industries.includes(i))
          )
          .slice(0, 3)
        
        setSimilarUsers(filtered)
      } catch (err) {
        console.error("Error fetching similar users:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSimilarUsers()
  }, [userId, industries])
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }
  
  if (similarUsers.length === 0) {
    return <p className="text-muted-foreground text-center">No similar users found.</p>
  }
  
  return (
    <>
      {similarUsers.map((u) => (
        <div key={u.id} className="flex items-center gap-3 border-b pb-4 last:border-0 last:pb-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={u.avatar || undefined} alt={u.full_name} />
            <AvatarFallback>{u.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link href={`/users/${u.id}`} className="font-medium hover:underline">
              {u.full_name}
            </Link>
            <p className="text-sm text-muted-foreground truncate">{u.industry.join(", ")}</p>
          </div>
        </div>
      ))}
    </>
  )
}

