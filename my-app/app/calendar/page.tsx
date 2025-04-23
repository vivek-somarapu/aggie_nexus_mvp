"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Loader2, AlertCircle, Plus, UserCircle2, ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isValid, addDays, isWithinInterval } from "date-fns";
import { eventService } from "@/lib/services/event-service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Import and augment the Event type to match API response
import type { Event as BaseEvent } from "@/lib/services/event-service";

// Define the actual event structure that matches the API response
interface Event extends Omit<BaseEvent, 'start_date' | 'end_date'> {
  start: string;
  end: string;
  color?: string;
}

// Define EventType for categorization
type EventType = 'workshop' | 'info_session' | 'networking' | 'hackathon' | 'deadline' | 'meeting' | 'personal' | 'other';

// Type for the processed events
type ProcessedEvent = FullCalendarEvent & {
  description: string;
  location: string;
};

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 }
  }
};

const calendarVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 150, delay: 0.2 }
  }
};

// Add dialog animations
const dialogVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 } 
  }
};

// Update the event card variants for upcoming events
const eventCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 15, stiffness: 120 }
  },
  hover: { 
    y: -5, 
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2 } 
  },
  tap: { 
    scale: 0.98, 
    transition: { duration: 0.1 } 
  }
};

// Add container variants for list animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07
    }
  }
};

