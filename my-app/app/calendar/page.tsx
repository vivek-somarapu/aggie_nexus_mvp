"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";
import { SquarePoster } from "@/components/ui/SquarePoster";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  Home,
  UserCircle2,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { eventService } from "@/lib/services/event-service";
import { motion, AnimatePresence } from "framer-motion";
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

/* ────── Constants ────── */
import {
  pageVariants,
  itemVariants,
  calendarVariants,
  dialogVariants,
  customScrollStyles,
  colorPalette,
  categories,
} from "@/lib/constants";

// Import and augment the Event type to match API response
import type { Event as BaseEvent } from "@/lib/services/event-service";

// Define the actual event structure that matches the API response
interface Event extends Omit<BaseEvent, "start_time" | "end_time"> {
  start: string;
  end: string;
}

// Type for the processed events
type ProcessedEvent = FullCalendarEvent & {
  description: string;
  location: string;
  created_by?: string;
  poster_url?: string;
  creator?: { full_name: string; avatar: string | null };
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
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
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [view, setView] = useState<"calendar" | "list">(
    isSmUp ? "calendar" : "list"
  );
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

  const effectiveView = isDesktop ? view : "list";
  const allEvents = events;

  // If the user shrinks the window below desktop, force-switch to list
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

  // Filter events based on category
  const filteredEvents = allEvents.filter(
    (event) => categoryFilter === "all" || event.event_type === categoryFilter
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
      toast.error(err.message); // will show "You have already RSVPed …" etc.
    }
  };

  const dayLabel = (d: Date) => {
    if (isToday(d)) return "Today " + format(d, "EEEE");
    if (isYesterday(d)) return "Yesterday " + format(d, "EEEE");
    return format(d, "EEEE, MMM d");
  };

  const groupedEvents = useMemo(() => {
    // Sort by start date ASC (most recent first)
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const map = new Map<string, Event[]>();
    sorted.forEach((ev) => {
      const key = dayLabel(parseISO(ev.start));
      map.set(key, [...(map.get(key) ?? []), ev]);
    });

    return Array.from(map.entries()); // → [ [label, events[]], … ]
  }, [filteredEvents]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollStyles }} />
      <motion.div
        className="flex flex-col max-w-6xl bg-gradient-to-br from-background via-background mx-auto to-muted/20"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center mb-2"
        >
          <div className="relative">
            {/* Green accent background for calendar */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent rounded-lg -m-4 p-4"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight">
                Events Calendar
              </h1>
              <p className="text-muted-foreground">
                Stay organized with upcoming events, workshops, and networking
                opportunities
              </p>
            </div>
          </div>

          <div className="flex space-x-2 mt-2 sm:mt-0">
            {!profile && !authLoading && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            )}
            {profile && (
              <Button
                onClick={() => router.push("/calendar/new")}
                size="sm"
                className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </motion.div>

        {!profile && !authLoading && (
          <motion.div variants={itemVariants}>
            <Alert
              variant="info"
              className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800 mb-2"
            >
              <Info className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">
                  Sign in to add personal events and get personalized
                  notifications.
                </span>{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600 dark:text-blue-400"
                  onClick={() => router.push("/auth/login?redirect=/calendar")}
                >
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

        <motion.div
          className="grid md:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          {/* Left Sidebar */}
          <motion.div className="md:col-span-1 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>View Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {isDesktop && (
                    <Tabs
                      value={view}
                      onValueChange={(v) => setView(v as "calendar" | "list")}
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="calendar" className="flex-1">
                          Calendar
                        </TabsTrigger>
                        <TabsTrigger value="list" className="flex-1">
                          List
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  <Tabs
                    value={view}
                    onValueChange={(v) => setView(v as "calendar" | "list")}
                    className="sm:hidden w-full"
                  >
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger value="list">List</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Event Type
                  </label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
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
          </motion.div>

          {/* Main Content */}
          <motion.div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="flex-1 flex items-center justify-center h-64"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 animate-spin" />
                </motion.div>
              ) : effectiveView === "calendar" ? (
                // Calendar view of Events
                <motion.div
                  key="calendar"
                  ref={calendarContainerRef}
                  variants={calendarVariants}
                  className="flex-1 flex flex-col"
                >
                  <Calendar
                    events={calendarEvents}
                    view="month"
                    onEventClick={handleEventClick}
                  >
                    <div className="h-full flex flex-col overflow-hidden">
                      {/* header */}
                      <div className="flex flex-wrap items-center gap-2 p-3 border rounded-t-lg bg-muted/30">
                        <div className="relative flex flex-1 items-center justify-center">
                          <CalendarCurrentDate />
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

                      {/* body – only MONTH view */}
                      <div className="flex-1 overflow-hidden">
                        <CalendarMonthView />
                      </div>
                    </div>
                  </Calendar>
                </motion.div>
              ) : (
                // List view of Events
                <motion.div
                  key="list"
                  className="flex-1 overflow-auto space-y-6"
                  variants={itemVariants}
                >
                  <div className="min-h-0">
                    <CardContent className="px-0 md:px-6 space-y-8 pb-8">
                      {filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                          <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No events found.
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
                            <section key={label} className="relative space-y-4">
                              {/* Timeline dot */}
                              <div
                                className="absolute left-2 sm:left-5 top-1 -translate-x-1/2
                                  w-3 h-3 bg-gray-500 dark:bg-gray-400
                                  rounded-full border-2 border-white dark:border-gray-900
                                  shadow-lg z-10"
                              />
                              {/* date heading */}
                              <h3 className="sm:pl-10 pl-7 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
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
                                    onClick={() =>
                                      handleEventClick({ id: e.id } as any)
                                    }
                                    className="relative group cursor-pointer"
                                  >
                                    {/* Event card */}
                                    <div
                                      className="sm:ml-10 ml-6 my-5
                                        bg-white/80 dark:bg-slate-800/70 backdrop-blur
                                        rounded-xl border border-slate-200 dark:border-slate-700
                                        transition-all duration-200
                                        group-hover:ring-2 group-hover:ring-gray-300 dark:group-hover:ring-gray-600"
                                    >
                                      <div className="flex items-start gap-6 p-6">
                                        <div className="flex-1 min-w-0">
                                          {/* Time badge */}
                                          <div className="inline-flex items-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                                            {format(
                                              parseISO(e.start),
                                              "h:mm a"
                                            )}{" "}
                                            -{" "}
                                            {format(parseISO(e.end), "h:mm a")}{" "}
                                            • {format(parseISO(e.end), "MMM d")}
                                          </div>

                                          {/* Title */}
                                          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                                            {e.title}
                                          </h3>

                                          {/* Location */}
                                          <div className="flex items-center gap-2 text-xs sm:text-sm dark:text-slate-300 text-slate-600">
                                            {e.location &&
                                            /^(https?:\/\/)/i.test(
                                              e.location
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
                                                  {e.location || "Location TBD"}
                                                </p>
                                              </>
                                            )}
                                          </div>

                                          {/* Description */}
                                          <p className="text-xs sm:text-sm text-gray-500 mt-2 dark:text-gray-400 line-clamp-2">
                                            {e.description}
                                          </p>
                                        </div>

                                        {/* Poster */}
                                        {e.poster_url && (
                                          <div className="flex-shrink-0">
                                            <div className="group-hover:scale-105 transition-transform duration-300">
                                              <SquarePoster
                                                src={e.poster_url}
                                                alt={`${e.title} poster`}
                                                className="sm:w-36 sm:h-36 w-28 h-28 ring-2 ring-white dark:ring-gray-900 shadow-lg"
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
          </motion.div>
        </motion.div>

        {/* Event Information Dialog with Integrated RSVP */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className="w-full max-h-[100dvh] p-0 overflow-hidden overflow-y-auto scrollbar-hidden 
            sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg dark:bg-slate-900/80"
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
                      <DialogTitle className="text-2xl font-bold dark:text-slate-100">
                        {selectedEvent?.title}
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
                            {!selectedEvent?.creator ? (
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
                            {selectedEvent?.creator?.full_name ?? "Unknown"}
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
                          <div className="bg-muted text-[10px] dark:text-slate-100 font-medium py-[3px] leading-none">
                            {format(selectedEvent.start, "MMM").toUpperCase()}
                          </div>
                          <div className="text-[15px] dark:text-slate-100 font-extrabold text-foreground leading-none pt-[3px]">
                            {format(selectedEvent.start, "d")}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="text-sm dark:text-slate-100">
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
                          <div className="flex items-center gap-2 text-sm dark:text-slate-100">
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
                    className="border border-primary/20 dark:border-primary/40 dark:text-slate-100
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
                        <p className="text-sm leading-relaxed dark:text-slate-200">
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
