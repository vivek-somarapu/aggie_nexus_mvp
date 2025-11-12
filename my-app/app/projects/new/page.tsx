"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { projectService } from "@/lib/services/project-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import DatePicker from "@/components/ui/date-picker";
import { TagSelector } from "@/components/ui/search-tag-selector";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

import { createClient } from "@/lib/supabase/client";
import { industryOptions } from "@/lib/constants";

const industrySkillsMap: { [industryOptions: string]: string[] } = {
  "Agriculture, Food & Natural Resources": [
    "Crop Management",
    "Animal Science",
    "Sustainable Farming",
    "Agribusiness",
    "Soil Analysis",
    "Food Safety",
    "Irrigation Systems",
    "Livestock Management",
    "Greenhouse Management",
    "Organic Farming",
    "Environmental Science"
  ],
  "Architecture & Construction": [
    "Blueprint Reading",
    "AutoCAD",
    "Structural Analysis",
    "Construction Management",
    "Building Codes",
    "Surveying",
    "Revit",
    "Construction Safety",
    "OSHA Regulations",
    "HVAC Systems",
    "Electrical Systems"
  ],
  "Arts, A/V Technology & Communications": [
    "Graphic Design",
    "Video Editing",
    "Photography",
    "Animation",
    "Public Speaking",
    "Content Creation",
    "3D Modeling",
    "UX/UI Design",
    "Sound Engineering",
    "Typography",
    "Web Design"
  ],
  "Business Management & Administration": [
    "Project Management",
    "Strategic Planning",
    "Business Analysis",
    "Operations Management",
    "Microsoft Excel",
    "Budgeting",
    "Human Resources",
    "Negotiation",
    "Customer Relationship Management (CRM)",
    "Data Analytics",
    "Business Communication"
  ],
  "Education & Training": [
    "Curriculum Design",
    "Classroom Management",
    "Lesson Planning",
    "Instructional Design",
    "Student Assessment",
    "Educational Technology",
    "Learning Management Systems (LMS)",
    "Special Education",
    "Behavior Management",
    "STEM Education",
    "E-learning Tools"
  ],
  "Finance": [
    "Financial Modeling",
    "Excel",
    "Accounting",
    "Investment Analysis",
    "Budget Forecasting",
    "Risk Management",
    "Corporate Finance",
    "Tax Preparation",
    "Audit",
    "Valuation",
    "Portfolio Management"
  ],
  "Government & Public Administration": [
    "Policy Analysis",
    "Public Speaking",
    "Regulatory Compliance",
    "Budget Planning",
    "Civic Engagement",
    "Research",
    "Public Policy",
    "Legislative Analysis",
    "Urban Planning",
    "Crisis Management",
    "Intergovernmental Relations"
  ],
  "Health Science": [
    "EMR Systems",
    "HIPAA Compliance",
    "Clinical Skills",
    "Medical Terminology",
    "Patient Care",
    "Pharmacology",
    "Anatomy & Physiology",
    "Health Informatics",
    "Medical Coding",
    "Patient Education",
    "Nutrition"
  ],
  "Human Services": [
    "Counseling",
    "Case Management",
    "Crisis Intervention",
    "Empathy",
    "Social Work",
    "Community Outreach",
    "Addiction Counseling",
    "Family Support Services",
    "Therapeutic Techniques",
    "Youth Services",
    "Cultural Competence"
  ],
  "Hospitality & Tourism": [
    "Customer Service",
    "Event Planning",
    "Food & Beverage Service",
    "Hotel Management",
    "Travel Coordination",
    "Conflict Resolution",
    "Tourism Marketing",
    "Hospitality Law",
    "Event Budgeting",
    "Culinary Arts",
    "Guest Services"
  ],
  "Information Technology": [
    "Programming",
    "Data Analysis",
    "Cybersecurity",
    "Cloud Computing",
    "Networking",
    "IT Support",
    "Fullstack Developer",
    "Backend Developer",
    "DevOps",
    "Agile Methodologies",
    "Machine Learning",
    "Mobile App Development",
    "Database Administration",
    "System Architecture",
    "Version Control (e.g. Git)"
  ],
  "Law, Public Safety, Corrections & Security": [
    "Legal Research",
    "Criminal Justice",
    "Emergency Response",
    "Security Operations",
    "Report Writing",
    "Surveillance",
    "Court Procedures",
    "Forensic Science",
    "Law Enforcement Tactics",
    "Correctional Management",
    "Criminal Psychology"
  ],
  "Manufacturing": [
    "Machine Operation",
    "Quality Control",
    "Lean Manufacturing",
    "CAD/CAM",
    "Industrial Safety",
    "Inventory Management",
    "Robotics",
    "Welding",
    "Production Planning",
    "CNC Programming",
    "Assembly Line Operations"
  ],
  "Marketing": [
    "Digital Marketing",
    "SEO",
    "Market Research",
    "Brand Management",
    "Copywriting",
    "Social Media",
    "Email Marketing",
    "Content Strategy",
    "Influencer Marketing",
    "CRM Tools",
    "Marketing Automation"
  ],
  "Science, Technology, Engineering & Mathematics": [
    "Lab Skills",
    "Data Analysis",
    "Mathematical Modeling",
    "Scientific Research",
    "Engineering Design",
    "Critical Thinking",
    "Python Programming",
    "Control Systems",
    "Circuit Design",
    "Systems Engineering",
    "Simulation Modeling"
  ],
  "Transportation, Distribution & Logistics": [
    "Logistics Management",
    "Supply Chain Operations",
    "Fleet Management",
    "Route Optimization",
    "Inventory Tracking",
    "Warehousing",
    "Freight Handling",
    "DOT Compliance",
    "GPS Navigation Systems",
    "Customs Regulations",
    "Logistics Software"
  ]
};


