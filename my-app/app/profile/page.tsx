"use client";

import { v4 as uuid } from "uuid";
/* ────── React & Next ────── */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

/* ────── Auth & Types ────── */

import { useAuth } from "@/lib/auth";
import { User as UserType } from "@/lib/models/users";

/* ────── Components: UI ────── */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputFile } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TagSelector } from "@/components/profile/tag-selector";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ────── Components: Custom ────── */
import { LinkWithPreview } from "@/components/link-preview";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileTab } from "@/components/profile/profile-tab";
import ProfileCompletionBanner from "@/components/profile/completion-banner";

/* ────── Libs ────── */
import { useIsMobile } from "@/lib/is-mobile";

import { formatDate } from "@/lib/utils";

/* ────── Services ────── */
import { userService } from "@/lib/services/user-service";
import { bookmarkService } from "@/lib/services/bookmark-service";
import { ProjectInquiry, inquiryService } from "@/lib/services/inquiry-service";
import { Project, projectService } from "@/lib/services/project-service";

/* ────── Constants ────── */
import {
  cardVariants,
  containerVariants,
  itemVariants,
  pageVariants,
  skillOptions,
} from "@/lib/constants";

/* ────── Icons ────── */
import {
  CalendarIcon,
  ExternalLink,
  FileText,
  Filter,
  Linkedin,
  Download,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Label } from "@/components/ui/label";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([]);
  const [bookmarkedUsers, setBookmarkedUsers] = useState<UserType[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [receivedInquiries, setReceivedInquiries] = useState<ProjectInquiry[]>(
    []
  );
  const [sentInquiries, setSentInquiries] = useState<ProjectInquiry[]>([]);

  const [isEditOpen, setIsEditOpen] = useState(false);
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

  // Full user data
  const [user, setUser] = useState<UserType | null>(null);

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
  });

  useEffect(() => {
    if (tabFromUrl) {
      const validTabs = ["profile", "projects", "inquiries", "bookmarks"];
      if (validTabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [tabFromUrl]);

  // fetch user and check if profile is complete
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await userService.getUser(currentUser.id);
        if (!userData) {
          throw new Error("User not found");
        }
        console.log("Raw userData:", userData);
        setUser(userData);
        setFormData({
          full_name: userData.full_name || "",
          email: userData.email || "",
          bio: userData.bio || "",
          industry: userData.industry || [],
          skills: userData.skills || [],
          linkedin_url: userData.linkedin_url || "",
          website_url: userData.website_url || "",
          is_texas_am_affiliate: userData.is_texas_am_affiliate || false,
          graduation_year: userData.graduation_year ?? undefined,
          avatar: userData.avatar || "",
          resume_url: userData.resume_url || "",
          contact: {
            email: userData.contact?.email || userData.email || "",
            phone: userData.contact?.phone || "",
          },
        });
        if (userData.industry) {
          setSelectedIndustries(userData.industry);
        }
        if (userData.skills) {
          setSelectedSkills(userData.skills);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [currentUser?.id]);

  // Load bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!currentUser) return;

      try {
        setBookmarksLoading(true);
        const bookmarks = await bookmarkService.getAllBookmarks(currentUser.id);
        setBookmarkedProjects(bookmarks.projects);
        setBookmarkedUsers(bookmarks.users);
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        setError("Failed to load bookmarks. Please try again later.");
      } finally {
        setBookmarksLoading(false);
      }
    };

    fetchBookmarks();
  }, [currentUser]);

  // Load user's projects
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!currentUser) return;

      try {
        setProjectsLoading(true);
        const projects = await projectService.getProjectsByOwnerId(
          currentUser.id
        );
        setUserProjects(projects);
      } catch (err) {
        console.error("Error fetching user projects:", err);
        setError("Failed to load your projects. Please try again later.");
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchUserProjects();
  }, [currentUser]);

  // Load inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      if (!currentUser) return;

      try {
        setInquiriesLoading(true);
        const [received, sent] = await Promise.all([
          inquiryService.getReceivedInquiries(currentUser.id),
          inquiryService.getSentInquiries(currentUser.id),
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
  }, [currentUser]);

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
    if (!currentUser) return;

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
    if (!currentUser) return;

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);

      // 1) upload file to bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuid()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2) get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // 3) update user profile with new avatar URL
      setFormData((prev) => ({
        ...prev,
        avatar: publicUrl,
      }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsSaving(false);
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

  const handleDeleteAvatar = async () => {
    if (!formData.avatar) return;

    try {
      const filePath = formData.avatar.split(
        "/storage/v1/object/public/avatars/"
      )[1];
      if (filePath) {
        await supabase.storage.from("avatars").remove([filePath]);
      }

      setFormData((prev) => ({ ...prev, avatar: "" }));
    } catch (err) {
      console.error("Failed to delete avatar from storage:", err);
      toast.error("Could not delete avatar from storage.");
    }
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);

      const result = await userService.updateUser(user.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        website_url: formData.website_url,
        is_texas_am_affiliate: formData.is_texas_am_affiliate,
        graduation_year: formData.graduation_year,
        avatar: formData.avatar,
        resume_url: formData.resume_url,
        industry: selectedIndustries,
        contact: formData.contact,
        skills: selectedSkills,
      });

      if (result) {
        await refreshProfile();
        setIsEditOpen(false);
        toast.success("Your profile has been updated successfully");
        window.location.reload();
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      // генерируем уникальное имя
      const ext = file.name.split(".").pop();
      const filename = `${uuid()}.${ext}`;
      // заливаем в bucket "resumes"
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filename, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      // получаем публичный URL
      const { data } = supabase.storage.from("resumes").getPublicUrl(filename);
      setFormData((prev) => ({
        ...prev,
        resume_url: data.publicUrl,
      }));
      toast.success("Resume uploaded");
    } catch (err) {
      console.error("Error uploading resume:", err);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
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

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Profile Completion Banner - only shown if needed */}
      <ProfileCompletionBanner visible={showCompletionBanner} />

      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile, projects, inquiries and bookmarks
          </p>
        </div>
      </motion.div>

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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <ProfileCard
          user={user}
          formData={formData}
          setFormData={setFormData}
          selectedIndustries={selectedIndustries}
          setSelectedIndustries={setSelectedIndustries}
          handleAvatarChange={handleAvatarChange}
          handleDeleteAvatar={handleDeleteAvatar}
          handleSwitchChange={handleSwitchChange}
          handleSaveProfile={handleSaveProfile}
          isSaving={isSaving}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="inquiries">Project Inquiries</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <ProfileTab
            isEditOpen={isEditOpen}
            setIsEditOpen={setIsEditOpen}
            isLoading={isLoading}
            user={user}
            formData={formData}
            setFormData={setFormData}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            handleResumeChange={handleResumeChange}
            handleSaveProfile={handleSaveProfile}
            handleChange={handleChange}
            handleContactChange={handleContactChange}
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
                        You haven't created any projects yet. Get started by
                        creating your first project.
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
              <h2 className="text-xl font-semibold">My Bookmarks</h2>
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
                      <h3 className="text-lg font-semibold">
                        Bookmarked Projects
                      </h3>
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
                                        {user.full_name.charAt(0)}
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
