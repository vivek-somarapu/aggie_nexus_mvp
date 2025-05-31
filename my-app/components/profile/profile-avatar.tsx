"use client";

import { useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  industryOptions,
} from "@/lib/constants";

interface ProfileAvatarEditProps {
  avatar: string | null;
  fullName: string | null;
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAvatarDelete: () => void;
}

interface ProfileAvatarProps {
  avatar: string | null;
  fullName: string | null;
  is_texas_am_affiliate: boolean;
}

/**
 * Editable avatar component with upload and delete
 */
export function ProfileAvatarEdit({
  avatar,
  fullName,
  onAvatarChange,
  onAvatarDelete,
}: ProfileAvatarEditProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar
          className="h-32 w-32 border-4 border-background ring-2 ring-border/40 shadow-md"
          key={avatar}
        >
          {avatar ? (
            <AvatarImage
              src={avatar}
              alt={fullName || "User"}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="text-3xl bg-muted text-[#500000]">
              {fullName ? (
                fullName.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="h-16 w-16" />
              )}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Upload icon overlay */}
        <div
          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
          onClick={triggerFileInput}
          title="Upload new picture"
        >
          <Upload className="h-4 w-4" />
        </div>

        {/* Delete icon overlay */}
        {avatar && (
          <div
            className="absolute top-0 right-0 bg-destructive text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-destructive/80 transition-opacity opacity-0 group-hover:opacity-100"
            onClick={onAvatarDelete}
            title="Delete picture"
          >
            <Trash2 className="h-4 w-4" />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          className="hidden"
          id="avatar-upload"
        />
      </div>
    </div>
  );
}

/**
 * Static avatar component (view-only)
 */
export function ProfileAvatar({
  avatar,
  fullName,
  is_texas_am_affiliate,
}: ProfileAvatarProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div
        className={cn(
          "h-32 w-32 relative rounded-full ring-2 shadow-md overflow-hidden",
          is_texas_am_affiliate
            ? "border-4 border-[#500000]"
            : "border-4 border-background ring-border/40"
        )}
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={fullName ?? "User"}
            fill
            className="object-cover"
            sizes="128px"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
            <span className="text-3xl font-medium text-[#500000]">
              {fullName ? (
                fullName.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="h-16 w-16" />
              )}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
