"use client";

/* ────── React & Next ────── */
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import type { Profile } from "@/lib/auth";
/* ────── Auth & Types ────── */

import { Profile as ProfileType, useAuth } from "@/lib/auth";
import { profileSetupStatus } from "@/lib/profile-utils";

/* ────── Components: UI ────── */
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ────── Components: Custom ────── */
import ProfileCompletionBanner from "@/components/profile/completion-banner";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileTab } from "@/components/profile/profile-tab";

/* ────── Libs ────── */

import { formatDate } from "@/lib/utils";

/* ────── Services ────── */
import { bookmarkService } from "@/lib/services/bookmark-service";
import { ProjectInquiry, inquiryService } from "@/lib/services/inquiry-service";
import { Project, projectService } from "@/lib/services/project-service";
import { userService } from "@/lib/services/user-service";

/* ────── Constants ────── */
import { cardVariants, containerVariants, pageVariants } from "@/lib/constants";

/* ────── Icons ────── */
import {
  CalendarIcon,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([]);
  const [bookmarkedUsers, setBookmarkedUsers] = useState<ProfileType[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [receivedInquiries, setReceivedInquiries] = useState<ProjectInquiry[]>(
    []
  );
  const [sentInquiries, setSentInquiries] = useState<ProjectInquiry[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  // Filtering state for inquiries
  const [inquiryType, setInquiryType] = useState<"received" | "sent">(
    "received"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredInquiries, setFilteredInquiries] = useState<ProjectInquiry[]>(
    []
  );
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [resumeFileInfo, setResumeFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    linkedin_url: "",
    website_url: "",
    graduation_year: undefined as number | undefined,
    is_texas_am_affiliate: false,
    avatar: "",
    skills: [] as string[],
    industry: [] as string[],
    resume_url: "",
    contact: { email: "", phone: "" } as { email: string; phone: string },
    additional_links: [] as { url: string; title: string }[],
  });

  // update profile tab url
  const onTabChange = (value: string) => {
    setActiveTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    router.replace(url.toString(), { scroll: false })
  }

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (tabFromUrl) {
      const validTabs = ["profile", "projects", "inquiries", "events", "bookmarks"];
      if (validTabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [tabFromUrl]);

  // fetch user and check if profile is complete
  useEffect(() => {
    if (!profile) {
      setIsLoading(true);
      return;
    }
    setFormData({
      full_name: profile.full_name || "",
      email: profile.email || "",
      bio: profile.bio || "",
      industry: profile.industry || [],
      skills: profile.skills || [],
      linkedin_url: profile.linkedin_url || "",
      website_url: profile.website_url || "",
      is_texas_am_affiliate: profile.is_texas_am_affiliate || false,
      graduation_year: profile.graduation_year ?? undefined,
      avatar: profile.avatar || "",
      resume_url: profile.resume_url || "",
      contact: {
        email: profile.contact?.email || profile.email || "",
        phone: profile.contact?.phone || "",
      },
      additional_links: profile.additional_links || [],
    });

    setSelectedSkills(profile.skills || []);
    setSelectedIndustries(profile.industry || []);

    const { shouldSetupProfile } = profileSetupStatus(profile, true);
    setShowCompletionBanner(shouldSetupProfile);
    setIsLoading(false);
  }, [profile]);

  // Load bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!profile) return;

      try {
        setBookmarksLoading(true);
        const bookmarks = await bookmarkService.getAllBookmarks(profile.id);
        setBookmarkedProjects(bookmarks.projects);
        setBookmarkedUsers(bookmarks.users as unknown as Profile[]);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        setError("Failed to load bookmarks. Please try again later.");
      } finally {
        setBookmarksLoading(false);
      }
    };

    fetchBookmarks();
  }, [profile]);

  // Load user's events
   useEffect(() => {
    const fetchEvents = async () => {
      if (!profile) return;

      try {
        setEventsLoading(true);
        // i think it'd go something like this
        // const events = await rsvpService.get(profile.id); ???
        // set(UserEvents(events)); 
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [profile]);

  // Load user's projects
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!profile) return;

      try {
        setProjectsLoading(true);
        const projects = await projectService.getProjectsByOwnerId(profile.id);
        setUserProjects(projects);
      } catch (err) {
        console.error("Error fetching user projects:", err);
        setError("Failed to load your projects. Please try again later.");
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchUserProjects();
  }, [profile]);

  // Load inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      if (!profile) return;

      try {
        setInquiriesLoading(true);
        const [received, sent] = await Promise.all([
          inquiryService.getReceivedInquiries(profile.id),
          inquiryService.getSentInquiries(profile.id),
        ]);

        setReceivedInquiries(received);
        setSentInquiries(sent);
      } catch (err) {
        console.error("Error fetching inquiries:", err);
        setError("Failed to load inquiries. Please try again later.");
      } finally {
        setInquiriesLoading(false);
      }
    };

    fetchInquiries();
  }, [profile]);

  // Filter inquiries when inquiry type, status filter, or search query changes
  useEffect(() => {
    const inquiriesToFilter =
      inquiryType === "received" ? receivedInquiries : sentInquiries;
    let filtered = [...inquiriesToFilter];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inquiry) => inquiry.status === statusFilter);
    }

    // Apply search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.project_title.toLowerCase().includes(query) ||
          (inquiryType === "received" &&
            inquiry.applicant_name.toLowerCase().includes(query)) ||
          inquiry.note.toLowerCase().includes(query)
      );
    }

    setFilteredInquiries(filtered);
  }, [
    inquiryType,
    statusFilter,
    searchQuery,
    receivedInquiries,
    sentInquiries,
  ]);

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!profile) return;

    try {
      setDeleteInProgress(inquiryId);
      await inquiryService.deleteInquiry(inquiryId);

      // Update the inquiries lists
      setReceivedInquiries(
        receivedInquiries.filter((inq) => inq.id !== inquiryId)
      );
      setSentInquiries(sentInquiries.filter((inq) => inq.id !== inquiryId));
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      setError("Failed to delete inquiry. Please try again.");
    } finally {
      setDeleteInProgress(null);
    }
  };

  const handleUpdateInquiryStatus = async (
    inquiryId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!profile) return;

    try {
      await inquiryService.updateInquiryStatus(inquiryId, status);

      // Update the received inquiries list
      setReceivedInquiries(
        receivedInquiries.map((inq) =>
          inq.id === inquiryId ? { ...inq, status } : inq
        )
      );
    } catch (err) {
      console.error("Error updating inquiry status:", err);
      setError("Failed to update inquiry status. Please try again.");
    }
  };

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
      contact: {
        ...prev.contact,
        [name]: value,
      },
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // 1) upload avatar
      let avatarUrl = formData.avatar;
      if (pendingAvatarFile) {
        avatarUrl = await uploadToBucket("avatars", pendingAvatarFile);
      }

      // 2) upload resume
      let resumeUrl = formData.resume_url;
      if (pendingResumeFile) {
        resumeUrl = await uploadToBucket("resumes", pendingResumeFile);
      }
      // 3) clean up additional links
      const cleanedLinks = (formData.additional_links || []).filter(
        (link) => link.url.trim() !== ""
      );

      // 4) collect form data
      const payload = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        linkedin_url: formData.linkedin_url.trim() || null,
        website_url: formData.website_url.trim() || null,
        is_texas_am_affiliate: formData.is_texas_am_affiliate,
        graduation_year: formData.graduation_year ?? null,
        avatar: avatarUrl || null,
        resume_url: resumeUrl || null,
        industry: selectedIndustries,
        skills: selectedSkills,
        contact: formData.contact,
        additional_links: cleanedLinks,
      };

      // 4) update user profile
      await userService.updateUser(profile.id, payload);
      await refreshProfile();

      // 5) reset form state
      setPendingAvatarFile(null);
      setPendingResumeFile(null);

      toast.success("Profile updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile, please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------
  Helpers that talk to the new API route
--------------------------------------------------*/
  async function uploadToBucket(
    bucket: "avatars" | "resumes",
    file: File
  ): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/upload/${bucket}`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Upload failed");
    }
    return (await res.json()).publicUrl as string;
  }

  async function deleteFromBucket(bucket: "avatars" | "resumes", url: string) {
    console.log(`[deleteFromBucket] DELETE /api/upload/${bucket}`, url);
    const res = await fetch(`/api/upload/${bucket}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await res.json().catch(() => ({}));
    console.log(`[deleteFromBucket] response status=${res.status}`, payload);
    if (!res.ok) {
      throw new Error(payload.error || `Status ${res.status}`);
    }
  }

  /* -------------------------------------------------
  Avatar upload  (POST)
--------------------------------------------------*/
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    // preview
    setFormData((prev) => ({
      ...prev,
      avatar: URL.createObjectURL(file),
    }));
  };

  /* -------------------------------------------------
  Résumé upload  (POST)
--------------------------------------------------*/
  const handleResumeChange = (file: File | null) => {
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setPendingResumeFile(file);
      setFormData((prev) => ({ ...prev, resume_url: blobUrl }));
      setResumeFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      });
    }
  };

  /* -------------------------------------------------
  Avatar delete  (DELETE)
--------------------------------------------------*/
  const handleDeleteAvatar = async () => {
    if (pendingAvatarFile) {
      URL.revokeObjectURL(formData.avatar);
      setPendingAvatarFile(null);
      setFormData((prev) => ({ ...prev, avatar: "" }));
      toast.success("Avatar preview removed");
      return;
    }

    if (!formData.avatar) return;

    try {
      setIsSaving(true);
      await deleteFromBucket("avatars", formData.avatar);
      setFormData((p) => ({ ...p, avatar: "" }));
      toast.success("Avatar removed");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete avatar");
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------
  Résumé delete  (DELETE)
--------------------------------------------------*/
  const handleResumeDelete = async () => {
    if (pendingResumeFile) {
      URL.revokeObjectURL(formData.resume_url);
      setPendingResumeFile(null);
      setFormData((prev) => ({ ...prev, resume_url: "" }));
      setResumeFileInfo(null);
      return;
    }

    if (formData.resume_url) {
      await deleteFromBucket("resumes", formData.resume_url);
      await userService.updateUser(profile!.id, { resume_url: null });
      await refreshProfile();
      setFormData((prev) => ({ ...prev, resume_url: "" }));
      setResumeFileInfo(null);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 w-full"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Profile Completion Banner - only shown if needed */}
      <ProfileCompletionBanner visible={showCompletionBanner} />

      {/* error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full mx-auto space-y-6">
        {/* Profile Card */}
        <ProfileCard
          user={profile}
          formData={formData}
          setFormData={setFormData}
          setSelectedIndustries={setSelectedIndustries}
          handleAvatarChange={handleAvatarChange}
          handleDeleteAvatar={handleDeleteAvatar}
          handleSaveProfile={handleSaveProfile}
          isSaving={isSaving}
          showCompletionBanner={showCompletionBanner}
        />

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full"> 
          <div className="hidden sm:flex justify-center mb-4">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="inquiries">Project Inquiries</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </div>

          {/* Dropdown for mobile */}
          <div className="sm:hidden mb-4">
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger className="w-full h-10 px-3 text-sm border rounded-lg">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="projects">My Projects</SelectItem>
              <SelectItem value="inquiries">Project Inquiries</SelectItem>
              <SelectItem value="bookmarks">Bookmarks</SelectItem>
              <SelectItem value="events">Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

          {/* Profile Tab */}
          <ProfileTab
            isLoading={isLoading}
            user={profile}
            formData={formData}
            setFormData={setFormData}
            setSelectedSkills={setSelectedSkills}
            handleSaveProfile={handleSaveProfile}
            handleChange={handleChange}
            handleContactChange={handleContactChange}
            resumeUrl={formData.resume_url || null}
            fileInfo={resumeFileInfo || undefined}
            onResumeChange={handleResumeChange}
            onResumeDelete={handleResumeDelete}
          />

          {/* My Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Projects</h2>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Link>
                </Button>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {projectsLoading ? (
                <motion.div
                  key="loading"
                  className="flex justify-center items-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2">Loading your projects...</span>
                </motion.div>
              ) : userProjects.length === 0 ? (
                <motion.div
                  key="no-projects"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-lg font-medium mb-2">
                        No projects yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {
                          "You haven't created any projects yet. Get started by creating your first project."
                        }
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button asChild>
                          <Link href="/projects/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                          </Link>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="projects"
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {userProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      variants={cardVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card className="shadow-sm h-full flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {project.is_idea ? (
                              <Badge variant="outline">Idea</Badge>
                            ) : (
                              <Badge variant="outline">Project</Badge>
                            )}
                            <Badge variant="outline">
                              {project.project_status}
                            </Badge>
                            <Badge variant="outline">
                              {project.recruitment_status}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">
                            {project.title}
                          </CardTitle>
                          <CardDescription>
                            Created on {formatDate(project.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {project.industry.slice(0, 3).map((ind) => (
                              <Badge
                                key={ind}
                                variant="secondary"
                                className="text-xs"
                              >
                                {ind}
                              </Badge>
                            ))}
                            {project.industry.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.industry.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-3 flex justify-between">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/edit/${project.id}`}>
                              <PenLine className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Project Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
            <motion.div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div>
                <h2 className="text-xl font-semibold">Project Inquiries</h2>
                <p className="text-muted-foreground">
                  Manage inquiries for your projects and track your applications
                </p>
              </div>
              <Select
                value={inquiryType}
                onValueChange={(value: "received" | "sent") =>
                  setInquiryType(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received Inquiries</SelectItem>
                  <SelectItem value="sent">Sent Inquiries</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Filtering controls */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inquiries..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {inquiriesLoading ? (
                <motion.div
                  key="loading"
                  className="flex justify-center items-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2">Loading inquiries...</span>
                </motion.div>
              ) : filteredInquiries.length === 0 ? (
                <motion.div
                  key="no-inquiries"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-lg font-medium mb-2">
                        No inquiries found
                      </h3>
                      <p className="text-muted-foreground">
                        {(inquiryType === "received"
                          ? receivedInquiries
                          : sentInquiries
                        ).length > 0
                          ? "Try adjusting your search filters"
                          : inquiryType === "received"
                          ? "When users express interest in your projects, they'll appear here"
                          : "You haven't submitted any project inquiries yet"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="inquiries"
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredInquiries.map((inquiry) => (
                    <motion.div
                      key={inquiry.id}
                      variants={cardVariants}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                      <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {inquiry.project_title}
                              </CardTitle>
                              <CardDescription>
                                {inquiryType === "received"
                                  ? `Inquiry received ${new Date(
                                      inquiry.created_at
                                    ).toLocaleDateString()}`
                                  : `Submitted on ${new Date(
                                      inquiry.created_at
                                    ).toLocaleDateString()}`}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                inquiry.status === "pending"
                                  ? "outline"
                                  : inquiry.status === "accepted"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {inquiry.status.charAt(0).toUpperCase() +
                                inquiry.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                          {inquiryType === "received" ? (
                            <>
                              <div className="md:col-span-1">
                                <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage
                                      src={inquiry.applicant_avatar || ""}
                                      alt={inquiry.applicant_name}
                                    />
                                    <AvatarFallback>
                                      {inquiry.applicant_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-center sm:text-left md:text-center">
                                    <h3 className="font-medium">
                                      {inquiry.applicant_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {inquiry.applicant_email}
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      asChild
                                    >
                                      <Link href={`/users/${inquiry.user_id}`}>
                                        <User className="h-3 w-3 mr-1" />
                                        View Profile
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <h3 className="font-medium mb-2">
                                  Note from Applicant:
                                </h3>
                                <blockquote className="text-muted-foreground border-l-2 pl-4 italic">
                                  {inquiry.note}
                                </blockquote>
                              </div>
                            </>
                          ) : (
                            <div className="md:col-span-3">
                              <h3 className="font-medium mb-2">Your Note:</h3>
                              <blockquote className="text-muted-foreground border-l-2 pl-4 italic mb-4">
                                {inquiry.note}
                              </blockquote>
                              <div className="flex gap-2 flex-wrap">
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Submitted:
                                  </span>
                                  <span>{formatDate(inquiry.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Status:
                                  </span>
                                  <span>
                                    {inquiry.status.charAt(0).toUpperCase() +
                                      inquiry.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex justify-between">
                          {inquiryType === "received" ? (
                            <>
                              <Button variant="outline" asChild>
                                <a href={`mailto:${inquiry.applicant_email}`}>
                                  Reply via Email
                                </a>
                              </Button>
                              <div className="flex gap-2">
                                {inquiry.status === "pending" && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateInquiryStatus(
                                          inquiry.id,
                                          "accepted"
                                        )
                                      }
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateInquiryStatus(
                                          inquiry.id,
                                          "rejected"
                                        )
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteInProgress === inquiry.id}
                                  onClick={() =>
                                    handleDeleteInquiry(inquiry.id)
                                  }
                                >
                                  {deleteInProgress === inquiry.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" asChild>
                                <Link href={`/projects/${inquiry.project_id}`}>
                                  View Project
                                </Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteInProgress === inquiry.id}
                                onClick={() => handleDeleteInquiry(inquiry.id)}
                              >
                                {deleteInProgress === inquiry.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Withdraw Inquiry
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-6">
            <motion.div
              className="flex justify-between items-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold">Bookmarked Projects</h2>
            </motion.div>

            <AnimatePresence mode="wait">
              {bookmarksLoading ? (
                <motion.div
                  key="loading"
                  className="flex justify-center items-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2">Loading your bookmarks...</span>
                </motion.div>
              ) : bookmarkedProjects.length === 0 &&
                bookmarkedUsers.length === 0 ? (
                <motion.div
                  key="no-bookmarks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-lg font-medium mb-2">
                        No bookmarks yet
                      </h3>
                      <p className="text-muted-foreground">
                        Bookmark projects and users to keep track of interesting
                        content.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <>
                  {bookmarkedProjects.length > 0 && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="grid gap-4 md:grid-cols-2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {bookmarkedProjects.map((project) => (
                          <motion.div
                            key={project.id}
                            variants={cardVariants}
                            whileHover={{
                              y: -5,
                              transition: { duration: 0.2 },
                            }}
                          >
                            <Card className="shadow-sm h-full hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {project.is_idea ? (
                                    <Badge variant="outline">Idea</Badge>
                                  ) : (
                                    <Badge variant="outline">Project</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {project.recruitment_status}
                                  </Badge>
                                </div>
                                <CardTitle className="text-lg">
                                  {project.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {project.description}
                                </p>
                              </CardContent>
                              <CardFooter className="border-t pt-3">
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="w-full"
                                >
                                  <Button
                                    className="w-full"
                                    variant="outline"
                                    asChild
                                  >
                                    <Link href={`/projects/${project.id}`}>
                                      View Project
                                    </Link>
                                  </Button>
                                </motion.div>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {bookmarkedUsers.length > 0 && (
                    <motion.div
                      className="space-y-4 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold">
                        Bookmarked Users
                      </h3>
                      <motion.div
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {bookmarkedUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            variants={cardVariants}
                            whileHover={{
                              y: -5,
                              transition: { duration: 0.2 },
                            }}
                          >
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-4">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage
                                        src={user.avatar || ""}
                                        alt={user.full_name}
                                      />
                                      <AvatarFallback>
                                        {user.full_name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {user.full_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {user.bio}
                                    </p>
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        asChild
                                      >
                                        <Link href={`/users/${user.id}`}>
                                          View Profile
                                        </Link>
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <motion.div
              className="flex justify-between items-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold">My Events</h2>
            </motion.div>

            <AnimatePresence mode="wait">
              {eventsLoading ? (
                <motion.div
                  key="loading"
                  className="flex justify-center items-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2">Loading your events...</span>
                </motion.div>
              ) : bookmarkedProjects.length === 0 &&
                bookmarkedUsers.length === 0 ? (
                <motion.div
                  key="no-events"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                      <h3 className="text-lg font-medium mb-2">
                        No events yet
                      </h3>
                      <p className="text-muted-foreground">
                        Explore upcoming events and join the ones that interest you!
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <>
                  {bookmarkedProjects.length > 0 && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="grid gap-4 md:grid-cols-2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {bookmarkedProjects.map((project) => (
                          <motion.div
                            key={project.id}
                            variants={cardVariants}
                            whileHover={{
                              y: -5,
                              transition: { duration: 0.2 },
                            }}
                          >
                            <Card className="shadow-sm h-full hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {project.is_idea ? (
                                    <Badge variant="outline">Idea</Badge>
                                  ) : (
                                    <Badge variant="outline">Project</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {project.recruitment_status}
                                  </Badge>
                                </div>
                                <CardTitle className="text-lg">
                                  {project.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {project.description}
                                </p>
                              </CardContent>
                              <CardFooter className="border-t pt-3">
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="w-full"
                                >
                                  <Button
                                    className="w-full"
                                    variant="outline"
                                    asChild
                                  >
                                    <Link href={`/projects/${project.id}`}>
                                      View Project
                                    </Link>
                                  </Button>
                                </motion.div>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {bookmarkedUsers.length > 0 && (
                    <motion.div
                      className="space-y-4 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold">
                        Bookmarked Users
                      </h3>
                      <motion.div
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {bookmarkedUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            variants={cardVariants}
                            whileHover={{
                              y: -5,
                              transition: { duration: 0.2 },
                            }}
                          >
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-4">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <Avatar className="h-16 w-16">
                                      <AvatarImage
                                        src={user.avatar || ""}
                                        alt={user.full_name}
                                      />
                                      <AvatarFallback>
                                        {user.full_name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {user.full_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {user.bio}
                                    </p>
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        asChild
                                      >
                                        <Link href={`/users/${user.id}`}>
                                          View Profile
                                        </Link>
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
