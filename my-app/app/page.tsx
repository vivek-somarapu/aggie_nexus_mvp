"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "keen-slider/keen-slider.min.css";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
/* ────── Constants ────── */
import { colorPalette } from "@/lib/constants";
import Autoplay from "embla-carousel-autoplay";
import { SquarePoster } from "@/components/ui/SquarePoster";
import {
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Zap,
  Atom,
  Recycle,
} from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { eventService } from "@/lib/services/event-service";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarTodayTrigger,
  CalendarPrevTrigger,
  CalendarNextTrigger,
  type CalendarEvent as FullCalendarEvent,
  useCalendar,
} from "@/components/ui/full-calendar";
import { cn } from "@/lib/utils";
import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Calendar utilities
const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      indigo: "bg-indigo-500",
      teal: "bg-teal-500",
      cyan: "bg-cyan-500",
      emerald: "bg-emerald-500",
      rose: "bg-rose-500",
      amber: "bg-amber-500",
      lime: "bg-lime-500",
      sky: "bg-sky-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const getDaysInMonth = (date: Date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOfWeekForMonth = new Date(startOfMonth);
  startOfWeekForMonth.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  let currentDate = new Date(startOfWeekForMonth);
  const calendar = [];

  while (calendar.length < 42) {
    calendar.push(new Date(currentDate));
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return calendar;
};

const generateWeekdays = (locale: any) => {
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    daysOfWeek.push(format(date, "EEEEEE"));
  }
  return daysOfWeek;
};

const getEventBackgroundColor = (color: any) => {
  if (!color) return "bg-primary/20";

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/20",
    green: "bg-green-500/20",
    yellow: "bg-yellow-500/20",
    pink: "bg-pink-500/20",
    purple: "bg-purple-500/20",
    red: "bg-red-500/20",
    orange: "bg-orange-500/20",
    indigo: "bg-indigo-500/20",
    teal: "bg-teal-500/20",
    cyan: "bg-cyan-500/20",
    emerald: "bg-emerald-500/20",
    rose: "bg-rose-500/20",
    amber: "bg-amber-500/20",
    lime: "bg-lime-500/20",
    sky: "bg-sky-500/20",
  };

  return colorMap[color] || "bg-primary/20";
};

