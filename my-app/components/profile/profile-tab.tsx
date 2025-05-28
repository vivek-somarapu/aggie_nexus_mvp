"use client";

import React, { useState } from "react";
import { Profile as ProfileType } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResumeInput } from "@/components/profile/resume-input";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Loader2,
  Download,
  Trash2,
  FileText,
  Linkedin,
  ExternalLink,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { InputFile } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagSelector } from "@/components/profile/tag-selector";
import { LinkWithPreview } from "@/components/link-preview";
import { containerVariants, itemVariants, skillOptions } from "@/lib/constants";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type BaseFormFields = {
  full_name: string;
  email: string;
  bio: string;
  linkedin_url: string;
  website_url: string;
  graduation_year?: number;
  is_texas_am_affiliate: boolean;
  avatar: string;
  skills: string[];
  industry: string[];
  resume_url: string;
  contact: { email: string; phone: string };
};

export interface ProfileTabProps<T extends BaseFormFields> {
  isLoading: boolean;
  user: ProfileType | null;

  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;

  setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;

  handleSaveProfile: () => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProfileTab<T extends BaseFormFields>({
  isLoading,
  user,
  formData,
  setFormData,
  setSelectedSkills,
  handleSaveProfile,
  handleChange,
  handleContactChange,
  resumeUrl,
  fileInfo,
  onResumeChange,
  onResumeDelete,
}: ProfileTabProps<T>) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  /* ---------------------------- UI -------------------------*/
  return (
    <TabsContent value="profile" className="space-y-6 mx-2">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {/* ---------- MAIN VIEW ---------- */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="flex justify-center items-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-2">Loading your profile...</span>
            </motion.div>
          ) : (
            <motion.div
              key="profile-content"
              initial="hidden"
              animate="visible"
              className="flex justify-center"
            >
              <div className="w-full max-w-4xl">
                <motion.div
                  className="grid md:grid-cols-3 gap-8 py-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    className="md:col-span-2 space-y-6"
                    variants={itemVariants}
                  >
                    {/* About */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">About</h3>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:shadow-sm rounded-2xl transition-shadow"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Button>
                        </DialogTrigger>
                      </div>

                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {user?.bio || "No bio provided yet."}
                      </p>
                    </div>

                    {/* Skills */}
                    {user?.skills && user.skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div className="space-y-5" variants={itemVariants}>
                    {/* Contact */}
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">Contact</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {user?.contact?.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Links (LinkedIn & Website) */}
                    {(user?.linkedin_url || user?.website_url) && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Links</h3>
                        <div className="space-y-3">
                          {user?.linkedin_url && (
                            <div className="flex items-center gap-3 group">
                              <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <LinkWithPreview
                                name={user?.full_name}
                                url={user.linkedin_url}
                              >
                                LinkedIn
                              </LinkWithPreview>
                            </div>
                          )}
                          {user?.website_url && (
                            <div className="flex items-center gap-3 group">
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <LinkWithPreview
                                name={user?.full_name}
                                url={user.website_url}
                              >
                                {user.website_url.replace(
                                  /^https?:\/\/(www\.)?/,
                                  ""
                                )}
                              </LinkWithPreview>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resume */}
                    {user?.resume_url && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Resume</h3>
                        {/* Mobile: link only */}
                        <div className="sm:hidden">
                          <a
                            href={user.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            View Resume
                          </a>
                        </div>

                        {/* Desktop: modal preview */}
                        <div className="hidden sm:block">
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="flex items-center gap-3 group cursor-pointer text-primary hover:underline">
                                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm">View Resume</span>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {user.full_name}'s Resume
                                </DialogTitle>
                              </DialogHeader>
                              <iframe
                                src={user.resume_url}
                                title="Resume"
                                className="w-full h-[80vh] rounded-md border"
                              />
                              <Button asChild className="mt-4">
                                <a
                                  href={user.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download PDF
                                </a>
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- EDIT DIALOG ---------- */}
        <DialogContent className="flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          {/* scrollable form */}
          <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted flex-1">
            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                className="text-sm"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                className="text-sm"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            {/* Contact email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="email"
                type="email"
                className="text-sm"
                value={formData.contact.email}
                onChange={handleContactChange}
                placeholder="public@example.com"
              />
            </div>

            {/* Resume uploader */}
            <div className="flex flex-col gap-2">
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
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                className="text-sm"
                value={formData.bio}
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
                {formData.bio.length} / 250
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills (select up to 10)</Label>
              <TagSelector
                label="Skills"
                options={skillOptions}
                selected={user?.skills || []}
                onChange={setSelectedSkills}
              />
            </div>
          </div>

          {/* footer */}
          <DialogFooter>
            <div className="w-full flex justify-end">
              <Button
                size="sm"
                className="w-32"
                onClick={async () => {
                  await handleSaveProfile();
                  setIsEditOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
