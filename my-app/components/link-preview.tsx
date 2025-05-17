"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { useEffect, useState } from "react";

type LinkPreview = { title: string; description: string };

const LINKEDIN_RE = /linkedin\.com/i;
const GHP_RE = /github\.io$/i;

interface Props {
  url: string;
  name?: string;
  children: React.ReactNode;
}

export function LinkWithPreview({ url, name, children }: Props) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  /* ---------- helpers ---------- */
  const linkedInFallback = (): LinkPreview => ({
    title: `LinkedIn — ${name ?? "Profile"}`,
    description: "",
  });

  const fetchPreview = async (link: string): Promise<LinkPreview> => {
    if (LINKEDIN_RE.test(link)) return linkedInFallback();

    // fallback for GitHub Pages
    if (GHP_RE.test(new URL(link).hostname))
      return {
        title: "Portfolio — " + new URL(link).hostname.split(".")[0],
        description: "",
      };

    try {
      const qs = new URLSearchParams({
        url: link,
        meta: "true",
        timeout: "10s",
      });
      const res = await fetch(`https://api.microlink.io/?${qs}`);
      if (!res.ok) throw new Error("microlink failed");
      const { data } = await res.json();
      return {
        title: data?.title || link,
        description: data?.description || "",
      };
    } catch {
      return { title: link, description: "" };
    }
  };

  /* ---------- prefetch once ---------- */
  useEffect(() => {
    fetchPreview(url).then(setPreview);
  }, [url]);

  /* ---------- UI ---------- */
  return (
    <HoverCard.Root openDelay={0} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <a
          href={url}
          target="_blank"
          className="text-sm"
          rel="noopener noreferrer"
        >
          {preview?.title ?? new URL(url).hostname.replace(/^www\./, "")}
        </a>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={6}
          className="w-72 p-4 bg-white rounded-xl shadow-lg z-50"
        >
          {preview ? (
            <>
              <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                {preview.title}
              </h4>
              {preview.description && (
                <p className="text-xs text-gray-500 line-clamp-3">
                  {preview.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">Loading preview…</p>
          )}
          <HoverCard.Arrow className="fill-white" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
