"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Star, 
  Award, 
  Medal, 
  Zap, 
  Target, 
  Users, 
  Calendar,
  Bookmark,
  GraduationCap,
  Rocket
} from "lucide-react";

interface AchievementBadgeProps {
  achievement: string;
  className?: string;
  showTooltip?: boolean;
}

// Achievement icon mapping
const achievementIcons = {
  // Funding achievements
  "10K_FUNDED": Trophy,
  "25K_FUNDED": Trophy,
  "50K_FUNDED": Trophy,
  "100K_FUNDED": Trophy,
  "250K_FUNDED": Trophy,
  "500K_FUNDED": Trophy,
  "1M_FUNDED": Trophy,
  
  // Other achievements
  "FIRST_PROJECT": Star,
  "TEAM_BUILDER": Users,
  "EVENT_HOST": Calendar,
  "NETWORKER": Users,
  "BOOKMARKED": Bookmark,
  "INCUBATOR_GRAD": GraduationCap,
  "ACCELERATOR_GRAD": Rocket,
  
  // Default
  "DEFAULT": Award
};

// Achievement color variants
const achievementVariants = {
  // Funding achievements - gold gradient
  "10K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "25K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "50K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "100K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "250K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "500K_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  "1M_FUNDED": "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500",
  
  // Other achievements - different colors
  "FIRST_PROJECT": "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-500",
  "TEAM_BUILDER": "bg-gradient-to-r from-green-400 to-green-600 text-white border-green-500",
  "EVENT_HOST": "bg-gradient-to-r from-purple-400 to-purple-600 text-white border-purple-500",
  "NETWORKER": "bg-gradient-to-r from-indigo-400 to-indigo-600 text-white border-indigo-500",
  "BOOKMARKED": "bg-gradient-to-r from-pink-400 to-pink-600 text-white border-pink-500",
  "INCUBATOR_GRAD": "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white border-emerald-500",
  "ACCELERATOR_GRAD": "bg-gradient-to-r from-orange-400 to-orange-600 text-white border-orange-500",
  
  // Default
  "DEFAULT": "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-gray-500"
};

// Achievement descriptions
const achievementDescriptions = {
  "10K_FUNDED": "Seed Seeker - Raised $10,000+ in funding",
  "25K_FUNDED": "Growth Guardian - Raised $25,000+ in funding",
  "50K_FUNDED": "Funding Fighter - Raised $50,000+ in funding",
  "100K_FUNDED": "Capital Champion - Raised $100,000+ in funding",
  "250K_FUNDED": "Investment Icon - Raised $250,000+ in funding",
  "500K_FUNDED": "Venture Victor - Raised $500,000+ in funding",
  "1M_FUNDED": "Millionaire Maker - Raised $1M+ in funding",
  "FIRST_PROJECT": "Project Pioneer - Created your first project",
  "TEAM_BUILDER": "Team Builder - Successfully recruited team members",
  "EVENT_HOST": "Event Host - Hosted your first event",
  "NETWORKER": "Networker - Connected with 10+ users",
  "BOOKMARKED": "Bookmarked - Your project was bookmarked 5+ times",
  "INCUBATOR_GRAD": "Incubator Graduate - Graduated from an incubator program",
  "ACCELERATOR_GRAD": "Accelerator Graduate - Graduated from an accelerator program"
};

export function AchievementBadge({ 
  achievement, 
  className,
  showTooltip = true 
}: AchievementBadgeProps) {
  const Icon = achievementIcons[achievement as keyof typeof achievementIcons] || achievementIcons.DEFAULT;
  const variant = achievementVariants[achievement as keyof typeof achievementVariants] || achievementVariants.DEFAULT;
  const description = achievementDescriptions[achievement as keyof typeof achievementDescriptions] || "Achievement unlocked!";

  const badge = (
    <Badge 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border shadow-sm",
        variant,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {achievement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
} 