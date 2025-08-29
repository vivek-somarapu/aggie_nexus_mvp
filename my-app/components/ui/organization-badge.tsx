"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  GraduationCap, 
  Users, 
  Rocket, 
  Lightbulb,
  Crown,
  School,
  Briefcase
} from "lucide-react";

interface OrganizationBadgeProps {
  organization: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

// Organization icon mapping
const organizationIcons = {
  "Aggies Create": Lightbulb,
  "AggieX": Rocket,
  "Aggie Entrepreneurs (AE)": Users,
  "Texas A&M Innovation": Building2,
  "Startup Aggieland": Rocket,
  "Mays Business School": School,
  "Engineering Entrepreneurship": Briefcase,
  "Student Government Association": Crown,
  "Graduate Student Council": GraduationCap,
  "Other": Building2
};

// Organization color variants
const organizationVariants = {
  "Aggies Create": "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-500",
  "AggieX": "bg-gradient-to-r from-purple-400 to-purple-600 text-white border-purple-500",
  "Aggie Entrepreneurs (AE)": "bg-gradient-to-r from-green-400 to-green-600 text-white border-green-500",
  "Texas A&M Innovation": "bg-gradient-to-r from-red-400 to-red-600 text-white border-red-500",
  "Startup Aggieland": "bg-gradient-to-r from-orange-400 to-orange-600 text-white border-orange-500",
  "Mays Business School": "bg-gradient-to-r from-indigo-400 to-indigo-600 text-white border-indigo-500",
  "Engineering Entrepreneurship": "bg-gradient-to-r from-teal-400 to-teal-600 text-white border-teal-500",
  "Student Government Association": "bg-gradient-to-r from-pink-400 to-pink-600 text-white border-pink-500",
  "Graduate Student Council": "bg-gradient-to-r from-cyan-400 to-cyan-600 text-white border-cyan-500",
  "Other": "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-gray-500"
};

export function OrganizationBadge({ 
  organization, 
  className,
  variant = "default"
}: OrganizationBadgeProps) {
  const Icon = organizationIcons[organization as keyof typeof organizationIcons] || organizationIcons.Other;
  const colorVariant = organizationVariants[organization as keyof typeof organizationVariants] || organizationVariants.Other;

  if (variant === "outline") {
    return (
      <Badge 
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium",
          className
        )}
      >
        <Icon className="w-3 h-3" />
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
        <Icon className="w-3 h-3" />
        {organization}
      </Badge>
    );
  }

  return (
    <Badge 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border shadow-sm",
        colorVariant,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {organization}
    </Badge>
  );
} 