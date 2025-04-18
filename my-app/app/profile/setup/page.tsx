"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { userService } from "@/lib/services/user-service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ChevronRight, ChevronLeft, User as UserIcon, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Get industry options from the project page
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

// Get skill options from the project page
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

export default function ProfileSetupPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isFromAuthError, setIsFromAuthError] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    linkedin_url: "",
    website_url: "",
    graduation_year: "",
    is_texas_am_affiliate: false,
    resume_url: "",
    contact: { email: "", phone: "" },
  })

  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || "",
        email: user.email || "",
        bio: user.bio || "",
        linkedin_url: user.linkedin_url || "",
        website_url: user.website_url || "",
        graduation_year: user.graduation_year?.toString() || "",
        is_texas_am_affiliate: user.is_texas_am_affiliate || false,
        contact: {
          email: user.email || "",
          phone: user.contact?.phone || ""
        }
      }))

      if (user.industry) {
        setSelectedIndustries(user.industry)
      }

      if (user.skills) {
        setSelectedSkills(user.skills)
      }
    }
  }, [user])

  // Check if user was redirected from auth error
  useEffect(() => {
    // Check localStorage for auth error flag
    const authErrorFlag = localStorage.getItem("auth_profile_error")
    if (authErrorFlag === "true") {
      setIsFromAuthError(true)
      setMessage("We detected an issue with your profile during signup. Please complete your profile setup now.")
      // Jump directly to step 2 (basic information)
      setCurrentStep(2)
      // Clear the flag
      localStorage.removeItem("auth_profile_error")
    }
  }, [])

  // Handle user interaction
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
      contact: {
        ...prev.contact,
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
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

  const nextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!user) {
      setError("You must be logged in to update your profile")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Format the data for API with validation
      const userData = {
        ...formData,
        // Ensure full_name is never empty - use email prefix if empty
        full_name: formData.full_name || (formData.email?.split('@')[0] || 'User'),
        industry: selectedIndustries,
        skills: selectedSkills,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null
      }
      
      // Update user via API
      await userService.updateUser(user.id, userData)
      
      if (isFromAuthError) {
        setMessage("Your profile has been successfully created!")
      }
      
      // Redirect to home page or profile
      router.push("/")
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipToHome = () => {
    router.push("/")
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
            You need to be logged in to set up your profile.
            <Link href="/auth/login" className="ml-2 underline">
              Log in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Step 1: Welcome screen with options
  if (currentStep === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Aggie Nexus!</CardTitle>
            <CardDescription>
              Would you like to set up your profile now or continue to the platform?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar || undefined} alt={user.full_name} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-center text-muted-foreground">
              Setting up your profile helps others find you and makes it easier to connect with like-minded individuals.
            </p>
            {message && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={skipToHome}>Skip for now</Button>
            <Button onClick={nextStep}>Set up profile <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 2: Basic information
  if (currentStep === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Let's start with the basics</CardDescription>
            {isFromAuthError && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_texas_am_affiliate"
                name="is_texas_am_affiliate"
                checked={formData.is_texas_am_affiliate}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_texas_am_affiliate" className="font-normal">
                I am a Texas A&M Affiliate
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year">Graduation Year</Label>
              <Input
                id="graduation_year"
                name="graduation_year"
                type="number"
                value={formData.graduation_year}
                onChange={handleChange}
                placeholder="Enter your graduation year"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep}>
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 3: Skills and Industries
  if (currentStep === 3) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Skills & Industries</CardTitle>
            <CardDescription>Select your skills and industries of interest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Industries (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
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

            <div className="space-y-2">
              <Label>Skills (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
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
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep}>
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 4: Contact and Links
  if (currentStep === 4) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Contact & Links</CardTitle>
            <CardDescription>How can others reach you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="email"
                type="email"
                value={formData.contact.email}
                onChange={handleContactChange}
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
              <Input
                id="contact_phone"
                name="phone"
                value={formData.contact.phone || ""}
                onChange={handleContactChange}
                placeholder="Enter contact phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep}>
              Review <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 5: Review and Submit
  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Review Your Profile</CardTitle>
          <CardDescription>Make sure everything looks good</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{formData.full_name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{formData.email}</p>
          </div>

          {formData.bio && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Bio</p>
              <p className="text-sm text-muted-foreground">{formData.bio}</p>
            </div>
          )}

          {formData.graduation_year && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Graduation Year</p>
              <p className="text-sm text-muted-foreground">{formData.graduation_year}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Texas A&M Affiliate</p>
            <p className="text-sm text-muted-foreground">{formData.is_texas_am_affiliate ? "Yes" : "No"}</p>
          </div>

          {selectedIndustries.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Industries</p>
              <p className="text-sm text-muted-foreground">{selectedIndustries.join(", ")}</p>
            </div>
          )}

          {selectedSkills.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Skills</p>
              <p className="text-sm text-muted-foreground">{selectedSkills.join(", ")}</p>
            </div>
          )}

          {formData.linkedin_url && (
            <div className="space-y-1">
              <p className="text-sm font-medium">LinkedIn</p>
              <p className="text-sm text-muted-foreground">{formData.linkedin_url}</p>
            </div>
          )}

          {formData.website_url && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Website</p>
              <p className="text-sm text-muted-foreground">{formData.website_url}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Complete Setup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 