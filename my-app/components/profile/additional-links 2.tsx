// components/profile/AdditionalLinks.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export interface AdditionalLink {
  url: string;
  title: string;
}

export interface AdditionalLinksProps {
  links: AdditionalLink[];
  onChangeLinks: (links: AdditionalLink[]) => void;
  maxLinks?: number;
  colsClass?: string;
}

export default function AdditionalLinks({
  links,
  onChangeLinks,
  colsClass = "grid-cols-1 md:grid-cols-2",
  maxLinks = 2,
}: AdditionalLinksProps) {
  // Utility function to derive site name from URL
  const deriveSiteName = (url: string): string => {
    if (!url) return "";

    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      const hostname = urlObj.hostname.toLowerCase();

      // Remove www. prefix
      const domain = hostname.replace(/^www\./, "");

      // Map of common domains to their display names
      const siteMap: Record<string, string> = {
        "github.com": "GitHub",
        "linkedin.com": "LinkedIn",
        "kaggle.com": "Kaggle",
        "twitter.com": "Twitter",
        "x.com": "X (Twitter)",
        "instagram.com": "Instagram",
        "facebook.com": "Facebook",
        "youtube.com": "YouTube",
        "behance.net": "Behance",
        "dribbble.com": "Dribbble",
        "medium.com": "Medium",
        "dev.to": "Dev.to",
        "stackoverflow.com": "Stack Overflow",
        "codepen.io": "CodePen",
        "gitlab.com": "GitLab",
        "bitbucket.org": "Bitbucket",
        "figma.com": "Figma",
        "notion.so": "Notion",
        "substack.com": "Substack",
        "hashnode.dev": "Hashnode",
        "hashnode.com": "Hashnode",
      };

      // Check if it's a known site
      if (siteMap[domain]) {
        return siteMap[domain];
      }

      // For subdomains of known sites
      for (const [siteDomain, siteName] of Object.entries(siteMap)) {
        if (domain.endsWith(siteDomain)) {
          return siteName;
        }
      }

      // For unknown sites, capitalize the domain name
      const domainParts = domain.split(".");
      const mainDomain = domainParts[0];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i);
      if (match && match[1]) {
        const domain = match[1].split(".")[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
      return "";
    }
  };

  const handleAdd = () => {
    if (links.length < maxLinks) {
      onChangeLinks([...links, { url: "", title: "" }]);
    }
  };

  // clear *all* slots
  const handleRemoveAll = () => {
    onChangeLinks([]);
  };

  // update url or title at index, and auto-derive title on URL change
  const handleUrlChange = (idx: number, url: string) => {
    const updated = [...links];
    // ensure the slot exists
    while (updated.length <= idx) updated.push({ url: "", title: "" });
    // your “paste into slot 1 but save into slot 0 if empty” logic:
    if (idx === 1 && !updated[0].url.trim()) {
      updated[0] = { url, title: deriveSiteName(url) };
      updated[1] = { url: "", title: "" };
    } else {
      updated[idx] = { url, title: deriveSiteName(url) };
    }
    onChangeLinks(updated);
  };

  const handleTitleChange = (idx: number, title: string) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], title };
    onChangeLinks(updated);
  };

  // clear a single slot
  const handleClearSlot = (idx: number) => {
    const updated = links.map((l, i) =>
      i === idx ? { url: "", title: "" } : l
    );
    onChangeLinks(updated);
  };

  const canEdit = links.length > 0;

  return (
    <>
      {canEdit ? (
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center">
            <Label>Additional Links</Label>
            <Button variant="ghost" size="sm" onClick={handleRemoveAll}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className={`grid ${colsClass} gap-4`}>
            {[0, 1].map((idx) => (
              <div key={idx} className="relative">
                <Input
                  placeholder={`https://example.com/${idx + 1}`}
                  value={links[idx]?.url || ""}
                  onChange={(e) => handleUrlChange(idx, e.target.value)}
                  className="pr-24"
                />

                {links[idx]?.url && (
                  <Input
                    placeholder="Title"
                    value={links[idx].title}
                    onChange={(e) => handleTitleChange(idx, e.target.value)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 
                            w-24 h-6 text-xs pl-1 pr-6 mr-1 bg-muted border-none font-medium text-muted-foreground"
                  />
                )}

                {links[idx]?.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClearSlot(idx)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 " />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Enter a valid URL to auto-detect site name
          </p>
        </div>
      ) : (
        <div className="md:col-span-2">
          <Button variant="outline" onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Additional Link (limit {maxLinks})
          </Button>
        </div>
      )}
    </>
  );
}
