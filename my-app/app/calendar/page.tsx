"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { rsvpService } from "@/lib/services/rsvp-service";

import {
  Info,
  Loader2,
  AlertCircle,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CalendarIcon,
  Filter,
  List,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { eventService } from "@/lib/services/event-service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
  type CalendarEvent as FullCalendarEvent,
} from "@/components/ui/full-calendar";
import {
  CalendarPrevTrigger,
  CalendarNextTrigger,
} from "@/components/ui/full-calendar"; // Import CalendarPrevTrigger and CalendarNextTrigger

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/* ────── Constants ────── */
import {
  pageVariants,
  itemVariants,
  calendarVariants,
  dialogVariants,
  customScrollStyles,
  type EventType,
  colorPalette,
  categories,
} from "@/lib/constants";

// Import and augment the Event type to match API response
import type { Event as BaseEvent } from "@/lib/services/event-service";

// Define the actual event structure that matches the API response
interface Event extends Omit<BaseEvent, "start_time" | "end_time"> {
  start: string;
  end: string;
  color?: string;
}

// Type for the processed events
type ProcessedEvent = FullCalendarEvent & {
  description: string;
  location: string;
  created_by?: string;
  poster_url?: string;
  creator?: { full_name: string; avatar: string | null };
};

export default function CalendarPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpData, setRsvpData] = useState({
    name: "",
    email: "",
    notes: "",
  });

  // Function to get a random color from our palette
  const getRandomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
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
      if (profile) {
        try {
          // Since getUserEvents doesn't exist, we'll filter the events for this user
          // This is a temporary solution - ideally we'd implement proper getUserEvents in the service
          const userEvents = publicEvents.filter(
            (event) => event.organizer_id === profile.id
          );
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
  }, [profile]); // Only re-fetch when user state changes

  // Get all events (public + personal)
  const allEvents = [...events, ...personalEvents];

  // Filter events based on category
  const filteredEvents = allEvents.filter(
    (event) =>
      categoryFilter === "all" ||
      (event.event_type || event.color) === categoryFilter
  );

  // Map of event IDs to consistent colors (so same event always has same color)
  const eventColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();

    // Assign a random color to each event and store it in the map
    filteredEvents.forEach((event) => {
      if (!colorMap.has(event.id)) {
        colorMap.set(event.id, getRandomColor());
      }
    });

    return colorMap;
  }, [filteredEvents]);

  // Convert events to FullCalendarEvent format for the full calendar
  const calendarEvents: FullCalendarEvent[] = filteredEvents
    .filter((event) => event.start && event.end) // Only include events with valid dates
    .map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      // Use random color from map instead of event type-based color
      color: eventColorMap.get(event.id) as any,
      description: event.description || "",
      location: event.location || "",
      created_by: event.created_by,
    }));

  // Handle calendar event click
  const handleEventClick = async (evt: FullCalendarEvent) => {
    try {
      // GET /api/events/<id>  — includes creator object
      const full = await eventService.getEvent(evt.id as string);

      if (!full) return; // 404 safeguard
      setSelectedEvent({
        id: full.id,
        title: full.title,
        start: new Date(full.start_time),
        end: new Date(full.end_time),
        description: full.description || "",
        location: full.location || "",
        created_by: full.created_by,
        creator: full.creator ?? undefined,
        poster_url: full.poster_url,
        color: eventColorMap.get(full.id),
      } as ProcessedEvent);

      setDialogOpen(true);
    } catch (err) {
      toast.error("Failed to load event details");
    }
  };

  // Handle RSVP submission
  const handleRSVP = async () => {
    try {
      await rsvpService.submitRSVP({
        eventId: selectedEvent!.id,
        name: profile?.full_name ?? rsvpData.name,
        email: profile?.email ?? rsvpData.email,
        notes: rsvpData.notes,
        userId: profile?.id,
      });
      setRsvpSuccess(true);
    } catch (err: any) {
      toast.error(err.message); // will show “You have already RSVPed …” etc.
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollStyles }} />
      <motion.div
        className="flex flex-col bg-gradient-to-br from-background via-background to-muted/20"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
        >
          <div className="container mx-auto flex flex-wrap items-center justify-between px-6 py-3 gap-4">
            {/* Title */}
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight">
              Events Calendar
            </h1>

            {/* Desktop: inline filters & stats */}
            <div className="hidden md:flex items-center gap-6">
              {/* Event Type */}
              <div>
                <label className="sr-only">Event Type</label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Events" />
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

              {/* View Toggle */}
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>

              {profile && (
                <Button
                  onClick={() => router.push("/calendar/new")}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 hover:text-white dark:hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              )}
            </div>

            {/* Mobile: compact header with Add & Filter */}
            <div className="md:hidden flex items-center gap-2">
              {/* + Add button (floating style) */}
              {profile && (
                <Button
                  size="icon"
                  className="bg-green-600 text-white hover:bg-green-700 hover:text-white dark:hover:text-white"
                  onClick={() => router.push("/calendar/new")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}

              {/* Filter toggle button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Filter Dropdown (with smooth animation) */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={
            filtersOpen
              ? { opacity: 1, height: "auto" }
              : { opacity: 0, height: 0 }
          }
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden px-6"
        >
          <div className="space-y-3 py-3 ">
            {/* View Toggle */}
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Event Type */}
            <div>
              <Label
                htmlFor="mobile-filter-type"
                className="text-sm font-medium"
              >
                Event Type
              </Label>
              <Select
                id="mobile-filter-type"
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Events" />
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
          </div>
        </motion.div>

        {/* Content (only this scrolls on desktop!) */}
        <div className="flex-1 overflow-auto py-4">
          {/* Auth Alert */}
          {!profile && !authLoading && (
            <motion.div variants={itemVariants} className="mb-6 px-4">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">
                    Sign in to add personal events and get personalized
                    notifications.
                  </span>{" "}
                  <Button
                    variant="link"
                    className="text-blue-600 p-0 h-auto"
                    onClick={() =>
                      router.push("/auth/login?redirect=/calendar")
                    }
                  >
                    Sign in now
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div variants={itemVariants} className="mb-6 px-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid h-full gap-6">
            {/* Events Pane */}
            <section className="flex flex-col lg:col-span-3 h-full">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    className="flex-1 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </motion.div>
                ) : view === "calendar" ? (
                  <motion.div
                    key="calendar"
                    ref={calendarContainerRef}
                    variants={calendarVariants}
                    className="h-[calc(100vh-200px)] min-h-[600px] px-4"
                  >
                    <Calendar
                      events={calendarEvents}
                      onEventClick={handleEventClick}
                    >
                      <div className="h-full flex flex-col border rounded-xl overflow-hidden dark:border-border shadow-sm">
                        <div className="flex p-6 items-center gap-3 border-b dark:border-border bg-muted/30">
                          <CalendarViewTrigger
                            className="aria-[current=true]:bg-accent px-4 py-2 rounded-lg font-medium"
                            view="day"
                          >
                            Day
                          </CalendarViewTrigger>
                          <CalendarViewTrigger
                            view="week"
                            className="aria-[current=true]:bg-accent px-4 py-2 rounded-lg font-medium"
                          >
                            Week
                          </CalendarViewTrigger>
                          <CalendarViewTrigger
                            view="month"
                            className="aria-[current=true]:bg-accent px-4 py-2 rounded-lg font-medium"
                          >
                            Month
                          </CalendarViewTrigger>

                          <span className="flex-1" />

                          <CalendarCurrentDate className="text-lg font-semibold" />

                          <div className="flex items-center gap-2">
                            <CalendarPrevTrigger className="p-2 hover:bg-muted rounded-lg">
                              <ChevronLeft size={18} />
                              <span className="sr-only">Previous</span>
                            </CalendarPrevTrigger>

                            <CalendarTodayTrigger className="px-4 py-2 rounded-lg font-medium hover:bg-muted">
                              Today
                            </CalendarTodayTrigger>

                            <CalendarNextTrigger className="p-2 hover:bg-muted rounded-lg">
                              <ChevronRight size={18} />
                              <span className="sr-only">Next</span>
                            </CalendarNextTrigger>
                          </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-6 relative">
                          <CalendarDayView className="[&_.calendar-day-slot]:min-h-[120px] [&_.calendar-day-slot]:p-4 [&_.calendar-day-slot]:overflow-y-auto [&_.calendar-day-slot]:scrollbar-thin [&_.calendar-day-slot]:scrollbar-thumb-muted [&_.calendar-day-slot]:scrollbar-track-transparent" />
                          <CalendarWeekView className="[&_.calendar-week-slot]:min-h-[140px] [&_.calendar-week-slot]:p-3 [&_.calendar-week-slot]:overflow-y-auto [&_.calendar-week-slot]:scrollbar-thin [&_.calendar-week-slot]:scrollbar-thumb-muted [&_.calendar-week-slot]:scrollbar-track-transparent" />
                          <CalendarMonthView className="[&_.calendar-month-grid]:gap-2 [&_.calendar-month-cell]:min-h-[160px] [&_.calendar-month-cell]:p-3 [&_.calendar-month-cell]:border [&_.calendar-month-cell]:rounded-lg [&_.calendar-month-cell]:bg-background [&_.calendar-month-cell]:overflow-y-auto [&_.calendar-month-cell]:scrollbar-thin [&_.calendar-month-cell]:scrollbar-thumb-muted [&_.calendar-month-cell]:scrollbar-track-transparent [&_.calendar-month-cell:hover]:bg-muted/50 [&_.calendar-month-cell]:transition-colors" />
                          <CalendarYearView />
                        </div>
                      </div>
                    </Calendar>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    className="flex-1 overflow-auto space-y-6"
                    variants={itemVariants}
                  >
                    <div className="min-h-0 px-4 py-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 px-4 py-2">
                          <List className="h-5 w-5" /> All Events
                          <Badge variant="secondary" className="ml-auto">
                            {filteredEvents.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 px-4 py-2">
                        {filteredEvents.length === 0 ? (
                          <div className="flex-1 text-center py-12">
                            <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              No events found.
                            </p>
                          </div>
                        ) : (
                          filteredEvents.map((e, i) => (
                            <motion.div
                              key={e.id}
                              variants={itemVariants}
                              custom={i}
                              whileHover={{ scale: 1.02 }}
                              className="group"
                            >
                              <Card
                                onClick={() => {
                                  const full = calendarEvents.find(
                                    (c) => c.id === e.id
                                  );
                                  if (full) {
                                    setSelectedEvent(full as ProcessedEvent);
                                    setDialogOpen(true);
                                  }
                                }}
                                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md border-l-4"
                                style={{
                                  borderLeftColor: `rgb(var(--${eventColorMap.get(
                                    e.id
                                  )}-500)/1)`,
                                }}
                              >
                                <CardContent className="space-y-2 p-4">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {categories[e.event_type as EventType] ||
                                        "Event"}
                                    </Badge>
                                    {e.event_type === "personal" && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Private
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold group-hover:text-primary">
                                    {e.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {e.start
                                        ? format(
                                            parseISO(e.start),
                                            "MMM d, yyyy 'at' h:mm a"
                                          )
                                        : "Unknown start time"}
                                    </div>
                                    {e.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate">
                                          <p className="font-medium text-[14px]">
                                            {/^(https?:\/\/)/i.test(e.location)
                                              ? "Online Event"
                                              : e.location}
                                          </p>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {e.description && (
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                      {e.description}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </CardContent>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>

        {/* Event Information Dialog with Integrated RSVP */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className="w-full max-h-[100dvh] p-0 overflow-hidden overflow-y-auto scrollbar-hidden 
            sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg"
          >
            <motion.div
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="py-5 px-4"
            >
              {selectedEvent && (
                <div className="space-y-6">
                  {/* Event Information */}
                  <div className="space-y-2">
                    {/* Poster preview */}
                    {selectedEvent?.poster_url && (
                      <div className="relative w-full max-w-sm mx-auto mb-4 overflow-hidden rounded-lg border shadow-lg shadow-black/10">
                        <Image
                          src={selectedEvent.poster_url}
                          alt={`${selectedEvent.title} poster`}
                          width={480}
                          height={480}
                          unoptimized
                          className="w-full h-auto object-contain"
                          sizes="(max-width:600px) 100vw, 320px"
                        />
                      </div>
                    )}

                    <div className="pb-2">
                      <DialogTitle className="text-2xl font-bold">
                        {selectedEvent.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 pt-2 group">
                        <Link
                          href={`/users/${selectedEvent?.created_by}`}
                          className="flex items-center gap-2"
                        >
                          {/* Avatar */}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            }}
                            className="h-8 w-8 relative rounded-full border overflow-hidden bg-muted border-border flex items-center justify-center transition-transform duration-200"
                          >
                            {!selectedEvent.creator ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : selectedEvent.creator.avatar ? (
                              <Image
                                src={selectedEvent.creator.avatar}
                                alt={selectedEvent.creator.full_name}
                                fill
                                className="object-cover"
                                sizes="64px"
                                priority
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-muted">
                                <span className="text-xs font-medium text-[#500000]">
                                  {selectedEvent.creator.full_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                          </motion.div>

                          {/* Host text */}
                          <p className="text-sm text-muted-foreground font-semibold group-hover:underline group-hover:text-foreground transition-colors duration-200">
                            Hosted by{" "}
                            {selectedEvent.creator?.full_name ?? "Unknown"}
                          </p>
                        </Link>
                      </div>
                    </div>

                    {/* Date, Time & Location */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Calendar Icon */}

                        <div
                          className="w-10 h-10 rounded-sm border bg-background text-center
                            overflow-hidden shadow-sm shrink-0"
                        >
                          <div className="bg-muted text-[10px] font-medium py-[3px] leading-none">
                            {format(selectedEvent.start, "MMM").toUpperCase()}
                          </div>
                          <div className="text-[15px] font-extrabold text-foreground leading-none pt-[3px]">
                            {format(selectedEvent.start, "d")}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="text-sm">
                          <p className="font-semibold text-[14px]">
                            {format(selectedEvent.start, "EEEE, MMMM d")}
                          </p>
                          <p className="text-muted-foreground">
                            {format(selectedEvent.start, "h:mm a")} –{" "}
                            {format(selectedEvent.end, "h:mm a")}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border" />

                        {/* Location Info */}
                        {selectedEvent.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 border rounded-md bg-background flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-[14px]">
                                {/^(https?:\/\/)/i.test(selectedEvent.location)
                                  ? "Online Event"
                                  : selectedEvent.location}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {/^(https?:\/\/)/i.test(selectedEvent.location)
                                  ? ""
                                  : "In-person Event"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Join Event Card */}
                  <Card
                    className="border border-primary/20 dark:border-primary/40
                      bg-primary/5 dark:bg-primary/10 p-4 space-y-4"
                  >
                    {new Date(selectedEvent.end) < new Date() ? (
                      // Past Event Notice
                      <div className="text-center text-sm text-muted-foreground space-y-1">
                        <h3 className="font-semibold text-base text-gray-800">
                          Past Event
                        </h3>
                        <p>
                          This event ended on{" "}
                          <span className="font-medium">
                            {format(
                              new Date(selectedEvent.end),
                              "MMMM d, yyyy"
                            )}
                          </span>
                          .
                        </p>
                      </div>
                    ) : rsvpSuccess ? (
                      // RSVP Success
                      <div className="text-center py-2">
                        <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-green-800 text-sm">
                          Registration Confirmed!
                        </h3>
                        <p className="text-xs text-green-600 mt-1">
                          A confirmation email has been sent to you.
                        </p>
                      </div>
                    ) : profile ? (
                      // Logged-in RSVP
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="font-semibold">
                            Register as {profile.full_name}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {profile.email}
                          </span>
                        </div>

                        <Textarea
                          id="rsvp-notes"
                          placeholder="Notes (optional)"
                          value={rsvpData.notes}
                          onChange={(e) =>
                            setRsvpData({
                              ...rsvpData,
                              notes: e.target.value,
                            })
                          }
                          rows={2}
                          className="text-sm"
                        />
                        <Button
                          onClick={handleRSVP}
                          disabled={rsvpLoading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
                        >
                          {rsvpLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            "One-Click RSVP"
                          )}
                        </Button>
                      </div>
                    ) : (
                      // Guest RSVP
                      <div className="space-y-3 text-sm">
                        <p className="font-medium text-gray-800">
                          Welcome! To join the event, please register below.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            id="rsvp-name"
                            placeholder="Full name"
                            value={rsvpData.name}
                            onChange={(e) =>
                              setRsvpData({ ...rsvpData, name: e.target.value })
                            }
                            required
                            className="text-sm"
                          />
                          <Input
                            id="rsvp-email"
                            type="email"
                            placeholder="your@email.com"
                            value={rsvpData.email}
                            onChange={(e) =>
                              setRsvpData({
                                ...rsvpData,
                                email: e.target.value,
                              })
                            }
                            required
                            className="text-sm"
                          />
                        </div>
                        <Textarea
                          id="rsvp-notes"
                          placeholder="Notes (optional)"
                          value={rsvpData.notes}
                          onChange={(e) =>
                            setRsvpData({ ...rsvpData, notes: e.target.value })
                          }
                          rows={2}
                          className="text-sm"
                        />
                        <Button
                          onClick={handleRSVP}
                          disabled={
                            rsvpLoading ||
                            !rsvpData.name.trim() ||
                            !rsvpData.email.trim()
                          }
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
                        >
                          {rsvpLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            "Register for Event"
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* About Event */}

                  {selectedEvent.description?.trim() && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        About Event
                      </h3>
                      <Separator />
                      <div className="rounded-md px-4 py-2">
                        <p className="text-sm leading-relaxed ">
                          {selectedEvent.description.trimStart()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}
