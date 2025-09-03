"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { IncubatorAcceleratorBadge } from "./incubator-accelerator-badge";

interface OrganizationBadgeProps {
  organization: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

// Special organizations that should use incubator/accelerator badges
const SPECIAL_ORGANIZATIONS = [
  "Aggies Create Incubator",
  "AggieX Accelerator"
];

export function OrganizationBadge({ 
  organization, 
  className,
  variant = "default"
}: OrganizationBadgeProps) {
  // Check if this is a special organization that should use incubator/accelerator badge
  if (SPECIAL_ORGANIZATIONS.includes(organization)) {
    const type = organization.includes("Incubator") ? "incubator" : "accelerator";
    return (
      <IncubatorAcceleratorBadge
        type={type}
        organization={organization}
        className={className}
        size="sm"
      />
    );
  }

  // For all other organizations, use a simple black badge
  if (variant === "outline") {
    return (
      <Badge 
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium",
          className
        )}
      >
        <Building2 className="w-3 h-3" />
        {organization}
      </Badge>
    );
  }

  if (variant === "secondary") {
    return (
      <Badge 
        variant="secondary"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium",
          className
        )}
      >
        <Building2 className="w-3 h-3" />
        {organization}
      </Badge>
    );
  }

  // Default variant - black badge
  return (
    <Badge 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border shadow-sm",
        "bg-black text-white border-black",
        className
      )}
    >
      <Building2 className="w-3 h-3" />
      {organization}
    </Badge>
  );
} 