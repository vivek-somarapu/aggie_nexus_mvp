"use client";

import React, { useState } from "react";

import Link from "next/link";
import { motion } from "framer-motion";
import { ResumeInput } from "@/components/profile/resume-input";
import {
  TexasAMAffiliation,
  type TexasAMAffiliationData,
} from "@/components/profile/tamu-affiliate";
import AdditionalLinks from "@/components/profile/additional-links";
import { Profile as ProfileType } from "@/lib/auth";
import {
  containerVariants,
  itemVariants,
  industryOptions,
} from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

import {
  ProfileAvatar,
  ProfileAvatarEdit,
} from "@/components/profile/profile-avatar";

import {
  CalendarIcon,
  GraduationCap,
  Eye,
  Pencil,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TagSelector } from "@/components/profile/tag-selector";
import { Textarea } from "../ui/textarea";

type MinimalFormData = {
  full_name: string;
  avatar: string;
  is_texas_am_affiliate: boolean;
  graduation_year?: number;
  contact: { email?: string; phone?: string };
  linkedin_url?: string;
  website_url?: string;
  resume_url?: string;
  bio?: string;
  additional_links?: { url: string; title: string }[];
};

/**
 * Profile edit form component used in /profile/settings and /profile/settings pages
 */

export interface ProfileSetupFormProps<T extends MinimalFormData> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  selectedIndustries: string[];
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAvatar: () => void;
  handleContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  resumeUrl: string | null;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
  };
  onResumeChange: (file: File | null) => void;
  onResumeDelete: () => void;
}

