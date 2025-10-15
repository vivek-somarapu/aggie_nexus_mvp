"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";
import { SquarePoster } from "@/components/ui/SquarePoster";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarIcon,
  Link as LinkIcon,
  Filter,
  Edit,
} from "lucide-react";
import { eventService } from "@/lib/services/event-service";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
} from "date-fns";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarMonthView,
  CalendarTodayTrigger,
  type CalendarEvent as FullCalendarEvent,
} from "@/components/ui/full-calendar";
import {
  CalendarPrevTrigger,
  CalendarNextTrigger,
} from "@/components/ui/full-calendar";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ────── Constants ────── */
import {
  pageVariants,
  itemVariants,
  calendarVariants,
  dialogVariants,
  customScrollStyles,
  colorPalette,
  categories,
  industryOptions,
} from "@/lib/constants";

// Import and augment the Event type to match API response
import type { Event as BaseEvent } from "@/lib/services/event-service";

// Define the actual event structure that matches the API response
interface Event extends Omit<BaseEvent, "start_time" | "end_time"> {
  start: string;
  end: string;
  color?: string;
  pending_changes?: any;
  has_pending_changes?: boolean;
}

// Type for the processed events
type ProcessedEvent = FullCalendarEvent & {
  description: string;
  location: string;
  created_by?: string;
  poster_url?: string;
  creator?: { full_name: string; avatar: string | null };
  pending_changes?: any;
  has_pending_changes?: boolean;
};

