"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { userService } from "@/lib/services/user-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Shield, User, Upload, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Dynamically import the Bell icon with SSR disabled
const BellIcon = dynamic(() => import("lucide-react").then((mod) => mod.Bell), {
  ssr: false,
});

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
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
  })

  const [emailNotifications, setEmailNotifications] = useState({
    newMessages: true,
    projectUpdates: true,
    newFollowers: false,
    marketing: false,
  })

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        bio: user.bio || "",
        industry: user.industry || [],
        skills: user.skills || [],
        linkedin_url: user.linkedin_url || "",
        website_url: user.website_url || "",
        contact: { 
          email: user.contact?.email || user.email || "", 
          phone: user.contact?.phone || "" 
        },
        is_texas_am_affiliate: user.is_texas_am_affiliate || false,
        graduation_year: user.graduation_year,
        avatar: user.avatar || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [name]: value,
      },
    }))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // In a real app, you'd upload this to Supabase Storage or a similar service
      // For now, we'll use a placeholder or data URL for demo purposes
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            avatar: event.target?.result as string,
          }))
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Failed to upload avatar. Please try again.")
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const result = await userService.updateUser(user.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        website_url: formData.website_url,
        contact: formData.contact,
        is_texas_am_affiliate: formData.is_texas_am_affiliate,
        graduation_year: formData.graduation_year,
        avatar: formData.avatar,
      })

      if (result) {
        setSuccess("Profile updated successfully")
        toast.success("Your profile has been updated successfully")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
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
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar} alt={formData.full_name} />
                  <AvatarFallback>
                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : <User />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="block mb-2">Upload New Picture</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="max-w-xs"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                    Email cannot be changed directly. Contact support for assistance.
                  </p>
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Update your professional details and links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    name="phone"
                    value={formData.contact.phone || ""}
                    onChange={handleContactChange}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_texas_am_affiliate"
                  checked={formData.is_texas_am_affiliate}
                  onCheckedChange={(checked) => handleSwitchChange(checked, "is_texas_am_affiliate")}
                />
                <Label htmlFor="is_texas_am_affiliate">I am a Texas A&M affiliate (student, alumni, staff)</Label>
              </div>
              
              {formData.is_texas_am_affiliate && (
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="graduation_year">Graduation Year (if applicable)</Label>
                  <Input
                    id="graduation_year"
                    name="graduation_year"
                    type="number"
                    value={formData.graduation_year || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      setFormData((prev) => ({ ...prev, graduation_year: value }))
                    }}
                    placeholder="YYYY"
                  />
                </div>
              )}
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
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Messages</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                </div>
                <Switch
                  checked={emailNotifications.newMessages}
                  onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, newMessages: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Project Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified about updates to your projects</p>
                </div>
                <Switch
                  checked={emailNotifications.projectUpdates}
                  onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, projectUpdates: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Followers</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications when someone follows you</p>
                </div>
                <Switch
                  checked={emailNotifications.newFollowers}
                  onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, newFollowers: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                </div>
                <Switch
                  checked={emailNotifications.marketing}
                  onCheckedChange={(checked) => setEmailNotifications((prev) => ({ ...prev, marketing: checked }))}
                />
              </div>
              <Button className="mt-4">Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}