"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ProjectMember,
  UserSearchSelector,
} from "@/components/ui/user-search-selector";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar-range";
import { TagSelector } from "@/components/ui/search-tag-selector";
import { ChevronLeft, Loader2, X } from "lucide-react";

import { useAuth } from "@/lib/auth";
import {
  industryOptions,
  industrySkillsMap,
  projectStatusOptions,
  recruitmentStatusOptions,
  locationTypeOptions,
  skillOptions,
} from "@/lib/constants";
import { projectService } from "@/lib/services/project-service";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Range = { start: Date | null; end: Date | null };

export default function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;

  /* -------------- auth + routing -------------- */
  const { authUser: user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  /* -------------- component state -------------- */
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);

  /* form‑field state */
  const [descriptionWords, setDescriptionWords] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [range, setRange] = useState<Range | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_idea: true,
    recruitment_status: "Not Recruiting",
    industry: [] as string[],
    required_skills: [] as string[],
    location_type: "Remote",
    contact_info: { email: "", phone: "" },
    project_status: "Idea Phase",
  });

  const [originalMembers, setOriginalMembers] = useState<ProjectMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<ProjectMember[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ---------- fetch existing project ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        const project = await projectService.getProject(projectId);

        if (!project) return setNotFound(true);
        if (user && project.owner_id !== user.id) return setNotAuthorized(true);

        /* hydrate state */
        setFormData({
          title: project.title ?? "",
          description: project.description ?? "",
          is_idea: project.is_idea ?? false,
          recruitment_status: project.recruitment_status ?? "Not Recruiting",
          industry: project.industry ?? [],
          required_skills: project.required_skills ?? [],
          location_type: project.location_type ?? "Remote",
          contact_info: {
            email: project.contact_info?.email ?? "",
            phone: project.contact_info?.phone ?? "",
          },
          project_status: project.project_status ?? "Not Started",
        });

        setSelectedIndustries(project.industry ?? []);
        setSelectedSkills(project.required_skills ?? []);

        /* calendar range */
        setRange({
          start: project.estimated_start
            ? new Date(project.estimated_start)
            : null,
          end: project.estimated_end ? new Date(project.estimated_end) : null,
        });

        /* word counter */
        setDescriptionWords(
          (project.description ?? "").trim().split(/\s+/).filter(Boolean).length
        );
      } catch (e) {
        setError("Failed to load project. Please try again.");
      } finally {
        setIsLoading(false);
      }

      const members = await projectService.getProjectMembers(projectId);
      setOriginalMembers(members);
      setSelectedMembers(members);
    };

    if (!authLoading) load();
  }, [authLoading, projectId, user]);

  /* ---------- derived helpers ---------- */
  const availableSkills = selectedIndustries.length
    ? [
        ...new Set(
          selectedIndustries.flatMap((i) => industrySkillsMap[i] ?? [])
        ),
      ].sort()
    : skillOptions;

  /* ---------- generic handlers ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "description") {
      setDescriptionWords(value.trim().split(/\s+/).filter(Boolean).length);
    }
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      contact_info: { ...p.contact_info, [name]: value },
    }));
  };

  const handleSelectChange = (k: keyof typeof formData, v: string) =>
    setFormData((p) => ({ ...p, [k]: v }));

  const handleSwitchChange = (checked: boolean) =>
    setFormData((p) => ({
      ...p,
      is_idea: checked,
      project_status: checked ? "Idea Phase" : p.project_status,
    }));

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError("You must be logged in");

    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    }
    if (!formData.description.trim()) {
      errors.description = "Project description is required";
    } else if (descriptionWords > 400) {
      errors.description = "Must be 400 words or fewer";
    }

    if (!range?.start || !range?.end) {
      errors.timeline = "Both start & end dates are required";
    } else if (range.start > range.end) {
      errors.timeline = "End date can’t be before start";
    }

    if (selectedIndustries.length === 0) {
      errors.industry = "Select at least one industry";
    }
    if (selectedSkills.length === 0) {
      errors.skills = "Select at least one skill";
    }
    for (const m of selectedMembers) {
      if (!m.role.trim()) {
        errors.members = `Role is required for ${m.user.full_name}`;
        break;
      }
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    // clear any old errors
    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);

    // All validations passed
    try {
      setIsSubmitting(true);
      setError(null);

      await projectService.updateProject(projectId, {
        ...formData,
        industry: selectedIndustries,
        required_skills: selectedSkills,
        estimated_start: range.start.toISOString(),
        estimated_end: range.end.toISOString(),
      });

      toast.success("Project updated successfully!");
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.message ?? "Update failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMembersChange = async (newList: ProjectMember[]) => {
    // who was removed?
    const removedIds = originalMembers
      .map((m) => m.user_id)
      .filter((id) => !newList.some((m) => m.user_id === id));

    // who was added?
    const added = newList.filter(
      (m) => !originalMembers.some((om) => om.user_id === m.user_id)
    );

    try {
      // 1) delete removals
      for (const uid of removedIds) {
        await projectService.removeProjectMember(projectId, uid);
      }

      // 2) add additions
      if (added.length) {
        await projectService.addProjectMembers(
          projectId,
          added.map((m) => ({ user_id: m.user_id, role: m.role }))
        );
      }

      // 3) on success, update both lists
      setOriginalMembers(newList);
      setSelectedMembers(newList);
      toast.success("Team updated");
    } catch (err) {
      console.error("Team update error:", err);
      toast.error("Failed to update team");
    }
  };

  /* ---------- render ---------- */
  if (authLoading || isLoading)
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (notFound)
    return (
      <Alert className="container py-8">
        <AlertDescription>
          Project not found.{" "}
          <Link href="/projects" className="underline">
            Browse
          </Link>
        </AlertDescription>
      </Alert>
    );

  if (notAuthorized)
    return (
      <Alert className="container py-8">
        <AlertDescription>
          You don’t have permission to edit this project.
          <Link href={`/projects/${projectId}`} className="underline ml-1">
            View project
          </Link>
        </AlertDescription>
      </Alert>
    );

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
        <h1 className="text-3xl font-bold text-center">Edit Project</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* ---------- BASIC ---------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your project details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={
                  fieldErrors.title ? "border-red-500 focus:ring-red-500" : ""
                }
                required
              />
              {fieldErrors.title && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.title}</p>
              )}
            </div>

            {/* description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project (max 400 words)"
                rows={5}
                className={
                  fieldErrors.description
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }
                required
              />
              {fieldErrors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {fieldErrors.description}
                </p>
              )}
              <div className="text-right text-sm">
                <span
                  className={
                    descriptionWords > 400
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }
                >
                  {descriptionWords}/400 words
                </span>
              </div>
            </div>

            {/* idea switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_idea"
                checked={formData.is_idea}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_idea">
                This is just an idea (not active yet)
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* status */}
              <div className="space-y-2">
                <Label>Project Status</Label>
                <Select
                  value={formData.project_status}
                  onValueChange={(v) => handleSelectChange("project_status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* location */}
              <div className="space-y-2">
                <Label>Location Type</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(v) => handleSelectChange("location_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- TIMELINE & RECRUITMENT ---------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Timeline & Recruitment</CardTitle>
            <CardDescription>
              Adjust dates or recruitment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* calendar */}
              <div className="space-y-2">
                <Label>Estimated Timeline</Label>
                <Calendar value={range} onChange={setRange} allowClear />
                {fieldErrors.timeline && (
                  <p className="text-red-600 text-sm mt-1">
                    {fieldErrors.timeline}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-700">
                  {range?.start && range?.end
                    ? `${format(range.start, "MMM dd, yyyy")} – ${format(
                        range.end,
                        "MMM dd, yyyy"
                      )}`
                    : range?.start
                    ? `Start: ${format(range.start, "MMM dd, yyyy")} (end TBD)`
                    : "No date selected"}
                </p>
              </div>

              {/* recruitment */}
              <div className="space-y-2">
                <Label>Recruitment Status</Label>
                <Select
                  value={formData.recruitment_status}
                  onValueChange={(v) =>
                    handleSelectChange("recruitment_status", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {recruitmentStatusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- INDUSTRIES & SKILLS ---------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Industries & Skills</CardTitle>
            <CardDescription>Categorise your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* industries */}
            <TagSelector
              label="Industries"
              options={industryOptions}
              selected={selectedIndustries}
              onChange={setSelectedIndustries}
              maxTags={10}
              placeholder="Type and press Enter"
            />
            {fieldErrors.industry && (
              <p className="text-red-600 text-sm mt-1">
                {fieldErrors.industry}
              </p>
            )}

            <Separator />

            {/* skills */}
            <TagSelector
              label="Required Skills"
              options={availableSkills}
              selected={selectedSkills}
              onChange={setSelectedSkills}
              maxTags={10}
              placeholder="Type and press Enter"
            />
            {fieldErrors.industry && (
              <p className="text-red-600 text-sm mt-1">
                {fieldErrors.industry}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Add or remove collaborators on this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserSearchSelector
              selectedMembers={selectedMembers}
              excludeUserIds={user ? [user.id] : []}
              onChange={handleMembersChange}
              maxMembers={10}
              placeholder="Search users to add…"
            />
          </CardContent>
        </Card>

        {/* ---------- CONTACT ---------- */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How can collaborators reach you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.contact_info.email}
                  onChange={handleContactChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  name="phone"
                  value={formData.contact_info.phone || ""}
                  onChange={handleContactChange}
                  placeholder="(123) 456‑7890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------- ACTIONS ---------- */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
              </>
            ) : (
              "Update Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
