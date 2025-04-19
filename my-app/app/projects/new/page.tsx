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

export default function NewProjectPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined)
  
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

  // Initialize contact email with user's email when user data is available
  useEffect(() => {
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          email: user.email
        }
      }))
    }
  }, [user])

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
      project_status: checked ? "Idea Phase" : "Not Started"
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
      setError("You must be logged in to create a project")
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
        required_skills: selectedSkills,
        owner_id: user.id
      }
      
      const newProject = await projectService.createProject(projectData)
      
      toast.success("Project created successfully!")
      router.push(`/projects/${newProject.id}`)
    } catch (err: any) {
      console.error("Error creating project:", err)
      setError(err.message || "Failed to create project. Please try again.")
      toast.error("Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You need to be logged in to create a project.
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
      <div className="flex flex-col items-center mb-8">
        <div className="w-full flex justify-start mb-2">
          <Button variant="ghost" asChild>
            <Link href="/projects">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-center">Create New Project</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the core details about your project or idea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a clear, descriptive title"
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
                  placeholder="Describe your project, its goals, and what you're looking to achieve"
                  rows={5}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_idea"
                  checked={formData.is_idea}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_idea">
                  This is just an idea (not an active project yet)
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_status">Project Status</Label>
                  <Select
                    value={formData.project_status}
                    onValueChange={(value) => handleSelectChange("project_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                When will your project start and end?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_start">Estimated Start Date</Label>
                  <DatePicker
                    selected={selectedStartDate}
                    onSelect={handleStartDateSelect}
                    placeholderText="Select start date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_end">Estimated End Date</Label>
                  <DatePicker
                    selected={selectedEndDate}
                    onSelect={handleEndDateSelect}
                    placeholderText="Select end date"
                    minDate={selectedStartDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories & Skills</CardTitle>
              <CardDescription>
                Categorize your project and specify required skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Industries (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {industryOptions.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`industry-${industry}`}
                        checked={selectedIndustries.includes(industry)}
                        onChange={() => handleIndustrySelect(industry)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`industry-${industry}`} className="font-normal">
                        {industry}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Required Skills (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {skillOptions.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillSelect(skill)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`skill-${skill}`} className="font-normal">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team & Recruitment</CardTitle>
              <CardDescription>
                Specify if you're looking for collaborators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How should interested collaborators reach you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="email"
                    type="email"
                    value={formData.contact_info.email}
                    onChange={handleContactChange}
                    placeholder="Enter contact email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
                  <Input
                    id="contact_phone"
                    name="phone"
                    value={formData.contact_info.phone || ""}
                    onChange={handleContactChange}
                    placeholder="Enter contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/projects">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 