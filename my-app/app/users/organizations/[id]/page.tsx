"use client"

import { useState, useEffect } from "react"
import { useParams, notFound, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import {
  Bookmark,
  ChevronLeft,
  ExternalLink,
  Loader2,
  Home,
  Calendar,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Mail,
  MessageSquare,
  Crown,
  Edit,
} from "lucide-react"
import { organizationService, Organization } from "@/lib/services/organization-service"
import { bookmarkService } from "@/lib/services/bookmark-service"
import { inquiryService } from "@/lib/services/inquiry-service"
import { useAuth } from "@/lib"
import { Project } from "@/lib/services/project-service"
import { createClient } from "@/lib/supabase/client"
import { map } from "zod"

// Simple Alert component
function Alert({ variant, className, children }: { 
  variant?: "default" | "destructive", 
  className?: string, 
  children: React.ReactNode 
}) {
  return (
    <div className={`rounded-lg border p-4 ${variant === "destructive" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50"} ${className || ""}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

export default function OrganizationPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { authUser: currentUser } = useAuth()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationIndustries, setOrganizationIndustries] = useState<string[]>([])
  const [organizationProjects, setOrganizationProjects] = useState<Project[]>([])
  const [organizationMembers, setOrganizationMembers] = useState<Array<{
    id: string;
    full_name: string;
    avatar: string | null;
    email: string;
  }>>([])
  const [organizationManagers, setOrganizationManagers] = useState<Array<{
    id: string;
    full_name: string;
    avatar: string | null;
    email: string;
    bio: string | null;
    is_texas_am_affiliate: boolean;
  }>>([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isLoadingManagers, setIsLoadingManagers] = useState(true)
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  
  // Inquiry dialog state
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [inquiryNote, setInquiryNote] = useState("")
  const [preferredContact, setPreferredContact] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)
  const [inquirySuccess, setInquirySuccess] = useState(false)
  
  // Message dialog state
  const [isMessageOpen, setIsMessageOpen] = useState(false)
  const [messageNote, setMessageNote] = useState("")
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState(false)

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoadingOrganization(true)
        setError(null)
        
        const timeoutId = setTimeout(() => {
          setError("Loading timeout. Please refresh the page.")
          setIsLoadingOrganization(false)
        }, 10000)
        
        const organizationData = await organizationService.getOrganization(id);
        clearTimeout(timeoutId)
        
        if (!organizationData) {
          return notFound();
        }
        setOrganization(organizationData);
      } catch (err) {
        console.error("Error fetching organization:", err);
        setError("Failed to load organization data. Please try again later.");
      } finally {
        setIsLoadingOrganization(false);
      }
    };
    
    fetchOrganization();
  }, [id]);
  
  // Fetch organization's projects
  useEffect(() => {
    const fetchOrganizationProjects = async () => {
      if (!organization) return;
      
      try {
        setIsLoadingProjects(true);
        const projects = await organizationService.getOrganizationProjects(organization.id);
        setOrganizationProjects(projects);
      } catch (err) {
        console.error("Error fetching organization projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchOrganizationProjects();
  }, [organization]);

  // Fetch organization's members
  useEffect(() => {
    const fetchOrganizationMembers = async () => {
      if (!organization) return;
      
      try {
        setIsLoadingMembers(true);
        const members = await organizationService.getOrganizationMembers(organization.id);
        setOrganizationMembers(members);
      } catch (err) {
        console.error("Error fetching organization members:", err);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchOrganizationMembers();
  }, [organization]);

  // Fetch organization's managers (executive team)
  useEffect(() => {
    const fetchOrganizationManagers = async () => {
      if (!organization) return;
      
      try {
        setIsLoadingManagers(true);
        const managers = await organizationService.getOrganizationManagers(organization.id);
        setOrganizationManagers(managers);
      } catch (err) {
        console.error("Error fetching organization managers:", err);
      } finally {
        setIsLoadingManagers(false);
      }
    };
    
    fetchOrganizationManagers();
  }, [organization]);

  // Check if user can edit this organization (admin or manager)
  useEffect(() => {
    const checkEditPermission = async () => {
      if (!currentUser || !organization) {
        setCanEdit(false);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        if (!supabase) {
          setCanEdit(false);
          return;
        }

        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single() as { data: { role: string } | null };

        const userRole = userData?.role;
        const isAdmin = userRole === 'admin';

        // Admins can edit all organizations
        if (isAdmin) {
          setCanEdit(true);
          return;
        }

        // Managers can edit organizations they manage
        if (userRole === 'manager') {
          const { data } = await supabase
            .from('organization_managers')
            .select('org_id')
            .eq('user_id', currentUser.id)
            .eq('org_id', organization.id)
            .single();
          
          setCanEdit(!!data);
        } else {
          setCanEdit(false);
        }
      } catch (err) {
        console.error("Error checking edit permission:", err);
        setCanEdit(false);
      }
    };

    checkEditPermission();
  }, [currentUser, organization]);

  // Check bookmark status
  useEffect(() => {
    const checkBookmark = async () => {
      if (!currentUser || !organization) return;
      
      try {
        setIsLoadingBookmark(true);
        const bookmarks = await bookmarkService.getOrganizationBookmarks(organization.id);
        const isOrgBookmarked = bookmarks.some(b => b.id === organization.id);
        setIsBookmarked(isOrgBookmarked);
      } catch (err) {
        console.error("Error checking bookmark:", err);
      } finally {
        setIsLoadingBookmark(false);
      }
    };
    
    checkBookmark();
  }, [currentUser, organization]);

  const handleBookmarkToggle = async () => {
    if (!currentUser || !organization) {
      router.push('/auth/login?redirect=/users/organizations/' + id);
      return;
    }
    
    try {
      setIsLoadingBookmark(true);
      const isBookmarked = await bookmarkService.toggleOrganizationBookmark(currentUser.id, organization.id);
      setIsBookmarked(isBookmarked.action === 'added');
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  // Handle organization inquiry submission
  const handleInquirySubmit = async () => {
    if (!currentUser || !organization) {
      setInquiryError("You must be logged in to submit an inquiry");
      return;
    }

    if (!inquiryNote.trim()) {
      setInquiryError("Please provide a note about your interest");
      return;
    }

    if (!preferredContact.trim()) {
      setInquiryError("Please provide your preferred form of contact");
      return;
    }

    try {
      setIsSubmitting(true);
      setInquiryError(null);

      await inquiryService.submitOrganizationInquiry(
        organization.id,
        currentUser.id,
        inquiryNote.trim(),
        preferredContact.trim()
      );

      setInquirySuccess(true);
      setInquiryNote("");
      setPreferredContact("");

      // Close dialog after a delay
      setTimeout(() => {
        setIsInquiryOpen(false);
        setInquirySuccess(false);
      }, 2000);
    } catch (err: unknown) {
      console.error("Error submitting inquiry:", err);
      setInquiryError(err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle message submission to all managers
  const handleMessageSubmit = async () => {
    if (!currentUser || !organization || organizationManagers.length === 0) {
      setMessageError("You must be logged in to send a message");
      return;
    }
    
    if (!messageNote.trim()) {
      setMessageError("Please provide a message");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessageError(null);
      
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Failed to initialize Supabase client");
      }
      
      // Send message to all managers
      const messagePromises = organizationManagers.map((manager) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('messages') as any).insert({
          sender_id: currentUser.id,
          recipient_id: manager.id,
          content: messageNote.trim(),
          status: 'unread'
        })
      );
      
      const results = await Promise.all(messagePromises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error("Some messages failed to send:", errors);
        throw new Error(`Failed to send message to ${errors.length} manager(s)`);
      }
      
      // Show success message and reset form
      setMessageSuccess(true);
      setMessageNote("");
      
      // Close dialog after a delay
      setTimeout(() => {
        setIsMessageOpen(false);
        setMessageSuccess(false);
      }, 2000);
      
    } catch (err: unknown) {
      console.error("Error sending message:", err);
      setMessageError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingOrganization) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2">Loading organization...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!organization) return null;

  // Format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const foundedDate = organization.founded_date || organization.created_at;
  const joinedDate = organization.joined_aggiex_date || organization.created_at;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/organizations/edit/${id}`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Organization
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleBookmarkToggle}
            disabled={isLoadingBookmark}
          >
            {isLoadingBookmark ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
            )}
          </Button>
        </div>
      </div>
      {/* Header Section - Logo/Title/Description with Details Card */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] items-start max-w-full">
        {/* Left Column - Logo, Title, Description */}
        <div className="space-y-6 min-w-0 max-w-full">
          {/* Date Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {organization.is_texas_am_affiliate && (
              <Badge variant="outline" className="flex items-center gap-2 bg-[#500000]">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">TAMU</span>
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Founded: {formatDate(foundedDate)}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Joined: {formatDate(joinedDate)}</span>
            </Badge>
          </div>

          {/* Logo and Title Card */}
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-4">
                {organization.logo_url ? (
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2">
                    <Image
                      src={organization.logo_url}
                      alt={`${organization.name} logo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, 128px"
                    />
                  </div>
                ) : (
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                    <AvatarFallback className="text-3xl sm:text-4xl">{organization.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="text-center">
                  <CardTitle className="text-2xl sm:text-3xl mb-2 pb-4">{organization.name}</CardTitle>
                  {organization.industry && organization.industry.length > 0 && (
                    (organization.industry.map((industry) => (
                        <Badge key={industry} variant="outline" className="ml-2 text-xs sm:text-sm">
                            {industry}
                        </Badge>
                        ))))
                 }
                
                  {organization.website_url && (
                    <a 
                      href={organization.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{organization.website_url}</span>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Box */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building2 className="h-5 w-5" />
                About {organization.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm sm:text-base">
                {organization.description || "No description available."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Organization Details Card */}
        <div className="lg:sticky lg:self-start lg:mt-13 min-w-0 max-w-full">
          <Card className="w-full lg:w-[280px] max-w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-1 text-base sm:text-lg">
                <Crown className="justify-self-start h-5 w-5" /> 
                Leadership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Section - Organization Managers */}
              {isLoadingManagers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : organizationManagers.length > 0 ? (
                <>
                  <div>
                    <div className="space-y-2 border rounded-lg dark:bg-muted/30">
                      {organizationManagers.map((manager) => (
                        <Link key={manager.id} href={`/users/${manager.id}`}>
                          <div className="flex items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={manager.avatar || undefined} alt={manager.full_name} />
                              <AvatarFallback className="text-xs">{manager.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{manager.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{manager.bio}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>                      
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No managers found
                </p>
              )}
              
              {/* Inquiry Button */}
              <Separator />
              <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm" disabled={!currentUser}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Inquire About Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Inquire About {organization?.name}</DialogTitle>
                    <DialogDescription>
                      Send a note to the organization&apos;s executive team about your interest.
                      They will be able to see your profile details and contact you back.
                    </DialogDescription>
                  </DialogHeader>

                  {inquirySuccess ? (
                    <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                      <AlertDescription>
                        Your inquiry has been submitted successfully! The organization&apos;s executive team will review it soon.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {inquiryError && (
                        <Alert variant="destructive">
                          <AlertDescription>{inquiryError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="preferredContact">
                            Preferred Form of Contact <span className="text-red-500">*</span>
                          </Label>
                          <input
                            id="preferredContact"
                            type="text"
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            value={preferredContact}
                            onChange={(e) => setPreferredContact(e.target.value)}
                            placeholder="e.g., Email, Phone, LinkedIn, etc."
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="inquiryNote">
                            Your Message <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="inquiryNote"
                            placeholder="Write your message here. Introduce yourself and explain why you're reaching out..."
                            value={inquiryNote}
                            onChange={(e) => {
                              const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
                              if (words.length <= 200) {
                                setInquiryNote(e.target.value);
                              }
                            }}
                            rows={5}
                            className="resize-none"
                          />
                          <div className="text-xs text-muted-foreground text-right">
                            {inquiryNote.trim().split(/\s+/).filter(w => w.length > 0).length} / 200 words
                          </div>
                        </div>
                      </div>

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
                          disabled={isSubmitting || !inquiryNote.trim() || !preferredContact.trim() || !currentUser}
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organization Images Gallery */}
      {organization.images && organization.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>Images showcasing {organization.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {organization.images.map((imageUrl, index) => (
                <div key={index} className="relative w-full aspect-video rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
                  <Image
                    src={imageUrl}
                    alt={`${organization.name} image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects and Members Grid - Equal Width 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-2 max-w-full">
        {/* Projects Section - Carousel */}
        {organizationProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>
                {organizationProjects.length} {organizationProjects.length === 1 ? 'project' : 'projects'} associated with {organization.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading projects...</span>
                </div>
              ) : (
                <div className="w-full overflow-hidden">
                  <Carousel
                    opts={{ loop: true }}
                    plugins={[
                      Autoplay({ delay: 5000, stopOnInteraction: false }),
                    ]}
                    className="w-full relative"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {organizationProjects.map((project) => (
                        <CarouselItem
                          key={project.id}
                          className="pl-2 md:pl-4 max-w-full sm:max-w-[350px] basis-full sm:basis-1/2"
                        >
                          <Link href={`/projects/${project.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="pt-6">
                                <h4 className="font-semibold mb-2">{project.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {project.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {project.is_idea ? (
                                    <Badge variant="outline">Idea</Badge>
                                  ) : (
                                    <Badge variant="outline">Project</Badge>
                                  )}
                                  <Badge variant="outline">{project.project_status}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                    <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Members Section - Carousel */}
        {organizationMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({organizationMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2">Loading members...</span>
                </div>
              ) : (
                <div className="w-full overflow-hidden">
                  <Carousel
                    opts={{ loop: true }}
                    plugins={[
                      Autoplay({ delay: 5000, stopOnInteraction: false }),
                    ]}
                    className="w-full relative"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {organizationMembers.map((member) => (
                        <CarouselItem
                          key={member.id}
                          className="pl-2 md:pl-4 max-w-full sm:max-w-[280px] basis-full sm:basis-1/2"
                        >
                          <Link href={`/users/${member.id}`}>
                            <Card className="flex flex-row h-full hover:shadow-md transition-shadow cursor-pointer p-2 ml-12">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={member.avatar || undefined} alt={member.full_name} />
                                    <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{member.full_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{member.bio}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                    <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
