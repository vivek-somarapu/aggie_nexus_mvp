"use client";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileSetupForm } from "@/components/profile/profile-card";
import { TagSelector } from "@/components/profile/tag-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import {
  containerVariants,
  industryOptions,
  itemVariants,
  skillOptions,
  stepVariants,
} from "@/lib/constants";
import { userService } from "@/lib/services/user-service";

import { VerificationBadge } from "@/components/ui/verification-badge";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfileSetupPage() {
  const { authUser, profile, refreshProfile, isLoading: authLoading } = useAuth();
  const stillLoadingProfile = authLoading || (authUser && !profile);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
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
    organizations: [] as string[],
    resume_url: "",
    contact: { email: "", phone: "" } as { email: string; phone: string },
  });

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
      organizations: profile.organizations || [],
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
    });

    setSelectedSkills(profile.skills || []);
    setSelectedIndustries(profile.industry || []);
    setSelectedOrganizations(profile.organizations || []);

    setIsLoading(false);
  }, [profile]);

  // Fetch available organizations from database
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (authUser) {
        const supabase = createClient();
        const { data: orgs } = await supabase
          .from('organizations')
          .select('name')
          .order('name');
        
        const orgNames = orgs?.map((org: { name: string }) => org.name) || [];
        setAvailableOrganizations(orgNames);
      }
    };

    fetchOrganizations();
  }, [authUser]);

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
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
        profile_setup_completed: true,
        profile_setup_skipped: false,
      };

      /// 4) update user profile 
      if (selectedOrganizations.length > 0) {
        await userService.updateUserWithAffiliations(profile.id, payload, selectedOrganizations);
      } else {
        await userService.updateUser(profile.id, payload);
      }

      await refreshProfile();

      // 5) reset form state
      setPendingAvatarFile(null);
      setPendingResumeFile(null);

      toast.success("Profile setup completed!");
      router.push("/");
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
    const res = await fetch(`/api/upload/${bucket}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Delete failed");
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

  const skipToHome = async () => {
    try {
      // Record that the user has chosen to skip profile setup
      if (profile) {
        await userService.updateUser(profile.id, {
          profile_setup_skipped: true,
          profile_setup_completed: false, // Ensure completion flag is cleared
          profile_setup_skipped_at: new Date().toISOString(),
        });
      }
      toast.success("Profile setup skipped");
      router.push("/");
    } catch (err) {
      console.error("Error recording skip preference:", err);
      // Continue to home page even if there's an error
      toast.error("Failed to record skip preference, but continuing to home page");
      router.push("/");
    }
  };

  if (stillLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertDescription>
            You need to be logged in to set up your profile.
            <Link href="/auth/login" className="ml-2 underline">
              Log in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile only version */}
      <div className="block md:hidden">
        <motion.div
          key="completion-banner"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className=" sm:right-6 sm:left-auto z-50 w-auto sm:max-w-md max-w-sm"
        >
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg rounded-lg px-4 py-3">
            <CardDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">
                  Your profile is incomplete
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You're almost there — finish setting up your profile!
                </p>
              </div>
            </CardDescription>
          </Card>
        </motion.div>

        <ProfileSetupForm
          formData={formData}
          setFormData={setFormData}
          selectedIndustries={selectedIndustries}
          setSelectedIndustries={setSelectedIndustries}
          handleAvatarChange={handleAvatarChange}
          handleDeleteAvatar={handleDeleteAvatar}
          handleContactChange={handleContactChange}
          handleChange={handleChange}
          resumeUrl={formData.resume_url || null}
          fileInfo={resumeFileInfo || undefined}
          onResumeChange={handleResumeChange}
          onResumeDelete={handleResumeDelete}
        />
        <div className="px-6 md:hidden">
          <div className="space-y-2">
            <Label>Industries</Label>
            <TagSelector
              label="Industries"
              options={industryOptions}
              selected={profile?.industry || []}
              onChange={setSelectedIndustries}
            />
          </div>
          <div className="space-y-2 md:hidden">
            <Label>Skills</Label>
            <TagSelector
              label="Skills"
              options={skillOptions}
              selected={profile?.skills || []}
              onChange={setSelectedSkills}
              maxTags={15}
            />
          </div>
        </div>
        {/* Save Button */}
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveProfile} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </div>

      {/* Desktop/Tablet: step-by-step cards */}
      <div className="hidden md:block ">
        <AnimatePresence mode="wait">
          {currentStep >= 1 && (
            <motion.div
              key={currentStep}
              className="flex items-center justify-center"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Background animated circles */}
              <motion.div
                className="
              hidden lg:block
              absolute
              right-0
              top-50
              z-0
              transform
              rotate-[220deg]
              pointer-events-none
              opacity-60
            "
                initial={{ opacity: 0, scale: 0.8, rotate: 205 }}
                animate={{
                  opacity: 0.6,
                  scale: 1,
                  rotate: 220,
                  transition: {
                    duration: 0.8,
                    ease: "easeOut",
                  },
                }}
                whileInView={{
                  x: [0, 10, 0],
                  transition: {
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 8,
                  },
                }}
              >
                <Image
                  src="/images/circles-logo.png"
                  alt="Decorative circles"
                  width={700}
                  height={500}
                  className="object-contain"
                  priority
                />
              </motion.div>

              <div className="relative z-10 w-full max-w-4xl">
                {currentStep === 1 && (
                  <>
                    <motion.div
                      key="completion-banner"
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3 }}
                      className="fixed top-25 right-4 left-4 sm:right-6 sm:left-auto z-50 w-auto sm:max-w-md max-w-sm"
                    >
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg rounded-lg px-4 py-3">
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1 text-sm">
                            <p className="font-medium text-green-800 dark:text-green-300">
                              Your profile is incomplete
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              You're almost there — finish setting up your
                              profile!
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </motion.div>

                    <Card className="w-full max-w-5xl border-0 md:border shadow-none md:shadow">
                      <CardHeader>
                        <CardTitle>
                          Personal & Professional Information
                        </CardTitle>
                        <CardDescription>
                          Update your personal & professional details and links
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ProfileSetupForm
                          formData={formData}
                          setFormData={setFormData}
                          selectedIndustries={selectedIndustries}
                          setSelectedIndustries={setSelectedIndustries}
                          handleAvatarChange={handleAvatarChange}
                          handleDeleteAvatar={handleDeleteAvatar}
                          handleContactChange={handleContactChange}
                          handleChange={handleChange}
                          resumeUrl={formData.resume_url || null}
                          fileInfo={resumeFileInfo || undefined}
                          onResumeChange={handleResumeChange}
                          onResumeDelete={handleResumeDelete}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Industries</Label>
                            <TagSelector
                              label="Industries"
                              options={industryOptions}
                              selected={selectedIndustries}
                              onChange={setSelectedIndustries}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Skills</Label>
                            <TagSelector
                              label="Skills"
                              options={skillOptions}
                              selected={selectedSkills}
                              onChange={setSelectedSkills}
                              maxTags={15}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Organizations</Label>
                          <TagSelector
                            label="Organizations"
                            options={availableOrganizations}
                            selected={selectedOrganizations}
                            onChange={setSelectedOrganizations}
                            maxTags={10}
                          />
                          <p className="text-xs text-muted-foreground">
                            Select organizations you're affiliated with. Organizations require verification.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between mt-2">
                      <Button variant="outline" onClick={skipToHome}>
                        Skip for now
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={isSaving}
                      >
                        Set up profile <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <>
                    <Card className="w-full mx-auto">
                      <CardHeader>
                        <CardTitle>Review Your Profile</CardTitle>
                        <CardDescription>
                          Make sure everything looks good
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-1 max-h-[60vh] overflow-y-auto">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-start gap-6">
                          {/* Avatar */}
                          <div className="flex-1 flex justify-center">
                            <div className="shrink-0">
                              <ProfileAvatar
                                avatar={formData.avatar}
                                fullName={formData.full_name}
                                is_texas_am_affiliate={
                                  formData.is_texas_am_affiliate
                                }
                              />
                            </div>
                          </div>

                          {/* Name / Email / Affiliation */}
                          <div className="flex-1 flex flex-col gap-3">
                            <div className="">
                              <p className="text-sm font-medium">Name</p>
                              <p className="text-sm text-muted-foreground">
                                {formData.full_name}
                              </p>
                            </div>
                            <div className="">
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">
                                {formData.email}
                              </p>
                            </div>
                            <div className="">
                              <p className="text-sm font-medium">
                                Texas A&M Affiliate
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formData.is_texas_am_affiliate ? "Yes" : "No"}
                                {formData.is_texas_am_affiliate &&
                                formData.graduation_year
                                  ? ` - ${formData.graduation_year}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          {/* LinkedIn / Website */}
                          <div className="flex-1 flex flex-col gap-3">
                            {formData.linkedin_url && (
                              <div className="">
                                <p className="text-sm font-medium">LinkedIn</p>
                                <p className="text-sm text-muted-foreground">
                                  {formData.linkedin_url}
                                </p>
                              </div>
                            )}
                            {formData.website_url && (
                              <div className="">
                                <p className="text-sm font-medium">Website</p>
                                <p className="text-sm text-muted-foreground">
                                  {formData.website_url}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skills and industries */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedIndustries.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Industries</p>
                              <motion.div
                                className="flex flex-wrap gap-2 mt-2"
                                variants={containerVariants}
                              >
                                {selectedIndustries.map((tag) => (
                                  <motion.div key={tag} variants={itemVariants}>
                                    <Badge
                                      variant="secondary"
                                      className="px-2 py-1"
                                    >
                                      {tag}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </motion.div>
                            </div>
                          )}

                          {selectedSkills.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Skills</p>
                              <motion.div
                                className="flex flex-wrap gap-2 mt-2"
                                variants={containerVariants}
                              >
                                {selectedSkills.map((tag) => (
                                  <motion.div key={tag} variants={itemVariants}>
                                    <Badge
                                      variant="secondary"
                                      className="px-2 py-1"
                                    >
                                      {tag}
                                    </Badge>
                                  </motion.div>
                                ))}
                              </motion.div>
                            </div>
                          )}
                        </div>

                        {/* Organizations */}
                        {selectedOrganizations.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Organizations</p>
                            <motion.div
                              className="flex flex-wrap gap-2 mt-2"
                              variants={containerVariants}
                            >
                              {selectedOrganizations.map((org) => (
                                <motion.div key={org} variants={itemVariants}>
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="px-2 py-1">{org}</Badge>
                                    {org && (
                                      <VerificationBadge 
                                        organization={org} 
                                        profile={profile} 
                                        size="sm" 
                                        showText={false} 
                                      />
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                            {selectedOrganizations && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ⚠️ Organizations require verification. Claims will be reviewed.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bio */}
                        {formData.bio && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Bio</p>
                            <p className="text-sm text-muted-foreground break-words max-w-full">
                              {formData.bio}
                            </p>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex justify-between mt-2">
                        <Button variant="outline" onClick={prevStep}>
                          <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Complete Setup
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
