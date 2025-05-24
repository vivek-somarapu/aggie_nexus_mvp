"use client";

import type React from "react";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TexasAMAffiliationData {
  is_texas_am_affiliate: boolean;
  graduation_year?: number;
}

interface TexasAMAffiliationProps {
  value: TexasAMAffiliationData;
  onChange: (data: TexasAMAffiliationData) => void;
  className?: string;
}

export function TexasAMAffiliation({
  value,
  onChange,
  className,
}: TexasAMAffiliationProps) {
  const currentYear = new Date().getFullYear();

  // Initialize graduation year if it's not set and affiliate is true
  useEffect(() => {
    if (value.is_texas_am_affiliate && value.graduation_year === undefined) {
      onChange({
        ...value,
        graduation_year: currentYear,
      });
    }
  }, [
    value.is_texas_am_affiliate,
    value.graduation_year,
    currentYear,
    onChange,
    value,
  ]);

  const handleToggleChange = (checked: boolean) => {
    onChange({
      is_texas_am_affiliate: checked,
      graduation_year: checked
        ? value.graduation_year || currentYear
        : value.graduation_year,
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      graduation_year: e.target.value
        ? Number.parseInt(e.target.value)
        : currentYear,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between p-3 rounded-md">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-4 w-4 text-gray-500" />
          <Label
            htmlFor="is_texas_am_affiliate"
            className="font-medium cursor-pointer"
          >
            Texas A&M affiliate?
          </Label>
        </div>
        <div className="flex items-center gap-3">
          {/* Graduation Year - Conditional Field */}
          <div
            className={cn(
              "transition-all duration-300",
              value.is_texas_am_affiliate
                ? "w-24 opacity-100"
                : "w-0 opacity-0 overflow-hidden"
            )}
          >
            <Input
              id="graduation_year"
              type="number"
              value={value.graduation_year || currentYear}
              onChange={handleYearChange}
              className="h-8 text-sm"
              placeholder={currentYear.toString()}
            />
          </div>
          <Switch
            id="is_texas_am_affiliate"
            checked={value.is_texas_am_affiliate}
            onCheckedChange={handleToggleChange}
            className="data-[state=checked]:bg-[#500000]"
          />
        </div>
      </div>
    </div>
  );
}
