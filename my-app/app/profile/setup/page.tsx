"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { User as UserType } from "@/lib/models/users";
import { userService } from "@/lib/services/user-service";
import { v4 as uuid } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileSetupForm } from "@/components/profile/profile-card";
import Image from "next/image";
import {
  containerVariants,
  itemVariants,
  industryOptions,
  skillOptions,
  stepVariants,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagSelector } from "@/components/profile/tag-selector";
import {
  TexasAMAffiliation,
  type TexasAMAffiliationData,
} from "@/components/profile/tamu-affiliate";
import {
  ProfileAvatar,
  ProfileAvatarEdit,
} from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Check,
  Download,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ProfileSetupPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isFromAuthError, setIsFromAuthError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Initialize form with user data if available
  useEffect(() => {
    if (!authUser?.id) return;
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const userData = await userService.getUser(authUser.id);
        if (!userData) {
          throw new Error("User not found");
        }
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
  }, [authUser?.id]);

  // Check if user was redirected from auth error
  useEffect(() => {
    // Check localStorage for auth error flag
    const authErrorFlag = localStorage.getItem("auth_profile_error");
    if (authErrorFlag === "true") {
      setIsFromAuthError(true);
      setMessage(
        "We detected an issue with your profile during signup. Please complete your profile setup now."
      );
      // Jump directly to step 2 (basic information)
      setCurrentStep(2);
      // Clear the flag
      localStorage.removeItem("auth_profile_error");
    }
  }, []);

  // Handle user interaction
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

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const ext = file.name.split(".").pop();
      const filename = `${uuid()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filename, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

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

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      setError("You must be logged in to update your profile");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await userService.updateUser(user.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        website_url: formData.website_url,
        is_texas_am_affiliate: formData.is_texas_am_affiliate,
        graduation_year: formData.graduation_year,
        avatar: formData.avatar || "",
        resume_url: formData.resume_url,
        industry: selectedIndustries,
        contact: formData.contact,
        skills: selectedSkills,
      });

      if (isFromAuthError) {
        setMessage("Your profile has been successfully created!");
      }

      // Redirect to home page or profile
      window.location.href = "/profile";
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAffiliationChange = (data: TexasAMAffiliationData) => {
    setFormData({
      ...formData,
      is_texas_am_affiliate: data.is_texas_am_affiliate,
      graduation_year: data.graduation_year,
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: localUrl }));

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

  const skipToHome = async () => {
    try {
      // Record that the user has chosen to skip profile setup
      if (user) {
        await userService.updateUser(user.id, {
          profile_setup_skipped: true,
          // Add a timestamp to record when setup was skipped
          profile_setup_skipped_at: new Date().toISOString(),
        });
      }
      router.push("/");
    } catch (err) {
      console.error("Error recording skip preference:", err);
      // Continue to home page even if there's an error
      router.push("/");
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
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
        <ProfileSetupForm
          formData={formData}
          setFormData={setFormData}
          selectedIndustries={selectedIndustries}
          setSelectedIndustries={setSelectedIndustries}
          handleAvatarChange={handleAvatarChange}
          handleDeleteAvatar={handleDeleteAvatar}
          handleAffiliationChange={handleAffiliationChange}
          handleContactChange={handleContactChange}
          handleChange={handleChange}
          handleResumeChange={handleResumeChange}
        />
        <div className="px-6 md:hidden">
          <div className="space-y-2">
            <Label>Industries</Label>
            <TagSelector
              label="Industries"
              options={industryOptions}
              selected={selectedIndustries}
              onChange={setSelectedIndustries}
            />
          </div>
          <div className="space-y-2 md:hidden">
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
        {/* Save Button */}
        <div className="flex justify-end mt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
      <div className="hidden md:block">
        <AnimatePresence mode="wait">
          {currentStep >= 1 && (
            <motion.div
              key={currentStep}
              className="absolute inset-0 flex items-center justify-center"
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
              top-30
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

              <div className="relative z-10 w-full max-w-3xl">
                {currentStep === 1 && (
                  <>
                    <ProfileSetupForm
                      formData={formData}
                      setFormData={setFormData}
                      selectedIndustries={selectedIndustries}
                      setSelectedIndustries={setSelectedIndustries}
                      handleAvatarChange={handleAvatarChange}
                      handleDeleteAvatar={handleDeleteAvatar}
                      handleAffiliationChange={handleAffiliationChange}
                      handleContactChange={handleContactChange}
                      handleChange={handleChange}
                      handleResumeChange={handleResumeChange}
                    />

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
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle>Skills & Industries</CardTitle>
                        <CardDescription>
                          Select your skills and industries of interest
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      </CardContent>
                    </Card>

                    <div className="flex justify-between gap-4 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                      </Button>

                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={isSaving}
                      >
                        Next Step
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Steps 3 */}
                {currentStep === 3 && (
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
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
