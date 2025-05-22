"use client";

import { useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Upload, Trash2 } from "lucide-react";

interface ProfileAvatarEditProps {
  avatar: string | null;
  fullName: string | null;
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAvatarDelete: () => void;
}

interface ProfileAvatarProps {
  avatar: string | null;
  fullName: string | null;
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
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-border/40 shadow-md">
          <AvatarImage src={avatar || ""} alt={fullName || "User"} />
          {avatar ? (
            <Image
              src={avatar || "/placeholder.svg"}
              alt={fullName ?? "User"}
              width={128}
              height={128}
              className="object-cover rounded-full"
              priority
            />
          ) : (
            <AvatarFallback className="text-3xl bg-muted">
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
            className="absolute top-0 right-0 bg-destructive text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-destructive/80 transition group-hover:opacity-100 opacity-0"
            onClick={onAvatarDelete}
            title="Delete picture"
          >
            <Trash2 className="h-4 w-4" />
          </div>
        )}

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
export function ProfileAvatar({ avatar, fullName }: ProfileAvatarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-border/40 shadow-md">
        <AvatarImage src={avatar || ""} alt={fullName || "User"} />
        {avatar ? (
          <Image
            src={avatar || "/placeholder.svg"}
            alt={fullName ?? "User"}
            width={128}
            height={128}
            className="object-cover rounded-full"
            priority
          />
        ) : (
          <AvatarFallback className="text-3xl bg-muted">
            {fullName ? (
              fullName.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="h-16 w-16" />
            )}
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
}