export default function CalendarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  const categories: Record<EventType, string> = {
    workshop: "Workshops",
    info_session: "Info Sessions",
    networking: "Networking Events",
    hackathon: "Hackathons",
    deadline: "Project Deadlines",
    meeting: "Meetings",
    other: "Other Events",
    personal: "Personal Events"
  };
  
  // Function to get events
  const getEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching calendar events...");
      
      // Always fetch public events regardless of auth state
      const publicEvents = await eventService.getEvents();
      // Safe cast since we know the API returns the correct shape
      setEvents(publicEvents as unknown as Event[]);
      
      // Get personal events if user is authenticated
      if (user) {
        try {
          // Since getUserEvents doesn't exist, we'll filter the events for this user
          // This is a temporary solution - ideally we'd implement proper getUserEvents in the service
          const userEvents = publicEvents.filter(event => event.organizer_id === user.id);
          // Safe cast since we know the API returns the correct shape
          setPersonalEvents(userEvents as unknown as Event[]);
        } catch (err) {
          console.error("Error fetching personal events:", err);
        }
      }
      
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
    
  // Fetch events when component mounts
  useEffect(() => {
    getEvents();
  }, [user]); // Only re-fetch when user state changes
  
  // Get all events (public + personal)
  const allEvents = [...events, ...personalEvents];
  
  // Filter events based on category
  const filteredEvents = allEvents.filter(event => 
    categoryFilter === "all" || (event.event_type || event.color) === categoryFilter
  );
  
  // Get events for selected date
  const eventsForSelectedDate = date 
    ? filteredEvents.filter(event => {
        const eventDate = event.start ? parseISO(event.start) : null;
        return eventDate && isValid(eventDate) && 
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear();
      })
    : [];
  
  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!a.start || !b.start) return 0;
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
  
  // Get upcoming events (next 7 days)
  const upcomingEvents = filteredEvents.filter(event => {
    if (!event.start) return false;
    const eventDate = parseISO(event.start);
    if (!isValid(eventDate)) return false;
    
    const today = new Date();
    const sevenDaysLater = addDays(today, 7);
    const eventTime = eventDate.getTime();
    
    return eventTime >= today.getTime() && eventTime <= sevenDaysLater.getTime();
  }).sort((a, b) => {
    return new Date(a.start as string).getTime() - new Date(b.start as string).getTime();
  });

  // Function to get badge variant based on event type
  const getBadgeVariant = (type: string) => {
    switch(type as EventType) {
      case "workshop":
        return "blue";
      case "info_session":
        return "green";
      case "networking":
        return "yellow";
      case "hackathon":
        return "purple";
      case "deadline":
        return "red";
      case "meeting":
        return "orange";
      case "personal":
        return "pink";
      default:
        return "default";
    }
  };
  
  // Convert events to FullCalendarEvent format for the full calendar
  const calendarEvents: FullCalendarEvent[] = filteredEvents
    .filter(event => event.start && event.end) // Only include events with valid dates
    .map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      color: (event.color ? getBadgeVariant(event.color) : getBadgeVariant(event.event_type || 'other')) as any,
      description: event.description || '',
      location: event.location || '',
    }));

  // Handle calendar event click
  const handleEventClick = (event: FullCalendarEvent) => {
    // Find the full event data including description and location
    const fullEvent = calendarEvents.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent as ProcessedEvent);
      setDialogOpen(true);
    }
  };

  return (
    <motion.div 
      className="container max-w-7xl mx-auto p-4 space-y-4"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Calendar</h1>
          <p className="text-muted-foreground">
            Discover upcoming events and opportunities
          </p>
        </div>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "calendar" | "list")}
            className="hidden sm:flex"
          >
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          {user && (
            <Button onClick={() => router.push('/calendar/new')} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </motion.div>
      
      {!user && !authLoading && (
        <motion.div variants={itemVariants}>
          <Alert variant="info" className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800 mb-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Sign in to add personal events and get personalized notifications.</span>{" "}
              <Button variant="link" className="h-auto p-0 text-blue-600 dark:text-blue-400" onClick={() => router.push('/auth/login?redirect=/calendar')}>
                Sign in now
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {Object.entries(categories).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "calendar" | "list")}
          className="sm:hidden w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>
      
      <motion.div className="grid md:grid-cols-4 gap-4" variants={itemVariants}>
        {/* Left Sidebar */}
        <motion.div className="md:col-span-1 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>View Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Tabs defaultValue={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
                    <TabsTrigger value="list" className="flex-1">List</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Event Type</label>
                <Select defaultValue={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {Object.entries(categories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {view === "calendar" && date && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>
                    {format(date, "MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {eventsForSelectedDate.length > 0 ? (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {eventsForSelectedDate.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            whileHover={{ x: 5 }}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                            onClick={() => router.push(`/calendar/${event.id}`)}
                          >
                            <Badge 
                              variant="outline" 
                              className="rounded-sm px-1 py-0 text-xs"
                            >
                              {categories[event.event_type as EventType] || 'Event'}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.start ? format(parseISO(event.start), "h:mm a") : "Time not set"}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.p 
                        className="text-sm text-muted-foreground text-center py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        No events for this day
                      </motion.p>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
        
        {/* Main Calendar Area */}
        <div className="md:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex justify-center items-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading events...</span>
              </motion.div>
            ) : (
              <>
                {view === "calendar" ? (
                  <motion.div 
                    key="calendar" 
                    ref={calendarContainerRef}
                    variants={calendarVariants}
                    className="h-[calc(100vh-350px)] min-h-[500px]"
                  >
                    <Card className="h-full shadow-sm">
                      <Calendar events={calendarEvents} onEventClick={handleEventClick}>
                        <div className="h-full flex flex-col border rounded-lg overflow-hidden dark:border-border">
                          <div className="flex p-4 items-center gap-2 border-b dark:border-border">
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
                            <CalendarDayView />
                            <CalendarWeekView />
                            <CalendarMonthView />
                            <CalendarYearView />
                          </div>
                        </div>
                      </Calendar>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    className="space-y-4"
                    variants={itemVariants}
                  >
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle>Upcoming Events</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {sortedEvents.length === 0 ? (
                          <motion.p 
                            className="text-center py-4 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            No events found. Try changing your filters.
                          </motion.p>
                        ) : (
                          <motion.ul 
                            className="space-y-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            {sortedEvents.map((event, index) => (
                              <motion.li 
                                key={event.id}
                                variants={itemVariants}
                                custom={index}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <Card 
                                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => router.push(`/calendar/${event.id}`)}
                                >
                                  <div className={cn(
                                    "h-1 w-full",
                                    {
                                      "bg-blue-500": event.event_type === "workshop",
                                      "bg-green-500": event.event_type === "info_session",
                                      "bg-yellow-500": event.event_type === "networking",
                                      "bg-purple-500": event.event_type === "hackathon",
                                      "bg-red-500": event.event_type === "deadline",
                                      "bg-orange-500": event.event_type === "meeting",
                                      "bg-pink-500": event.event_type === "personal",
                                      "bg-gray-500": event.event_type === "other",
                                    }
                                  )} />
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge 
                                            variant="outline" 
                                            className="rounded-sm px-1 py-0 text-xs"
                                          >
                                            {categories[event.event_type as EventType] || 'Event'}
                                          </Badge>
                                          {event.event_type === "personal" && (
                                            <Badge variant="secondary" className="rounded-sm px-1 py-0 text-xs">
                                              Private
                                            </Badge>
                                          )}
                                        </div>
                                        <h3 className="font-medium text-base mb-1">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {event.start ? format(parseISO(event.start), "MMMM d, yyyy 'at' h:mm a") : "Date not set"}
                                        </p>
                                        {event.description && (
                                          <p className="text-sm line-clamp-2">{event.description}</p>
                                        )}
                                      </div>
                                      {event.organizer_id && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <UserCircle2 className="h-3 w-3" />
                                          <span className="truncate max-w-[100px]">{event.organizer_id}</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                
                {/* Upcoming Events Section - Enhanced */}
                {upcomingEvents.length > 0 && (
                  <motion.div 
                    variants={itemVariants}
                    className="mt-4"
                  >
                    <Card className="shadow-sm border-t overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardTitle className="flex items-center">
                          <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                          <span>Upcoming Aggie Events</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {/* Group events by date */}
                          {Array.from(
                            upcomingEvents.reduce((acc, event) => {
                              const date = format(parseISO(event.start), "yyyy-MM-dd");
                              if (!acc.has(date)) {
                                acc.set(date, []);
                              }
                              acc.get(date)?.push(event);
                              return acc;
                            }, new Map<string, Event[]>())
                          ).map(([dateStr, dayEvents], groupIndex) => {
                            const date = new Date(dateStr);
                            return (
                              <motion.div 
                                key={dateStr}
                                initial="hidden"
                                animate="visible"
                                custom={groupIndex}
                                className="p-4"
                                variants={{
                                  hidden: { opacity: 0 },
                                  visible: i => ({
                                    opacity: 1,
                                    transition: { delay: i * 0.1 }
                                  })
                                }}
                              >
                                <h4 className="text-sm font-medium mb-3 flex items-center bg-muted/30 p-2 rounded">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: groupIndex * 0.1 + 0.2, type: "spring" }}
                                    className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"
                                  />
                                  {format(date, "EEEE, MMMM d")}
                                </h4>
                                <div className="ml-4 space-y-2 border-l-2 border-primary/20 pl-4">
                                  {dayEvents.map((event, eventIndex) => (
                                    <motion.div 
                                      key={event.id}
                                      variants={eventCardVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      custom={eventIndex}
                                      className="rounded-md border bg-card shadow-sm overflow-hidden cursor-pointer"
                                      onClick={() => {
                                        const fullEvent = calendarEvents.find(e => e.id === event.id);
                                        if (fullEvent) {
                                          setSelectedEvent(fullEvent as ProcessedEvent);
                                          setDialogOpen(true);
                                        }
                                      }}
                                    >
                                      <div className="flex items-start p-3">
                                        <div 
                                          className={cn(
                                            "w-1 h-full self-stretch flex-shrink-0 rounded-full",
                                            {
                                              "bg-blue-500": event.event_type === "workshop",
                                              "bg-green-500": event.event_type === "info_session",
                                              "bg-yellow-500": event.event_type === "networking",
                                              "bg-purple-500": event.event_type === "hackathon",
                                              "bg-red-500": event.event_type === "deadline",
                                              "bg-orange-500": event.event_type === "meeting",
                                              "bg-pink-500": event.event_type === "personal",
                                              "bg-gray-500": event.event_type === "other",
                                            }
                                          )}
                                        />
                                        <div className="ml-3 flex-1">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                {event.start ? format(parseISO(event.start), "h:mm a") : "Time not set"}
                                                {event.location && ` • ${event.location}`}
                                              </p>
                                            </div>
                                            <Badge 
                                              variant="outline" 
                                              className="rounded-sm px-1 py-0 text-xs"
                                            >
                                              {categories[event.event_type as EventType] || 'Event'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
            className="p-6"
          >
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedEvent.start, "MMM d, yyyy • h:mm a")} - {format(selectedEvent.end, "h:mm a")}</span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="mt-4 bg-muted/30 p-3 rounded-md">
                    <p className="text-sm whitespace-pre-line">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => setDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      onClick={() => router.push(`/calendar/${selectedEvent.id}`)}
                    >
                      View Details
                    </Button>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 