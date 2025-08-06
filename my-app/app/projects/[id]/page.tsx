"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AvatarGroup from "@/components/profile/profile-avatar";

import { format } from "date-fns";
import clsx from "clsx";
import { ProjectWithMembers } from "@/lib/services/project-service";
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
  Users,
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

  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [owner, setOwner] = useState<UserType | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarProjects, setSimilarProjects] = useState<Project[]>([]);

  const [inquiryNote, setInquiryNote] = useState("");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedProject = (await projectService.getProject(
          id
        )) as ProjectWithMembers;
        if (!fetchedProject) return notFound();
        setProject(fetchedProject);

        if (fetchedProject.owner_id) {
          const fetchedOwner = await userService.getUser(
            fetchedProject.owner_id
          );
          setOwner(fetchedOwner);
        }

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
        console.error(err);
        setError("Failed to load project details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    const fetchBookmarkData = async () => {
      if (!currentUser || !project) return;
      try {
        setIsBookmarkLoading(true);
        const bookmarks = await bookmarkService.getProjectBookmarks(
          currentUser.id
        );
        setIsBookmarked(bookmarks.some((b) => b.project_id === id));
      } catch {
        // ignore
      } finally {
        setIsBookmarkLoading(false);
      }
    };
    if (isAuthReady && currentUser && project) {
      fetchBookmarkData();
    }
  }, [isAuthReady, currentUser, project, id]);

  const handleEdit = () => {
    if (project) redirect(`/projects/edit/${project.id}`);
  };

  const handleBookmarkToggle = async () => {
    if (!currentUser || !project) return;

    setIsBookmarked((prev) => !prev);

    try {
      await bookmarkService.toggleProjectBookmark(currentUser.id, project.id);
    } catch {
      // Revert on error
      setIsBookmarked((prev) => !prev);
    }
  };

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
      const { data: existing } = await supabase
        .from("project_applications")
        .select("id")
        .eq("project_id", project.id)
        .eq("user_id", currentUser.id)
        .single();
      if (existing) {
        setInquiryError(
          "You have already submitted an inquiry for this project"
        );
        return;
      }
      const { error } = await supabase.from("project_applications").insert({
        project_id: project.id,
        user_id: currentUser.id,
        note: inquiryNote,
        status: "pending",
      });
      if (error) throw error;
      setInquirySuccess(true);
      setInquiryNote("");
      setTimeout(() => {
        setIsInquiryOpen(false);
        setInquirySuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setInquiryError(err?.message || "Failed to submit inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-2 text-sm">Loading project details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project) return notFound();
  const isOwner = currentUser?.id === project.owner_id;

  return (
    <div className="space-y-4 text-sm">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <button
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push("/projects");
              }
            }}
            className="inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Main Content */}
        <div className="md:col-span-3 space-y-4">
          <Card className="shadow-sm gap-0 pb-0">
            <CardHeader className="p-3 pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {!project.is_idea && (
                      <Badge
                        variant="outline"
                        className={clsx(
                          "bg-green-100 text-black border-none transition-shadow",
                          "hover:shadow-[0_0_6px_2px_rgba(31,160,78,0.30)]",
                          "text-xs px-2 py-0.5"
                        )}
                      >
                        Project
                      </Badge>
                    )}
                    <Badge
                      className={clsx(
                        "border-none transition-shadow text-xs px-2 py-0.5",
                        projectStatusColors[project.project_status] ??
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {project.project_status}
                    </Badge>
                    <Badge
                      className={clsx(
                        "border-none transition-shadow text-xs px-2 py-0.5",
                        recruitmentStatusColors[project.recruitment_status] ??
                          "bg-gray-100 text-gray-700"
                      )}
                    >
                      {project.recruitment_status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-snug line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-4 text-gray-700 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{project.location_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>Team ({project.members?.length || 0})</span>
                      {owner && (
                        <section className="mx-2">
                          <AvatarGroup
                            avatars={[
                              // use owner state, not project.owner
                              {
                                id: owner.id,
                                src: owner.avatar ?? "/placeholder.png",
                                alt: owner.full_name,
                                label: owner.full_name,
                                isOwner: true,
                                role: "Owner",
                              },
                              // then the rest of the members
                              ...(project.members || [])
                                .filter((m) => m.user.id !== owner.id)
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
                        </section>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isOwner && (
                    <Button variant="outline" size="icon" onClick={handleEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    size="icon"
                    onClick={handleBookmarkToggle}
                  >
                    <Bookmark
                      className={`h-4 w-4 transition-colors ${
                        isBookmarked
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                    />
                  </Button>

                  <Button
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    size="icon"
                  >
                    <Share2 className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-base mb-1">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {project.description}
                </p>
              </div>

              {/* Subtle date & views */}
              <div className="flex border-t items-center gap-1 pt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Posted on {formatDate(project.created_at)}
                <Separator orientation="vertical" className="h-3" />
                <Eye className="h-3 w-3" />
                {project.views}
              </div>

              {/* Contact & Industry/Skills */}
              <div className="grid gap-3 sm:grid-cols-2">
                <section className="space-y-3">
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

                  {project.contact_info?.email && (
                    <div className="flex items-center gap-3 ">
                      <div className="h-8 w-8 shadow-sm flex items-center justify-center rounded-md border bg-background">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <a
                          href={`mailto:${project.contact_info.email}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {project.contact_info.email}
                        </a>
                        <p className="text-xs text-muted-foreground">Email</p>
                      </div>
                    </div>
                  )}
                  {project.contact_info?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shadow-sm flex items-center justify-center rounded-md border bg-background">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        {(() => {
                          const raw = project.contact_info.phone.replace(
                            /\D/g,
                            ""
                          );
                          const formatted = raw.replace(
                            /(\d{3})(\d{3})(\d{4})/,
                            "($1) $2-$3"
                          );
                          return (
                            <a
                              href={`sms:${raw}`}
                              className="text-sm font-medium text-primary hover:underline"
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

                <div className="space-y-1">
                  <h3 className="font-semibold text-base mb-1">
                    Industry & Skills
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.industry.map((ind, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          "text-xs px-2 py-0.5",
                          badgeShadowVariants[
                            Math.floor(
                              Math.random() * badgeShadowVariants.length
                            )
                          ]
                        )}
                      >
                        {ind}
                      </Badge>
                    ))}
                  </div>
                  <h4 className="text-sm font-medium mb-1">Required Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {project.required_skills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          "text-xs px-2 py-0.5",
                          badgeShadowVariants[
                            Math.floor(
                              Math.random() * badgeShadowVariants.length
                            )
                          ]
                        )}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t mt-2 py-3 flex justify-end">
              {!isOwner && (
                <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-9 px-3 text-sm bg-gradient-to-r from-[#400404] to-[#bc0404] text-white">
                      <MessageSquare className="h-4 w-4 mr-1" />
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
                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertDescription>
                          Your inquiry has been submitted!
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
                          placeholder="Why are you interested?"
                          value={inquiryNote}
                          onChange={(e) => setInquiryNote(e.target.value)}
                          rows={4}
                          className="resize-none text-sm"
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsInquiryOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleInquirySubmit}
                            disabled={isSubmitting || !inquiryNote.trim()}
                          >
                            {isSubmitting ? "Submitting..." : "Submit"}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              )}
              {isOwner && (
                <Button size="sm" asChild>
                  <Link href="/profile?tab=inquiries">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Manage Inquiries
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Similar Projects - Mobile */}
          <Card className="shadow-sm md:hidden">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-base">Similar Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {similarProjects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {similarProjects.map((p) => (
                    <div
                      key={p.id}
                      className="border rounded-lg p-2 hover:bg-muted/20"
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  No similar projects
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-sm hidden md:block">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-base">Similar Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {similarProjects.length > 0 ? (
                similarProjects.map((p) => (
                  <div
                    key={p.id}
                    className="border-b pb-2 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  No similar projects
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