// Default skill options
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
  "Creativity",
];

// Project status options
const projectStatusOptions = [
  "Idea Phase",
  "Not Started",
  "Planning",
  "In Progress",
  "Advanced Stage",
  "Completed",
];

// Recruitment status options
const recruitmentStatusOptions = [
  "Not Recruiting",
  "Open to Collaboration",
  "Actively Recruiting",
  "Team Complete",
];

// Location type options
const locationTypeOptions = ["Remote", "On-site", "Hybrid", "Flexible"];

export default function NewProjectPage() {
  const { authUser: user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(
    undefined
  );
  const datePickerForm = useForm<{ date: Date | undefined }>({
    defaultValues: {
      date: undefined,
    },
  });

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
    project_status: "Idea Phase",
    funding_received: 0,
  });

  // Initialize contact email with user's email when user data is available
  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          email: user.email,
        },
      }));
    }
  }, [user]);

  // Fetch available programs for user
  useEffect(() => {
    const fetchAvailablePrograms = async () => {
      if (user) {
        const supabase = createClient();
        if (!supabase) return;
        const { data: orgMemberships } = await supabase
          .from('organization_members')
          .select(`
            organizations(name)
          `)
          .eq('user_id', user.id);
        
        const userOrgs = orgMemberships?.map((m: { organizations?: { name: string } }) => m.organizations?.name).filter(Boolean) || [];
        // Fix: filter out undefined values from userOrgs before filtering for special/regular programs
        const userOrgsFiltered = (userOrgs as string[]).filter((org): org is string => typeof org === "string");
        const specialPrograms = userOrgsFiltered.filter(
          (org) => org === "Aggies Create Incubator" || org === "AggieX Accelerator"
        );
        const regularOrganizations = userOrgsFiltered.filter(
          (org) => org !== "Aggies Create Incubator" && org !== "AggieX Accelerator"
        );
        setAvailablePrograms(specialPrograms);
        setAvailableOrganizations(regularOrganizations);
      }
    };

    fetchAvailablePrograms();
  }, [user]);

  useEffect(() => {
  if (selectedIndustries.length === 0) {
    // No industries selected, use default skills
    return;
  }

  // Get all skills from selected industries
  const industrySkills = selectedIndustries.reduce((allSkills: string[], industry) => {
    const skills = industrySkillsMap[industry] || [];
    return [...allSkills, ...skills];
  }, []);

  // Remove duplicates
  const uniqueIndustrySkills = [...new Set(industrySkills)];

  // Filter out selected skills that are no longer available
  const validSelectedSkills = selectedSkills.filter(skill => 
    uniqueIndustrySkills.includes(skill)
  );

  // Update selected skills if any were filtered out
  if (validSelectedSkills.length !== selectedSkills.length) {
    setSelectedSkills(validSelectedSkills);
  }
}, [selectedIndustries]); // Only depend on selectedIndustries to avoid infinite loops

// Create a computed value for available skills
const getAvailableSkills = () => {
  if (selectedIndustries.length === 0) {
    return skillOptions; // Return default skills when no industry is selected
  }

  // Get skills from selected industries
  const industrySkills = selectedIndustries.reduce((allSkills: string[], industry) => {
    const skills = industrySkillsMap[industry] || [];
    return [...allSkills, ...skills];
  }, []);

  // Remove duplicates and sort
  return [...new Set(industrySkills)].sort();
};

