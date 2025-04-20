"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Bookmark,
  Calendar,
  ChevronLeft,
  Clock,
  Eye,
  Flag,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Share2,
  User,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { projectService, Project } from "@/lib/services/project-service"
import { userService } from "@/lib/services/user-service"
import { User as UserType } from "@/lib/models/users"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { useAuth } from "@/lib"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProjectPage() {
  const { id } = useParams() as { id: string }
  const { user: currentUser } = useAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [owner, setOwner] = useState<UserType | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [similarProjects, setSimilarProjects] = useState<Project[]>([])

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch project
        const fetchedProject = await projectService.getProject(id)
        if (!fetchedProject) {
          notFound()
        }
        setProject(fetchedProject)
        
        // Fetch project owner
        if (fetchedProject.owner_id) {
          const fetchedOwner = await userService.getUser(fetchedProject.owner_id)
          setOwner(fetchedOwner)
        }
        
        // Fetch similar projects
        const allProjects = await projectService.getProjects()
        const similar = allProjects
          .filter(p => 
            p.id !== id && 
            p.industry.some(i => fetchedProject.industry.includes(i))
          )
          .slice(0, 3)
        setSimilarProjects(similar)
        
        // Check if project is bookmarked
        if (currentUser) {
          const bookmarks = await bookmarkService.getProjectBookmarks(currentUser.id)
          const isProjectBookmarked = bookmarks.some(b => b.project_id === id)
          setIsBookmarked(isProjectBookmarked)
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjectData()
  }, [id, currentUser])
  
  const handleBookmarkToggle = async () => {
    if (!currentUser || !project) return
    
    try {
      setIsBookmarkLoading(true)
      const result = await bookmarkService.toggleProjectBookmark(currentUser.id, project.id)
      setIsBookmarked(result.action === 'added')
    } catch (err) {
      console.error("Error toggling bookmark:", err)
    } finally {
      setIsBookmarkLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading project details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!project) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.is_idea ? (
                      <Badge variant="outline" className="bg-yellow-100 text-black">
                        Idea
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-black">
                        Project
                      </Badge>
                    )}
                    <Badge variant="outline">{project.project_status}</Badge>
                    <Badge variant="outline">{project.recruitment_status}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    Posted on {formatDate(project.created_at)}
                    <Separator orientation="vertical" className="h-4" />
                    <Eye className="h-4 w-4" />
                    {project.views} views
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleBookmarkToggle}
                    disabled={isBookmarkLoading || !currentUser}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary" : ""}`} />
                    )}
                    <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Bookmark project"}</span>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share project</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{project.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Project Details</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                      <span>{project.project_status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span>{project.location_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{formatDate(project.estimated_start)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{formatDate(project.estimated_end)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Industry & Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.industry.map((ind) => (
                      <Badge key={ind} variant="secondary">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="text-sm font-medium">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              {owner && (
                <Button variant="outline" asChild>
                  <Link href={`/users/${owner.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    View Owner Profile
                  </Link>
                </Button>
              )}
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Owner
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Owner</CardTitle>
            </CardHeader>
            <CardContent>
              {owner ? (
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={owner.avatar ?? ''} alt={owner.full_name} />
                    <AvatarFallback>{owner.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{owner.full_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {owner.bio && owner.bio.substring(0, 100)}
                    {owner.bio && owner.bio.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex gap-2 mb-4">
                    {owner.is_texas_am_affiliate && <Badge variant="secondary">Texas A&M Affiliate</Badge>}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/users/${owner.id}`}>View Full Profile</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">Owner information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{project.contact_info.email}</span>
              </div>
              {project.contact_info.phone && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{project.contact_info.phone}</span>
                </div>
              )}
              <Button className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Similar Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {similarProjects.length > 0 ? (
                similarProjects.map((p) => (
                  <div key={p.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center">No similar projects found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

