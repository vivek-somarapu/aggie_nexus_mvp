"use client";
import * as React from "react";
import { useRef, ChangeEvent, useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { itemVariants } from "@/lib/constants";
import { useRouter } from "next/navigation";

/**
 * Utility to extract the first letter of the first name.
 */
function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
export interface AvatarGroupProps {
  avatars: Array<{
    id?: string;
    src: string;
    alt?: string; // full name
    label?: string; // fallback name
    role?: string; // e.g. “Designer”
    isOwner?: boolean; // true if this user is the project owner
  }>;
  maxVisible?: number;
  size?: number;
  overlap?: number;
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

/**
 * AvatarGroup: shows overlapping avatars with hover tooltip, fallback initials,
 * and each links to /users/[id] when an id is provided.
 */

export default function AvatarGroup({
  avatars,
  maxVisible = 5,
  size = 40,
  overlap = 14,
}: AvatarGroupProps) {
  const router = useRouter();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visible = avatars.slice(0, maxVisible);
  const extraCount = avatars.length - maxVisible;

  const isImage = (src?: string) => !!src && !src.endsWith("/placeholder.png");

  return (
    <div className="flex items-center">
      <div className="flex" style={{ marginLeft: -overlap }}>
        {visible.map((a, idx) => {
          const isHovered = idx === hoveredIdx;
          const name = a.label ?? a.alt ?? "";

          // Dedupe tags so "Owner" only appears once
          const tagsSet = new Set<string>();
          if (a.role) tagsSet.add(a.role);
          if (a.isOwner) tagsSet.add("Owner");
          const tags = Array.from(tagsSet);

          const tooltip = `${name}${
            tags.length ? ` (${tags.join(", ")})` : ""
          }`;

          return (
            <div
              key={idx}
              className="relative cursor-pointer"
              style={{
                marginLeft: idx === 0 ? 0 : -overlap,
                zIndex: isHovered ? 100 : visible.length - idx,
                transition: "margin-left 0.3s, transform 0.3s",
                transform: isHovered ? "translateY(-10px)" : "translateY(0)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => a.id && router.push(`/users/${a.id}`)}
            >
              <Avatar
                className="border-2 border-background ring-2 ring-border/40 shadow-md"
                style={{ width: size, height: size }}
              >
                {isImage(a.src) ? (
                  <AvatarImage
                    src={a.src}
                    alt={name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">
                    {getInitials(name)}
                  </AvatarFallback>
                )}
              </Avatar>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="tooltip"
                    initial={{ x: "-50%", y: 10, opacity: 0, scale: 0.7 }}
                    animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
                    exit={{ x: "-50%", y: 10, opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="absolute left-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg pointer-events-none"
                    style={{ top: -size * 0.7 }}
                  >
                    {tooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {extraCount > 0 && (
          <div
            className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold border-2 border-background shadow-md"
            style={{
              width: size,
              height: size,
              marginLeft: -overlap,
              fontSize: size * 0.32,
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
}
