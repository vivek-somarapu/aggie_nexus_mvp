"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
// UI Components
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SquarePoster } from "@/components/ui/SquarePoster";

// Icons
import { Check, Loader2, MapPin, ChevronLeft } from "lucide-react";

// Services
import { eventService } from "@/lib/services/event-service";
import { rsvpService } from "@/lib/services/rsvp-service";
import { useAuth } from "@/lib";

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpData, setRsvpData] = useState({ name: "", email: "", notes: "" });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventService.getEvent(params.id);
        if (!data) {
          setError("Event not found");
        } else {
          setEvent(data);
        }
      } catch (err) {
        setError("Failed to fetch event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [params.id]);

  const handleRSVP = async () => {
    try {
      setRsvpLoading(true);
      await rsvpService.submitRSVP({
        eventId: event.id,
        name: profile?.full_name || rsvpData.name,
        email: profile?.email || rsvpData.email,
        notes: rsvpData.notes,
        userId: profile?.id,
      });
      setRsvpSuccess(true);
    } catch (err) {
      setError("RSVP failed");
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Event not found."}
        </p>
      </div>
    );
  }

  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);

  return (
    <main className="min-h-screen bg-background/95 py-8 px-4 dark:bg-slate-900/80">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* heading row */}
        <header className="space-y-1">
          <div className="mb-2 md:mb-4 flex items-center gap-3">
            {/* BACK → Calendar */}
            <Button
              type="button"
              onClick={() => router.push("/calendar")}
              className="h-9 px-3 rounded-md bg-muted/90 hover:bg-muted text-foreground font-medium shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Back</span>
            </Button>

            <h1 className="text-3xl mb-2 font-bold tracking-tight dark:text-slate-100">
              {event.title}
            </h1>
          </div>

          {event.creator && (
            <Link
              href={`/users/${event.created_by}`}
              className="flex items-center gap-2 group"
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
                {!event.creator ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : event.creator.avatar ? (
                  <Image
                    src={event.creator.avatar}
                    alt={event.creator.full_name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-muted">
                    <span className="text-xs font-medium text-[#500000]">
                      {event.creator.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </motion.div>
              <span className="text-sm font-semibold text-muted-foreground group-hover:underline group-hover:text-foreground">
                Hosted by {event.creator.full_name}
              </span>
            </Link>
          )}
        </header>

        {event.poster_url && (
          <SquarePoster src={event.poster_url} alt={`${event.title} poster`} />
        )}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm dark:text-slate-100">
            <div className="flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-sm border bg-background text-center shadow-sm">
              <div className="bg-muted py-[3px] text-[10px] font-medium leading-none dark:text-slate-100">
                {format(start, "MMM").toUpperCase()}
              </div>
              <div className="pt-[3px] text-[15px] font-extrabold leading-none text-foreground dark:text-slate-100">
                {format(start, "d")}
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold">
                {format(start, "EEEE, MMMM d")}
              </p>
              <p className="text-muted-foreground">
                {format(start, "h:mm a")} – {format(end, "h:mm a")}
              </p>
            </div>
            <div className="h-6 w-px bg-border" />
            {event.location && (
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">
                    {/^(https?:\/\/)/i.test(event.location)
                      ? "Online Event"
                      : event.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {/^(https?:\/\/)/i.test(event.location)
                      ? ""
                      : "In-person Event"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <Card className="space-y-4 border border-primary/20 bg-primary/5 p-4 dark:border-primary/40 dark:bg-primary/10 dark:text-slate-100">
          {new Date(event.end_time) < new Date() ? (
            <div className="text-center text-sm text-muted-foreground">
              <h3 className="text-base font-semibold">Past Event</h3>
              <p>
                This event ended on{" "}
                {format(new Date(event.end_time), "MMMM d, yyyy")}.
              </p>
            </div>
          ) : rsvpSuccess ? (
            <div className="text-center py-2">
              <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-green-800">
                Registration Confirmed!
              </h3>
              <p className="text-xs text-green-600 mt-1">
                A confirmation email has been sent to you.
              </p>
            </div>
          ) : profile ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <span className="font-semibold">
                  Register as {profile.full_name}
                </span>
                <span className="text-muted-foreground">{profile.email}</span>
              </div>
              <Textarea
                placeholder="Notes (optional)"
                rows={2}
                value={rsvpData.notes}
                onChange={(e) =>
                  setRsvpData({ ...rsvpData, notes: e.target.value })
                }
              />
              <Button
                onClick={handleRSVP}
                disabled={rsvpLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
              >
                {rsvpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Registering...
                  </>
                ) : (
                  "One-Click RSVP"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-gray-800 dark:text-slate-200">
                Welcome! To join the event, please register below.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Full name"
                  value={rsvpData.name}
                  onChange={(e) =>
                    setRsvpData({ ...rsvpData, name: e.target.value })
                  }
                  required
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={rsvpData.email}
                  onChange={(e) =>
                    setRsvpData({ ...rsvpData, email: e.target.value })
                  }
                  required
                />
              </div>
              <Textarea
                placeholder="Notes (optional)"
                rows={2}
                value={rsvpData.notes}
                onChange={(e) =>
                  setRsvpData({ ...rsvpData, notes: e.target.value })
                }
              />
              <Button
                onClick={handleRSVP}
                disabled={
                  rsvpLoading || !rsvpData.name.trim() || !rsvpData.email.trim()
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm"
              >
                {rsvpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Registering...
                  </>
                ) : (
                  "Register for Event"
                )}
              </Button>
            </div>
          )}
        </Card>

        {event.description?.trim() && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              About Event
            </h2>
            <Separator />
            <div className="rounded-md px-4 py-2">
              <p className="text-sm leading-relaxed dark:text-slate-200">
                {event.description.trimStart()}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
