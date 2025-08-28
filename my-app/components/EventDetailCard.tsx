"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, Check, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type EventDetailProps = {
  id: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  color?: "default" | "green" | "blue" | "pink" | "purple" | null | undefined;
  isPopover?: boolean;
};

export function EventDetailCard({
  id,
  title,
  description,
  location,
  start,
  end,
  color = "default",
  isPopover = false,
}: EventDetailProps) {
  const [rsvp, setRsvp] = useState(false);

  const handleRsvpClick = () => {
    setRsvp(!rsvp);
    // TODO: Implement actual RSVP functionality
  };
  
  const colorMap = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };
  
  const colorClass = color ? colorMap[color] : colorMap.default;
  
  const EventContent = () => (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      {description && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(start, "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(start, "h:mm a")} - {format(end, "h:mm a")}
          </span>
        </div>
        
        {location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
          </div>
        )}
      </div>
      
      <div className="pt-2">
        <Button
          onClick={handleRsvpClick}
          variant={rsvp ? "default" : "outline"}
          className="w-full transition-all duration-300 group"
        >
          {rsvp ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Going
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              RSVP
            </>
          )}
        </Button>
      </div>
    </div>
  );
  
  // For popover display
  if (isPopover) {
    return (
      <PopoverContent side="right" align="start" className="w-80 p-4">
        <EventContent />
      </PopoverContent>
    );
  }
  
  // For regular dialog display - just render content directly
  return <EventContent />;
} 