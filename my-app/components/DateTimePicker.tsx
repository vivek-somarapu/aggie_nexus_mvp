"use client";

import React, { useState, useMemo } from "react";
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

const timeSlots: string[] = (() => {
  const out: string[] = [];
  const d = new Date(2000, 0, 1);
  d.setSeconds(0);
  d.setMilliseconds(0);
  for (let mins = 8 * 60; mins <= 20 * 60; mins += 30) {
    d.setHours(0, mins);
    out.push(
      d.toLocaleTimeString([], {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }
  return out;
})();

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
export default function DateTimePicker({ error }: { error?: boolean }) {
  const form = useFormContext(); // pulls RHF context from parent <Form>
  const [timeRange, setTimeRange] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });

  /* helpers ------------------------------------------------------- */
  const t2m = (t: string) => {
    const [time, period] = t.split(" ");
    const [h, m] = time.split(":").map(Number);
    const pm = period.toLowerCase() === "pm";
    const hour = (pm && h !== 12 ? h + 12 : !pm && h === 12 ? 0 : h) % 24;
    return hour * 60 + m;
  };

  const onTimeClick = (t: string) => {
    if (!timeRange.start || timeRange.end) {
      setTimeRange({ start: t, end: null });
      form.setValue("start_time", t);
      form.setValue("end_time", null);
    } else if (t2m(t) > t2m(timeRange.start)) {
      setTimeRange({ start: timeRange.start, end: t });
      form.setValue("end_time", t);
    } else {
      setTimeRange({ start: t, end: null });
      form.setValue("start_time", t);
      form.setValue("end_time", null);
    }
  };

  const dateValue = form.watch("date");

  const triggerLabel = useMemo(() => {
    if (!dateValue) return "Select date";
    const datePart = dateValue.toLocaleDateString(undefined, {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const fmt = (t?: string | null) => t ?? "— — —";

    if (timeRange.start && timeRange.end) {
      return `${datePart} · ${fmt(timeRange.start)} – ${fmt(timeRange.end)}`;
    }
    if (timeRange.start) {
      return `${datePart} · ${fmt(timeRange.start)}`;
    }
    return datePart;
  }, [dateValue, timeRange.start, timeRange.end]);

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
                    error && "border-red-300 focus:border-red-500"
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
              className="w-[450px] p-0 dark:bg-slate-900 dark:text-slate-200"
            >
              <div className="flex">
                {/* calendar */}
                <DayPicker
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(d) => d < new Date()}
                  showOutsideDays
                  className="p-6"
                  classNames={{
                    ...defaultClassNames,
                    day_button: cn(
                      defaultClassNames.day_button,
                      "hover:bg-accent"
                    ),
                  }}
                  components={{ Chevron }}
                  modifiers={{
                    today: (date) => isToday(date),
                  }}
                  initialFocus
                />

                {/* divider */}
                <div className="w-px bg-border" />

                {/* time list */}
                <div className="w-48 max-h-[336px] overflow-y-auto p-6 no-scrollbar">
                  <div className="grid gap-2">
                    {timeSlots.map((time) => {
                      const isStart = time === timeRange.start;
                      const isEnd = time === timeRange.end;
                      const inRange =
                        timeRange.start &&
                        timeRange.end &&
                        t2m(time) > t2m(timeRange.start) &&
                        t2m(time) < t2m(timeRange.end);

                      return (
                        <Button
                          key={time}
                          variant={
                            isStart || isEnd
                              ? "default"
                              : inRange
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() => onTimeClick(time)}
                          className={cn(
                            "w-full shadow-none",
                            inRange && rangeClass
                          )}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
