"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

// UI primitives
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SquarePoster } from "@/components/ui/SquarePoster";

// Icons
import { Check, Loader2, MapPin, Link as LinkIcon } from "lucide-react";

// Services & hooks
import { eventService } from "@/lib/services/event-service";
import { rsvpService } from "@/lib/services/rsvp-service";
import { useAuth } from "@/lib";

/**
 * Event details & one-click RSVP page.
 * Route suggestion: `app/events/[id]/page.tsx`
 */
export default function EventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile } = useAuth();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpData, setRsvpData] = useState({ name: "", email: "", notes: "" });

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch event once on mount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventService.getEvent(params.id);
        setEvent(res);
      } catch (e) {
        setError("Unable to load event. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [params.id]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RSVP handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleRSVP = async () => {
    if (!event) return;
    setRsvpLoading(true);
    try {
      await rsvpService.rsvp({
        event_id: event.id,
        name: rsvpData.name || profile?.full_name,
        email: rsvpData.email || profile?.email,
        notes: rsvpData.notes,
      });
      setRsvpSuccess(true);
    } catch (e) {
      // handle error with toast / alert if you have a Toast system
      console.error(e);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background/95 py-8 px-4 dark:bg-slate-900/80">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* — Poster ———————————————————————————— */}
        {event.poster_url && (
          <SquarePoster src={event.poster_url} alt={`${event.title} poster`} />
        )}

        {/* — Title & Host ——————————————————— */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight dark:text-slate-100">
            {event.title}
          </h1>
          {event.creator && (
            <Link
              href={`/users/${event.created_by}`}
              className="flex items-center gap-2 group"
            >
              {/* Avatar */}
              {event.creator.avatar ? (
                <Image
                  src={event.creator.avatar}
                  alt={event.creator.full_name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-[#500000]">
                  {event.creator.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-muted-foreground group-hover:underline group-hover:text-foreground">
                Hosted by {event.creator.full_name}
              </span>
            </Link>
          )}
        </header>

        {/* — Date / Time / Location ——————————————————— */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm dark:text-slate-100">
            {/* Mini calendar-style badge */}
            <div className="flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-sm border bg-background text-center shadow-sm">
              <div className="bg-muted py-[3px] text-[10px] font-medium leading-none dark:text-slate-100">
                {format(event.start, "MMM").toUpperCase()}
              </div>
              <div className="pt-[3px] text-[15px] font-extrabold leading-none text-foreground dark:text-slate-100">
                {format(event.start, "d")}
              </div>
            </div>
            {/* Date & Time */}
            <div>
              <p className="text-[14px] font-semibold">
                {format(event.start, "EEEE, MMMM d")}
              </p>
              <p className="text-muted-foreground">
                {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
              </p>
            </div>
            {/* Divider */}
            <div className="h-6 w-px bg-border" />
            {/* Location */}
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

        {/* — RSVP / Past-event notice ——————————— */}
        <Card className="space-y-4 border border-primary/20 bg-primary/5 p-4 dark:border-primary/40 dark:bg-primary/10 dark:text-slate-100">
          {new Date(event.end) < new Date() ? (
            <div className="space-y-1 text-center text-sm text-muted-foreground">
              <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200">
                Past Event
              </h3>
              <p>
                This event ended on{" "}
                <span className="font-medium">
                  {format(new Date(event.end), "MMMM d, yyyy")}
                </span>
                .
              </p>
            </div>
          ) : rsvpSuccess ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-green-800">
                Registration Confirmed!
              </h3>
              <p className="mt-1 text-xs text-green-600">
                A confirmation email has been sent to you.
              </p>
            </div>
          ) : profile ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
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
                className="text-sm"
              />
              <Button
                onClick={handleRSVP}
                disabled={rsvpLoading}
                className="w-full bg-green-600 py-2 text-sm text-white hover:bg-green-700"
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
                  className="text-sm"
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={rsvpData.email}
                  onChange={(e) =>
                    setRsvpData({ ...rsvpData, email: e.target.value })
                  }
                  required
                  className="text-sm"
                />
              </div>
              <Textarea
                placeholder="Notes (optional)"
                rows={2}
                value={rsvpData.notes}
                onChange={(e) =>
                  setRsvpData({ ...rsvpData, notes: e.target.value })
                }
                className="text-sm"
              />
              <Button
                onClick={handleRSVP}
                disabled={
                  rsvpLoading || !rsvpData.name.trim() || !rsvpData.email.trim()
                }
                className="w-full bg-green-600 py-2 text-sm text-white hover:bg-green-700"
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

        {/* — About ——————————————————————————— */}
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