export function ProfileSetupForm<T extends MinimalFormData>({
  formData,
  setFormData,
  handleAvatarChange,
  handleDeleteAvatar,
  handleContactChange,
  handleChange,
  resumeUrl,
  fileInfo,
  onResumeChange,
  onResumeDelete,
}: ProfileSetupFormProps<T>) {
  const handleAffiliationChange = (data: TexasAMAffiliationData) => {
    setFormData({
      ...formData,
      is_texas_am_affiliate: data.is_texas_am_affiliate,
      graduation_year: data.graduation_year,
    });
  };

  const additionalLinks = formData.additional_links || [];

  return (
    <>
      {/* Avatar + Name + Affiliation */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full flex justify-center sm:w-auto sm:shrink-0">
          <ProfileAvatarEdit
            avatar={formData.avatar}
            fullName={formData.full_name}
            onAvatarChange={handleAvatarChange}
            onAvatarDelete={handleDeleteAvatar}
          />
        </div>
        <div className="w-full sm:flex-1 space-y-2">
          <div className="space-y-1">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>
          <TexasAMAffiliation
            value={{
              is_texas_am_affiliate: formData.is_texas_am_affiliate,
              graduation_year: formData.graduation_year,
            }}
            onChange={handleAffiliationChange}
          />
        </div>
      </div>

      {/* Contacts and links */}
      <div className="grid gap-4 md:grid-cols-2">
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
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            name="phone"
            value={formData.contact.phone || ""}
            onChange={handleContactChange}
            placeholder="(123) 456-7890"
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

        {/* Additional Links */}
        <AdditionalLinks
          links={additionalLinks}
          colsClass="grid-cols-1 md:grid-cols-2"
          onChangeLinks={(newLinks) =>
            setFormData({
              ...formData,
              additional_links: newLinks,
            })
          }
        />
      </div>

      {/* Resume */}
      <div className=" sm:col-span-2">
        <ResumeInput
          label="Professional Resume"
          value={resumeUrl}
          onChange={onResumeChange}
          onDelete={onResumeDelete}
          accept=".pdf,.doc,.docx"
          fileInfo={fileInfo || undefined}
        />
      </div>

      {/* Bio */}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          className="max-h-[80px] overflow-y-auto"
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
    </>
  );
}

/**
 * Profile view/edit component used in /profile page
 */

interface ProfileCardProps<T extends MinimalFormData = MinimalFormData> {
  user: ProfileType | null;

  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;

  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;

  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAvatar: () => void;
  handleSaveProfile: () => void;
  showCompletionBanner: boolean;
  isSaving: boolean;
}

export function ProfileCard<T extends MinimalFormData = MinimalFormData>({
  user,
  formData,
  setFormData,
  setSelectedIndustries,
  handleAvatarChange,
  handleDeleteAvatar,
  handleSaveProfile,
  showCompletionBanner,
  isSaving,
}: ProfileCardProps<T>) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const handleAffiliationChange = (data: TexasAMAffiliationData) => {
    setFormData({
      ...formData,
      is_texas_am_affiliate: data.is_texas_am_affiliate,
      graduation_year: data.graduation_year,
    });
  };

  return (
    <Card className="shadow-none overflow-hidden border-0">
      {/* Gradient heading */}
      {/* <div className="relative -mt-7 h-50 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
        <div className="absolute top-6 right-4">
          {!showCompletionBanner && (
            <Button variant="secondary" size="sm" className="shadow-sm" asChild>
              <Link href={`/users/${user?.id}`}>View Profile</Link>
            </Button>
          )}
        </div>
      </div> */}

      {/* {!showCompletionBanner && (
            <Button variant="secondary" size="sm" className="shadow-sm" asChild>
              <Link href={`/users/${user?.id}`}>View Profile</Link>
            </Button>
          )} */}

      <CardContent className="px-6 relative">
        <motion.div
          className="flex flex-col gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Avatar */}
          <div className="flex justify-center">
            <ProfileAvatar
              avatar={user?.avatar || null}
              fullName={formData.full_name}
              is_texas_am_affiliate={formData.is_texas_am_affiliate}
            />
          </div>

          {/* Info block */}
          <motion.div className="flex-1 space-y-4" variants={itemVariants}>
            {/* Name + edit button */}
            <div className="flex items-center justify-center">
              <h2 className="pl-13 text-2xl font-bold tracking-tight">
                {user?.full_name || "Unnamed User"}
              </h2>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:shadow-sm ml-5 rounded-2xl transition-shadow"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </DialogTrigger>

                <DialogContent className="flex flex-col max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted flex-1">
                    {/* Avatar edit */}
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* ── Avatar ───────────────────────────── */}
                      <div className="w-full flex justify-center sm:w-auto sm:shrink-0">
                        <ProfileAvatarEdit
                          avatar={formData.avatar}
                          fullName={formData.full_name}
                          onAvatarChange={handleAvatarChange}
                          onAvatarDelete={handleDeleteAvatar}
                        />
                      </div>

                      <div className="w-full sm:flex-1 space-y-4 pt-2">
                        {/* Full Name */}
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                full_name: e.target.value,
                              }))
                            }
                          />
                        </div>

                        {/* A&M Affiliation */}
                        <TexasAMAffiliation
                          value={{
                            is_texas_am_affiliate:
                              formData.is_texas_am_affiliate,
                            graduation_year: formData.graduation_year,
                          }}
                          onChange={handleAffiliationChange}
                        />
                      </div>
                    </div>

                    {/* Industry edit */}
                    <div className="space-y-2">
                      <Label>Industries (select up to 10)</Label>
                      <TagSelector
                        label="Industries"
                        options={industryOptions}
                        selected={user?.industry || []}
                        onChange={setSelectedIndustries}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <div className="w-full flex justify-end">
                      <Button
                        disabled={isSaving}
                        onClick={async () => {
                          await handleSaveProfile();
                          setIsEditOpen(false);
                        }}
                      >
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Meta info */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              {user?.is_texas_am_affiliate && (
                <div className="flex items-center">
                  <Separator orientation="vertical" className="h-4 hidden" />
                  <GraduationCap className="h-4 w-4 mr-1" />
                  <span>Texas A&M Affiliate</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
