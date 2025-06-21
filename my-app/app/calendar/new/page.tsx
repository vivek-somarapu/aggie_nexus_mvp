"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  MapPin,
  LinkIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
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

// Form schema validation
const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(350, "Description must be less than 350 characters")
    .optional(),
  event_type: z.enum(
    [
      "workshop",
      "info_session",
      "networking",
      "hackathon",
      "deadline",
      "meeting",
      "personal",
      "other",
    ],
    {
      required_error: "Please select an event type",
    }
  ),
  date: z.date({
    required_error: "Please select a date",
  }),
  start_time: z.string({
    required_error: "Please select a start time",
  }),
  end_time: z.string({
    required_error: "Please select an end time",
  }),
  is_online: z.boolean().default(false),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  event_link: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

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
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [eventPhoto, setEventPhoto] = useState<File | null>(null);

  // Create form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      event_type: "other",
      date: new Date(),
      start_time: "12:00",
      end_time: "13:00",
      is_online: false,
      location: "",
      event_link: "",
    },
  });

  const watchIsOnline = form.watch("is_online");

  const watchDescription = form.watch("description");
  const descriptionWords = watchDescription
    ? watchDescription.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!profile) {
      router.push("/auth/login?redirect=/calendar/new");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      // Combine date and time into start and end timestamps
      const [startHour, startMinute] = values.start_time.split(":").map(Number);
      const [endHour, endMinute] = values.end_time.split(":").map(Number);

      const startDate = new Date(values.date);
      startDate.setHours(startHour, startMinute, 0);

      const endDate = new Date(values.date);
      endDate.setHours(endHour, endMinute, 0);

      // Upload photo if provided
      let photoUrl = null;
      if (eventPhoto) {
        const fileExt = eventPhoto.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("event-photos")
          .upload(fileName, eventPhoto);

        if (uploadError) {
          throw new Error("Failed to upload photo");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-photos").getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Insert event with pending status
      const { data, error } = await supabase.from("events").insert({
        title: values.title,
        description: values.description || null,
        event_type: values.event_type,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: values.is_online ? null : values.location || null,
        event_link: values.is_online ? values.event_link || null : null,
        is_online: values.is_online,
        photo_url: photoUrl,
        created_by: profile.id,
        status: "pending", // Events start as pending and need manager approval
      });

      if (error) {
        throw error;
      }

      // Show success UI
      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/calendar");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setSubmitError(
        err?.message || "Failed to create event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Event type options
  const eventTypes = [
    { value: "workshop", label: "Workshop" },
    { value: "info_session", label: "Info Session" },
    { value: "networking", label: "Networking Event" },
    { value: "hackathon", label: "Hackathon" },
    { value: "deadline", label: "Project Deadline" },
    { value: "meeting", label: "Meeting" },
    { value: "personal", label: "Personal Event" },
    { value: "other", label: "Other Event" },
  ];

  // Time options (30 min intervals)
  const timeOptions: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-4"></div>
          <div className="h-6 w-96 bg-muted/60 rounded animate-pulse mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-muted rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    router.push("/auth/login?redirect=/calendar/new");
    return null;
  }

  if (submitSuccess) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <AlertTitle>Event Submitted!</AlertTitle>
            </div>
            <AlertDescription>
              Your event has been submitted and is pending approval from a
              manager. You will be redirected to the calendar.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <motion.div
        className="h-full "
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container max-w-4xl space-y-6">
          <motion.div variants={itemVariants} className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Request an Event
              </h1>
              <p className="text-muted-foreground">
                Submit an event for approval by Aggie Nexus managers
              </p>
            </div>
          </motion.div>

          {submitError && (
            <motion.div variants={itemVariants}>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Title: takes full width on mobile, 2/3 on md+ */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter event title"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Event Type: takes full width on mobile, 1/3 on md+ */}
                      <div className="md:col-span-1">
                        <FormField
                          control={form.control}
                          name="event_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {eventTypes.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
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
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
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
                        <FormField
                          control={form.control}
                          name="start_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Start time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {format(
                                        new Date(`2000-01-01T${time}`),
                                        "h:mm a"
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="end_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="End time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {format(
                                        new Date(`2000-01-01T${time}`),
                                        "h:mm a"
                                      )}
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

                    {/* Online/Offline Toggle with Integrated Input (one row) */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Toggle section (small switch) */}
                      <div className="col-span-12 md:col-span-4">
                        <FormField
                          control={form.control}
                          name="is_online"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {field.value ? (
                                  <LinkIcon className="h-4 w-4" />
                                ) : (
                                  <MapPin className="h-4 w-4" />
                                )}
                                {field.value
                                  ? "Online Event"
                                  : "In-Person Event"}
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="scale-75" // shrink the switch
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Input field for link or location */}
                      <div className="col-span-12 md:col-span-8">
                        {watchIsOnline ? (
                          <FormField
                            control={form.control}
                            name="event_link"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="https://zoom.us/j/123456789"
                                    {...field}
                                  />
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
                                  <Input
                                    placeholder="Enter event address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter event description (optional)"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>

                          <div className="flex justify-between items-center">
                            <span
                              className={cn(
                                "text-xs",
                                descriptionWords > 350
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              )}
                            >
                              {descriptionWords}/350 words
                            </span>
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <PhotoUpload onPhotoChange={setEventPhoto} />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting
                        </>
                      ) : (
                        "Submit Event Request"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
