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
import { Bookmark, Calendar, MapPin, Users, Eye, Loader2 } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

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

  // Get all unique industries from projects
  const industries = Array.from(
    new Set(projects.flatMap((project) => project.industry))
  );

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
              Discover innovative ideas and collaborate on impactful projects with
              fellow Aggies
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
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
            ) : (
              <motion.div
                key="projects"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {sortedProjects.map((project: Project, index: number) => (
                  <motion.div
                    key={project.id}
                    variants={cardVariants}
                    custom={index}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Link href={`/projects/${project.id}`}>
                      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="line-clamp-1">
                              {project.title}
                            </CardTitle>
                            <motion.div
                              whileTap={buttonVariants.tap}
                              onClick={(e) =>
                                handleBookmarkToggle(project.id, e)
                              }
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isBookmarkLoading}
                              >
                                {isBookmarkLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Bookmark
                                    className={`h-4 w-4 ${
                                      bookmarkedProjects.includes(project.id)
                                        ? "fill-primary"
                                        : ""
                                    }`}
                                  />
                                )}
                                <span className="sr-only">
                                  Bookmark project
                                </span>
                              </Button>
                            </motion.div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.is_idea ? (
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-black"
                              >
                                Idea
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-black"
                              >
                                Project
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {project.project_status}
                            </Badge>
                            {project.organizations && project.organizations.length > 0 && (
                              project.organizations.some(org => 
                                org === 'Aggies Create Incubator' || org === 'AggieX Accelerator'
                              ) && (
                                <IncubatorAcceleratorBadges organizations={project.organizations} size="sm" maxDisplay={2}/>
                              )
                            )}
                          </div>
                          {/* Organization Tags */}
                          {project.organizations && project.organizations
                            .filter((org: string) => org !== 'Aggies Create Incubator' && org !== 'AggieX Accelerator')
                            .slice(0, 2)
                            .map((org: string, orgIndex: number) => (
                              <Badge
                                key={`${project.id}-org-${orgIndex}`}
                                variant="outline"
                                className="text-xs"
                              >
                                {org}
                              </Badge>
                            ))}
                          {project.organizations && project.organizations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.organizations.length - 2}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground line-clamp-3 mb-4">
                            {project.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{project.location_type}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(project.estimated_start)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{project.recruitment_status}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              <span>{project.views} views</span>
                            </div>
                          </div>
                          
                          {/* Funding Information */}
                          {project.funding_received !== null && project.funding_received !== undefined && project.funding_received > 0 && (
                            <div className="flex items-center gap-1 text-green-600 font-medium col-span-2">
                              <span className="text-xs">💰</span>
                              <span className="text-xs">${project.funding_received.toLocaleString()} funding</span>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                          {project.industry.slice(0, 3).map((ind: string, indIndex: number) => (
                            <Badge
                              key={`${project.id}-industry-${indIndex}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ind}
                            </Badge>
                          ))}
                          {project.industry.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.industry.length - 3}
                            </Badge>
                          )}
                          
                        </CardFooter>
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
