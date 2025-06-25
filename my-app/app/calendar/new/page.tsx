"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SquarePoster } from "@/components/ui/SquarePoster";
import { formatISO, set } from "date-fns";
import { FileUpload } from "@/components/file-upload";
import DateTimePicker from "@/components/DateTimePicker";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LinkIcon, MapPin, ChevronLeft, Loader2 } from "lucide-react";
import { pageVariants, calendarVariants, categories } from "@/lib/constants";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { eventService } from "@/lib/services/event-service";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

/* ------------------------------------------------------------------
  Validation Schema
-------------------------------------------------------------------*/
/* ------------------------------------------------------------------
  Validation Schema  ➜  drop-in replacement
-------------------------------------------------------------------*/
const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    event_type: z.string().min(1, "Event type is required"),

    /* all three of these fields are needed to build the full Date-time */
    date: z.date({ required_error: "Date is required" }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),

    is_online: z.boolean(),
    location: z.string().optional(),
    event_link: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().url().optional()
    ),

    description: z.string().max(10_000).optional(),
  })
  /* -------------------------------------------------------------- */
  /*  ❶ address / link requirement (your old rule)                  */
  /* -------------------------------------------------------------- */
  .refine(
    (d) => (d.is_online ? d.event_link : d.location),
    (d) => ({
      message: d.is_online
        ? "Link required for online events"
        : "Address required",
      path: ["location"],
    })
  )
  /* -------------------------------------------------------------- */
  /*  ❷ NO events in the past ↴                                     */
  /* -------------------------------------------------------------- */
  .refine(
    (d) => {
      /* turn date + start_time into one JS Date                     */
      const [sh, sm] = d.start_time.split(":").map(Number);
      const start = new Date(
        d.date.getFullYear(),
        d.date.getMonth(),
        d.date.getDate(),
        sh,
        sm,
        0,
        0
      );
      return start >= new Date();
    },
    {
      message: "Cannot schedule an event in the past",
      path: ["date"], // error shows under the Date field (red text)
    }
  )
  /* -------------------------------------------------------------- */
  /*  ❸ End time must be after start time ↴                         */
  /* -------------------------------------------------------------- */
  .refine(
    (d) => {
      const [sh, sm] = d.start_time.split(":").map(Number);
      const [eh, em] = d.end_time.split(":").map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

type FormValues = z.infer<typeof schema>;

/* ------------------------------------------------------------------
  Constants
-------------------------------------------------------------------*/
export const eventTypes = Object.entries(categories).map(([value, label]) => ({
  value,
  label,
}));

const timeOptions: string[] = [];
for (let h = 8; h <= 20; h++) {
  for (let m = 0; m < 60; m += 30) {
    timeOptions.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
  }
}

/* ------------------------------------------------------------------
  Helper to POST to the /api/upload/event-posters route
-------------------------------------------------------------------*/
async function uploadPoster(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/event-posters", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error("Upload failed");
  }
  const { publicUrl } = (await res.json()) as { publicUrl: string };
  return publicUrl;
}

/* ------------------------------------------------------------------
  Main Page Component
-------------------------------------------------------------------*/
export default function NewEventPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      is_online: false,
    } as any,
  });

  const isOnline = form.watch("is_online");
  const descWords = form
    .watch("description", "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      // build start/end ISO strings
      const [sh, sm] = data.start_time.split(":").map(Number);
      const [eh, em] = data.end_time.split(":").map(Number);
      const startISO = formatISO(
        set(data.date, { hours: sh, minutes: sm, seconds: 0 })
      );
      const endISO = formatISO(
        set(data.date, { hours: eh, minutes: em, seconds: 0 })
      );

      // optional poster upload
      let poster_url: string | null = null;
      if (posterFile) {
        poster_url = await uploadPoster(posterFile);
      }

      await eventService.createEvent({
        title: data.title,
        description: data.description || null,
        start_time: startISO,
        end_time: endISO,
        event_type: data.event_type as any,
        location: data.is_online
          ? (data.event_link as string)
          : (data.location as string),
        poster_url,
      } as any);
      toast.success(
        "Event submitted successfully 🎉 Wait for updates on email!"
      );
      router.push("/calendar");
    } catch (err) {
      console.error(err);
      form.setError("title", { message: "Failed to create event" });
    } finally {
      setSubmitting(false);
    }
  }
  // 🔗 preview URL for the selected poster (or null)
  const posterPreview = useMemo(
    () => (posterFile ? URL.createObjectURL(posterFile) : null),
    [posterFile]
  );

  // 🧹 revoke the object URL when it’s no longer needed
  useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

  /* -------------------------------- UI -------------------------------- */
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-2"
    >
      <div className="max-w-5xl mx-auto">
        {/* heading row */}
        <div className="mb-0 md:mb-4 flex items-center gap-3">
          {/* BACK → Calendar */}
          <Button
            type="button"
            onClick={() => router.push("/calendar")}
            className="h-9 px-3 rounded-md bg-muted/90 hover:bg-muted text-foreground font-medium shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Back</span>
          </Button>

          {/* page title */}
          <h1 className="text-2xl font-bold text-foreground">
            New Event Request
          </h1>
        </div>

        <Card
          className="border-0 shadow-none md:border md:shadow-lg
            bg-card/80  sm:dark:bg-slate-900/80
            md:border-slate-200 dark:md:border-slate-700
            backdrop-blur-sm"
        >
          <CardContent className="p-0 md:px-6 md:py-3 space-y-4">
            <Form {...form}>
              <motion.form
                variants={calendarVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* ── Title + Date/Time (responsive row) ────────────────────────── */}
                <div className="grid gap-4 lg:grid-cols-4">
                  {/* Event Title & Category */}
                  <div className="lg:col-span-2">
                    <FormField
                      name="title"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Event Title
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your event title..."
                                className="h-10 pr-36 dark:bg-slate-900/80 dark:text-slate-200"
                              />
                            </FormControl>

                            {/* Category dropdown in the input’s right corner */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                              <FormField
                                name="event_type"
                                control={form.control}
                                render={({ field: categoryField }) => (
                                  <Select
                                    value={categoryField.value}
                                    onValueChange={categoryField.onChange}
                                  >
                                    <SelectTrigger className="h-8 w-36 bg-muted/50 border-0 text-xs">
                                      <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {eventTypes.map((t) => (
                                        <SelectItem
                                          key={t.value}
                                          value={t.value}
                                        >
                                          {t.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Date + Time range picker */}
                  <div className="lg:col-span-2">
                    <DateTimePicker />
                  </div>
                </div>

                {/* Location Section - Switch and Input on Same Line */}
                <div className="space-y-3">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Event Location
                  </FormLabel>
                  <div className="flex items-center gap-4">
                    <FormField
                      name="is_online"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <LinkIcon className="h-4 w-4 text-blue-600" />
                            ) : (
                              <MapPin className="h-4 w-4 text-green-600" />
                            )}
                            <span className="font-medium text-sm whitespace-nowrap text-slate-700 dark:text-slate-200">
                              {field.value ? "Online" : "In-Person"}
                            </span>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex-1">
                      {isOnline ? (
                        <FormField
                          name="event_link"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="https://zoom.us/j/..."
                                  {...field}
                                  className="h-10 dark:bg-slate-900/80 dark:text-slate-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          name="location"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="123 Main St, City, State"
                                  {...field}
                                  className="h-10 dark:bg-slate-900/80 dark:text-slate-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Description and Poster - Stacked Vertically */}
                <div className="space-y-4">
                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[80px] resize-none"
                            {...field}
                            placeholder="Tell people about your event..."
                          />
                        </FormControl>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            Optional
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              descWords > 350
                                ? "text-destructive"
                                : "text-muted-foreground dark:text-slate-400"
                            )}
                          >
                            {descWords}/350 words
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FileUpload onChange={setPosterFile} />
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 dark:bg-slate-800 dark:border-slate-600"
                    onClick={() => setShowPreview(true)}
                  >
                    Preview Event Page
                  </Button>
                  <AlertDialog>
                    {/* primary button just OPENS the dialog */}
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button" // no immediate submit
                        className="flex-1 h-10 font-medium bg-gradient-to-r
                          from-primary to-primary/90
                          hover:from-primary/90 hover:to-primary"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin h-3 w-3 mr-2 border-b-2 border-white rounded-full" />
                            Creating…
                          </>
                        ) : (
                          "Create Event"
                        )}
                      </Button>
                    </AlertDialogTrigger>

                    {/* confirmation dialog */}
                    <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Heads-up!</AlertDialogTitle>
                        <AlertDialogDescription>
                          Once you create the event you{" "}
                          <strong>won’t be able to edit it.</strong>
                          <br />
                          Double-check all details!
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel className="w-full sm:w-auto">
                          Go back &amp; review
                        </AlertDialogCancel>

                        {/* final “Send anyway” — calls the SAME RHF submit */}
                        <AlertDialogAction
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            form.handleSubmit(async (data) => {
                              await onSubmit(data); // your existing submit fn
                              toast.success("Event submitted successfully 🎉");
                            })()
                          }
                        >
                          Double-check&nbsp;and&nbsp;Send&nbsp;anyway
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.form>
            </Form>
          </CardContent>
        </Card>
      </div>
      {/* Event Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-full max-h-[100dvh] p-0 overflow-hidden scrollbar-hidden overflow-y-auto sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg dark:text-slate-1500 dark:bg-slate-800/70">
          <div className="py-5 px-4">
            <div className="space-y-6">
              {/* Poster preview (only if a file was chosen) */}
              {posterPreview && (
                <SquarePoster src={posterPreview} alt={`Preview poster`} />
              )}

              {/* Event Information */}
              <div className="space-y-2">
                <div className="pb-2">
                  <DialogTitle className="text-2xl font-bold">
                    {form.watch("title") || "Event Title"}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <div className="relative h-8 w-8 rounded-full overflow-hidden border bg-muted border-border flex items-center justify-center transition-transform duration-200">
                      {!profile ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : profile.avatar ? (
                        <Image
                          src={profile.avatar}
                          alt={profile.full_name ?? "Avatar"}
                          fill
                          className="object-cover"
                          sizes="64px"
                          priority
                        />
                      ) : (
                        <span className="text-xs font-medium text-[#500000]">
                          {profile.full_name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Host text */}
                    <p className="text-sm font-semibold text-muted-foreground group-hover:underline group-hover:text-foreground transition-colors duration-200">
                      Hosted by {profile?.full_name ?? "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Date, Time & Location */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Calendar Icon */}
                    {form.watch("date") && (
                      <>
                        <div className="w-10 h-10 rounded-sm border bg-white text-center overflow-hidden shadow-sm shrink-0">
                          <div className="bg-gray-100 text-[10px] font-medium text-gray-700 py-[3px] leading-none">
                            {format(form.watch("date"), "MMM").toUpperCase()}
                          </div>
                          <div className="text-[15px] font-extrabold text-gray-900 leading-none pt-[3px]">
                            {format(form.watch("date"), "d")}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="text-sm">
                          <p className="font-semibold text-[14px]">
                            {format(form.watch("date"), "EEEE, MMMM d")}
                          </p>
                          <p className="text-muted-foreground">
                            {form.watch("start_time") &&
                              form.watch("end_time") && (
                                <>
                                  {new Date(
                                    `2000-01-01T${form.watch("start_time")}`
                                  ).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}{" "}
                                  –{" "}
                                  {new Date(
                                    `2000-01-01T${form.watch("end_time")}`
                                  ).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </>
                              )}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border" />
                      </>
                    )}

                    {/* Location Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-10 h-10 border rounded-md bg-gray-100 flex items-center justify-center">
                        {isOnline ? (
                          <LinkIcon className="h-5 w-5 text-blue-600" />
                        ) : (
                          <MapPin className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[14px]">
                          {isOnline
                            ? "Online Event"
                            : form.watch("location") || "Venue Address"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {isOnline ? "Virtual Meeting" : "In-person Event"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Notice */}
              <Card className="border border-blue-200 bg-blue-50 p-4">
                <div className="text-center text-sm text-blue-800">
                  <h3 className="font-semibold text-base">Event Preview</h3>
                  <p className="mt-1">
                    This is how your event will appear to attendees
                  </p>
                </div>
              </Card>

              {/* About Event */}
              {form.watch("description")?.trim() && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    About Event
                  </h3>
                  <Separator />
                  <div className="rounded-md px-4 py-2">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {form.watch("description")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