// Get available incubator/accelerator programs for the user
// Now handled by the availablePrograms state variable


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value,
      },
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_idea: checked,
      // Update project status based on is_idea value
      project_status: checked ? "Idea Phase" : "Not Started",
    }));
  };

  const handleIndustrySelect = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    setSelectedStartDate(date);
    setFormData((prev) => ({
      ...prev,
      estimated_start: date ? date.toISOString() : "",
    }));
  }, []);

  useEffect(() => {
    const subscription = datePickerForm.watch((values) => {
      const newDate = values?.date;
      const currentDate = selectedStartDate;

      const isSame =
        (!newDate && !currentDate) ||
        (newDate &&
          currentDate &&
          newDate.getTime() === currentDate.getTime());

      if (isSame) {
        return;
      }

      handleStartDateSelect(newDate);
    });

    return () => subscription.unsubscribe();
  }, [datePickerForm, selectedStartDate, handleStartDateSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate form data
      if (!formData.title.trim()) {
        throw new Error("Project title is required");
      }

      if (!formData.description.trim()) {
        throw new Error("Project description is required");
      }

      // Update form data with selected arrays
      const projectData = {
        ...formData,
        industry: selectedIndustries,
        required_skills: selectedSkills,
        organizations: selectedOrganizations,
        funding_received: formData.funding_received,
        // owner_id is handled by the server via auth middleware
      };

      let newProject;
      if (selectedOrganizations.length > 0) {
        newProject = await projectService.createProjectWithAffiliations(projectData, selectedOrganizations);
      } else {
        newProject = await projectService.createProject(projectData);
      }

      toast.success("Project created successfully!");
      router.push(`/projects/${newProject.id}`);
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message || "Failed to create project. Please try again.");
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
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
    );
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
                    onValueChange={(value) =>
                      handleSelectChange("project_status", value)
                    }
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
                    onValueChange={(value) =>
                      handleSelectChange("location_type", value)
                    }
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
                When will your project start?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_start">Estimated Start Date</Label>
                  <Form {...datePickerForm}>
                    <DatePicker />
                  </Form>
                </div>

                {/*<div className="space-y-2">
                  <Label htmlFor="estimated_end">Estimated End Date</Label>
                  <DatePicker
                    selected={selectedEndDate}
                    onSelect={handleEndDateSelect}
                    placeholderText="Select end date"
                    minDate={selectedStartDate}
                  />
                </div>*/}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industries & Skills</CardTitle>
              <CardDescription>
                Categorize your project by industry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <TagSelector
                  label="Industries"
                  options={industryOptions}
                  selected={selectedIndustries}
                  onChange={setSelectedIndustries}
                  maxTags={10}
                  placeholder="Type and press Enter"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <TagSelector
                  label="Required Skills"
                  options={getAvailableSkills()}
                  selected={selectedSkills}
                  onChange={setSelectedSkills}
                  maxTags={10}
                  placeholder="Type and press Enter"
                />
                <div className="text-sm text-muted-foreground">
                
                  
                </div>
              </div>

              <Separator />

              {/* Program Affiliations */}
              <div className="space-y-2">
                <TagSelector
                  label="Program Affiliations"
                  options={availablePrograms}
                  selected={selectedOrganizations.filter(org => 
                    org === 'Aggies Create Incubator' || org === 'AggieX Accelerator'
                  )}
                  onChange={(newPrograms) => {
                    // Remove existing incubator/accelerator programs
                    const nonProgramOrgs = selectedOrganizations.filter(org => 
                      org !== 'Aggies Create Incubator' && org !== 'AggieX Accelerator'
                    );
                    
                    // Check if adding this program would create a conflict
                    const hasIncubator = newPrograms.includes('Aggies Create Incubator');
                    const hasAccelerator = newPrograms.includes('AggieX Accelerator');
                    
                    let finalPrograms = newPrograms;
                    if (hasIncubator && hasAccelerator) {
                      // Keep only the most recently added one
                      finalPrograms = [newPrograms[newPrograms.length - 1]];
                    }
                    
                    // Combine non-program orgs with selected programs
                    setSelectedOrganizations([...nonProgramOrgs, ...finalPrograms]);
                  }}
                  maxTags={5}
                  placeholder="Select special programs your project is part of"
                />
                <div className="text-sm text-muted-foreground">
                  Based on your organization affiliations, you can claim these special programs for your project.
                  <br />
                  <span className="text-orange-600">Note: A project cannot be part of both an incubator and accelerator program.</span>
                </div>
              </div>

              {/* Organization Affiliations */}
              <div className="space-y-2">
                <TagSelector
                  label="Organization Affiliations"
                  options={availableOrganizations}
                  selected={selectedOrganizations.filter(org => 
                    org !== 'Aggies Create Incubator' && org !== 'AggieX Accelerator'
                  )}
                  onChange={(newOrgs) => {
                    // Get current incubator/accelerator programs
                    const currentPrograms = selectedOrganizations.filter(org => 
                      org === 'Aggies Create Incubator' || org === 'AggieX Accelerator'
                    );
                    
                    // Combine regular orgs with programs
                    setSelectedOrganizations([...newOrgs, ...currentPrograms]);
                  }}
                  maxTags={10}
                  placeholder="Select organizations your project is affiliated with"
                />
                <div className="text-sm text-muted-foreground">
                  Add any organizations your project is associated with.
                </div>
              </div>

              <Separator />

              {/* Funding Information */}
              <div className="space-y-2">
                <Label htmlFor="funding_received">Funding Received (USD)</Label>
                <Input
                  id="funding_received"
                  name="funding_received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.funding_received}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <div className="text-sm text-muted-foreground">
                  Enter the total funding amount your project has received.
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
                  onValueChange={(value) =>
                    handleSelectChange("recruitment_status", value)
                  }
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
                  <Label htmlFor="contact_phone">
                    Contact Phone (Optional)
                  </Label>
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
  );
}
