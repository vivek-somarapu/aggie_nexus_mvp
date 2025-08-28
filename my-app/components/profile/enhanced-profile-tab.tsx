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
  FileText,
  Linkedin,
  ExternalLink,
  Mail,
  Trophy,
  Building2,
  DollarSign,
  Code,
  Users,
} from "lucide-react";
import AdditionalLinks from "@/components/profile/additional-links";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TagSelector } from "@/components/profile/tag-selector";
import { EnhancedTagSelector } from "@/components/ui/enhanced-tag-selector";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { OrganizationBadge } from "@/components/ui/organization-badge";
import { FundingDisplay } from "@/components/ui/funding-display";
import { containerVariants, itemVariants, skillOptions, industryOptions, organizationOptions, technicalSkillOptions, softSkillOptions } from "@/lib/constants";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type EnhancedFormFields = {
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
  additional_links?: { url: string; title: string }[];
  // New gamification fields
  funding_raised?: number;
  organizations?: string[];
  achievements?: string[];
  technical_skills?: string[];
  soft_skills?: string[];
};

export interface EnhancedProfileTabProps {
  isLoading: boolean;
  user: ProfileType | null;
  formData: EnhancedFormFields;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedFormFields>>;
  setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedOrganizations: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedTechnicalSkills: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSoftSkills: React.Dispatch<React.SetStateAction<string[]>>;
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

export function EnhancedProfileTab({
  isLoading,
  user,
  formData,
  setFormData,
  setSelectedSkills,
  setSelectedIndustries,
  setSelectedOrganizations,
  setSelectedTechnicalSkills,
  setSelectedSoftSkills,
  handleSaveProfile,
  handleChange,
  handleContactChange,
  resumeUrl,
  fileInfo,
  onResumeChange,
  onResumeDelete,
}: EnhancedProfileTabProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const additionalLinks = formData.additional_links || [];

  // Technical skills categories
  const technicalSkillCategories = {
    "Programming Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Scala"],
    "Web Technologies": ["React", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "Laravel", "ASP.NET"],
    "Mobile Development": ["React Native", "Flutter", "Xamarin", "Ionic", "Native iOS", "Native Android"],
    "Database & Backend": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes"],
    "Data Science & AI": ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Jupyter", "R", "Tableau", "Power BI"],
    "Design & Creative": ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign", "Blender", "Unity", "Unreal Engine"],
    "Other Technical": ["Git", "Linux", "DevOps", "CI/CD", "API Development", "Microservices", "Blockchain", "IoT", "Cybersecurity"]
  };

  // Soft skills categories
  const softSkillCategories = {
    "Communication": ["Public Speaking", "Written Communication", "Presentation Skills", "Active Listening", "Storytelling"],
    "Leadership": ["Team Leadership", "Project Management", "Strategic Planning", "Decision Making", "Conflict Resolution"],
    "Business": ["Business Development", "Sales", "Marketing", "Customer Service", "Negotiation", "Financial Management"],
    "Personal": ["Time Management", "Problem Solving", "Critical Thinking", "Creativity", "Adaptability", "Resilience"],
    "Collaboration": ["Teamwork", "Cross-functional Collaboration", "Mentoring", "Networking", "Relationship Building"],
    "Event & Community": ["Event Planning", "Community Building", "Volunteer Management", "Fundraising", "Grant Writing"]
  };

