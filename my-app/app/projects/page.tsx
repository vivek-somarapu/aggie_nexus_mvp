"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AvatarGroup from "@/components/profile/profile-avatar";

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
import { Bookmark, Calendar, MapPin, Eye, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  projectService,
  ProjectWithMembers,
  ProjectSearchParams,
} from "@/lib/services/project-service";
import { bookmarkService } from "@/lib/services/bookmark-service";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  pageVariants,
  containerVariants,
  cardVariants,
  buttonVariants,
  projectStatusColors,
  recruitmentStatusColors,
} from "@/lib/constants";

export default function ProjectsPage() {
  const { authUser: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Client-side authentication check
  useEffect(() => {
    // Wait until auth is no longer loading to make a decision
    if (!authLoading && !currentUser) {
      console.log("No authenticated user found, redirecting to login");
      router.push("/auth/login?redirect=" + encodeURIComponent("/projects"));
    }
  }, [currentUser, authLoading, router]);

  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [bookmarkedProjects, setBookmarkedProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tamuFilter, setTamuFilter] = useState("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");

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

  const handleBookmarkToggle = async (
    projectId: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    if (!currentUser) return;

    // ✅ Optimistically update the UI immediately
    const isBookmarked = bookmarkedProjects.includes(projectId);
    setBookmarkedProjects((prev) =>
      isBookmarked
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );

    try {
      const result = await bookmarkService.toggleProjectBookmark(
        currentUser.id,
        projectId
      );

      // ✅ If API failed, revert UI (optional safety)
      if (
        (result.action === "added" && isBookmarked) ||
        (result.action === "removed" && !isBookmarked)
      ) {
        setBookmarkedProjects((prev) =>
          isBookmarked
            ? [...prev, projectId]
            : prev.filter((id) => id !== projectId)
        );
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);

      // ✅ Revert on error
      setBookmarkedProjects((prev) =>
        isBookmarked
          ? [...prev, projectId]
          : prev.filter((id) => id !== projectId)
      );
    }
  };

  // Get all unique industries from projects
  const industries = Array.from(
    new Set(projects.flatMap((project) => project.industry))
  );

  // Filter projects based on filters
  const filteredProjects: ProjectWithMembers[] = projects.filter(
    (project: ProjectWithMembers) => {
      // Filter by industry
      const matchesIndustry =
        industryFilter === "all" || project.industry.includes(industryFilter);

      // Filter by status
      const matchesStatus =
        statusFilter === "all" || project.project_status === statusFilter;

      const isMatch = matchesIndustry && matchesStatus;
      return isMatch;
    }
  );

  // Log filtering results for debugging
  useEffect(() => {
    console.log(
      `Filtering projects: ${projects.length} total, ${filteredProjects.length} after filters`
    );
    console.log(
      `Filters: projectType=${projectTypeFilter}, tamu=${tamuFilter}, industry=${industryFilter}, status=${statusFilter}`
    );
  }, [
    filteredProjects,
    projects,
    projectTypeFilter,
    tamuFilter,
    industryFilter,
    statusFilter,
  ]);

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
          {/* Red accent background for projects */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent rounded-lg -m-4 p-4"></div>
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
              Discover innovative ideas and collaborate on impactful projects
              with fellow Aggies
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button
            asChild
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            <Link href="/projects/new">Create New Project</Link>
          </Button>
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

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Tabs value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
            <TabsList className="mb-4 md:mb-0">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ideas">Ideas</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-4">
            <Tabs value={tamuFilter} onValueChange={setTamuFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tamu">TAMU</TabsTrigger>
                <TabsTrigger value="non-tamu">Non-TAMU</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-lg border-l-4 border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Industry" />
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Idea Phase">Idea Phase</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
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
            ) : filteredProjects.length === 0 ? (
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
            ) : (
              <motion.div
                key="projects"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredProjects.map((project: ProjectWithMembers, index) => (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Link href={`/projects/${project.id}`}>
                      <Card className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600">
                        <CardHeader
                          className="p-4 pt-0 pb-3 flex flex-col"
                          style={{
                            minHeight: 140 /* adjust as needed to fit title + badges + metadata */,
                          }}
                        >
                          {/* Title & bookmark row */}
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug ">
                              {project.title}
                            </CardTitle>

                            <motion.div
                              whileTap={buttonVariants.tap}
                              onClick={(e) =>
                                handleBookmarkToggle(project.id, e)
                              }
                              className="shrink-0"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="bookmark"
                              >
                                <Bookmark
                                  className={`h-4 w-4 transition-colors ${
                                    bookmarkedProjects.includes(project.id)
                                      ? "fill-[#500000] text-[#500000]"
                                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  }`}
                                />
                              </Button>
                            </motion.div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className={clsx(
                                projectStatusColors[project.project_status] ??
                                  "",
                                "border-0"
                              )}
                            >
                              {project.project_status}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={clsx(
                                recruitmentStatusColors[
                                  project.recruitment_status
                                ] ?? "",
                                "border-0"
                              )}
                            >
                              {project.recruitment_status}
                            </Badge>
                          </div>

                          {/* Prominent metadata: location & team size */}
                          <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>{project.location_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <AvatarGroup
                                avatars={[
                                  // Project owner: mark as owner
                                  {
                                    id: project.owner.id,
                                    src:
                                      project.owner.avatar ??
                                      "/placeholder.png",
                                    alt: project.owner.full_name,
                                    label: project.owner.full_name,
                                    isOwner: true,
                                    role: "Owner",
                                  },
                                  // Other members get their actual role
                                  ...(project.members || [])
                                    .filter(
                                      (m) => m.user.id !== project.owner.id
                                    )
                                    .map((m) => ({
                                      id: m.user.id,
                                      src: m.user.avatar ?? "/placeholder.png",
                                      alt: m.user.full_name,
                                      label: m.user.full_name,
                                      role: m.role,
                                    })),
                                ]}
                                maxVisible={4}
                                size={24}
                                overlap={8}
                              />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="px-4 flex-1 flex flex-col">
                          <div className="flex-1 flex flex-col justify-end">
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                              {(() => {
                                const words = project.description.split(" ");
                                return words.length > 25
                                  ? words.slice(0, 25).join(" ") + "..."
                                  : project.description;
                              })()}
                            </p>
                          </div>

                          <div className="flex border-t border-gray-100 items-center gap-1 pt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Posted on {formatDate(project.created_at)}
                            <Eye className="h-3 w-3" />
                            {project.views}
                          </div>

                          {project.industry.length > 0 && (
                            <div className="pt-4 dark:border-gray-700">
                              <div className="flex flex-wrap gap-2">
                                {project.industry
                                  .slice(0, 3)
                                  .map((industry: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      {industry}
                                    </Badge>
                                  ))}
                                {project.industry.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    +{project.industry.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
