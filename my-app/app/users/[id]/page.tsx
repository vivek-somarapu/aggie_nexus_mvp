"use client"

import { useState } from "react"
import { useParams, notFound } from "next/navigation"
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
} from "lucide-react"
import { mockUsers, mockProjects } from "@/lib/utils"

export default function UserPage() {
  const { id } = useParams()
  const user = mockUsers.find((u) => u.id === id)

  if (!user) {
    notFound()
  }

  const userProjects = mockProjects.filter((p) => p.owner_id === user.id)
  const [isBookmarked, setIsBookmarked] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar} alt={user.full_name} />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Eye className="h-4 w-4" />
                      {user.views} profile views
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
                  <Button variant="outline" size="icon" onClick={() => setIsBookmarked(!isBookmarked)}>
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary" : ""}`} />
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
                      {user.industry.map((ind) => (
                        <Badge key={ind} variant="secondary">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
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
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      {user.contact.phone && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
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
                          className="flex items-center gap-2 text-primary hover:underline"
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
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {user.additional_links?.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
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
            <CardFooter className="border-t pt-6">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact User
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User&apos;s Projects</CardTitle>
              <CardDescription>Projects created or owned by {user.full_name}</CardDescription>
            </CardHeader>
            <CardContent>
              {userProjects.length > 0 ? (
                <div className="space-y-4">
                  {userProjects.map((project) => (
                    <div key={project.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.title}
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {project.is_idea ? (
                              <Badge variant="outline" className="bg-yellow-100">
                                Idea
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100">
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
                  <p className="text-muted-foreground">No projects found for this user&apos;s profile.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
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
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Profile Views: {user.views}</span>
              </div>
              <Button className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Similar Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockUsers
                .filter((u) => u.id !== user.id && u.industry.some((i) => user.industry.includes(i)))
                .slice(0, 3)
                .map((u) => (
                  <div key={u.id} className="flex items-center gap-3 border-b pb-4 last:border-0 last:pb-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar} alt={u.full_name} />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