  return (
    <TabsContent value="profile" className="space-y-6">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {/* ---------- MAIN VIEW ---------- */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="flex justify-center items-center py-1"
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
              <div className="w-full border rounded-xl p-6">
                <motion.div
                  className="grid md:grid-cols-3 gap-8"
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

                    {/* Achievements */}
                    {user?.achievements && user.achievements.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-semibold text-lg">Achievements</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.achievements.map((achievement) => (
                            <AchievementBadge key={achievement} achievement={achievement} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Funding Raised */}
                    {user?.funding_raised && user.funding_raised > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-lg">Funding Raised</h3>
                        </div>
                        <FundingDisplay amount={user.funding_raised} variant="detailed" />
                      </div>
                    )}

                    {/* Organizations */}
                    {user?.organizations && user.organizations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">Organizations</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.organizations.map((org) => (
                            <OrganizationBadge key={org} organization={org} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Industry */}
                    {user?.industry && user.industry.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Industry</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.industry.map((tag) => (
                            <motion.div key={tag} variants={itemVariants}>
                              <Badge variant="secondary" className="px-2 py-1">
                                {tag}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical Skills */}
                    {user?.technical_skills && user.technical_skills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-lg">Technical Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.technical_skills.slice(0, 8).map((skill) => (
                            <Badge key={skill} variant="outline" className="px-2 py-1">
                              {skill}
                            </Badge>
                          ))}
                          {user.technical_skills.length > 8 && (
                            <Badge variant="outline">
                              +{user.technical_skills.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Soft Skills */}
                    {user?.soft_skills && user.soft_skills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-indigo-600" />
                          <h3 className="font-semibold text-lg">Soft Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.soft_skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="outline" className="px-2 py-1">
                              {skill}
                            </Badge>
                          ))}
                          {user.soft_skills.length > 6 && (
                            <Badge variant="outline">
                              +{user.soft_skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Legacy Skills */}
                    {user?.skills && user.skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.slice(0, 6).map((skill, skillIndex) => (
                            <Badge key={`profile-skill-${skillIndex}`} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                          {user.skills && user.skills.length > 6 && (
                            <Badge variant="outline">
                              +{user.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div className="space-y-5" variants={itemVariants}>
                    {/* Contact */}
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">Contact</h3>
                      <div className="space-y-3">
                        {user?.contact?.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a
                              href={`mailto:${user.contact.email}`}
                              className="text-sm hover:underline text-primary"
                            >
                              {user.contact.email}
                            </a>
                          </div>
                        )}
                        {user?.contact?.phone && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a
                              href={`tel:${user.contact.phone}`}
                              className="text-sm hover:underline text-primary"
                            >
                              {user.contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">Links</h3>
                      <div className="space-y-3">
                        {user?.linkedin_url && (
                          <div className="flex items-center gap-3">
                            <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a
                              href={user.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline text-primary flex items-center gap-1"
                            >
                              LinkedIn
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {user?.website_url && (
                          <div className="flex items-center gap-3">
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a
                              href={user.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline text-primary flex items-center gap-1"
                            >
                              Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {additionalLinks.length > 0 &&
                          additionalLinks.map((link, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline text-primary flex items-center gap-1"
                              >
                                {link.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Resume */}
                    {resumeUrl && (
                      <div>
                        <h3 className="font-semibold mb-2 text-lg">Resume</h3>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:underline text-primary flex items-center gap-1"
                          >
                            View Resume
                            <ExternalLink className="h-3 w-3" />
                          </a>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {/* Gamification Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Achievements & Funding</h3>
              
              <div>
                <Label htmlFor="funding_raised">Total Funding Raised ($)</Label>
                <Input
                  id="funding_raised"
                  name="funding_raised"
                  type="number"
                  value={formData.funding_raised || 0}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total funding raised across all your projects
                </p>
              </div>

              <div>
                <Label>Organizations</Label>
                <EnhancedTagSelector
                  label="Organizations"
                  options={organizationOptions}
                  selected={formData.organizations || []}
                  onChange={(selected) => setSelectedOrganizations(selected)}
                  maxTags={5}
                  placeholder="Select organizations you're affiliated with"
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills & Expertise</h3>
              
              <div>
                <Label>Industry</Label>
                <TagSelector
                  label="Industry"
                  options={industryOptions}
                  selected={formData.industry}
                  onChange={(selected) => setSelectedIndustries(selected)}
                  maxTags={5}
                />
              </div>

              <div>
                <Label>Technical Skills</Label>
                <EnhancedTagSelector
                  label="Technical Skills"
                  options={technicalSkillOptions}
                  selected={formData.technical_skills || []}
                  onChange={(selected) => setSelectedTechnicalSkills(selected)}
                  maxTags={15}
                  categorized={true}
                  categories={technicalSkillCategories}
                  categoryLabels={{
                    "Programming Languages": "Programming Languages",
                    "Web Technologies": "Web Technologies",
                    "Mobile Development": "Mobile Development",
                    "Database & Backend": "Database & Backend",
                    "Data Science & AI": "Data Science & AI",
                    "Design & Creative": "Design & Creative",
                    "Other Technical": "Other Technical"
                  }}
                />
              </div>

              <div>
                <Label>Soft Skills</Label>
                <EnhancedTagSelector
                  label="Soft Skills"
                  options={softSkillOptions}
                  selected={formData.soft_skills || []}
                  onChange={(selected) => setSelectedSoftSkills(selected)}
                  maxTags={10}
                  categorized={true}
                  categories={softSkillCategories}
                  categoryLabels={{
                    "Communication": "Communication",
                    "Leadership": "Leadership",
                    "Business": "Business",
                    "Personal": "Personal",
                    "Collaboration": "Collaboration",
                    "Event & Community": "Event & Community"
                  }}
                />
              </div>

              <div>
                <Label>General Skills</Label>
                <TagSelector
                  label="General Skills"
                  options={skillOptions}
                  selected={formData.skills}
                  onChange={(selected) => setSelectedSkills(selected)}
                  maxTags={10}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="email"
                    value={formData.contact.email}
                    onChange={handleContactChange}
                    placeholder="Contact email"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    name="phone"
                    value={formData.contact.phone}
                    onChange={handleContactChange}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="LinkedIn profile URL"
                  />
                </div>

                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="Personal website URL"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resume</h3>
              <ResumeInput
                resumeUrl={resumeUrl}
                fileInfo={fileInfo}
                onResumeChange={onResumeChange}
                onResumeDelete={onResumeDelete}
              />
            </div>

            {/* Additional Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Links</h3>
              <AdditionalLinks
                links={additionalLinks}
                onChange={(links) =>
                  setFormData((prev) => ({ ...prev, additional_links: links }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
} 