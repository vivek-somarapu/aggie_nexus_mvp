"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, Calendar } from "lucide-react"

export default function NewProjectPage() {
  const router = useRouter()
  const [isIdea, setIsIdea] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recruitment_status: "Recruiting team members",
    industry: [],
    required_skills: [],
    location_type: "Remote",
    estimated_start: "",
    estimated_end: "",
    contact_email: "",
    contact_phone: "",
  })

  // Industry options
  const industryOptions = [
    "Software Development",
    "Web Development",
    "Mobile Development",
    "Artificial Intelligence",
    "Data Science",
    "IoT",
    "Blockchain",
    "Education",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Sustainability",
    "Design",
    "User Experience",
    "Marketing",
    "Business Development",
  ]

  // Skill options
  const skillOptions = [
    "React",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "Machine Learning",
    "Data Analysis",
    "UI/UX Design",
    "Product Management",
    "Mobile Development",
    "Cloud Computing",
    "DevOps",
    "Blockchain Development",
    "Marketing",
    "Business Strategy",
    "Project Management",
  ]

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle array field changes (industry, skills)
  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentArray = [...((prev[field as keyof typeof prev] as string[]) || [])]

      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter((item) => item !== value) }
      }
    })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, this would send data to the backend
    // For now, we'll just redirect to the projects page
    console.log("Form submitted:", formData)

    // Simulate successful creation and redirect
    setTimeout(() => {
      router.push("/projects")
    }, 1000)
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

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">Share your project or idea with the community</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Provide information about your project to attract collaborators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Type */}
            <div className="flex items-center space-x-2">
              <Switch id="is-idea" checked={isIdea} onCheckedChange={setIsIdea} />
              <Label htmlFor="is-idea">This is an idea (not an active project yet)</Label>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project, its goals, and what you're looking for"
                  rows={5}
                  required
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="recruitment_status">Recruitment Status</Label>
                <Select
                  value={formData.recruitment_status}
                  onValueChange={(value) => handleSelectChange("recruitment_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recruiting team members">Recruiting team members</SelectItem>
                    <SelectItem value="Looking for co-founders">Looking for co-founders</SelectItem>
                    <SelectItem value="Full team, seeking investment">Full team, seeking investment</SelectItem>
                    <SelectItem value="Looking for technical co-founder">Looking for technical co-founder</SelectItem>
                    <SelectItem value="Team complete">Team complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location_type">Location Type</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(value) => handleSelectChange("location_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="In-person">In-person</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimated_start">Estimated Start Date</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <Input
                    id="estimated_start"
                    name="estimated_start"
                    type="date"
                    value={formData.estimated_start}
                    onChange={handleChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimated_end">Estimated End Date</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <Input
                    id="estimated_end"
                    name="estimated_end"
                    type="date"
                    value={formData.estimated_end}
                    onChange={handleChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>

            {/* Industry and Skills */}
            <div className="space-y-4">
              <div>
                <Label className="block mb-2">Industry (select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {industryOptions.slice(0, 9).map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <Checkbox
                        id={`industry-${industry}`}
                        checked={(formData.industry as string[]).includes(industry)}
                        onCheckedChange={(checked) => handleArrayChange("industry", industry, checked as boolean)}
                      />
                      <Label htmlFor={`industry-${industry}`} className="text-sm">
                        {industry}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block mb-2">Required Skills (select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {skillOptions.slice(0, 9).map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={(formData.required_skills as string[]).includes(skill)}
                        onCheckedChange={(checked) => handleArrayChange("required_skills", skill, checked as boolean)}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-sm">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="Your contact email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_phone">Phone (optional)</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/projects">Cancel</Link>
            </Button>
            <Button type="submit">Create Project</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

