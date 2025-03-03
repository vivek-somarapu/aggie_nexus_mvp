"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Bookmark, ExternalLink, GraduationCap, Linkedin, Pencil, Save, User } from "lucide-react"
import { mockUsers, mockProjectBookmarks, mockUserBookmarks, mockProjects } from "@/lib/utils"

// temporary type definitions
interface Project {
  id: string
  title: string
  description: string
  owner_id: string
  is_idea: boolean
  recruitment_status: string
  industry: string[]
  required_skills: string[]
  location_type: string
  estimated_start: string
  deleted: boolean
}

// temporary type definitions
interface User {
  id: string
  full_name: string
  avatar: string
  industry: string[]
  // add other user properties as needed
}

// interface ProjectBookmark {
//   id: string
//   user_id: string
//   project_id: string
// }



export default function ProfilePage() {
  // Mock current user - in a real app this would come from auth context
  const currentUser = mockUsers[0]

  // Get bookmarked projects and users
  // const bookmarkedProjects = mockProjectBookmarks
  //   .filter((bookmark) => bookmark.user_id === currentUser.id)
  //   .map((bookmark) => {
  //     const project = mockProjects.find((p) => p.id === bookmark.project_id)
  //     return project
  //   })
  //   .filter(Boolean)

  const bookmarkedProjects = mockProjectBookmarks
    .filter((bookmark) => bookmark.user_id === currentUser.id)
    .map((bookmark) => {
      const project = mockProjects.find((p) => p.id === bookmark.project_id)
      return project!
    })
    .filter(Boolean) as Project[]

  // const bookmarkedUsers = mockUserBookmarks
  //   .filter((bookmark) => bookmark.user_id === currentUser.id)
  //   .map((bookmark) => {
  //     const user = mockUsers.find((u) => u.id === bookmark.bookmarked_user_id)
  //     return user
  //   })
  //   .filter(Boolean)

  const bookmarkedUsers = mockUserBookmarks
    .filter((bookmark) => bookmark.user_id === currentUser.id)
    .map((bookmark) => {
      const user = mockUsers.find((u) => u.id === bookmark.bookmarked_user_id)
      return user!
    })
    .filter(Boolean) as User[]

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: currentUser.full_name,
    email: currentUser.email,
    bio: currentUser.bio,
    linkedin_url: currentUser.linkedin_url,
    website_url: currentUser.website_url,
    graduation_year: currentUser.graduation_year,
    is_texas_am_affiliate: currentUser.is_texas_am_affiliate,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to the backend
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your profile information and bookmarks</p>
        </div>
      </div>

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
                  onClick={() => (isEditing ? handleSubmit : setIsEditing(true))}
                >
                  {isEditing ? (
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
                      <AvatarImage src={currentUser.avatar} alt={currentUser.full_name} />
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                        value={formData.graduation_year}
                        onChange={handleChange}
                        disabled={!isEditing}
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
                      disabled={!isEditing}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="is_texas_am_affiliate">I am a Texas A&amp;M affiliate</Label>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bookmarked Projects</CardTitle>
              <CardDescription>Projects you&apos;ve saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              {bookmarkedProjects.length > 0 ? (
                <div className="space-y-4">
                  {bookmarkedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.title}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Bookmark className="h-4 w-4 fill-primary" />
                        <span className="sr-only">Remove bookmark</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven&apos;t bookmarked any projects yet.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/projects">Browse Projects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bookmarked Users</CardTitle>
              <CardDescription>Users you&apos;ve saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              {bookmarkedUsers.length > 0 ? (
                <div className="space-y-4">
                  {bookmarkedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.full_name} />
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                            {user.full_name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{user.industry.join(", ")}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Bookmark className="h-4 w-4 fill-primary" />
                        <span className="sr-only">Remove bookmark</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven&apos;t bookmarked any users yet.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/users">Browse Users</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Your conversations with other users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">You don&apos;t have any messages yet.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/users">Find Users to Message</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

