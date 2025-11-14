"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { DayPicker } from "react-day-picker";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

/* ------------------------------------------------------------------ */
/*  constants                                                         */
/* ------------------------------------------------------------------ */
const defaultClassNames = {
  months: "relative flex flex-col sm:flex-row gap-4",
  month: "w-full",
  month_caption:
    "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
  caption_label: "text-sm font-medium",
  nav: "absolute top-0 flex w-full justify-between z-10",
  button_previous: cn(
    buttonVariants({ variant: "ghost" }),
    "size-9 text-muted-foreground/80 hover:text-foreground p-0"
  ),
  button_next: cn(
    buttonVariants({ variant: "ghost" }),
    "size-9 text-muted-foreground/80 hover:text-foreground p-0"
  ),
  weekday: "size-9 p-0 text-xs font-medium text-muted-foreground/80",
  day_button:
    "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-foreground outline-offset-2 " +
    "group-[[data-selected]:not(.range-middle)]:transition-colors " +
    "focus:outline-none focus-visible:z-10 hover:bg-accent " +
    "group-data-[selected]:bg-primary group-data-[selected]:text-primary-foreground " +
    "group-data-[disabled]:pointer-events-none group-data-[disabled]:text-foreground/30 " +
    "group-data-[outside]:text-foreground/30 group-data-[outside]:group-data-[selected]:text-primary-foreground " +
    "group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none " +
    "group-[.range-middle]:rounded-none",
  day: "group size-9 px-0 text-sm",
  /* the rest of the keys are unchanged … */
};

const Chevron = ({
  orientation,
  ...props
}: { orientation: "left" | "right" } & React.SVGProps<SVGSVGElement>) =>
  orientation === "left" ? (
    <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />
  ) : (
    <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />
  );

const rangeClass =
  "bg-muted text-muted-foreground hover:bg-muted pointer-events-none";

/* ------------------------------------------------------------------ */
/*  component                                                         */
/* ------------------------------------------------------------------ */
export default function DatePicker({ error }: { error?: boolean }) {
  const form = useFormContext(); // pulls RHF context from parent <Form>

  const dateValue = form.watch("date");

  const triggerLabel = useMemo(() => {
    if (!dateValue) return "Select date";
    const datePart = dateValue.toLocaleDateString(undefined, {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return datePart;
  }, [dateValue]);

  /* markup -------------------------------------------------------- */
  return (
    <FormField
      name="date"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-full text-left font-normal",
                    !field.value && "text-muted-foreground",
                    error && "border-red-300 focus:border-red-500",
                    "dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {triggerLabel}
                </Button>
              </FormControl>
            </PopoverTrigger>

            <PopoverContent
              sideOffset={8}
              align="start"
              className=" p-0 dark:bg-zinc-900 dark:text-zinc-200 dark:border dark:border-zinc-700"
            >
              <div className="flex">
                {/* calendar */}
                <DayPicker
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  // disabled={(d) => d < new Date()}
                  showOutsideDays
                  className="p-6"
                  classNames={{
                    ...defaultClassNames,
                    day_button: cn(
                      defaultClassNames.day_button,
                      "hover:bg-accent dark:hover:bg-zinc-800"
                    ),
                  }}
                  components={{ Chevron }}
                  modifiers={{
                    today: (date) => isToday(date),
                  }}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