// It hides the calendar view on mobile and uses a list view instead. The calendar view is only available on desktop screens.
function useMediaQuery(query: string) {
  const getMatch = () =>
    typeof window !== "undefined" && window.matchMedia(query).matches;

  const [matches, setMatches] = useState(getMatch); // ← initialised correctly

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export default function CalendarPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
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

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [view, setView] = useState<"calendar" | "list">(
    isDesktop ? "calendar" : "list"
  );
  const effectiveView = isDesktop ? view : "list";

  // Function to merge pending changes with base event for display
  const mergeEventWithPendingChanges = (event: Event): Event => {
    if (event.has_pending_changes && event.pending_changes) {
      return {
        ...event,
        title: event.pending_changes.title || event.title,
        description: event.pending_changes.description || event.description,
        start_time: event.pending_changes.start_time || event.start_time,
        end_time: event.pending_changes.end_time || event.end_time,
        location: event.pending_changes.location || event.location,
        event_type: event.pending_changes.event_type || event.event_type,
        industry: event.pending_changes.industry || event.industry,
        poster_url: event.pending_changes.poster_url || event.poster_url,
        start: event.pending_changes.start_time || event.start,
        end: event.pending_changes.end_time || event.end,
      };
    }
    return event;
  };

  const allEvents = events.map(mergeEventWithPendingChanges);
  const [includeOld, setIncludeOld] = useState(false);

  const cutoff = startOfDay(subDays(new Date(), 1));

  // If the user shrinks the window below md, force-switch to list
  useEffect(() => {
    if (!isDesktop) setView("list");
  }, [isDesktop]);

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

  // Filter events based on category and industry
  const filteredEvents = allEvents.filter((event) => {
    const categoryMatch =
      categoryFilter === "all" ||
      (event.event_type || event.color) === categoryFilter;

    const industryMatch =
      industryFilter === "all" ||
      (event.industry && event.industry.includes(industryFilter));

    return categoryMatch && industryMatch;
  });

  const upcomingOrRecent = filteredEvents.filter(
    (ev) => new Date(ev.start) >= cutoff
  );
  const listEvents = includeOld ? filteredEvents : upcomingOrRecent;

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
  const dayLabel = (d: Date) => {
    if (isToday(d)) return "Today " + format(d, "EEEE");
    if (isYesterday(d)) return "Yesterday " + format(d, "EEEE");
    return format(d, "EEEE, MMM d");
  };

  const groupedEvents = useMemo(() => {
    const sorted = [...listEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    const map = new Map<string, Event[]>();
    sorted.forEach((ev) => {
      const key = dayLabel(parseISO(ev.start));
      map.set(key, [...(map.get(key) ?? []), ev]);
    });
    return Array.from(map.entries());
  }, [listEvents]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollStyles }} />
      <motion.div
        className="flex flex-col max-w-6xl bg-gradient-to-b mx-auto from-background via-background to-muted/20"
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
              {/* Industry Filter */}
              {/* <div>
                <label className="sr-only">Industry</label>
                <Select
                  value={industryFilter}
                  onValueChange={setIndustryFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}

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

              {/* View Toggle – only show on desktop */}
              {isDesktop && (
                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {profile && (
                <Button
                  onClick={() => router.push("/calendar/new")}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 hover:text-white dark:hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              )}

              {/* {isDesktop && effectiveView === "list" && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={includeOld}
                    onCheckedChange={setIncludeOld}
                  />
                  <span className="text-sm">Old events</span>
                </div>
              )} */}
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
            {/* Industry Filter */}
            {/* <div>
              <Label
                htmlFor="mobile-filter-industry"
                className="text-sm py-2 font-medium"
              >
                Industry
              </Label>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Event Type */}
            <div>
              <Label
                htmlFor="mobile-filter-type"
                className="text-sm py-2 font-medium"
              >
                Event Type
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

            <div>
              <Label className="text-sm py-2 font-medium">Old events</Label>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  Show past events
                </span>
                <Switch checked={includeOld} onCheckedChange={setIncludeOld} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-hidden pt-4">
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
                ) : effectiveView === "calendar" ? (
                  // Calendarview of Events
                  <motion.div
                    key="calendar"
                    ref={calendarContainerRef}
                    variants={calendarVariants}
                    className="flex-1 flex flex-col"
                  >
                    <Calendar
                      key={categoryFilter}
                      events={calendarEvents}
                      /** keep the calendar locked to “month” view */
                      view="month"
                      onEventClick={handleEventClick}
                    >
                      <div className="h-full flex flex-col overflow-hidden">
                        {/* header -------------------------------------------------------- */}
                        <div className="flex flex-wrap items-center gap-2 p-3 border rounded-t-lg bg-muted/30">
                          <div className="relative flex flex-1 items-center justify-center">
                            <CalendarCurrentDate
                              className="
                              absolute left-1/2 -translate-x-1/2
                              pointer-events-none select-none
                              text-3xl md:text-4xl font-black tracking-tight
                              !text-foreground         
                            "
                            />
                          </div>

                          {/* prev / today / next controls */}
                          <div className="flex gap-1">
                            <CalendarPrevTrigger className="p-2">
                              <ChevronLeft size={16} />
                              <span className="sr-only">Previous</span>
                            </CalendarPrevTrigger>

                            <CalendarTodayTrigger className="text-xs px-2 py-1">
                              Today
                            </CalendarTodayTrigger>

                            <CalendarNextTrigger className="p-2">
                              <ChevronRight size={16} />
                              <span className="sr-only">Next</span>
                            </CalendarNextTrigger>
                          </div>
                        </div>

                        {/* body –- only MONTH view -------------------------------------- */}
                        <div className="flex-1 overflow-hidden">
                          <CalendarMonthView />
                        </div>
                      </div>
                    </Calendar>
                  </motion.div>
                ) : (
                  // Listview of Events
                  <motion.div
                    key="list"
                    className="flex-1 overflow-auto space-y-6"
                    variants={itemVariants}
                  >
                    <div className="min-h-0">
                      <CardContent className="px-0 md:px-6 space-y-8 pb-8">
                        {listEvents.length === 0 ? (
                          <div className="text-center py-12">
                            <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              No events so far
                            </p>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* single vertical spine */}
                            <span
                              aria-hidden
                              className="pointer-events-none absolute left-2 sm:left-5 top-1 bottom-0
              border-l border-dashed border-muted-foreground/30
              dark:border-muted-foreground/40"
                            />

                            {/* all the dated sections */}
                            {groupedEvents.map(([label, dayEvents]) => (
                              <section
                                key={label}
                                className="relative space-y-4"
                              >
                                {/* Timeline dot */}
                                <div
                                  className="absolute left-2 sm:left-5 top-1 -translate-x-1/2
                  w-3 h-3 bg-gray-500 dark:bg-zinc-400
                  rounded-full border-2 border-white dark:border-zinc-900
                  shadow-lg z-10"
                                />
                                {/* date heading */}
                                <h3 className="sm:pl-10 pl-7 text-sm font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                                  {label}
                                </h3>

                                {/* events for that day */}
                                <div>
                                  {dayEvents.map((e, index) => (
                                    <motion.div
                                      key={e.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      onClick={() => {
                                        if (isDesktop) {
                                          handleEventClick({ id: e.id } as any);
                                        } else {
                                          router.push(`/calendar/${e.id}`);
                                        }
                                      }}
                                      className="relative group cursor-pointer"
                                    >
                                      {/* Event card */}
                                      <div
                                        className="sm:ml-10 ml-6 my-5
                        bg-white/80 dark:bg-zinc-800/70 backdrop-blur
                        rounded-xl border border-slate-200 dark:border-zinc-700
                        transition-all duration-200
                        group-hover:ring-2 group-hover:ring-gray-300 dark:group-hover:ring-zinc-600"
                                      >
                                        <div className="flex items-start gap-6 p-6">
                                          <div className="flex-1 min-w-0">
                                            {/* Time badge */}
                                            <div className="inline-flex items-center text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                                              {format(e.start, "h:mm a")} -{" "}
                                              {format(e.end, "h:mm a")} •{" "}
                                              {format(e.end, "MMM d")}
                                            </div>

                                            {/* Title */}
                                            <div className="flex items-center gap-2 mb-3">
                                              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-zinc-100">
                                                {e.title}
                                              </h3>
                                              {e.has_pending_changes && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                  Pending Changes
                                                </span>
                                              )}
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-center gap-2 text-xs sm:text-sm dark:text-zinc-300 text-slate-600">
                                              {/^(https?:\/\/)/i.test(
                                                e.location ?? ""
                                              ) ? (
                                                <>
                                                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                                  <p className="font-medium text-[14px]">
                                                    Online Event
                                                  </p>
                                                </>
                                              ) : (
                                                <>
                                                  <MapPin className="h-5 w-5 text-muted-foreground" />
                                                  <p className="font-medium text-[14px]">
                                                    {e.location}
                                                  </p>
                                                </>
                                              )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs sm:text-sm text-gray-500 mt-2 dark:text-zinc-400 line-clamp-2">
                                              {e.description}
                                            </p>

                                            {/* Edit Button - Only show if user owns the event */}
                                            {profile?.id === e.created_by && (
                                              <div className="mt-3">
                                                <Button
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    router.push(`/calendar/edit/${e.id}`);
                                                  }}
                                                  variant="outline"
                                                  size="sm"
                                                  className="flex items-center gap-1 text-xs"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                  Edit
                                                </Button>
                                              </div>
                                            )}
                                          </div>

                                          {/* Poster */}
                                          {e.poster_url && (
                                            <div className="flex-shrink-0">
                                              <div className="group-hover:scale-105 transition-transform duration-300">
                                                <SquarePoster
                                                  src={e.poster_url}
                                                  alt={`${e.title} poster`}
                                                  className="sm:w-36 sm:h-36 w-28 h-28 ring-2 ring-white dark:ring-zinc-900 shadow-lg"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            ))}
                          </div>
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
               sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg
               dark:bg-zinc-900/80 dark:text-zinc-100 dark:border dark:border-zinc-700"
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
                      <SquarePoster
                        src={selectedEvent.poster_url}
                        alt={`${selectedEvent.title} poster`}
                      />
                    )}
                    <div className="pb-2">
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-2xl font-bold dark:text-zinc-100">
                          {selectedEvent.title}
                        </DialogTitle>
                        {selectedEvent.has_pending_changes && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Pending Changes
                          </span>
                        )}
                      </div>
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
                            className="h-8 w-8 relative rounded-full border overflow-hidden bg-muted border-border
                               flex items-center justify-center transition-transform duration-200"
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
                          <div className="bg-muted text-[10px] font-medium py-[3px] leading-none dark:text-zinc-100">
                            {format(selectedEvent.start, "MMM").toUpperCase()}
                          </div>
                          <div className="text-[15px] font-extrabold text-foreground leading-none pt-[3px] dark:text-zinc-100">
                            {format(selectedEvent.start, "d")}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="text-sm dark:text-zinc-100">
                          <p className="font-semibold text-[14px]">
                            {format(selectedEvent.start, "EEEE, MMMM d")}
                          </p>
                          <p className="text-muted-foreground">
                            {format(selectedEvent.start, "h:mm a")} –{" "}
                            {format(selectedEvent.end, "h:mm a")}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border dark:bg-zinc-700" />

                        {/* Location Info */}
                        {selectedEvent.location && (
                          <div className="flex items-center gap-2 text-sm dark:text-zinc-100">
                            <div className="w-10 h-10 border rounded-md bg-background flex items-center justify-center dark:border-zinc-700">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-[14px]">
                                {/^(https?:\/\/)/i.test(
                                  selectedEvent.location ?? ""
                                )
                                  ? "Online Event"
                                  : selectedEvent.location}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {/^(https?:\/\/)/i.test(
                                  selectedEvent.location ?? ""
                                )
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
                    className="border border-primary/20 bg-primary/5 p-4 space-y-4
                       dark:border-primary/40 dark:bg-primary/10 dark:text-zinc-100"
                  >
                    {new Date(selectedEvent.end) < new Date() ? (
                      /* Past Event Notice */
                      <div className="text-center text-sm text-muted-foreground space-y-1">
                        <h3 className="font-semibold text-base text-gray-800 dark:text-zinc-200">
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
                      /* RSVP Success */
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
                      /* Logged-in RSVP */
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
                            setRsvpData({ ...rsvpData, notes: e.target.value })
                          }
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={handleRSVP}
                            disabled={rsvpLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 text-sm min-w-0"
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm min-w-0">
                                Add to Calendar
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56 p-0">
                              <div className="flex flex-col divide-y divide-border">
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Google Calendar link
                                    const start = encodeURIComponent(
                                      selectedEvent.start
                                        .toISOString()
                                        .replace(/[-:]|\.\d{3}/g, "")
                                    );
                                    const end = encodeURIComponent(
                                      selectedEvent.end
                                        .toISOString()
                                        .replace(/[-:]|\.\d{3}/g, "")
                                    );
                                    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                      selectedEvent.title
                                    )}&dates=${start}/${end}&details=${encodeURIComponent(
                                      selectedEvent.description || ""
                                    )}&location=${encodeURIComponent(
                                      selectedEvent.location || ""
                                    )}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  Google Calendar
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Outlook Calendar link
                                    const start = encodeURIComponent(
                                      selectedEvent.start.toISOString()
                                    );
                                    const end = encodeURIComponent(
                                      selectedEvent.end.toISOString()
                                    );
                                    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
                                      selectedEvent.title
                                    )}&body=${encodeURIComponent(
                                      selectedEvent.description || ""
                                    )}&startdt=${start}&enddt=${end}&location=${encodeURIComponent(
                                      selectedEvent.location || ""
                                    )}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  Outlook Calendar
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Apple Calendar: download .ics
                                    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${selectedEvent.title}\nDESCRIPTION:${
                                      selectedEvent.description || ""
                                    }\nLOCATION:${
                                      selectedEvent.location || ""
                                    }\nDTSTART:${selectedEvent.start
                                      .toISOString()
                                      .replace(/[-:]|\.\d{3}/g, "")
                                      .replace("Z", "Z")}\nDTEND:${selectedEvent.end
                                      .toISOString()
                                      .replace(/[-:]|\.\d{3}/g, "")
                                      .replace("Z", "Z")}\nEND:VEVENT\nEND:VCALENDAR`;
                                    const blob = new Blob([icsContent], {
                                      type: "text/calendar",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${selectedEvent.title.replace(
                                      /\s+/g,
                                      "_"
                                    )}.ics`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  Apple Calendar
                                </button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      /* Guest RSVP */
                      <div className="space-y-3 text-sm">
                        <p className="font-medium text-gray-800 dark:text-zinc-200">
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
                        <div className="flex gap-2">
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm min-w-0">
                                Add to Calendar
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56 p-0">
                              <div className="flex flex-col divide-y divide-border">
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Google Calendar link
                                    const start = encodeURIComponent(
                                      selectedEvent.start
                                        .toISOString()
                                        .replace(/[-:]|\.\d{3}/g, "")
                                    );
                                    const end = encodeURIComponent(
                                      selectedEvent.end
                                        .toISOString()
                                        .replace(/[-:]|\.\d{3}/g, "")
                                    );
                                    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                      selectedEvent.title
                                    )}&dates=${start}/${end}&details=${encodeURIComponent(
                                      selectedEvent.description || ""
                                    )}&location=${encodeURIComponent(
                                      selectedEvent.location || ""
                                    )}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  Google Calendar
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Outlook Calendar link
                                    const start = encodeURIComponent(
                                      selectedEvent.start.toISOString()
                                    );
                                    const end = encodeURIComponent(
                                      selectedEvent.end.toISOString()
                                    );
                                    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
                                      selectedEvent.title
                                    )}&body=${encodeURIComponent(
                                      selectedEvent.description || ""
                                    )}&startdt=${start}&enddt=${end}&location=${encodeURIComponent(
                                      selectedEvent.location || ""
                                    )}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  Outlook Calendar
                                </button>
                                <button
                                  className="w-full text-left px-4 py-3 hover:bg-muted text-sm"
                                  onClick={() => {
                                    // Apple Calendar: download .ics
                                    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${selectedEvent.title}\nDESCRIPTION:${
                                      selectedEvent.description || ""
                                    }\nLOCATION:${
                                      selectedEvent.location || ""
                                    }\nDTSTART:${selectedEvent.start
                                      .toISOString()
                                      .replace(/[-:]|\.\d{3}/g, "")
                                      .replace("Z", "Z")}\nDTEND:${selectedEvent.end
                                      .toISOString()
                                      .replace(/[-:]|\.\d{3}/g, "")
                                      .replace("Z", "Z")}\nEND:VEVENT\nEND:VCALENDAR`;
                                    const blob = new Blob([icsContent], {
                                      type: "text/calendar",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${selectedEvent.title.replace(
                                      /\s+/g,
                                      "_"
                                    )}.ics`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  Apple Calendar
                                </button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
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
                        <p className="text-sm leading-relaxed dark:text-zinc-200">
                          {selectedEvent.description.trimStart()}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Edit Button - Only show if user owns the event */}
                  {profile?.id === selectedEvent.created_by && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setDialogOpen(false);
                          router.push(`/calendar/edit/${selectedEvent.id}`);
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Event
                      </Button>
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
