"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { User as UserType } from "@/lib/models/users";
import {
  containerVariants,
  itemVariants,
  industryOptions,
} from "@/lib/constants";

import {
  CalendarIcon,
  GraduationCap,
  Eye,
  Pencil,
  Trash2,
  User,
  Loader2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TagSelector } from "@/components/profile/tag-selector";

type MinimalFormData = {
  full_name: string;
  avatar: string;
  is_texas_am_affiliate: boolean;
  graduation_year?: number;
};

interface ProfileCardProps<T extends MinimalFormData = MinimalFormData> {
  user: UserType | null;

  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;

  selectedIndustries: string[];
  setSelectedIndustries: React.Dispatch<React.SetStateAction<string[]>>;

  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAvatar: () => void;
  handleSwitchChange: (checked: boolean, name: keyof T) => void;
  handleSaveProfile: () => void;

  isSaving: boolean;
}

export function ProfileCard<T extends MinimalFormData = MinimalFormData>({
  user,
  formData,
  setFormData,
  selectedIndustries,
  setSelectedIndustries,
  handleAvatarChange,
  handleDeleteAvatar,
  handleSwitchChange,
  handleSaveProfile,
  isSaving,
}: ProfileCardProps<T>) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <Card className="shadow-none border border-border/50 overflow-hidden md:shadow-md md:border-0">
      {/* Gradient heading */}
      <div className="relative -mt-7 h-50 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
        <div className="absolute top-6 right-4">
          <Button variant="secondary" size="sm" className="shadow-sm" asChild>
            <Link href={`/users/${user?.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>

      <CardContent className="px-6 -mt-16 relative">
        <motion.div
          className="flex flex-col md:flex-row gap-6 mb-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Avatar */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Avatar className="h-32 w-32 relative border-4 border-background ring-2 ring-border/40 shadow-md overflow-hidden">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.full_name ?? "User"}
                  width={128}
                  height={128}
                  className="object-cover rounded-full"
                  priority
                />
              ) : (
                <AvatarFallback className="text-3xl bg-muted">
                  {user?.full_name ? (
                    user.full_name.charAt(0)
                  ) : (
                    <User className="h-16 w-16" />
                  )}
                </AvatarFallback>
              )}
            </Avatar>
          </motion.div>

          {/* Info block */}
          <motion.div className="flex-1 space-y-4" variants={itemVariants}>
            {/* Name + edit button */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                {user?.full_name || "Unnamed User"}
              </h2>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:shadow-sm rounded-2xl transition-shadow"
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
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-border/40 shadow-md">
                        <AvatarImage
                          src={formData.avatar}
                          alt={formData.full_name}
                        />
                        {formData.avatar ? (
                          <Image
                            src={formData.avatar}
                            alt={formData.full_name ?? "User"}
                            width={128}
                            height={128}
                            className="object-cover rounded-full"
                            priority
                          />
                        ) : (
                          <AvatarFallback className="text-3xl bg-muted">
                            {formData.full_name ? (
                              formData.full_name.charAt(0).toUpperCase()
                            ) : (
                              <User className="h-16 w-16" />
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div>
                          <Label htmlFor="avatar-upload" className="block mb-2">
                            Upload New Picture
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="max-w-xs"
                            />
                            {formData.avatar && (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteAvatar}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Recommended: square ≥ 200 × 200 px
                        </p>
                      </div>
                    </div>

                    {/* Name edit */}
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

                    {/* Industry edit */}
                    <div className="space-y-2">
                      <Label>Industries (select up to 10)</Label>
                      <TagSelector
                        label="Industries"
                        options={industryOptions}
                        selected={selectedIndustries}
                        onChange={setSelectedIndustries}
                      />
                    </div>

                    {/* Texas A&M edit */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_texas_am_affiliate"
                        checked={formData.is_texas_am_affiliate}
                        onCheckedChange={(checked) =>
                          handleSwitchChange(checked, "is_texas_am_affiliate")
                        }
                      />
                      <Label htmlFor="is_texas_am_affiliate">
                        I am a Texas A&M affiliate
                      </Label>
                    </div>

                    {formData.is_texas_am_affiliate && (
                      <div className="space-y-2 max-w-xs">
                        <Label htmlFor="graduation_year">Graduation Year</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          value={formData.graduation_year ?? ""}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              graduation_year: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            }))
                          }
                          placeholder="YYYY"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <div className="w-full flex justify-end">
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Meta info */}
            <motion.div
              className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>0 profile views</span>
              </div>

              {user?.is_texas_am_affiliate && (
                <div className="flex items-center">
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <GraduationCap className="h-4 w-4 mr-1" />
                  <span>Texas A&M Affiliate</span>
                </div>
              )}

              {user?.graduation_year && (
                <div className="flex items-center">
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Class of {user.graduation_year}</span>
                </div>
              )}
            </motion.div>

            {/* Industry tags */}
            {user?.industry?.length && (
              <motion.div
                className="flex flex-wrap gap-2 mt-2"
                variants={containerVariants}
              >
                {user.industry.map((tag) => (
                  <motion.div key={tag} variants={itemVariants}>
                    <Badge variant="secondary" className="px-2 py-1">
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
