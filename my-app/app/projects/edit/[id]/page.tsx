"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { projectService } from "@/lib/services/project-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { DatePicker } from "@/components/ui/date-picker"
import React from "react"

// Industry options
const industryOptions = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Entertainment",
  "Retail",
  "Manufacturing",
  "Agriculture",
  "Energy",
  "Transportation",
  "Real Estate",
  "Nonprofit",
  "Sports",
  "Food & Beverage",
  "Other"
]

// Skill options
const skillOptions = [
  "Programming",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Management",
  "Writing",
  "Research",
  "Customer Service",
  "Data Analysis",
  "Project Management",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Creativity"
]

// Project status options
const projectStatusOptions = [
  "Idea Phase",
  "Not Started",
  "Planning",
  "In Progress",
  "Advanced Stage",
  "Completed"
]

// Recruitment status options
const recruitmentStatusOptions = [
  "Not Recruiting",
  "Open to Collaboration",
  "Actively Recruiting",
  "Team Complete"
]

// Location type options
const locationTypeOptions = [
  "Remote",
  "On-site",
  "Hybrid",
  "Flexible"
]

export default function EditProjectPage({ params }: { params: { id: string } }) {
  // For client components, we don't need to use React.use() since they're not Server Components
  // Just access params directly
  const projectId = params.id
  
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined)
  const [notFound, setNotFound] = useState(false)
  const [notAuthorized, setNotAuthorized] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_idea: true,
    recruitment_status: "Not Recruiting",
    industry: [] as string[],
    required_skills: [] as string[],
    location_type: "Remote",
    estimated_start: "",
    estimated_end: "",
    contact_info: { email: "", phone: "" },
    project_status: "Idea Phase"
  })

  // Fetch project data when component mounts
  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!projectId) {
          setNotFound(true)
          return
        }

        const projectData = await projectService.getProject(projectId)
        
        if (!projectData) {
          setNotFound(true)
          return
        }
        
        // Check if the current user is the owner of the project
        if (user && projectData.owner_id !== user.id) {
          setNotAuthorized(true)
          return
        }
        
        setProject(projectData)
        
        // Initialize form data with project data
        setFormData({
          title: projectData.title || "",
          description: projectData.description || "",
          is_idea: projectData.is_idea || false,
          recruitment_status: projectData.recruitment_status || "Not Recruiting",
          industry: projectData.industry || [],
          required_skills: projectData.required_skills || [],
          location_type: projectData.location_type || "Remote",
          estimated_start: projectData.estimated_start || "",
          estimated_end: projectData.estimated_end || "",
          contact_info: {
            email: projectData.contact_info?.email || "",
            phone: projectData.contact_info?.phone || ""
          },
          project_status: projectData.project_status || "Not Started"
        })
        
        // Initialize selected values
        setSelectedIndustries(projectData.industry || [])
        setSelectedSkills(projectData.required_skills || [])
        
        // Initialize date pickers
        if (projectData.estimated_start) {
          setSelectedStartDate(new Date(projectData.estimated_start))
        }
        
        if (projectData.estimated_end) {
          setSelectedEndDate(new Date(projectData.estimated_end))
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (!authLoading && user) {
      fetchProject()
    }
  }, [projectId, user, authLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value
      }
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_idea: checked,
      // Update project status based on is_idea value
      project_status: checked ? "Idea Phase" : prev.project_status
    }))
  }

  const handleIndustrySelect = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry))
    } else {
      setSelectedIndustries([...selectedIndustries, industry])
    }
  }

  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    setSelectedStartDate(date)
    setFormData(prev => ({
      ...prev,
      estimated_start: date ? date.toISOString() : ""
    }))
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setSelectedEndDate(date)
    setFormData(prev => ({
      ...prev,
      estimated_end: date ? date.toISOString() : ""
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError("You must be logged in to update this project")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Validate form data
      if (!formData.title.trim()) {
        throw new Error("Project title is required")
      }
      
      if (!formData.description.trim()) {
        throw new Error("Project description is required")
      }
      
      // Update form data with selected arrays
      const projectData = {
        ...formData,
        industry: selectedIndustries,
        required_skills: selectedSkills
      }
      
      await projectService.updateProject(projectId, projectData)
      
      toast.success("Project updated successfully!")
      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      console.error("Error updating project:", err)
      setError(err.message || "Failed to update project. Please try again.")
      toast.error("Failed to update project")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Display loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // Handle not found
  if (notFound) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            Project not found. The project may have been deleted or you don't have access to it.
            <Link href="/projects" className="ml-2 underline">
              Browse projects
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Handle not authorized
  if (notAuthorized) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You don't have permission to edit this project. Only the project owner can edit it.
            <Link href={`/projects/${projectId}`} className="ml-2 underline">
              View project
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Handle not logged in
  if (!user) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You need to be logged in to edit a project.
            <Link href="/auth/login" className="ml-2 underline">
              Log in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-muted-foreground mt-1">Update your project details</p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the core details about your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project, its goals, and what you're looking to accomplish"
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_idea"
                checked={formData.is_idea}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_idea">This is just an idea (not an active project)</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Provide more specific information about your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_status">Project Status</Label>
              <Select
                value={formData.project_status}
                onValueChange={(value) => handleSelectChange("project_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruitment_status">Recruitment Status</Label>
              <Select
                value={formData.recruitment_status}
                onValueChange={(value) => handleSelectChange("recruitment_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recruitment status" />
                </SelectTrigger>
                <SelectContent>
                  {recruitmentStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Industries (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {industryOptions.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`industry-${industry}`}
                      checked={selectedIndustries.includes(industry)}
                      onChange={() => handleIndustrySelect(industry)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`industry-${industry}`} className="text-sm font-normal cursor-pointer">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Required Skills (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {skillOptions.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`skill-${skill}`}
                      checked={selectedSkills.includes(skill)}
                      onChange={() => handleSkillSelect(skill)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`skill-${skill}`} className="text-sm font-normal cursor-pointer">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Timeline & Location</CardTitle>
            <CardDescription>Set the estimated timeline and location type for your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => handleSelectChange("location_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_start">Estimated Start Date</Label>
                <DatePicker
                  selected={selectedStartDate}
                  onSelect={handleStartDateSelect}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_end">Estimated End Date</Label>
                <DatePicker
                  selected={selectedEndDate}
                  onSelect={handleEndDateSelect}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How can interested collaborators reach you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.contact_info.email}
                onChange={handleContactChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.contact_info.phone || ""}
                onChange={handleContactChange}
                placeholder="(123) 456-7890"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 