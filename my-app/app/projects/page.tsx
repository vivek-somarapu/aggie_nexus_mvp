"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Calendar, MapPin, Users, Eye, Loader2, Grid3x3, List, Filter, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { IncubatorAcceleratorBadges } from "@/components/ui/incubator-accelerator-badge";
import {
  projectService,
  Project,
  ProjectSearchParams,
} from "@/lib/services/project-service";
import { bookmarkService } from "@/lib/services/bookmark-service";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { industryOptions } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
    },
  },
};

const buttonVariants = {
  tap: { scale: 0.98 },
};

export default function ProjectsPage() {
  const { authUser: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Email verification is now handled server-side in middleware

  // Client-side authentication check
  useEffect(() => {
    // Wait until auth is no longer loading to make a decision
    if (!authLoading && !currentUser) {
      console.log("No authenticated user found, redirecting to login");
      router.push("/auth/login?redirect=" + encodeURIComponent("/projects"));
    }
  }, [currentUser, authLoading, router]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [bookmarkedProjects, setBookmarkedProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tamuFilter, setTamuFilter] = useState("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Inquiry dialog state
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState<Record<string, boolean>>({});
  const [inquiryNotes, setInquiryNotes] = useState<Record<string, string>>({});
  const [inquiryErrors, setInquiryErrors] = useState<Record<string, string>>({});
  const [inquirySuccess, setInquirySuccess] = useState<Record<string, boolean>>({});
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState<Record<string, boolean>>({});

  // Fetch projects only when user is authenticated
  useEffect(() => {
    // Skip if auth is still loading or user is not authenticated
    if (authLoading || !currentUser) return;

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const searchParams: ProjectSearchParams = {};

        if (tamuFilter === "tamu") {
          searchParams.tamu = true;
        } else if (tamuFilter === "non-tamu") {
          searchParams.tamu = false;
        }

        if (projectTypeFilter === "ideas") {
          searchParams.is_idea = true;
        } else if (projectTypeFilter === "projects") {
          searchParams.is_idea = false;
        }

        if (searchQuery) {
          searchParams.search = searchQuery;
        }

        console.log("Fetching projects with params:", searchParams);
        const fetchedProjects = await projectService.getProjects(searchParams);
        console.log(`Received ${fetchedProjects.length} projects from API`);

        if (Array.isArray(fetchedProjects)) {
          setProjects(fetchedProjects);
        } else {
          console.error("API did not return an array:", fetchedProjects);
          setError(
            "Received invalid data format from server. Please try again."
          );
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [searchQuery, tamuFilter, projectTypeFilter, currentUser, authLoading]);

  // Fetch bookmarked projects if user is logged in
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!currentUser) return;

      try {
        const bookmarks = await bookmarkService.getProjectBookmarks(
          currentUser.id
        );
        setBookmarkedProjects(bookmarks.map((bookmark) => bookmark.project_id));
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        // Don't set the main error as this is not critical
      }
    };

    fetchBookmarks();
  }, [currentUser]);

  // Log filtering results for debugging (moved here to avoid hook order issues)
  useEffect(() => {
    if (projects.length > 0) {
      console.log(`Projects loaded: ${projects.length} total`);
      console.log(`Filters: projectType=${projectTypeFilter}, tamu=${tamuFilter}, industry=${industryFilter}, status=${statusFilter}`);
    }
  }, [projects.length, projectTypeFilter, tamuFilter, industryFilter, statusFilter]);

  // If auth is still loading or user is not authenticated, show loading state
  if (authLoading || !currentUser) {
    return (
      <motion.div
        className="flex flex-col justify-center items-center py-12 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-lg font-medium">Checking authentication...</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </motion.div>
    );
  }

  const handleBookmarkToggle = async (
    projectId: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault(); // Prevent navigating to project detail

    if (!currentUser) return;

    try {
      setIsBookmarkLoading(true);
      const result = await bookmarkService.toggleProjectBookmark(
        currentUser.id,
        projectId
      );

      if (result.action === "added") {
        setBookmarkedProjects((prev) => [...prev, projectId]);
      } else {
        setBookmarkedProjects((prev) => prev.filter((id) => id !== projectId));
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // Handle opening inquiry dialog
  const handleOpenInquiry = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }
    setInquiryDialogOpen((prev) => ({ ...prev, [projectId]: true }));
    setInquiryErrors((prev) => ({ ...prev, [projectId]: "" }));
    setInquirySuccess((prev) => ({ ...prev, [projectId]: false }));
  };

  // Handle inquiry submission
  const handleInquirySubmit = async (projectId: string) => {
    if (!currentUser) {
      setInquiryErrors((prev) => ({
        ...prev,
        [projectId]: "You must be logged in to submit an inquiry",
      }));
      return;
    }

    const note = inquiryNotes[projectId] || "";
    if (!note.trim()) {
      setInquiryErrors((prev) => ({
        ...prev,
        [projectId]: "Please provide a note about your interest",
      }));
      return;
    }

    try {
      setIsSubmittingInquiry((prev) => ({ ...prev, [projectId]: true }));
      setInquiryErrors((prev) => ({ ...prev, [projectId]: "" }));

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Failed to initialize database client");
      }

      // Check if user already applied to this project
      const { data: existingApplications } = await supabase
        .from("project_applications")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (existingApplications) {
        setInquiryErrors((prev) => ({
          ...prev,
          [projectId]: "You have already submitted an inquiry for this project",
        }));
        setIsSubmittingInquiry((prev) => ({ ...prev, [projectId]: false }));
        return;
      }

      // Submit new application
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("project_applications") as any).insert({
        project_id: projectId,
        user_id: currentUser.id,
        note: note,
        status: "pending",
      });

      if (error) throw error;

      // Show success message and reset form
      setInquirySuccess((prev) => ({ ...prev, [projectId]: true }));
      setInquiryNotes((prev) => ({ ...prev, [projectId]: "" }));

      // Close dialog after a delay
      setTimeout(() => {
        setInquiryDialogOpen((prev) => ({ ...prev, [projectId]: false }));
        setInquirySuccess((prev) => ({ ...prev, [projectId]: false }));
      }, 2000);
    } catch (err: unknown) {
      console.error("Error submitting inquiry:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.";
      setInquiryErrors((prev) => ({
        ...prev,
        [projectId]: errorMessage,
      }));
    } finally {
      setIsSubmittingInquiry((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Get all unique industries from projects
  const industries = industryOptions;

  // Filter projects based on filters
  const filteredProjects = projects.filter((project: Project) => {
    // Filter by industry
    const matchesIndustry =
      industryFilter === "all" || project.industry.includes(industryFilter);

    // Filter by status
    const matchesStatus =
      statusFilter === "all" || project.project_status === statusFilter;

    const isMatch = matchesIndustry && matchesStatus;
    return isMatch;
  });

  // Sort: titles that start with searchQuery first, then those that contain it elsewhere
  const sortedProjects = searchQuery
    ? [...filteredProjects].sort((a, b) => {
        const query = searchQuery.toLowerCase();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aStarts = aTitle.startsWith(query);
        const bStarts = bTitle.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      })
    : filteredProjects;

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative">
          <div className="relative z-10">
            <motion.h1
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Projects
            </motion.h1>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Discover innovative ideas and collaborate on impactful projects with
              fellow Aggies
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <Grid3x3 className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
          </div>
        </motion.div>
      </div>

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

      {/* Filters Section - Collapsible and Prominent */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="border-l-4 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="h-8"
              >
                {filtersOpen ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </CardHeader>
          {filtersOpen && (
            <CardContent className="space-y-4 pt-0">
              {/* Search Bar */}
              <div>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

              {/* Filter Row 1: Project Type and TAMU Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Project Type</label>
          <Tabs value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="ideas" className="flex-1">Ideas</TabsTrigger>
                      <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
            </TabsList>
          </Tabs>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Affiliation</label>
            <Tabs value={tamuFilter} onValueChange={setTamuFilter}>
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="tamu" className="flex-1">TAMU</TabsTrigger>
                      <TabsTrigger value="non-tamu" className="flex-1">Non-TAMU</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

              {/* Filter Row 2: Industry and Status */}
              <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Industry</label>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry: string, index: number) => (
                <SelectItem key={`${industry}-${index}`} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
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
              </div>
            </CardContent>
          )}
        </Card>
        </motion.div>

        <div className="mt-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex flex-col justify-center items-center py-12 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-medium">Loading projects...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment
                  </p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Alert variant="destructive" className="my-8">
                  <AlertDescription className="flex items-center">
                    <span className="font-medium">{error}</span>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </motion.div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : sortedProjects.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg font-medium">No projects found</p>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search criteria
                </p>
              </motion.div>
            ) : viewMode === "grid" ? (
              // Grid View - Enhanced with more information
              <motion.div
                key="projects-grid"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {sortedProjects.map((project: Project, index: number) => {
                  const isIncubator = project.organizations?.some(
                    (org) => org === "Aggies Create Incubator"
                  );
                  const isAccelerator = project.organizations?.some(
                    (org) => org === "AggieX Accelerator"
                  );

                  return (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all relative border-l-.5 min-h-[320px]"
                          style={{
                            borderColor: isIncubator 
                              ? "rgba(251, 190, 36, 0.15)" 
                              : isAccelerator 
                              ? "rgba(255, 0, 0, 0.35)" 
                              : "rgba(255, 255, 255, 0.15)"
                          }}
                        >
                          {/* Subtle gradient background for grid cards */}
                          {isIncubator && (
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-30"
                              style={{
                                background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(229, 231, 235, 0.06) 100%)",
                              }}
                            />
                          )}
                          {isAccelerator && (
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-20"
                              style={{
                                background: "linear-gradient(135deg, rgba(80, 0, 0, 0.06) 0%, rgba(255, 255, 255, 0.02) 25%, rgba(34, 197, 94, 0.04) 50%, rgba(59, 130, 246, 0.05) 75%, rgba(80, 0, 0, 0.06) 100%)",
                              }}
                            />
                          )}
                          <div className="relative z-10 flex flex-col h-full">
                            <Link href={`/projects/${project.id}`} className="block">
                              <CardHeader className="pb-3 pt-4 px-5 cursor-pointer">
                                <div className="flex justify-between items-start gap-3 mb-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                            <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <Avatar className={cn(
                                        "h-16 w-16 shrink-0 ring-2",
                                        isIncubator && "ring-yellow-400 dark:ring-yellow-500",
                                        isAccelerator && "ring-[#500000] dark:ring-[#7A0000]",
                                        !isIncubator && !isAccelerator && "ring-background/50"
                                      )}>
                                        <AvatarImage src={project.logo_url ?? ""} alt={project.title} />
                                        <AvatarFallback className="text-base font-semibold">
                                          {project.title.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </motion.div>
                                    <div className="flex-1 min-w-0 pt-1">
                                      <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-2">{project.title}</h3>
                                      {/* Funding - More Prominent */}
                                      {project.funding_received > 0 && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100/90 dark:bg-green-900/30 border border-green-300/50 dark:border-green-700/50">
                                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                            ${project.funding_received.toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Bookmark Button - More Obvious */}
                                  <motion.div 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => handleBookmarkToggle(project.id, e)}
                                    className="shrink-0"
                            >
                              <Button
                                      variant={bookmarkedProjects.includes(project.id) ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "h-9 px-3 gap-2",
                                        bookmarkedProjects.includes(project.id) 
                                          ? "bg-primary text-primary-foreground" 
                                          : "hover:bg-accent"
                                      )}
                                disabled={isBookmarkLoading}
                              >
                                {isBookmarkLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                        <>
                                  <Bookmark
                                            className={cn(
                                              "h-4 w-4",
                                              bookmarkedProjects.includes(project.id) && "fill-current"
                                            )} 
                                          />
                                          <span className="text-xs font-medium">
                                            {bookmarkedProjects.includes(project.id) ? "Saved" : "Save"}
                                </span>
                                        </>
                                      )}
                              </Button>
                            </motion.div>
                          </div>
                                {/* Status Badges Row */}
                                <div className="flex flex-wrap gap-1.5">
                            {project.is_idea ? (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-yellow-100/90 dark:bg-yellow-900/50">
                                Idea
                              </Badge>
                            ) : (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-100/90 dark:bg-green-900/50">
                                      Project
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    {project.project_status}
                                  </Badge>
                                  {/* Recruitment Status - New */}
                              <Badge
                                variant="outline"
                                    className={cn(
                                      "text-xs px-2 py-0.5 font-medium",
                                      project.recruitment_status === "Actively Recruiting" 
                                        ? "bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-blue-300/50 dark:border-blue-700/50"
                                        : project.recruitment_status === "Not Recruiting"
                                        ? "bg-gray-100/90 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400"
                                        : "bg-orange-100/90 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400"
                                    )}
                                  >
                                    <Users className="h-3 w-3 mr-1 inline" />
                                    {project.recruitment_status}
                              </Badge>
                                  {project.organizations && project.organizations.length > 0 && (isIncubator || isAccelerator) && (
                                    <IncubatorAcceleratorBadges
                                      organizations={project.organizations}
                                      size="sm"
                                      maxDisplay={1}
                                    />
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="px-5 pb-3 flex-1 cursor-pointer">
                                <p className="text-muted-foreground text-sm line-clamp-3 mb-3 leading-relaxed">{project.description}</p>
                              </CardContent>
                            </Link>
                            <CardFooter className="border-t pt-3 pb-4 px-5 flex flex-col gap-3 mt-auto">
                              {/* Industry Tags */}
                              <div className="flex flex-wrap gap-1.5">
                                {project.industry?.slice(0, 4).map((ind: string, indIndex: number) => (
                                  <Badge key={`${project.id}-industry-${indIndex}`} variant="secondary" className="text-xs px-2 py-0.5">
                                    {ind}
                            </Badge>
                                ))}
                                {project.industry && project.industry.length > 4 && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    +{project.industry.length - 4}
                                  </Badge>
                                )}
                                {(!project.industry || project.industry.length === 0) && (
                                  <span className="text-xs text-muted-foreground">No industries</span>
                            )}
                          </div>
                              
                              {/* Contact/Manage Button Section - Prevent navigation from parent Link */}
                              <div 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="w-full"
                              >
                                {/* Contact Button - Only show if user is not the owner */}
                                {currentUser && currentUser.id !== project.owner_id && (
                                  <Dialog 
                                    open={inquiryDialogOpen[project.id] || false} 
                                    onOpenChange={(open) => {
                                      setInquiryDialogOpen((prev) => ({ ...prev, [project.id]: open }));
                                      if (!open) {
                                        setInquiryErrors((prev) => ({ ...prev, [project.id]: "" }));
                                        setInquirySuccess((prev) => ({ ...prev, [project.id]: false }));
                                      }
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2"
                                        onClick={(e) => handleOpenInquiry(project.id, e)}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        Contact Team Lead
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <DialogHeader>
                                        <DialogTitle>Inquire About {project.title}</DialogTitle>
                                        <DialogDescription>
                                          Send a note to the project owner about your interest.
                                          They will be able to see your profile details and contact you back.
                                        </DialogDescription>
                                      </DialogHeader>

                                      {inquirySuccess[project.id] ? (
                                        <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                                          <AlertDescription>
                                            Your inquiry has been submitted successfully! The project owner will review it soon.
                                          </AlertDescription>
                                        </Alert>
                                      ) : (
                                        <>
                                          {inquiryErrors[project.id] && (
                                            <Alert variant="destructive">
                                              <AlertDescription>{inquiryErrors[project.id]}</AlertDescription>
                                            </Alert>
                                          )}

                                          <Textarea
                                            placeholder="Describe why you're interested in this project, your relevant skills, or any questions you have..."
                                            value={inquiryNotes[project.id] || ""}
                                            onChange={(e) =>
                                              setInquiryNotes((prev) => ({
                                                ...prev,
                                                [project.id]: e.target.value,
                                              }))
                                            }
                                            rows={5}
                                            className="resize-none"
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                          />

                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setInquiryDialogOpen((prev) => ({ ...prev, [project.id]: false }));
                                                setInquiryErrors((prev) => ({ ...prev, [project.id]: "" }));
                                              }}
                                              disabled={isSubmittingInquiry[project.id]}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleInquirySubmit(project.id);
                                              }}
                                              disabled={
                                                isSubmittingInquiry[project.id] ||
                                                !inquiryNotes[project.id]?.trim() ||
                                                !currentUser
                                              }
                                            >
                                              {isSubmittingInquiry[project.id] ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Submitting...
                                                </>
                                              ) : (
                                                "Submit Inquiry"
                                              )}
                                            </Button>
                                          </DialogFooter>
                                        </>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                )}
                                {/* Manage Project Button - Only show if user is the owner */}
                                {currentUser && currentUser.id === project.owner_id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    asChild
                                  >
                                    <Link 
                                      href={`/projects/${project.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      Manage Project
                                    </Link>
                                  </Button>
                                )}
                                {/* Login to Contact Button - Only show if user is not logged in */}
                                {!currentUser && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      router.push("/auth/login");
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    Login to Contact
                                  </Button>
                                )}
                              </div>
                            </CardFooter>
                          </div>
                        </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // List View - Existing horizontal layout
              <motion.div
                key="projects-list"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {sortedProjects.map((project: Project, index: number) => {
                  // Check if project is in incubator or accelerator
                  const isIncubator = project.organizations?.some(
                    (org) => org === "Aggies Create Incubator"
                  );
                  const isAccelerator = project.organizations?.some(
                    (org) => org === "AggieX Accelerator"
                  );

                  // Funding display - using if statement
                  let fundingDisplay = null;
                  if (project.funding_received !== undefined && project.funding_received !== 0) {
                    fundingDisplay = (
                      <div className="text-center shrink-0 bg-background/85 backdrop-blur-md px-4 py-2 rounded-lg border shadow-lg">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">
                          Funding
                        </div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          ${project.funding_received.toLocaleString()}
                        </div>
                      </div>
                    );
                  }

                  return (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                        <Card
                          className={cn(
                            "h-full overflow-hidden hover:shadow-lg transition-all relative border-l-.5",
                            isIncubator
                            ? "rgba(251, 190, 36, 0.15)" 
                            : isAccelerator 
                            ? "rgba(255, 0, 0, 0.35)" 
                            : "rgba(255, 255, 255, 0.15)"
                          )}
                        >
                          {/* Animated background gradients - Subtle and slow */}
                          {isIncubator && (
                            <>
                              {/* Gold/White/Grey animated gradient for Incubator - Very subtle */}
                              <div 
                                className="absolute inset-0 pointer-events-none overflow-hidden"
                                style={{
                                  background: "linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(255, 255, 255, 0.04) 20%, rgba(229, 231, 235, 0.05) 40%, rgba(255, 255, 255, 0.03) 60%, rgba(251, 191, 36, 0.05) 80%, rgba(156, 163, 175, 0.04) 100%)",
                                  backgroundSize: "300% 300%",
                                  animation: "gradient-shift 20s ease-in-out infinite",
                                }}
                              />
                              {/* Very subtle shimmer sweep effect */}
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: "linear-gradient(110deg, transparent 40%, rgba(251, 191, 36, 0.04) 50%, transparent 60%)",
                                  backgroundSize: "300% 100%",
                                  animation: "shimmer 15s ease-in-out infinite",
                                }}
                              />
                            </>
                          )}
                          {isAccelerator && (
                            <>
                              {/* Maroon/White/Green/Red/Blue animated gradient for Accelerator - Subtle multi-color effect */}
                              <div 
                                className="absolute inset-0 pointer-events-none overflow-hidden"
                                style={{
                                  background: "linear-gradient(135deg, rgba(80, 0, 0, 0.05) 0%, rgba(255, 255, 255, 0.02) 12%, rgba(34, 197, 94, 0.04) 25%, rgba(255, 255, 255, 0.02) 37%, rgba(239, 68, 68, 0.04) 50%, rgba(255, 255, 255, 0.02) 62%, rgba(59, 130, 246, 0.05) 75%, rgba(255, 255, 255, 0.02) 87%, rgba(80, 0, 0, 0.05) 100%)",
                                  backgroundSize: "500% 500%",
                                  animation: "gradient-shift 25s ease-in-out infinite",
                                }}
                              />
                              {/* Very subtle radial pulse effect */}
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: "radial-gradient(ellipse at 30% 50%, rgba(80, 0, 0, 0.03) 0%, transparent 60%)",
                                  animation: "gradient-pulse 12s ease-in-out infinite",
                                }}
                              />
                              {/* Secondary subtle pulse from different position */}
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: "radial-gradient(ellipse at 70% 30%, rgba(59, 130, 246, 0.025) 0%, transparent 70%)",
                                  animation: "gradient-pulse 16s ease-in-out infinite 4s",
                                }}
                              />
                            </>
                          )}
                          <div className="relative z-10">
                            <Link href={`/projects/${project.id}`} className="block">
                              <CardHeader className="pb-3 pt-4 px-4 cursor-pointer">
                                {/* Top Row: Logo + Name + Funding */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  {/* Left: Logo + Name */}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 10,
                                      }}
                                    >
                                      <Avatar className="h-20 w-20 shrink-0 ring-2 ring-background/50 shadow-sm">
                                        <AvatarImage
                                          src={project.logo_url ?? ""}
                                          alt={`${project.title} logo`}
                                        />
                                        <AvatarFallback className="text-lg font-semibold bg-background/90">
                                          {project.title.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-xl font-bold line-clamp-2 text-foreground drop-shadow-md">
                                        {project.title}
                                      </CardTitle>
                                    </div>
                                  </div>

                                  {/* Right: Funding */}
                                  {fundingDisplay}
                                </div>

                                {/* Status Tags: Idea/Project + Status */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {project.is_idea ? (
                              <Badge
                                variant="outline"
                                      className="bg-yellow-100/90 text-black dark:bg-yellow-900/50 dark:text-yellow-400 backdrop-blur-sm border shadow-sm"
                              >
                                      Idea
                              </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100/90 text-black dark:bg-green-900/50 dark:text-green-400 backdrop-blur-sm border shadow-sm"
                                    >
                                      Project
                            </Badge>
                          )}
                                  <Badge
                                    variant="outline"
                                    className="bg-background/80 backdrop-blur-sm border shadow-sm"
                                  >
                                    {project.project_status}
                                  </Badge>
                                  {project.organizations &&
                                    project.organizations.length > 0 &&
                                    (isIncubator || isAccelerator) && (
                                      <IncubatorAcceleratorBadges
                                        organizations={project.organizations}
                                        size="sm"
                                        maxDisplay={2}
                                      />
                                    )}
                                </div>
                        </CardHeader>

                              {/* Content: Description + Metrics */}
                              <CardContent className="px-4 pb-3 cursor-pointer">
                                {/* Description */}
                                <p className="text-foreground/95 text-lg line-clamp-3 mb-6 font-medium drop-shadow-md bg-background/40 backdrop-blur-sm px-3 py-2 rounded-lg">
                            {project.description}
                          </p>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-foreground/90 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-sm">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-medium">
                                      {project.location_type}
                                    </span>
                            </div>
                                  <div className="flex items-center gap-2 text-foreground/90 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-sm">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-medium">
                                      {formatDate(project.estimated_start)}
                                    </span>
                            </div>
                                  <div className="flex items-center gap-2 text-foreground/90 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-sm">
                                    <Users className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-medium">
                                      {project.recruitment_status}
                                    </span>
                            </div>
                                  <div className="flex items-center gap-2 text-foreground/90 bg-background/60 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-sm">
                                    <Eye className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">{project.views} views</span>
                            </div>
                          </div>
                        </CardContent>
                            </Link>

                            {/* Footer: Industry Tags, Bookmark, and Contact/Manage Buttons */}
                            <CardFooter className="border-t border-border/50 pt-3 px-4 pb-4">
                              <div className="flex flex-col gap-3 w-full">
                                {/* Top Row: Industry Tags */}
                                <div className="flex flex-wrap gap-2">
                                  {project.industry.slice(0, 5).map(
                                    (ind: string, indIndex: number) => (
                            <Badge
                              key={`${project.id}-industry-${indIndex}`}
                              variant="secondary"
                                        className="text-xs bg-background/70 backdrop-blur-sm border shadow-sm"
                            >
                              {ind}
                            </Badge>
                                    )
                                  )}
                                  {project.industry.length > 5 && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs bg-background/70 backdrop-blur-sm border shadow-sm"
                                    >
                                      +{project.industry.length - 5} more
                            </Badge>
                          )}
                                  {project.industry.length === 0 && (
                                    <span className="text-xs text-foreground/70">
                                      No industries specified
                                    </span>
                                  )}
                                </div>
                                
                                {/* Bottom Row: Bookmark and Contact/Manage Buttons */}
                                <div className="flex items-center justify-between gap-4">
                                  {/* Left: Bookmark Button */}
                                  <motion.div
                                    whileTap={buttonVariants.tap}
                                    onClick={(e) =>
                                      handleBookmarkToggle(project.id, e)
                                    }
                                    className="shrink-0"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="lg"
                                      className="h-10 gap-2 items-center bg-background/80 backdrop-blur-md hover:bg-background/95 border shadow-lg"
                                      disabled={isBookmarkLoading}
                                    >
                                      {isBookmarkLoading ? (
                                        <Loader2 className="h-7 w-7 animate-spin" />
                                      ) : (
                                        <>
                                          <span className="text-sm font-medium">
                                            {bookmarkedProjects.includes(project.id)
                                              ? "I'm Interested."
                                              : "Interested?"}
                                          </span>
                                          <Bookmark
                                            className={`h-7 w-7 ${
                                              bookmarkedProjects.includes(
                                                project.id
                                              )
                                                ? "fill-primary text-primary"
                                                : ""
                                            }`}
                                          />
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>

                                  {/* Right: Contact/Manage Button Section - Prevent navigation from parent Link */}
                                  <div 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="shrink-0"
                                  >
                                    {/* Contact Button - Only show if user is not the owner */}
                                    {currentUser && currentUser.id !== project.owner_id && (
                                      <Dialog 
                                        open={inquiryDialogOpen[project.id] || false} 
                                        onOpenChange={(open) => {
                                          setInquiryDialogOpen((prev) => ({ ...prev, [project.id]: open }));
                                          if (!open) {
                                            setInquiryErrors((prev) => ({ ...prev, [project.id]: "" }));
                                            setInquirySuccess((prev) => ({ ...prev, [project.id]: false }));
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-10 gap-2 items-center bg-background/80 backdrop-blur-md hover:bg-background/95 border shadow-lg"
                                            onClick={(e) => handleOpenInquiry(project.id, e)}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                            }}
                                          >
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="text-sm font-medium">Contact Team Lead</span>
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent
                                          onClick={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <DialogHeader>
                                            <DialogTitle>Inquire About {project.title}</DialogTitle>
                                            <DialogDescription>
                                              Send a note to the project owner about your interest.
                                              They will be able to see your profile details and contact you back.
                                            </DialogDescription>
                                          </DialogHeader>

                                          {inquirySuccess[project.id] ? (
                                            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                                              <AlertDescription>
                                                Your inquiry has been submitted successfully! The project owner will review it soon.
                                              </AlertDescription>
                                            </Alert>
                                          ) : (
                                            <>
                                              {inquiryErrors[project.id] && (
                                                <Alert variant="destructive">
                                                  <AlertDescription>{inquiryErrors[project.id]}</AlertDescription>
                                                </Alert>
                                              )}

                                              <Textarea
                                                placeholder="Describe why you're interested in this project, your relevant skills, or any questions you have..."
                                                value={inquiryNotes[project.id] || ""}
                                                onChange={(e) =>
                                                  setInquiryNotes((prev) => ({
                                                    ...prev,
                                                    [project.id]: e.target.value,
                                                  }))
                                                }
                                                rows={5}
                                                className="resize-none"
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                              />

                                              <DialogFooter>
                                                <Button
                                                  variant="outline"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setInquiryDialogOpen((prev) => ({ ...prev, [project.id]: false }));
                                                    setInquiryErrors((prev) => ({ ...prev, [project.id]: "" }));
                                                  }}
                                                  disabled={isSubmittingInquiry[project.id]}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInquirySubmit(project.id);
                                                  }}
                                                  disabled={
                                                    isSubmittingInquiry[project.id] ||
                                                    !inquiryNotes[project.id]?.trim() ||
                                                    !currentUser
                                                  }
                                                >
                                                  {isSubmittingInquiry[project.id] ? (
                                                    <>
                                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                      Submitting...
                                                    </>
                                                  ) : (
                                                    "Submit Inquiry"
                                                  )}
                                                </Button>
                                              </DialogFooter>
                                            </>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                    {/* Manage Project Button - Only show if user is the owner */}
                                    {currentUser && currentUser.id === project.owner_id && (
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-10 gap-2 items-center bg-background/80 backdrop-blur-md hover:bg-background/95 border shadow-lg"
                                        asChild
                                      >
                                        <Link 
                                          href={`/projects/${project.id}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                          <span className="text-sm font-medium">Manage Project</span>
                                        </Link>
                                      </Button>
                                    )}
                                    {/* Login to Contact Button - Only show if user is not logged in */}
                                    {!currentUser && (
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="h-10 gap-2 items-center bg-background/80 backdrop-blur-md hover:bg-background/95 border shadow-lg"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          router.push("/auth/login");
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-sm font-medium">Login to Contact</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                        </CardFooter>
                          </div>
                      </Card>
                  </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </motion.div>
  );
}