const CustomCalendarMonthView = () => {
  const { view, events, locale, date, onEventClick } = useCalendar();
  const MAX_EVENTS_VISIBLE = 2;
  const gridRef = useRef<HTMLDivElement>(null);

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  if (view !== "month") return null;

  return (
    <div
      ref={gridRef}
      className="relative h-full grid grid-rows-6 grid-cols-7 min-h-[450px] overflow-hidden p-px gap-px"
    >
      {monthDates.map((_date, idx) => {
        const currentEvents = events.filter((e) => isSameDay(e.start, _date));

        return (
          <div
            key={_date.toString()}
            data-cell
            className={cn(
              "ring-1 ring-border overflow-hidden p-1 text-xs sm:text-sm text-muted-foreground",
              !isSameMonth(date, _date) && "text-muted-foreground/50"
            )}
          >
            {/* weekday label for the first row -------------------------------- */}
            {idx < 7 && (
              <div
                className={cn(
                  "text-[10px] sm:text-xs font-medium text-center",
                  [0, 6].includes(idx) && "text-muted-foreground/50"
                )}
              >
                {weekDays[idx]}
              </div>
            )}

            {/* day number ---------------------------------------------------- */}
            <span
              className={cn(
                "size-5 sm:size-6 grid place-items-center rounded-full sticky top-0 text-xs sm:text-sm",
                isToday(_date) && "bg-primary text-primary-foreground"
              )}
            >
              {format(_date, "d")}
            </span>

            {/* events -------------------------------------------------------- */}
            {currentEvents.slice(0, MAX_EVENTS_VISIBLE).map((event) => (
              <div
                key={`${event.id}-${_date.toISOString()}`}
                className={cn(
                  "px-1 rounded text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-colors",
                  "sm:bg-transparent",
                  getEventBackgroundColor(event.color)
                )}
                onClick={() => onEventClick?.(event)}
              >
                <div
                  className={cn(
                    "shrink-0 hidden sm:block",
                    monthEventVariants({ variant: event.color })
                  )}
                />
                <span className="flex-1 truncate">{event.title}</span>
              </div>
            ))}

            {/* "+ n more" ---------------------------------------------------- */}
            {currentEvents.length > MAX_EVENTS_VISIBLE && (
              <button
                className="text-[10px] sm:text-xs text-primary hover:underline"
                onClick={(e) => {
                  const cell = (e.currentTarget as HTMLElement).closest(
                    "[data-cell]"
                  )!;
                  const cellRect = cell.getBoundingClientRect();
                  const gridRect = gridRef.current!.getBoundingClientRect();

                  setPopoverPosition({
                    top: cellRect.top - gridRect.top - 25,
                    left: cellRect.left - gridRect.left,
                  });
                  setExpandedDate(_date);
                }}
              >
                +{currentEvents.length - MAX_EVENTS_VISIBLE} more…
              </button>
            )}
          </div>
        );
      })}
      {expandedDate && popoverPosition && (
        <>
          {/* Backdrop to close popover */}
          <div
            className="absolute inset-0 z-40"
            onClick={() => {
              setExpandedDate(null);
              setPopoverPosition(null);
            }}
          />

          {/* Popover */}
          <div
            className="absolute z-50 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg min-w-[50px] max-w-[200px]"
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-1">
              <div className="text-xs font-medium text-muted-foreground">
                {format(expandedDate, "EEE").toUpperCase()},{" "}
                {format(expandedDate, "d")}
              </div>
              <button
                className="text-muted-foreground hover:text-foreground px-1 rounded-sm hover:bg-muted/50"
                onClick={() => {
                  setExpandedDate(null);
                  setPopoverPosition(null);
                }}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Events list */}
            <div className="max-h-[300px] pb-1 overflow-y-auto">
              {events
                .filter((e) => isSameDay(e.start, expandedDate))
                .map((event) => (
                  <div
                    key={event.id}
                    className="pl-1 flex gap-1 items-center hover:bg-muted/40 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/20"
                    onClick={() => {
                      onEventClick?.(event);
                    }}
                  >
                    <div
                      className={cn(
                        "shrink-0 hidden sm:block",
                        monthEventVariants({ variant: event.color })
                      )}
                    />
                    <span className="flex-1 text-[12px]">{event.title}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
};

const slideRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.2 } },
};

const projects = [
  {
    id: 1,
    title: "Mobile App for Local Farmers Markets",
    stage: "Project",
    status: "In Progress",
    recruiting: "Actively Recruiting",
    summary:
      "Developing an augmented-reality application that provides interactive information about local vendors and their goods.",
    location: "Hybrid",
    createdAt: new Date("2025-05-25"),
    tags: ["Technology", "Agriculture"],
  },
  {
    id: 2,
    title: "Aerial Drone Launcher Development",
    stage: "Idea",
    status: "Planning",
    recruiting: "Full team, seeking investment",
    summary:
      "Building a full-scale prototype of a military-grade drone launcher for water craft. Looking for students interested in mechanical engineering.",
    location: "In-person",
    createdAt: new Date("2025-06-28"),
    tags: ["Manufacturing", "Technology", "Other"],
  },
  {
    id: 3,
    title: "FinTech App",
    stage: "Project",
    status: "Ongoing",
    recruiting: "Looking for co-founders",
    summary:
      "We’re looking for teammates with Customer Service and Design expertise to join us on this FinTech application.",
    location: "Hybrid",
    createdAt: new Date("2025-04-18"),
    tags: ["Nonprofit", "Customer Service", "Design"],
  },
  {
    id: 4,
    title: "AI App",
    stage: "Project",
    status: "Not Started",
    recruiting: "Looking for co-founders",
    summary:
      "Seeking Marketing and Sales talent to help launch an AI-driven application in the food & beverage space.",
    location: "Remote",
    createdAt: new Date("2025-04-18"),
    tags: ["Food & Beverage", "Marketing", "Sales"],
  },
  {
    id: 5,
    title: "ML App",
    stage: "Idea",
    status: "Not Started",
    recruiting: "Recruiting team members",
    summary:
      "Looking for teammates with strong Problem-Solving and Research skills to build an energy-sector ML solution.",
    location: "Remote",
    createdAt: new Date("2025-04-18"),
    tags: ["Energy", "Problem Solving", "Research"],
  },
];

export default function Home() {
  const { authUser, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const authError = searchParams?.get("auth_error");
  const [showError, setShowError] = useState(false);
  const getRandomColor = () => {
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
  };
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [calendarEvents, setCalendarEvents] = useState<FullCalendarEvent[]>([]);
  const [eventsReady, setEventsReady] = useState(false);
  useEffect(() => {
    async function fetchEvents() {
      try {
        const raw = await eventService.getEvents();

        const colourMap = new Map<string, string>();
        const mapped: FullCalendarEvent[] = raw.map((e) => {
          // decide where to read your dates from:
          const startStr = (e as any).start_time ?? (e as any).start;
          const endStr = (e as any).end_time ?? (e as any).end;

          // assign a one‑time random colour
          if (!colourMap.has(e.id)) colourMap.set(e.id, getRandomColor());

          return {
            id: e.id,
            title: e.title,
            start: new Date(startStr),
            end: new Date(endStr),
            color: colourMap.get(e.id) as any,
          };
        });
        setCalendarEvents(mapped);
      } finally {
        setEventsReady(true);
      }
    }
    fetchEvents();
  }, []);

  // Handle auth errors from callback
  useEffect(() => {
    if (authError) {
      setShowError(true);
      const timeout = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [authError]);

  // Simple loading state handled by client layout
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Decorative circles logo background with animation */}
      <motion.div
        className="
          absolute
          right-[-90px]  top-[0px] scale-60
          md:right-[-80px]  md:top-[40px] 
          lg:right-0       lg:top-[120px] 
          xl:right-0       xl:top-[120px] 
          md:scale-75
          lg:scale-100  
          rotate-[10deg]
          pointer-events-none opacity-60
        "
        initial={{ opacity: 0, rotate: 205 }}
        animate={{
          opacity: 0.6,
          scale: 1,
          rotate: 220,
          transition: { duration: 0.8, ease: "easeOut" },
        }}
        whileInView={{
          x: [0, 10, 0],
          transition: { repeat: Infinity, repeatType: "reverse", duration: 8 },
        }}
      >
        <Image
          src="/images/circles-logo.png"
          alt="Decorative circles"
          width={650}
          height={450}
          className="object-contain"
          priority
        />
      </motion.div>

      <section className="relative">
        {/* Hero Background */}
        <div className="absolute inset-0 bg-background/5 to-transparent -z-10" />

        {/* Auth Error Message */}
        {showError && (
          <div className="container mx-auto mt-24">
            <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
              <p>Authentication error occurred. Please try again.</p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="container mx-auto flex-1 flex flex-col md:flex-row items-center md:items-start
          justify-center gap-10 py-12 md:py-20 relative"
        >
          {/* ────── LEFT  (text) ────── */}
          <motion.div
            variants={fadeIn}
            className="flex-1 space-y-6 md:max-w-4xl text-left"
          >
            {/* headline */}
            <motion.h1
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.9]"
            >
              THE CENTRAL HUB
              <br />
              OF AGGIE
              <br />
              INNOVATION.
            </motion.h1>

            <div className="pl-2 sm:pl-0 pr-4 pt-[8rem]">
              {/* sub-heading */}
              <motion.h2
                variants={slideLeft}
                initial="hidden"
                animate="visible"
                className="text-xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-1"
              >
                The Future Starts Here.
              </motion.h2>

              {/* body copy */}
              <p
                className="
                  max-w-[55ch]
                  leading-[1.35]
                  font-light text-muted-foreground
                  text-sm     sm:text-md   md:text-lg  
                "
              >
                Aggie Nexus was created to connect the needs of the industry
                with builders excited to meet those needs. Here you can do more
                than stay up-to-date with industry progress—you now have the
                opportunity to be a part of the growth forward. Post your ideas,
                join a startup, network your product. It all happens right here,
                in the central hub for A&M innovation.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full text-lg uppercase bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-7 py-3 font-semibold tracking-wide transition-colors"
              >
                <Link href={authUser ? "/projects" : "/auth/signup"}>
                  {authUser ? "Explore Projects" : "Sign Up"}
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.section>

        {/* Projects in Progress section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideRight}
          className="relative py-16 md:py-20 overflow-hidden"
        >
          {/* ── Hard container (centres & limits width) ── */}
          <div className="container">
            {/* ── Headline ── */}
            <motion.h2
              variants={fadeUpSlow}
              initial="hidden"
              whileInView="visible"
              className="ml-auto max-w-4xl text-right pr-0 2xl:pr-[7.5rem] text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-12"
            >
              Join a project in progress.
              <br className="hidden sm:block" />
              Post your idea for a new one.
            </motion.h2>

            {/* ── Copy + carousel wrapper ── */}
            <div
              className="
              mx-auto max-w-7xl
              grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12
              items-start
            "
            >
              <div className="lg:col-span-1">
                <p className="text-muted-foreground text-center px-10 lg:px-5 lg:text-left leading-relaxed text-lg">
                  Our Projects Page is where ideas become a reality. Whether
                  you're starting a company or just looking for experience,
                  Aggie Nexus is the place to start.
                </p>
              </div>

              {/* ────── Carousel starts here ────── */}
              <div className="lg:col-span-3">
                <Carousel
                  opts={{ loop: true }}
                  plugins={[
                    Autoplay({ delay: 5000, stopOnInteraction: false }),
                  ]}
                  className="w-full relative"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {projects.map((p) => (
                      <CarouselItem
                        key={p.id}
                        className="pl-2 md:pl-4  max-w-[350px] basis-full sm:basis-1/2 "
                      >
                        <Card className="h-full transition-shadow hover:shadow-md flex flex-col">
                          <CardContent className="pt-6 flex flex-col h-full">
                            <div className="flex-1 space-y-4">
                              <h3 className="text-xl font-semibold leading-snug">
                                {p.title}
                              </h3>
                              <div className="flex gap-2">
                                <Badge
                                  className={
                                    p.stage === "Idea"
                                      ? "bg-blue-600 text-white"
                                      : "bg-green-600 text-white"
                                  }
                                >
                                  {p.stage}
                                </Badge>
                                <Badge variant="secondary">{p.status}</Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {p.summary}
                              </p>
                            </div>

                            {/* Fixed metadata at bottom */}
                            <div className="mt-auto pt-4 space-y-3 border-t border-border/50">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {p.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  {format(p.createdAt, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {p.recruiting}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {p.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Chevron arrows */}
                  <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                  <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                </Carousel>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Spacing between sections */}
        <div className="h-6 md:h-8"></div>

        {/* Project Highlights section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={scaleIn}
          className="relative bg-gray-100 py-10 md:py-12 overflow-hidden dark:bg-zinc-900"
        >
          <div className="container mx-auto flex flex-col lg:flex-row gap-8 px-6">
            {/* ── TEXT COLUMN ─────────────────────────────────────── */}
            <div className="flex-1 grid grid-rows-[auto_1fr_auto] text-center lg:text-left">
              {/* row-1 : title (stays top-left) */}
              <motion.h2
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                className="text-3xl md:text-4xl font-semibold pb-3 text-gray-900 dark:text-zinc-100"
              >
                Project Highlight
              </motion.h2>

              {/* row-3 : subtitle + copy (sticks bottom-right) */}
              <div className="row-start-3 place-self-center lg:place-self-start text-center lg:text-left max-w-2xl mx-auto lg:mx-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-3">
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                      <Atom className="w-3 h-3 mr-1" />
                      Active Project
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Actively Recruiting
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs px-2 py-1">
                      <Recycle className="w-3 h-3 mr-1" />
                      Clean Tech
                    </Badge>
                  </div>

                  <h3 className="text-xl md:text-2xl font-medium text-gray-800 dark:text-zinc-200">
                    PETRA: Plasma Metallurgy Revolution
                  </h3>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-600 dark:text-zinc-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Jan 2025 - May 2026</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Flexible Location</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>175 views</span>
                    </div>
                  </div>
                </div>

                <p className="mx-auto lg:mr-auto lg:ml-0 text-sm md:text-base leading-relaxed text-gray-700 dark:text-zinc-300">
                  PETRA aims to revolutionize titanium production by replacing
                  the outdated Kroll Process with a cleaner, faster, and more
                  scalable microwave plasma-based method. Our goal is to design
                  a fully custom system that enables continuous metal oxide
                  reduction through high-temperature plasma, dramatically
                  lowering environmental impact and cost.
                </p>

                <div className="space-y-2 text-left">
                  <h4 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                    Key Focus Areas:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-zinc-400 space-y-1">
                    <li>• Custom microwave plasma torch for TiO₂ reduction</li>
                    <li>• Full-system CFD simulations and optimization</li>
                    <li>• High-performance materials for extreme conditions</li>
                    <li>
                      • Impact across aerospace, medical, and clean-tech sectors
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-1 mt-4">
                  {[
                    "Aerospace",
                    "Material Science",
                    "Metallurgy",
                    "CFD",
                    "CAD",
                    "Research",
                  ].map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-white/50 dark:bg-zinc-800/50"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* ── IMAGE COLUMN ────────────────────────────────────── */}
            <div className="flex-shrink-0 flex flex-col md:flex-row md:justify-center lg:flex-col lg:justify-start gap-4 w-full lg:w-80">
              {/* Image placeholder 1 - Plasma torch visualization */}
              <div className="aspect-square h-48 md:h-60 rounded-lg overflow-hidden shadow-sm">
                <img
                  src="/images/PETRA_First_Ignition.png"
                  alt="PETRA First Ignition - Laboratory setup showing plasma torch with bright purple plasma flame"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image placeholder 2 - Titanium production process */}
              <div className="aspect-square h-64 md:h-60 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-zinc-800 flex items-center justify-center p-4">
                <img
                  src="/images/PETRA_Reaction_Chamber.png"
                  alt="PETRA Reaction Chamber - 3D technical rendering of plasma torch component"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* calendar section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative py-20 px-5 md:py-28 overflow-hidden"
        >
          <div className="container mx-auto">
            {/* ── Headline ── */}
            <motion.h2
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              className="max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-12"
            >
              Expand your network. Find new opportunities. Stay in the know.
            </motion.h2>

            {/* ── Calendar + copy grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* ✦ descriptive copy — first on ≤md, second on ≥lg */}
              <p
                className="
                  order-1 lg:order-2
                  lg:col-span-2
                  text-center lg:text-left
                  text-muted-foreground leading-relaxed
                  text-sm sm:text-base md:text-lg
                "
              >
                Our Nexus calendar lets you stay up to date with all of the
                A&amp;M events that you wouldn’t want to miss. Looking to grow
                your network? Find an upcoming networking event in your
                industry. Trying to hone your technical skills? Look for a
                workshop. We have it all right here, convenient and accessible.
              </p>

              {/* ✦ calendar preview — second on ≤md, first on ≥lg */}
              <motion.div
                className="order-2 lg:order-1 lg:col-span-3 "
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1.08, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.5 }}
                // ⬇️ here we set the day‑cell min‑height based on screen size
                style={
                  {
                    // on mobile give each cell only 1.5rem of height…
                    "--fc-daygrid-day-min-height": isMobile
                      ? "1rem"
                      : undefined,
                  } as React.CSSProperties
                }
              >
                <Card className="border-none p-0 mx-5">
                  <CardContent className="p-0">
                    {eventsReady /* ✅ only mount once data exists */ ? (
                      <Calendar
                        events={calendarEvents}
                        view="month"
                        onEventClick={() => {}}
                      >
                        <div className="h-full flex flex-col overflow-hidden">
                          {/* header */}
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 border rounded-t-lg bg-muted/30">
                            <div className="relative flex flex-1 items-center justify-center">
                              <CalendarCurrentDate
                                className="
                              absolute left-1/2 -translate-x-1/2
                              pointer-events-none select-none
                              text-sm sm:text-2xl md:text-3xl font-black tracking-tight
                              !text-foreground
                            "
                              />
                            </div>

                            {/* prev / today / next controls */}
                            <div className="flex gap-1">
                              <CalendarPrevTrigger className="p-1 sm:p-2">
                                <ChevronLeft
                                  size={14}
                                  className="sm:w-4 sm:h-4"
                                />
                                <span className="sr-only">Previous</span>
                              </CalendarPrevTrigger>

                              <CalendarTodayTrigger className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1">
                                Today
                              </CalendarTodayTrigger>

                              <CalendarNextTrigger className="p-1 sm:p-2">
                                <ChevronRight
                                  size={14}
                                  className="sm:w-4 sm:h-4"
                                />
                                <span className="sr-only">Next</span>
                              </CalendarNextTrigger>
                            </div>
                          </div>

                          {/* month view */}
                          <div className="flex-1 overflow-hidden">
                            <CustomCalendarMonthView />
                          </div>
                        </div>
                      </Calendar>
                    ) : (
                      /* tiny skeleton while we wait */
                      <Skeleton className="h-80 w-full rounded-xl" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Our mission section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpSlow}
          className="relative w-screen -mx-2 h-[60vh] overflow-hidden"
        >
          {/* background image (sits behind, covers whole section) */}
          <Image
            src="/images/design-center.jpg"
            alt="Campus innovation workshop"
            fill
            className="object-cover z-[-1]"
            priority
          />

          {/* dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-0" />

          {/* ────────────────────────────────
            WRAPPER: takes full height, full width
            flex column on mobile, row on ≥md
        ──────────────────────────────── */}
          <div className="relative z-10 flex h-full flex-col md:flex-row">
            {/* text block */}
            <div className="flex-[2] max-w-lg p-8 md:p-12 text-white">
              <motion.h2
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                className="text-3xl md:text-4xl lg:text-5xl font-light mb-6"
              >
                Our Mission
              </motion.h2>
              <p className="leading-relaxed font-light text-base md:text-lg">
                Aggie&nbsp;Nexus exists to create a central hub of innovation by
                connecting entrepreneurs, builders, and investors into a unified
                ecosystem. Our mission is to accelerate technology
                commercialization and foster transformative collaboration—rooted
                in Texas&nbsp;A&amp;M University and its affiliated network.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="container py-8 text-center dark:text-white/60 text-muted-foreground border-t">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/about" className="text-sm hover:underline">
              About
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/terms" className="text-sm hover:underline">
              Terms
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy
            </Link>
          </div>
          <p className="text-sm">© 2025 Aggie Nexus. All rights reserved.</p>
        </div>
      </section>
    </div>
  );
}
