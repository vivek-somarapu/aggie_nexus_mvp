"use client";

import Image from "next/image";
import { cn } from "@/lib/utils"; // shadcn helper (optional)

/* -------------------------------------------------------------------------- */
/*                             SquarePoster                                   */
/* -------------------------------------------------------------------------- */
/**
 * Renders a square poster with a blurred, darkened backdrop and a crisp
 * foreground image.  The component keeps a perfect square aspect ratio and
 * gracefully falls back to a placeholder if no `src` is provided.
 */
interface SquarePosterProps {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Optional extra CSS classes for the wrapper `<div>` */
}

export const SquarePoster = ({
  src,
  alt = "poster",
  className,
}: SquarePosterProps) => {
  const imageSrc = src || "/placeholder.svg";

  return (
    <div
      className={cn(
        // layout
        "relative w-full max-w-sm mx-auto overflow-hidden rounded-lg border",

        // background + border colors
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur",
        "border-slate-200 dark:border-slate-600",

        // shadow
        "shadow-lg shadow-black/10 dark:shadow-black/40",

        className
      )}
    >
      {/* 1️⃣ Square container keeps 1:1 aspect ratio */}
      <div className="relative aspect-square w-full">
        {/* 2️⃣ Blurred backdrop */}
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt=""
            fill
            unoptimized
            className="object-cover blur-md scale-110"
            sizes="(max-width: 600px) 100vw, 320px"
          />

          {/* Dark overlay: lighter in light-mode, deeper in dark-mode */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        </div>

        {/* 3️⃣ Foreground crisp poster */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Image
            src={imageSrc}
            alt={alt}
            width={480}
            height={480}
            unoptimized
            className="max-w-full max-h-full w-auto h-auto object-contain
                    drop-shadow-lg dark:drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
            sizes="(max-width: 600px) 100vw, 320px"
          />
        </div>
      </div>
    </div>
  );
};
