"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Award } from "lucide-react";
import { fundingAchievements } from "@/lib/constants";

interface FundingDisplayProps {
  amount: number;
  className?: string;
  showAchievement?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export function FundingDisplay({ 
  amount, 
  className,
  showAchievement = true,
  variant = "default"
}: FundingDisplayProps) {
  // Format amount with proper currency formatting
  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  // Get the highest achievement level reached
  const getHighestAchievement = (funding: number) => {
    const achievements = Object.entries(fundingAchievements)
      .filter(([_, data]) => funding >= data.amount)
      .sort(([_, a], [__, b]) => b.amount - a.amount);
    
    return achievements.length > 0 ? achievements[0] : null;
  };

  const achievement = getHighestAchievement(amount);
  const formattedAmount = formatAmount(amount);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <DollarSign className="w-3 h-3 text-green-600" />
        <span className="text-sm font-medium">{formattedAmount}</span>
        {showAchievement && achievement && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Award className="w-3 h-3 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{achievement[1].name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-lg font-semibold">{formattedAmount}</span>
          {showAchievement && achievement && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500">
              <Award className="w-3 h-3 mr-1" />
              {achievement[1].name}
            </Badge>
          )}
        </div>
        {showAchievement && achievement && (
          <p className="text-xs text-muted-foreground">{achievement[1].description}</p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <DollarSign className="w-4 h-4 text-green-600" />
        <span className="font-medium">{formattedAmount}</span>
      </div>
      {showAchievement && achievement && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500 text-xs">
                <Award className="w-3 h-3 mr-1" />
                {achievement[1].name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{achievement[1].description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
} 