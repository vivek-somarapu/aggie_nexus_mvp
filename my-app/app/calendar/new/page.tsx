"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatISO, set } from "date-fns";
import { useCallback } from "react";
import { Upload, X } from "lucide-react";

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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon, LinkIcon, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { eventService } from "@/lib/services/event-service";
import { categories } from "@/lib/constants";

const newEventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    event_type: z.string().min(1, "Event type is required"),
    date: z.date({ required_error: "Date is required" }),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    is_online: z.boolean(),

    // for in-person:
    location: z.string().optional(),

    // for online: trim, drop empty, then validate URL
    event_link: z.preprocess((val) => {
      if (typeof val === "string") {
        const t = val.trim();
        return t === "" ? undefined : t;
      }
      return val;
    }, z.string().url("Must be a valid URL").optional()),

    description: z.string().max(500).optional(),
  })
  // (re-add your refine here if you need to enforce one vs the other)
  .refine(
    (data) =>
      data.is_online ? Boolean(data.event_link) : Boolean(data.location),
    {
      message: (data) =>
        data.is_online
          ? "A valid event link is required for online events"
          : "A location is required for in-person events",
      path: [(data) => (data.is_online ? "event_link" : "location")],
    }
  );

type NewEventFormValues = z.infer<typeof newEventSchema>;

export const eventTypes = Object.entries(categories).map(([value, label]) => ({
  value,
  label,
}));
// Time options (30 min intervals)
const timeOptions: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    timeOptions.push(`${formattedHour}:${formattedMinute}`);
  }
}

// Drag and drop photo component
function PhotoUpload({
  onPhotoChange,
}: {
  onPhotoChange: (file: File | null) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          setPhoto(file);
          onPhotoChange(file);

          const reader = new FileReader();
          reader.onload = (e) => {
            setPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [onPhotoChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setPhoto(file);
        onPhotoChange(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview(null);
    onPhotoChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Event Photo</label>
      {preview ? (
        <div className="relative">
          <img
            src={preview || "/placeholder.svg"}
            alt="Event preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("photo-input")?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag and drop an image here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to 10MB
          </p>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}
    </div>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventPhoto, setEventPhoto] = useState<File | null>(null);

  const form = useForm<NewEventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      date: new Date(),
      title: "",
      event_type: "",
      start_time: "",
      end_time: "",
      location: "",
      event_link: "",
      description: "",
      is_online: false,
    },
  });

  const watchIsOnline = form.watch("is_online");
  const descriptionWords = form
    .watch("description", "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const onSubmit = async (data: NewEventFormValues) => {
    setIsSubmitting(true);
    try {
      // build ISO timestamps
      const { date, start_time, end_time, is_online, ...rest } = data;
      const [startHour, startMin] = start_time.split(":").map(Number);
      const [endHour, endMin] = end_time.split(":").map(Number);
      const startDateObj = set(date, {
        hours: startHour,
        minutes: startMin,
        seconds: 0,
      });
      const endDateObj = set(date, {
        hours: endHour,
        minutes: endMin,
        seconds: 0,
      });
      const startISO = formatISO(startDateObj);
      const endISO = formatISO(endDateObj);

      let poster_url: string | null = null;
      if (eventPhoto) {
        poster_url = await eventService.uploadPhoto(eventPhoto);
      }

      // assemble payload
      const payload = {
        title: rest.title,
        description: rest.description || null,
        start_time: startISO,
        end_time: endISO,
        event_type: rest.event_type,
        location: !is_online && rest.location !== "" ? rest.location : null,
        event_link:
          is_online && rest.event_link !== "" ? rest.event_link : null,
        poster_url,
        created_by: profile!.id,
      };

      // call the REST API to create event
      await eventService.createEvent(payload);

      router.push("/calendar");
    } catch (error: any) {
      console.error("Error creating event:", error);
      form.setError("title", {
        message: error.message || "Failed to create event",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("🚨 validation errors:", errors);
              alert(
                "Form has validation errors – check the console for details."
              );
            })}
            className="space-y-6"
          >
            {/* Title & Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-1">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Date & Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                {["start_time", "end_time"].map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as "start_time" | "end_time"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {name === "start_time" ? "Start Time" : "End Time"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  name === "start_time" ? "Start" : "End"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {new Date(
                                  `2000-01-01T${time}`
                                ).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Online vs In-Person */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-12 md:col-span-4">
                <FormField
                  control={form.control}
                  name="is_online"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {field.value ? <LinkIcon /> : <MapPin />}
                        {field.value ? "Online Event" : "In-Person Event"}
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-12 md:col-span-8">
                {watchIsOnline ? (
                  <FormField
                    control={form.control}
                    name="event_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="https://zoom.us/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Enter event address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <div className="flex justify-end text-xs text-muted-foreground">
                    {descriptionWords}/350 words
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <PhotoUpload onPhotoChange={setEventPhoto} />

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2"
            >
              {isSubmitting ? "Submitting…" : "Submit Event Request"}
            </button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
