"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { projectService } from "@/lib/services/project-service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar-range";
import { TagSelector } from "@/components/ui/search-tag-selector";
import {
  UserSearchSelector,
  ProjectMember,
} from "@/components/ui/user-search-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import ProjectGalleryUploader, {
  PendingFile,
} from "@/components/ui/project-image-gallery";

import {
  industryOptions,
  industrySkillsMap,
  projectStatusOptions,
  skillOptions,
  locationTypeOptions,
  recruitmentStatusOptions,
} from "@/lib/constants";
import { ChevronLeft, Loader2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function NewProjectPage() {
  const { authUser: user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [descriptionWords, setDescriptionWords] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<ProjectMember[]>([]);

  const [range, setRange] = useState<{
    start: Date | null;
    end: Date | null;
  } | null>(null);

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
  });

  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const handleRemoveImage = (file: PendingFile) => {
    // 1️⃣ If it’s an already-uploaded image (edit mode), remember to delete it on save
    if (file.id) {
      setRemovedImageIds((prev) => [...prev, file.id!]);
    }

    // 2️⃣ Always remove it from the UI immediately
    setPendingFiles((prev) => prev.filter((f) => f !== file));

    // 3️⃣ And if it was a freshly‐selected File, revoke its objectURL
    if (file.file) {
      URL.revokeObjectURL(file.preview);
    }
  };

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

  useEffect(() => {
    if (selectedIndustries.length === 0) {
      // No industries selected, use default skills
      return;
    }

    // Get all skills from selected industries
    const industrySkills = selectedIndustries.reduce(
      (allSkills: string[], industry) => {
        const skills = industrySkillsMap[industry] || [];
        return [...allSkills, ...skills];
      },
      []
    );

    // Remove duplicates
    const uniqueIndustrySkills = [...new Set(industrySkills)];

    // Filter out selected skills that are no longer available
    const validSelectedSkills = selectedSkills.filter((skill) =>
      uniqueIndustrySkills.includes(skill)
    );

    // Update selected skills if any were filtered out
    if (validSelectedSkills.length !== selectedSkills.length) {
      setSelectedSkills(validSelectedSkills);
    }
  }, [selectedIndustries]); // Only depend on selectedIndustries to avoid infinite loops

  useEffect(() => {
    return () => {
      // on unmount revoke all previews
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  // Create a computed value for available skills
  const getAvailableSkills = () => {
    if (selectedIndustries.length === 0) {
      return skillOptions; // Return default skills when no industry is selected
    }

    // Get skills from selected industries
    const industrySkills = selectedIndustries.reduce(
      (allSkills: string[], industry) => {
        const skills = industrySkillsMap[industry] || [];
        return [...allSkills, ...skills];
      },
      []
    );

    // Remove duplicates and sort
    return [...new Set(industrySkills)].sort();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "description") {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      setDescriptionWords(words);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
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

  /* ---------- validation helpers ---------- */
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Project description is required";
    } else if (descriptionWords > 400) {
      errors.description = "Must be 400 words or fewer";
    }
    
    // Timeline validation
    if (!range?.start || !range?.end) {
      errors.timeline = "Both start & end dates are required";
    } else if (range.start > range.end) {
      errors.timeline = "End date can't be before start";
    }
    
    // Industry validation
    if (selectedIndustries.length === 0) {
      errors.industry = "Select at least one industry";
    }
    
    // Skills validation
    if (selectedSkills.length === 0) {
      errors.skills = "Select at least one skill";
    }
    
    // Team members validation
    for (const m of selectedMembers) {
      if (!m.role.trim()) {
        errors.members = `Role is required for ${m.user.full_name}`;
        break;
      }
    }
    
    return errors;
  };

  const isFormValid = () => {
    const errors = validateForm();
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }

    // 1️⃣ VALIDATION
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Show toast with validation errors
      const errorMessages = Object.values(errors).slice(0, 3); // Show first 3 errors
      toast.error(
        `Please fix the following issues: ${errorMessages.join(", ")}`,
        {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => {
              // Scroll to first error field
              const firstErrorField = document.querySelector('[class*="border-red-500"]');
              firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploading(true);

    try {

      // 2️⃣ CREATE PROJECT
      const created = await projectService.createProject({
        ...formData,
        industry: selectedIndustries,
        required_skills: selectedSkills,
      });

      // 3️⃣ ADD MEMBERS (OPTIONAL)
      if (selectedMembers.length) {
        try {
          await projectService.addProjectMembers(
            created.id,
            selectedMembers.map((m) => ({ user_id: m.user_id, role: m.role }))
          );
        } catch {
          toast.error("Project created but failed to add some members");
        }
      }

      // 4️⃣ PARALLEL IMAGE UPLOADS
      const uploadTasks = pendingFiles.map((pf, idx) => {
        // mark this file “uploading”
        setPendingFiles((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: "uploading",
            errorMessage: undefined,
          };
          return next;
        });

        const form = new FormData();
        if (pf.file) {
        form.append("file", pf.file);
        }

        return fetch("/api/upload/project-images", {
          method: "POST",
          body: form,
        })
          .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
          })
          .then(({ publicUrl }) =>
            projectService.addProjectImage(created.id, publicUrl, idx + 1)
          )
          .then(() => {
            // mark success
            setPendingFiles((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], status: "uploaded" };
              return next;
            });
          })
          .catch((err: any) => {
            // mark error on this tile
            const msg = err.error || err.message || "Upload failed";
            setPendingFiles((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], status: "error", errorMessage: msg };
              return next;
            });
          });
      });

      // wait for all to settle (no re-throw)
      await Promise.allSettled(uploadTasks);

      toast.success("Project created successfully!");
      router.push(`/projects/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      toast.error("Failed to create project");
    } finally {
      setUploading(false);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-8"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
          <Button variant="ghost" asChild>
            <Link href="/projects">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <div className="w-32"></div> {/* Spacer to balance the layout */}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        </motion.div>
      )}

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
      >

        <div className="grid gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
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
                  placeholder="Describe your project (max 400 words)"
                  rows={5}
                  required
                />

                <div className="text-right text-sm mt-1">
                  <span
                    className={
                      descriptionWords > 400
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }
                  >
                    {descriptionWords}/400&nbsp;words
                  </span>
                </div>
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
        </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & Recruitment</CardTitle>
              <CardDescription>
                When will your project start and end? Specify if you're looking
                for collaborators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_start">Estimated Timeline</Label>
                  <div className="space-y-2 md:col-span-2">
                    <Calendar value={range} onChange={setRange} allowClear />
                    {/* ✅ Prettier display */}
                    <div className="mt-2 text-sm text-gray-700">
                      {range?.start && range?.end ? (
                        <>
                          <p>
                            {format(range.start, "MMM dd, yyyy")}
                            {" - "} {format(range.end, "MMM dd, yyyy")}
                          </p>
                        </>
                      ) : range?.start ? (
                        <p>
                          <strong>Start:</strong>{" "}
                          {format(range.start, "MMM dd, yyyy")} (end not
                          selected yet)
                        </p>
                      ) : (
                        <p>No date selected</p>
                      )}
                    </div>
                  </div>
                </div>

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
                <div className="text-sm text-muted-foreground"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Add team members to your project with their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearchSelector
                selectedMembers={selectedMembers}
                onChange={setSelectedMembers}
                maxMembers={10}
                placeholder="Search for users to add to your team..."
                excludeUserIds={user ? [user.id] : []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Gallery</CardTitle>
              <CardDescription>
                Upload images to showcase your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectGalleryUploader
                pendingFiles={pendingFiles}
                setPendingFiles={setPendingFiles}
                onRemoveImage={handleRemoveImage}
              />
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex justify-end gap-4"
        >
          <Button variant="outline" asChild>
            <Link href="/projects">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid()}
            className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </motion.div>
        
        {/* Validation Status */}
        {!isFormValid() && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          >
            <p className="text-sm text-yellow-800">
              <strong>Please complete the following required fields:</strong>
            </p>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              {!formData.title.trim() && <li>• Project title</li>}
              {!formData.description.trim() && <li>• Project description</li>}
              {(!range?.start || !range?.end) && <li>• Timeline (start and end dates)</li>}
              {selectedIndustries.length === 0 && <li>• At least one industry</li>}
              {selectedSkills.length === 0 && <li>• At least one skill</li>}
            </ul>
          </motion.div>
        )}
      </motion.form>
    </motion.div>
  );
}
