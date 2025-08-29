// app/(manager)/manager-events/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { eventService } from "@/lib/services/event-service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle,
  Info,
  Calendar as CalendarIcon,
  MapPin,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { SquarePoster } from "@/components/ui/SquarePoster";

type Status = "pending" | "approved" | "rejected";

interface Creator {
  id: string;
  full_name: string;
  avatar: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  location: string | null;
  event_type: string;
  created_by: string;
  creator?: Creator;
  poster_url?: string | null;
  created_at: string;
  status: Status;
}

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 },
  },
};

export default function ManagerEventsPage() {
  const { user, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // redirect non‑managers
  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      router.push("/calendar");
    }
  }, [authLoading, role, router]);

  // load & rehydrate on tab change
  useEffect(() => {
    if (!authLoading && role === 'admin') {
      (async () => {
        setIsLoading(true);
        setError(null);
        try {
          // 1️⃣ fetch lightweight list
          const list = await eventService.getEventsByStatus(activeTab);

          // 2️⃣ fetch full details including .creator & .poster_url
          const enriched = await Promise.all(
            list.map(async (e) => {
              const full = await eventService.getEvent(e.id);
              return {
                ...e,
                creator: full?.creator,
                poster_url: full?.poster_url,
              };
            })
          );

          setEvents(enriched);
        } catch {
          setError("Failed to load events.");
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [activeTab, authLoading, role]);

  const handleChangeStatus = async (id: string, newStatus: Status) => {
    try {
      setError(null);
      await eventService.updateEventStatus(id, newStatus);

      setEvents((prev) => prev.filter((e) => e.id !== id));

      toast.success(
        `Event ${
          newStatus === "approved"
            ? "Approved ✅"
            : newStatus === "rejected"
            ? "Rejected ❌"
            : "Updated"
        }`
      );
    } catch {
      setError("Could not update status. Try again.");
      toast.error("Could not update status. Try again.");
    }
  };

  const categories: Record<string, string> = {
    workshop: "Workshop",
    info_session: "Info Session",
    networking: "Networking",
    hackathon: "Hackathon",
    deadline: "Deadline",
    meeting: "Meeting",
    personal: "Personal",
    other: "Other",
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
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

  if (authLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return null;
  }

  return (
    <motion.div
      className="container mx-auto max-w-7xl p-4 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
        <p className="text-muted-foreground">
          Review, approve, or reject event submissions
        </p>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className=" mb-4 flex flex-wrap items-center justify-between gap-4">
          {/* 🔎 Search Bar */}
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md w-full sm:w-64"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* 📂 Event Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border rounded-md"
            >
              <option value="all">All Types</option>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* ⬆️⬇️ Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
              className="px-3 py-2 text-sm border rounded-md"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Status)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {(["pending", "approved", "rejected"] as Status[]).map((status) => (
            <TabsContent key={status} value={status}>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No {status} events</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events
                    .filter((e) =>
                      filterType === "all" ? true : e.event_type === filterType
                    )
                    .filter((e) =>
                      e.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .sort((a, b) => {
                      const dateA = new Date(a.start).getTime();
                      const dateB = new Date(b.start).getTime();
                      return sortOrder === "newest"
                        ? dateB - dateA
                        : dateA - dateB;
                    })
                    .map((e) => (
                      <motion.div
                        key={e.id}
                        variants={itemVariants}
                        whileHover={{ y: -4 }}
                      >
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <Badge variant={getBadgeVariant(e.event_type)}>
                                {categories[e.event_type] || "Event"}
                              </Badge>
                              <Badge
                                variant={
                                  status === "pending"
                                    ? "outline"
                                    : status === "approved"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </Badge>
                            </div>
                            <CardTitle className="pt-2">{e.title}</CardTitle>
                            {e.creator && (
                              <CardDescription>
                                <div className="flex items-center gap-2 group">
                                  <Link
                                    href={`/users/${e.created_by}`}
                                    className="flex items-center gap-2"
                                  >
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 10,
                                      }}
                                      className="h-8 w-8 relative rounded-full border overflow-hidden bg-muted border-border flex items-center justify-center transition-transform duration-200"
                                    >
                                      {e.creator.avatar ? (
                                        <Image
                                          src={e.creator.avatar}
                                          alt={e.creator.full_name}
                                          fill
                                          className="object-cover"
                                          sizes="32px"
                                          priority
                                        />
                                      ) : (
                                        <span className="text-xs font-medium text-[#500000]">
                                          {e.creator.full_name
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </motion.div>
                                    <p className="text-sm text-muted-foreground font-semibold group-hover:underline group-hover:text-foreground transition-colors duration-200">
                                      Submitted by {e.creator.full_name}
                                    </p>
                                  </Link>
                                </div>
                              </CardDescription>
                            )}
                            {e.poster_url && (
                              <div className="mt-2">
                                <SquarePoster
                                  src={e.poster_url}
                                  alt={e.title}
                                />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {/* Date, Time & Location */}
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                              {/* Calendar date icon */}
                              <div className="w-8 h-8 rounded-sm border bg-background text-center overflow-hidden shadow-sm shrink-0">
                                <div className="bg-muted text-[8px] font-medium py-[3px] leading-none">
                                  {format(e.start, "MMM").toUpperCase()}
                                </div>
                                <div className="text-[12px] font-bold text-foreground leading-none pt-[2px]">
                                  {format(e.start, "d")}
                                </div>
                              </div>

                              {/* Date & Time */}
                              <div className="text-[10px] dark:text-slate-100">
                                <p className="font-semibold text-[14px]">
                                  {format(e.start, "EEE, MMMM d")}
                                </p>
                                <p className="text-muted-foreground">
                                  {format(e.start, "h:mm a")} –{" "}
                                  {format(e.end, "h:mm a")}
                                </p>
                              </div>

                              {/* Separator */}
                              {e.location && (
                                <span className="text-muted-foreground">|</span>
                              )}

                              {/* Location */}
                              {e.location && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[140px]">
                                    {/^(https?:\/\/)/i.test(e.location)
                                      ? "Online Event"
                                      : e.location.split(",")[0]}
                                  </span>
                                </div>
                              )}
                            </div>

                            {e.description && (
                              <p className="text-sm line-clamp-3">
                                {e.description}
                              </p>
                            )}
                          </CardContent>
                          {status === "pending" && (
                            <CardFooter className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleChangeStatus(e.id, "rejected")
                                }
                                className="flex-1"
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Reject
                              </Button>
                              <Button
                                onClick={() =>
                                  handleChangeStatus(e.id, "approved")
                                }
                                className="flex-1"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                            </CardFooter>
                          )}
                          {status === "approved" && (
                            <CardFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvent(e);
                                  setDialogOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                            </CardFooter>
                          )}

                          {status === "rejected" && (
                            <CardFooter>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleChangeStatus(e.id, "approved")
                                }
                              >
                                Move to Approved
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className="w-full max-h-[100dvh] p-0 overflow-hidden overflow-y-auto scrollbar-hidden 
      sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg dark:bg-slate-900/80"
          >
            {selectedEvent && (
              <div className="py-5 px-4 space-y-6">
                {/* Poster */}
                {selectedEvent.poster_url && (
                  <SquarePoster
                    src={selectedEvent.poster_url}
                    alt={`${selectedEvent.title} poster`}
                  />
                )}

                {/* Title & Host */}
                <div className="pb-2">
                  <DialogTitle className="text-2xl font-bold dark:text-slate-100">
                    {selectedEvent.title}
                  </DialogTitle>
                  {selectedEvent.creator && (
                    <div className="flex items-center gap-2 pt-2 group">
                      <Link
                        href={`/users/${selectedEvent.created_by}`}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                          className="h-8 w-8 relative rounded-full border overflow-hidden bg-muted border-border flex items-center justify-center transition-transform duration-200"
                        >
                          {selectedEvent.creator.avatar ? (
                            <Image
                              src={selectedEvent.creator.avatar}
                              alt={selectedEvent.creator.full_name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              priority
                            />
                          ) : (
                            <span className="text-xs font-medium text-[#500000]">
                              {selectedEvent.creator.full_name
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </motion.div>
                        <p className="text-sm text-muted-foreground font-semibold group-hover:underline group-hover:text-foreground transition-colors duration-200">
                          Hosted by {selectedEvent.creator.full_name}
                        </p>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Date, Time & Location */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-sm border bg-background text-center overflow-hidden shadow-sm shrink-0">
                    <div className="bg-muted text-[10px] dark:text-slate-100 font-medium py-[3px] leading-none">
                      {format(selectedEvent.start, "MMM").toUpperCase()}
                    </div>
                    <div className="text-[15px] dark:text-slate-100 font-extrabold text-foreground leading-none pt-[3px]">
                      {format(selectedEvent.start, "d")}
                    </div>
                  </div>
                  <div className="text-sm dark:text-slate-100">
                    <p className="font-semibold text-[14px]">
                      {format(selectedEvent.start, "EEE, MMMM d")}
                    </p>
                    <p className="text-muted-foreground">
                      {format(selectedEvent.start, "h:mm a")} –{" "}
                      {format(selectedEvent.end, "h:mm a")}
                    </p>
                  </div>

                  {selectedEvent.location && (
                    <div className="w-px h-6 bg-border" />
                  )}

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

                {/* About Event */}
                {selectedEvent.description && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      About Event
                    </h3>
                    <div className="rounded-md px-4 py-2">
                      <p className="text-sm leading-relaxed dark:text-slate-200">
                        {selectedEvent.description.trim()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      router.push(`/calendar/${selectedEvent.id}`);
                    }}
                  >
                    See Event in Calendar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
}
