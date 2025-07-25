"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import clsx from "clsx";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Bookmark,
  Calendar,
  ChevronLeft,
  Clock,
  Eye,
  Flag,
  Phone,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Share2,
  User,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { projectService, Project } from "@/lib/services/project-service";
import { userService } from "@/lib/services/user-service";
import { User as UserType } from "@/lib/models/users";
import { bookmarkService } from "@/lib/services/bookmark-service";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import {
  projectStatusColors,
  recruitmentStatusColors,
  badgeShadowVariants,
} from "@/lib/constants";

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const { authUser: currentUser, isAuthReady } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [owner, setOwner] = useState<UserType | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarProjects, setSimilarProjects] = useState<Project[]>([]);

  // Inquiry dialog state
  const [inquiryNote, setInquiryNote] = useState("");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Fetch project data - independent of auth state
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project
        const fetchedProject = await projectService.getProject(id);
        if (!fetchedProject) {
          notFound();
        }
        setProject(fetchedProject);

        // Fetch project owner
        if (fetchedProject.owner_id) {
          const fetchedOwner = await userService.getUser(
            fetchedProject.owner_id
          );
          setOwner(fetchedOwner);
        }

        // Fetch similar projects
        const allProjects = await projectService.getProjects();
        const similar = allProjects
          .filter(
            (p) =>
              p.id !== id &&
              p.industry.some((i) => fetchedProject.industry.includes(i))
          )
          .slice(0, 3);
        setSimilarProjects(similar);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id]); // Only depend on project ID, not auth state

  // Separate effect for bookmark data - only runs when auth is ready and user exists
  useEffect(() => {
    const fetchBookmarkData = async () => {
      if (!currentUser || !project) return;

      try {
        setIsBookmarkLoading(true);
        const bookmarks = await bookmarkService.getProjectBookmarks(
          currentUser.id
        );
        const isProjectBookmarked = bookmarks.some((b) => b.project_id === id);
        setIsBookmarked(isProjectBookmarked);
      } catch (err) {
        console.error("Error fetching bookmark data:", err);
        // Don't show error for bookmark fetch failure
      } finally {
        setIsBookmarkLoading(false);
      }
    };

    if (isAuthReady && currentUser && project) {
      fetchBookmarkData();
    }
  }, [isAuthReady, currentUser?.id, project?.id]); // Use stable auth ready state

  const handleEdit = async () => {
    redirect(`/projects/edit/${project?.id}`);
  };

  const handleBookmarkToggle = async () => {
    if (!currentUser || !project) return;

    try {
      setIsBookmarkLoading(true);
      const result = await bookmarkService.toggleProjectBookmark(
        currentUser.id,
        project.id
      );
      setIsBookmarked(result.action === "added");
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  // Handle inquiry submission
  const handleInquirySubmit = async () => {
    if (!currentUser || !project) {
      setInquiryError("You must be logged in to submit an inquiry");
      return;
    }

    if (!inquiryNote.trim()) {
      setInquiryError("Please provide a note about your interest");
      return;
    }

    try {
      setIsSubmitting(true);
      setInquiryError(null);

      const supabase = createClient();

      // Check if user already applied to this project
      const { data: existingApplications } = await supabase
        .from("project_applications")
        .select("id")
        .eq("project_id", project.id)
        .eq("user_id", currentUser.id)
        .single();

      if (existingApplications) {
        setInquiryError(
          "You have already submitted an inquiry for this project"
        );
        return;
      }

      // Submit new application
      const { error } = await supabase.from("project_applications").insert({
        project_id: project.id,
        user_id: currentUser.id,
        note: inquiryNote,
        status: "pending",
      });

      if (error) throw error;

      // Show success message and reset form
      setInquirySuccess(true);
      setInquiryNote("");

      // Close dialog after a delay
      setTimeout(() => {
        setIsInquiryOpen(false);
        setInquirySuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting inquiry:", err);
      setInquiryError(
        err?.message || "Failed to submit inquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading project details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return notFound();
  }

  const isOwner = currentUser?.id === project.owner_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Main Content - Left Column */}
        <div className="md:col-span-3 space-y-6">
          <Card className="shadow-sm gap-0">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.is_idea ? (
                      <Badge
                        variant="outline"
                        className={clsx(
                          "bg-yellow-100 text-black border-none transition-shadow",
                          "hover:shadow-[0_0_6px_2px_rgba(250,204,21,0.30)]" // yellow-ish glow (#facc15)
                        )}
                      >
                        Idea
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={clsx(
                          "bg-green-100 text-black border-none transition-shadow",
                          "hover:shadow-[0_0_6px_2px_rgba(31,160,78,0.30)]" // green glow
                        )}
                      >
                        Project
                      </Badge>
                    )}

                    <Badge
                      className={clsx(
                        "border-none transition-shadow", // keep base styles
                        projectStatusColors[project.project_status] ??
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {project.project_status}
                    </Badge>

                    <Badge
                      className={clsx(
                        "border-none transition-shadow",
                        recruitmentStatusColors[project.recruitment_status] ??
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {project.recruitment_status}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <div className="my-2 flex flex-wrap items-center gap-6 text-xs dark:text-slate-100">
                    {/* ✅ Date */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 flex-col overflow-hidden rounded-sm border bg-background text-center shadow-sm">
                        <div className="bg-muted py-[2px] text-[9px] font-medium leading-none dark:text-slate-100">
                          {format(
                            new Date(project.estimated_start!),
                            "MMM"
                          ).toUpperCase()}
                        </div>
                        <div className="pt-[1px] text-[13px] font-extrabold leading-none text-foreground dark:text-slate-100">
                          {format(new Date(project.estimated_start!), "d")}
                        </div>
                      </div>
                      <p className="font-medium">
                        {format(new Date(project.estimated_start!), "MMM d")}
                        {project.estimated_end &&
                          ` – ${format(
                            new Date(project.estimated_end!),
                            "MMM d"
                          )}`}
                      </p>
                    </div>

                    {/* ✅ Location */}
                    {project.location_type && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{project.location_type}</p>
                      </div>
                    )}
                  </div>

                  {owner && (
                    <Link
                      href={`/users/${owner.id}`}
                      className="flex items-center gap-2 group"
                    >
                      {/* Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                        className="h-8 w-8 relative rounded-full border overflow-hidden bg-muted border-border flex items-center justify-center transition-transform duration-200"
                      >
                        {!owner.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : owner.avatar ? (
                          <Image
                            src={owner.avatar}
                            alt={owner.full_name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            priority
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-muted">
                            <span className="text-xs font-medium text-[#500000]">
                              {owner.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </motion.div>
                      <span className="text-sm font-semibold text-muted-foreground group-hover:underline group-hover:text-foreground">
                        Hosted by {owner.full_name}
                      </span>
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentUser?.id == owner?.id && (
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit project</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleBookmarkToggle}
                    disabled={isBookmarkLoading || !currentUser}
                  >
                    {isBookmarkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark
                        className={`h-4 w-4 ${
                          isBookmarked ? "fill-current" : ""
                        }`}
                      />
                    )}
                    <span className="sr-only">
                      {isBookmarked ? "Remove bookmark" : "Bookmark project"}
                    </span>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share project</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {project.description}
                </p>
              </div>
              {/* ✅ Subtle metadata under description */}
              <div className="flex border-t items-center gap-2 pt-3 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Posted on {formatDate(project.created_at)}
                <Separator orientation="vertical" className="h-3" />
                <Eye className="h-3 w-3" />
                {project.views} views
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <section className="space-y-4">
                  {/* ✅ Contact Email */}
                  {project.contact_info?.email && (
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <a
                          href={`mailto:${project.contact_info.email}`}
                          className="text-[14px] font-medium text-primary hover:underline"
                        >
                          {project.contact_info.email}
                        </a>
                        <p className="text-xs text-muted-foreground">Email</p>
                      </div>
                    </div>
                  )}

                  {/* ✅ Contact Phone */}
                  {project.contact_info?.phone && (
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        {/* Format phone as (111) 111-1111 */}
                        {(() => {
                          const raw = project.contact_info.phone.replace(
                            /\D/g,
                            ""
                          ); // keep only digits
                          const formatted = raw.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "($1) $2-$3"
                          );

                          return (
                            <a
                              href={`sms:${raw}`} // ✅ Opens messaging app on mobile
                              className="text-[14px] font-medium text-primary hover:underline"
                            >
                              {formatted}
                            </a>
                          );
                        })()}
                        <p className="text-xs text-muted-foreground">Phone</p>
                      </div>
                    </div>
                  )}
                </section>

                <div className="space-y-2">
                  <h3 className="font-semibold">Industry & Skills</h3>

                  {/* ✅ Industry Badges with hover shadows */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.industry.map((ind, indIndex) => {
                      const randomShadow =
                        badgeShadowVariants[
                          Math.floor(Math.random() * badgeShadowVariants.length)
                        ];
                      return (
                        <Badge
                          key={`project-${project.id}-industry-${indIndex}`}
                          variant="secondary"
                          className={cn(
                            "transition-shadow duration-200",
                            randomShadow
                          )}
                        >
                          {ind}
                        </Badge>
                      );
                    })}
                  </div>

                  <h4 className="text-sm font-medium">Required Skills</h4>

                  {/* ✅ Skills Badges with hover shadows */}
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, skillIndex) => {
                      const randomShadow =
                        badgeShadowVariants[
                          Math.floor(Math.random() * badgeShadowVariants.length)
                        ];
                      return (
                        <Badge
                          key={`project-${project.id}-skill-${skillIndex}`}
                          variant="outline"
                          className={cn(
                            "transition-shadow duration-200",
                            randomShadow
                          )}
                        >
                          {skill}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t mt-2 pt-3 flex justify-end">
              {/* Inquire dialog for non-owners */}
              {!isOwner && (
                <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className={clsx(
                        "relative overflow-hidden h-10 px-4 text-white font-medium",
                        "bg-gradient-to-r from-[#400404] to-[#bc0404]",
                        "transition-all duration-300",
                        "hover:from-[#5a0505] hover:to-[#d30606]",
                        "hover:shadow-[0_0_10px_2px_rgba(188,4,4,0.5)]"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Inquire About Project
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inquire About {project.title}</DialogTitle>
                      <DialogDescription>
                        Send a note to the project owner about your interest.
                      </DialogDescription>
                    </DialogHeader>

                    {inquirySuccess ? (
                      <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                        <AlertDescription>
                          Your inquiry has been submitted successfully!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        {inquiryError && (
                          <Alert variant="destructive">
                            <AlertDescription>{inquiryError}</AlertDescription>
                          </Alert>
                        )}

                        <Textarea
                          placeholder="Why are you interested in this project?"
                          value={inquiryNote}
                          onChange={(e) => setInquiryNote(e.target.value)}
                          rows={5}
                          className="resize-none"
                        />

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsInquiryOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleInquirySubmit}
                            disabled={
                              isSubmitting ||
                              !inquiryNote.trim() ||
                              !currentUser
                            }
                            className={clsx(
                              "relative overflow-hidden text-white font-medium",
                              "bg-gradient-to-r from-[#400404] to-[#bc0404]",
                              "transition-all duration-300",
                              "hover:from-[#5a0505] hover:to-[#d30606]",
                              "hover:shadow-[0_0_10px_2px_rgba(188,4,4,0.5)]"
                            )}
                          >
                            {isSubmitting ? (
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

              {/* Manage inquiries for owners */}
              {isOwner && (
                <Button asChild>
                  <Link href="/profile?tab=inquiries">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Manage Project Inquiries
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Similar Projects - Moved below main content on mobile, right column on desktop */}
          <Card className="shadow-sm md:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Similar Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {similarProjects.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {similarProjects.map((p) => (
                    <div
                      key={p.id}
                      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">
                  No similar projects found
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Similar Projects - Only visible on desktop */}
          <Card className="shadow-sm hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Similar Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {similarProjects.length > 0 ? (
                <div className="space-y-3">
                  {similarProjects.map((p) => (
                    <div
                      key={p.id}
                      className="border-b pb-3 last:border-0 last:pb-0"
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">
                  No similar projects found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
