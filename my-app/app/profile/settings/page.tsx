"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Shield, User } from "lucide-react"

// Dynamically import the Bell icon with SSR disabled
const BellIcon = dynamic(() => import("lucide-react").then((mod) => mod.Bell), {
  ssr: false,
});

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState({
    newMessages: true,
    projectUpdates: true,
    newFollowers: false,
    marketing: false,
  })

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

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            General
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

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Update your email preferences and communication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="marketing-emails" />
                <Label htmlFor="marketing-emails">Receive marketing emails</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
              <CardDescription>Control who can see your profile and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="profile-public" defaultChecked />
                <Label htmlFor="profile-public">Make profile public</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="show-email" />
                <Label htmlFor="show-email">Show email address on profile</Label>
              </div>
            </CardContent>
          </Card>
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