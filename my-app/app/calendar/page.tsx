"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
  CalendarEvent as FullCalendarEvent,
} from "@/components/ui/full-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isWithinInterval } from "date-fns";

// Event type definition
type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  location: string;
  color: string;
};

// Type for the component's internal state
type ProcessedEvent = Omit<FullCalendarEvent, 'color'> & {
  description: string;
  location: string;
  color: "default" | "green" | "blue" | "pink" | "purple" | null | undefined;
};

export default function CalendarPage() {
  // Use client-side rendering to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ProcessedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from the database
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Convert string dates to Date objects and map colors to valid variants
        const formattedEvents = data.map((event: any) => {
          // Map string colors to valid color variants
          let validColor: "default" | "green" | "blue" | "pink" | "purple" | null | undefined;
          
          switch(event.color) {
            case "green":
              validColor = "green";
              break;
            case "blue":
              validColor = "blue";
              break;
            case "pink":
              validColor = "pink";
              break;
            case "purple":
              validColor = "purple";
              break;
            default:
              validColor = "default";
          }
          
          return {
            id: event.id,
            start: new Date(event.start),
            end: new Date(event.end),
            title: event.title,
            description: event.description || "",
            location: event.location || "",
            color: validColor
          };
        });
        
        setEvents(formattedEvents);
        setError(null);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
        
        // Fallback to sample events for development
        setEvents([
          {
            id: "1",
            start: new Date("2024-03-20T08:00:00"),
            end: new Date("2024-03-20T09:00:00"),
            title: "Today's Meeting",
            description: "Weekly team sync to discuss project progress",
            location: "Zach",
            color: "green",
          },
          {
            id: "2",
            start: new Date("2024-03-23T17:00:00"),
            end: new Date("2024-03-23T19:00:00"),
            title: "Innovation Expo Logo Design Competition",
            description: "Annual design competition showcasing creative talent",
            location: "Zach",
            color: "blue",
          },
          {
            id: "3",
            start: new Date("2024-03-24T19:00:00"),
            end: new Date("2024-03-24T20:30:00"),
            title: "Aggies Create Meeting",
            description: "Planning session for upcoming student projects",
            location: "Zach",
            color: "pink",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEvents();
  }, []);

  // Calculate upcoming events
  useEffect(() => {
    if (events.length > 0) {
      const today = new Date();
      const nextWeek = addDays(today, 7);
      
      const filtered = events.filter(event => 
        isWithinInterval(event.start, { start: today, end: nextWeek })
      );
      
      setUpcomingEvents(filtered);
      setMounted(true);
    }
  }, [events]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage your schedule and events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      <Calendar events={events}>
        <div className="h-[calc(100vh-230px)] flex flex-col border rounded-lg overflow-hidden">
          <div className="flex p-4 items-center gap-2 border-b">
            <CalendarViewTrigger className="aria-[current=true]:bg-accent" view="day">
              Day
            </CalendarViewTrigger>
            <CalendarViewTrigger view="week" className="aria-[current=true]:bg-accent">
              Week
            </CalendarViewTrigger>
            <CalendarViewTrigger view="month" className="aria-[current=true]:bg-accent">
              Month
            </CalendarViewTrigger>
            <CalendarViewTrigger view="year" className="aria-[current=true]:bg-accent">
              Year
            </CalendarViewTrigger>

            <span className="flex-1" />

            <CalendarCurrentDate />

            <CalendarPrevTrigger>
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </CalendarPrevTrigger>

            <CalendarTodayTrigger>Today</CalendarTodayTrigger>

            <CalendarNextTrigger>
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </CalendarNextTrigger>
          </div>

          <div className="flex-1 overflow-auto p-4 relative">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading events...</p>
              </div>
            ) : (
              <>
                <CalendarDayView />
                <CalendarWeekView />
                <CalendarMonthView />
                <CalendarYearView />
              </>
            )}
          </div>
        </div>
      </Calendar>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        {isLoading ? (
          <p>Loading upcoming events...</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-muted-foreground">No upcoming events in the next 7 days</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="py-2" style={{ backgroundColor: `var(--${event.color || 'default'}-100, #f0f9ff)` }}>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <span className="font-medium mr-2">Location:</span> {event.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Time:</span> 
                    {format(event.start, "MMMM d, yyyy 'at' h:mm a")} - {format(event.end, "h:mm a")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 