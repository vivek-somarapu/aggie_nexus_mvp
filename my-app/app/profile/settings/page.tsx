"use client";

import { ProfileSetupForm } from "@/components/profile/profile-card";
import { TagSelector } from "@/components/profile/tag-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { industryOptions, skillOptions } from "@/lib/constants";
import { userService } from "@/lib/services/user-service";
import {
  AlertTriangle,
  ChevronLeft,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Dynamically import the Bell icon with SSR disabled
const BellIcon = dynamic(() => import("lucide-react").then((mod) => mod.Bell), {
  ssr: false,
});

export default function SettingsPage() {
  const {
    profile,
    refreshProfile,
    isLoading: authLoading,
    signOut,
  } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    industry: [] as string[],
    skills: [] as string[],
    linkedin_url: "",
    website_url: "",
    contact: { email: "", phone: "" } as { email: string; phone: string },
    is_texas_am_affiliate: false,
    graduation_year: undefined as number | undefined,
    avatar: "",
    resume_url: "",
    additional_links: [] as { url: string; title: string }[],
  });

  const [emailNotifications, setEmailNotifications] = useState({
    newMessages: true,
    projectUpdates: true,
    newFollowers: false,
    marketing: false,
  });
  const [resumeFileInfo, setResumeFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
  } | null>(null);

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
      additional_links: profile.additional_links || [],
    });

    setSelectedSkills(profile.skills || []);
    setSelectedIndustries(profile.industry || []);

    setIsLoading(false);
  }, [profile]);

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
      // 3) clean up additional links
      const cleanedLinks = (formData.additional_links || []).filter(
        (link) => link.url.trim() !== ""
      );

      // 4) collect form data
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
        additional_links: cleanedLinks,
      };

      // 4) update user profile
      await userService.updateUser(profile.id, payload);
      await refreshProfile();

      // 5) reset form state
      setPendingAvatarFile(null);
      setPendingResumeFile(null);

      toast.success("Profile updated!");
      router.push("/profile");
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
    console.log(`[deleteFromBucket] DELETE /api/upload/${bucket}`, url);
    const res = await fetch(`/api/upload/${bucket}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await res.json().catch(() => ({}));
    console.log(`[deleteFromBucket] response status=${res.status}`, payload);
    if (!res.ok) {
      throw new Error(payload.error || `Status ${res.status}`);
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

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setIsDeletingAccount(true);
    setError(null);

    try {
      // Call the API endpoint to delete account
      const response = await fetch("/api/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error deleting account:", errorData.error);
        // We'll show error but still log them out and redirect
        toast.error(
          "Account deletion may have failed, but you've been logged out"
        );
      } else {
        // Show success toast
        toast.success("Your account has been deleted");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      // We'll still log them out even if there was an error
      toast.error(
        "Account deletion may have failed, but you've been logged out"
      );
    } finally {
      // Always sign out and redirect regardless of deletion success
      try {
        await signOut();
      } catch (signOutErr) {
        console.error("Error signing out:", signOutErr);
      }

      // Always redirect to landing page
      setIsDeletingAccount(false);
      setShowDeleteConfirmation(false);
      router.push("/");
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            You need to be logged in to access this page.
            <Link href="/auth/login" className="ml-2 underline">
              Log in
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <button
            onClick={() => {
              if (from) {
                router.push(from);
              } else if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/profile");
              }
            }}
            className="inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-600">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-0 md:border shadow-none md:shadow">
            <CardHeader>
              <CardTitle>Personal & Professional Information</CardTitle>
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
            </CardContent>
          </Card>

          <Card className="border-0 md:border shadow-none md:shadow">
            <CardHeader>
              <CardTitle>Skills & Industries</CardTitle>
              <CardDescription>
                Select your skills and industries of interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Industries</Label>
                  <TagSelector
                    label="Industries"
                    options={industryOptions}
                    selected={profile.industry || []}
                    onChange={setSelectedIndustries}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <TagSelector
                    label="Skills"
                    options={skillOptions}
                    selected={profile.skills || []}
                    onChange={setSelectedSkills}
                    maxTags={15}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.newMessages}
                  onCheckedChange={(checked) =>
                    setEmailNotifications((prev) => ({
                      ...prev,
                      newMessages: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Project Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about updates to your projects
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.projectUpdates}
                  onCheckedChange={(checked) =>
                    setEmailNotifications((prev) => ({
                      ...prev,
                      projectUpdates: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive marketing and promotional emails
                  </p>
                </div>
                <Switch
                  checked={emailNotifications.marketing}
                  onCheckedChange={(checked) =>
                    setEmailNotifications((prev) => ({
                      ...prev,
                      marketing: checked,
                    }))
                  }
                />
              </div>
              <Button className="mt-4">Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password and Account Email</CardTitle>
              <CardDescription>
                Change your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed directly. Contact support for
                    assistance.
                  </p>
                </div>

                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-destructive/10 p-4">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-medium text-destructive">
                      Delete Account
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back. This
                      action is permanent and will delete all your data.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirmation(true)}
                className="w-full sm:w-auto"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
