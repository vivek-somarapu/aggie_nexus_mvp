"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bookmark, Calendar, MapPin, Users, Eye } from "lucide-react"
import { mockProjects, formatDate } from "@/lib/utils"

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tamuFilter, setTamuFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Get all unique industries from projects
  const industries = Array.from(new Set(mockProjects.flatMap((project) => project.industry)))

  // Filter projects based on search query and filters
  const filteredProjects = mockProjects.filter((project) => {
    // Filter by search query
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by idea/project tab
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ideas" && project.is_idea) ||
      (activeTab === "projects" && !project.is_idea)

    // Filter by industry
    const matchesIndustry = industryFilter === "all" || project.industry.includes(industryFilter)

    // Filter by status
    const matchesStatus = statusFilter === "all" || project.project_status === statusFilter

    // Filter by TAMU affiliation (using owner_id as proxy in this mock)
    const matchesTamu =
      tamuFilter === "all" ||
      (tamuFilter === "tamu" && ["1", "2", "5"].includes(project.owner_id)) ||
      (tamuFilter === "non-tamu" && !["1", "2", "5"].includes(project.owner_id))

    return matchesSearch && matchesTab && matchesIndustry && matchesStatus && matchesTamu
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Browse through ideas and projects or find collaborators</p>
        </div>
        <Button>
          <Link href="/projects/new">Create New Project</Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4">
            <TabsList>
              <TabsTrigger
                value="all"
                onClick={() => setTamuFilter("all")}
                className={tamuFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="tamu"
                onClick={() => setTamuFilter("tamu")}
                className={tamuFilter === "tamu" ? "bg-primary text-primary-foreground" : ""}
              >
                TAMU
              </TabsTrigger>
              <TabsTrigger
                value="non-tamu"
                onClick={() => setTamuFilter("non-tamu")}
                className={tamuFilter === "non-tamu" ? "bg-primary text-primary-foreground" : ""}
              >
                Non-TAMU
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
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
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Idea Phase">Idea Phase</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bookmark className="h-4 w-4" />
                        <span className="sr-only">Bookmark project</span>
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">{project.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{project.location_type}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(project.estimated_start)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{project.recruitment_status}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{project.views} views</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                    {project.industry.slice(0, 3).map((ind) => (
                      <Badge key={ind} variant="secondary" className="text-xs">
                        {ind}
                      </Badge>
                    ))}
                    {project.industry.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.industry.length - 3}
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("")
                  setIndustryFilter("all")
                  setStatusFilter("all")
                  setTamuFilter("all")
                  setActiveTab("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="mt-0">
          {/* Same content as "all" tab but filtered for ideas */}
        </TabsContent>

        <TabsContent value="projects" className="mt-0">
          {/* Same content as "all" tab but filtered for projects */}
        </TabsContent>
      </Tabs>
    </div>
  )
}

