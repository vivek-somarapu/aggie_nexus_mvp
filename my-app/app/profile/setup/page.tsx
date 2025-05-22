"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { User as UserType } from "@/lib/models/users";
import { userService } from "@/lib/services/user-service";
import { Switch } from "@/components/ui/switch";
import { InputFile } from "@/components/ui/input";
import { v4 as uuid } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
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
  ProfileAvatar,
  ProfileAvatarEdit,
} from "@/components/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Check,
  Download,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

import { industryOptions, skillOptions, stepVariants } from "@/lib/constants";
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

  const handleSwitchChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
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

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
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
      window.location.reload();
      router.push("/");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
      {/* Desktop: step-by-step cards */}
      <AnimatePresence initial={false}>
        {currentStep >= 1 && (
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="hidden lg:flex items-center justify-center h-[calc(100vh-7rem)]"
          >
            <div className="w-full max-w-md">
              {currentStep === 1 && (
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                      Welcome to Aggie Nexus!
                    </CardTitle>
                    <CardDescription>
                      Would you like to set up your profile now or continue to
                      the platform?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar */}
                    <div className="flex justify-center">
                      <ProfileAvatarEdit
                        avatar={formData.avatar}
                        fullName={formData.full_name}
                        onAvatarChange={handleAvatarChange}
                        onAvatarDelete={handleDeleteAvatar}
                      />
                    </div>

                    <p className="text-center text-muted-foreground">
                      Setting up your profile helps others find you and makes it
                      easier to connect with like-minded individuals.
                    </p>
                    {message && (
                      <Alert className="mt-4">
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={skipToHome}>
                      Skip for now
                    </Button>
                    <Button onClick={nextStep}>
                      Set up profile <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Let's start with the basics
                    </CardDescription>
                    {isFromAuthError && (
                      <Alert className="mt-4">
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bio: e.target.value.slice(0, 250),
                          }))
                        }
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                      <div className="text-sm text-muted-foreground text-right">
                        {formData.bio?.length || 0} / 250
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_texas_am_affiliate"
                        checked={formData.is_texas_am_affiliate}
                        onCheckedChange={(checked) =>
                          handleSwitchChange(checked, "is_texas_am_affiliate")
                        }
                      />
                      <Label htmlFor="is_texas_am_affiliate">
                        I am a Texas A&M affiliate (student, alumni, staff)
                      </Label>
                    </div>

                    {formData.is_texas_am_affiliate && (
                      <div className="space-y-2 max-w-xs">
                        <Label htmlFor="graduation_year">
                          Graduation Year (if applicable)
                        </Label>
                        <Input
                          id="graduation_year"
                          name="graduation_year"
                          type="number"
                          value={formData.graduation_year || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            setFormData((prev) => ({
                              ...prev,
                              graduation_year: value,
                            }));
                          }}
                          placeholder="YYYY"
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={nextStep}>
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Steps 3 */}
              {currentStep === 3 && (
                <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Skills & Industries</CardTitle>
                    <CardDescription>
                      Select your skills and industries of interest
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Industries (Select all that apply)</Label>
                      <div className=" mt-2">
                        <Label>Industries</Label>
                        <TagSelector
                          label="Industries"
                          options={industryOptions}
                          selected={selectedIndustries}
                          onChange={setSelectedIndustries}
                        />

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
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={nextStep}>
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Steps 4 */}
              {currentStep === 4 && (
                <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Contact & Links</CardTitle>
                    <CardDescription>How can others reach you?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        name="email"
                        type="email"
                        value={formData.contact.email}
                        onChange={handleContactChange}
                        placeholder="Enter contact email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">
                        Contact Phone (Optional)
                      </Label>
                      <Input
                        id="contact_phone"
                        name="phone"
                        value={formData.contact.phone || ""}
                        onChange={handleContactChange}
                        placeholder="Enter contact phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url">Website URL</Label>
                      <Input
                        id="website_url"
                        name="website_url"
                        value={formData.website_url}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={nextStep}>
                      Review <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Steps 5 */}
              {currentStep === 5 && (
                <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Review Your Profile</CardTitle>
                    <CardDescription>
                      Make sure everything looks good
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Avatar */}
                    <div className="flex justify-center">
                      <ProfileAvatar
                        avatar={formData.avatar}
                        fullName={formData.full_name}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.full_name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.email}
                      </p>
                    </div>

                    {formData.bio && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Bio</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.bio}
                        </p>
                      </div>
                    )}

                    {formData.graduation_year && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Graduation Year</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.graduation_year}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Texas A&M Affiliate</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.is_texas_am_affiliate ? "Yes" : "No"}
                      </p>
                    </div>

                    {selectedIndustries.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Industries</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedIndustries.join(", ")}
                        </p>
                      </div>
                    )}

                    {selectedSkills.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Skills</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedSkills.join(", ")}
                        </p>
                      </div>
                    )}

                    {formData.linkedin_url && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">LinkedIn</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.linkedin_url}
                        </p>
                      </div>
                    )}

                    {formData.website_url && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Website</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.website_url}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
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

      {/* Mobile/Tablet: single-page form */}
      <div className="lg:hidden space-y-6 px-5 mx-auto">
        <h1 className="text-2xl font-semibold text-center">Profile Setup</h1>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Avatar */}
            <div className="flex justify-center">
              <ProfileAvatarEdit
                avatar={formData.avatar}
                fullName={formData.full_name}
                onAvatarChange={handleAvatarChange}
                onAvatarDelete={handleDeleteAvatar}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="email"
                type="email"
                value={formData.contact.email || ""}
                onChange={handleContactChange}
                placeholder="public@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url || ""}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                value={formData.website_url || ""}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="phone"
                value={formData.contact.phone || ""}
                onChange={handleContactChange}
                placeholder="(123) 456-7890"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <InputFile
                label="Upload resume"
                accept=".pdf"
                onChange={handleResumeChange}
              />
              <div className="mt-auto flex justify-end">
                {formData.resume_url ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-sm py-4"
                  >
                    <a
                      href={formData.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Resume
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No resume uploaded
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    bio: e.target.value.slice(0, 250),
                  }))
                }
                placeholder="Tell us about yourself"
                rows={4}
              />
              <div className="text-sm text-muted-foreground text-right">
                {formData.bio?.length || 0} / 250
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_texas_am_affiliate}
              onCheckedChange={(val) =>
                setFormData({ ...formData, is_texas_am_affiliate: val })
              }
            />
            <Label htmlFor="is_texas_am_affiliate">Texas A&M affiliate?</Label>
          </div>
          {formData.is_texas_am_affiliate && (
            <div className="space-y-2">
              <Label htmlFor="graduation_year">Graduation Year</Label>
              <Input
                id="graduation_year"
                type="number"
                value={formData.graduation_year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    graduation_year: parseInt(e.target.value),
                  })
                }
              />
            </div>
          )}
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
        </div>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    </div>
  );
}
