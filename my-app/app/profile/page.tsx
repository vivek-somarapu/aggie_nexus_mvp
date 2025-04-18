"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Bookmark, ExternalLink, GraduationCap, Linkedin, Loader2, Pencil, Save, User } from "lucide-react"
import { useAuth } from "@/lib"
import { userService } from "@/lib/services/user-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { User as UserType } from "@/lib/models/users"
import { Project } from "@/lib/services/project-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { hasJustLoggedIn } from "@/lib/profile-utils"

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([])
  const [bookmarkedUsers, setBookmarkedUsers] = useState<UserType[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletionBanner, setShowCompletionBanner] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    linkedin_url: '',
    website_url: '',
    graduation_year: 0,
    is_texas_am_affiliate: false,
  })

  // Check if profile needs completion
  useEffect(() => {
    if (currentUser) {
      // Check if the profile is incomplete
      const isIncomplete = !currentUser.bio || 
                          !currentUser.skills || 
                          (currentUser.skills && currentUser.skills.length === 0);
      
      const wasSkipped = currentUser.profile_setup_skipped;
      const wasCompleted = currentUser.profile_setup_completed;
      
      // Show banner if:
      // 1. Profile is incomplete and wasn't explicitly marked as completed
      // 2. Or if user just logged in and had previously skipped
      setShowCompletionBanner(
        (isIncomplete && !wasCompleted) || 
        (isIncomplete && wasSkipped && hasJustLoggedIn(currentUser))
      );
    }
  }, [currentUser]);

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name,
        email: currentUser.email,
        bio: currentUser.bio || '',
        linkedin_url: currentUser.linkedin_url || '',
        website_url: currentUser.website_url || '',
        graduation_year: currentUser.graduation_year || 0,
        is_texas_am_affiliate: currentUser.is_texas_am_affiliate || false,
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
  
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner - only shown if needed */}
      {showCompletionBanner && (
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
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile information and bookmarks</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile information and preferences</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSubmit : setIsEditing(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.full_name} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        <Linkedin className="h-4 w-4" />
                      </span>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        <ExternalLink className="h-4 w-4" />
                      </span>
                      <Input
                        id="website_url"
                        name="website_url"
                        value={formData.website_url}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                      <Input
                        id="graduation_year"
                        name="graduation_year"
                        type="number"
                        value={formData.graduation_year || ''}
                        onChange={handleChange}
                        disabled={!isEditing || isLoading}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="is_texas_am_affiliate"
                      name="is_texas_am_affiliate"
                      checked={formData.is_texas_am_affiliate}
                      onChange={handleCheckboxChange}
                      disabled={!isEditing || isLoading}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is_texas_am_affiliate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I am affiliated with Texas A&M University
                    </Label>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bookmarked Users</CardTitle>
                <CardDescription>People you've bookmarked</CardDescription>
              </CardHeader>
              <CardContent>
                {bookmarksLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading bookmarks...</span>
                  </div>
                ) : bookmarkedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarkedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} alt={user.full_name} />
                            <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                              {user.full_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {user.skills?.slice(0, 2).join(", ")}
                              {user.skills && user.skills.length > 2 ? "..." : ""}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/users/${user.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't bookmarked any users yet.</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link href="/users">
                        Browse Users
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookmarked Projects</CardTitle>
                <CardDescription>Projects you've bookmarked</CardDescription>
              </CardHeader>
              <CardContent>
                {bookmarksLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading bookmarks...</span>
                  </div>
                ) : bookmarkedProjects.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarkedProjects.map((project) => (
                      <div key={project.id} className="flex flex-col">
                        <div className="flex justify-between items-start">
                          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.title}
                          </Link>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>View</Link>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You haven't bookmarked any projects yet.</p>
                    <Button variant="outline" size="sm" className="mt-4" asChild>
                      <Link href="/projects">
                        Browse Projects
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Manage your conversations</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Message functionality coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

