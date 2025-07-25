"use client";

import clsx from "clsx";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useClickOutside } from "@/components/ui/use-click-outside";

const DATE_FORMAT = "MM/dd/yyyy";

/* ------------------------------------------
   ✅ Types
-------------------------------------------*/
export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

interface CalendarProps {
  allowClear?: boolean;
  compact?: boolean;
  stacked?: boolean;
  showTimeInput?: boolean;
  popoverAlignment?: "start" | "center" | "end";
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets?: {
    [key: string]: {
      text: string;
      start: Date;
      end: Date;
    };
  };
  presetIndex?: number;
  minValue?: Date;
  maxValue?: Date;
}

/* ------------------------------------------
   ✅ Calendar Component
-------------------------------------------*/
export const Calendar = ({
  allowClear = false,
  compact = false,
  stacked = false,
  showTimeInput = true,
  popoverAlignment = "start",
  value,
  onChange,
  presets,
  presetIndex,
  minValue,
  maxValue,
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const timezones = useMemo(
    () => [
      { value: "UTC", label: "UTC" },
      {
        value: Intl.DateTimeFormat().resolvedOptions().timeZone,
        label: `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`,
      },
    ],
    []
  );

  const [selectedTimezone, setSelectedTimezone] = useState(timezones[1].value);
  const [startDate, setStartDate] = useState(
    formatInTimeZone(value?.start || new Date(), selectedTimezone, DATE_FORMAT)
  );

  const [endDate, setEndDate] = useState(
    formatInTimeZone(value?.end || new Date(), selectedTimezone, DATE_FORMAT)
  );

  const [startDateError, setStartDateError] = useState(false);
  const [endDateError, setEndDateError] = useState(false);

  const calendarRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(calendarRef, () => setIsOpen(false));

  useEffect(() => {
    window.addEventListener("resize", () => setIsOpen(false));
    window.addEventListener("scroll", () => setIsOpen(false));
    return () => {
      window.removeEventListener("resize", () => setIsOpen(false));
      window.removeEventListener("scroll", () => setIsOpen(false));
    };
  }, []);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysArray: Date[] = [];
  let day = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  while (day <= endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })) {
    daysArray.push(day);
    day = addDays(day, 1);
  }

  const handleDateClick = (day: Date) => {
    if (!value?.start || (value.start && value.end)) {
      onChange({ start: startOfDay(day), end: null });
      setHoverDate(day);
      setIsSelecting(true);
    } else if (isSelecting) {
      if (day > value.start) {
        onChange({ ...value, end: endOfDay(day) });
      } else {
        onChange({ start: startOfDay(day), end: endOfDay(value.start) });
      }
      setIsSelecting(false);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleMouseEnter = (day: Date) => {
    if (value?.start && !value.end) {
      setHoverDate(day);
    }
  };

  const onApply = () => {
    // 🗓 today in our display format
    const todayStr = format(new Date(), DATE_FORMAT);

    // ----- 1.  Substitute empty fields with today -----
    let cleanedStart = startDate.trim();
    let cleanedEnd = endDate.trim();

    if (!cleanedStart) {
      cleanedStart = todayStr;
      setStartDate(todayStr); // show it in the box
    }
    if (!cleanedEnd) {
      cleanedEnd = todayStr;
      setEndDate(todayStr);
    }

    // ----- 2.  Parse & validate -----
    const parsedStartDate = parse(cleanedStart, DATE_FORMAT, new Date());
    const parsedEndDate = parse(cleanedEnd, DATE_FORMAT, new Date());

    if (
      parsedStartDate.toString() === "Invalid Date" ||
      parsedEndDate.toString() === "Invalid Date"
    ) {
      setStartDateError(parsedStartDate.toString() === "Invalid Date");
      setEndDateError(parsedEndDate.toString() === "Invalid Date");
      return;
    }

    setStartDateError(false);
    setEndDateError(false);

    // ----- 3.  Commit the range -----
    onChange({
      start: fromZonedTime(parsedStartDate, selectedTimezone),
      end: fromZonedTime(parsedEndDate, selectedTimezone),
    });

    setIsOpen(false); // optional: close the pop‑over
  };

  useEffect(() => {
    setStartDate(
      formatInTimeZone(
        value?.start || new Date(),
        selectedTimezone,
        DATE_FORMAT
      )
    );

    setEndDate(
      formatInTimeZone(value?.end || new Date(), selectedTimezone, DATE_FORMAT)
    );
  }, [isOpen, value]);

  return (
    <div className="relative w-full">
      <div className="w-full">
        <Button
          type="button"
          variant="outline"
          className={clsx("w-full justify-start gap-2")}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <CalendarIcon className="h-4 w-4 opacity-70" />
          {value?.start && value?.end
            ? `${format(value.start, "MMM d")} - ${format(value.end, "MMM d")}`
            : "Select Date Range"}
        </Button>
        {value?.start && value?.end && allowClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => onChange(null)}
          >
            ✕
          </Button>
        )}
      </div>

      {isOpen && (
        <Card
          ref={calendarRef}
          className={twMerge(
            clsx(
              "absolute top-12 z-10 p-4  w-[250px] md:w-[450px]",
              popoverAlignment === "center" && "left-1/2 -translate-x-1/2",
              popoverAlignment === "end" && "right-0"
            )
          )}
        >
          <div className="flex flex-col md:flex-row md:gap-4">
            {/* ✅ LEFT: Calendar Grid */}
            <div className="md:flex-1">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={prevMonth}
                  >
                    ‹
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={nextMonth}
                  >
                    ›
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
                <div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {daysArray.map((day) => {
                  const isStart = value?.start && isSameDay(day, value.start);
                  const isEnd = value?.end && isSameDay(day, value.end);
                  const currentHover =
                    hoverDate && isSelecting && isSameDay(day, hoverDate);
                  const isInRange =
                    value?.start &&
                    ((value.end &&
                      isWithinInterval(day, {
                        start: value.start,
                        end: value.end,
                      })) ||
                      (hoverDate &&
                        isWithinInterval(day, {
                          start: value.start,
                          end: hoverDate,
                        })));
                  const isAllowedDate =
                    (minValue ? day >= minValue : true) &&
                    (maxValue ? day <= maxValue : true);

                  return (
                    <div
                      key={day.toString()}
                      className={clsx(
                        "flex aspect-square w-full items-center justify-center text-sm cursor-pointer",

                        // Text color for days outside the current month
                        isSameMonth(day, currentDate)
                          ? "text-foreground dark:text-slate-100"
                          : "text-muted-foreground dark:text-slate-500",

                        // RANGE FILL (middle days ONLY — not start or end)
                        isInRange &&
                          !isStart &&
                          !isEnd &&
                          "bg-gray-200 text-foreground rounded-none dark:bg-slate-700/70 dark:text-slate-100",

                        // START CELL
                        isStart &&
                          "bg-primary text-primary-foreground rounded-l-md dark:bg-blue-800 dark:text-white",

                        // END CELL
                        isEnd &&
                          "bg-primary text-primary-foreground rounded-r-md dark:bg-blue-800 dark:text-white",

                        // Single-day selection (fully rounded)
                        isStart && isEnd && "rounded-md",

                        // Today outline (only if not in range)

                        isToday(day) &&
                          "rounded-md border border-gray-400 dark:border-blue-500",

                        // Hover effect
                        currentHover &&
                          "bg-primary/80 text-primary-foreground dark:bg-blue-500/70 dark:text-white",

                        // Generic hover
                        !isStart &&
                          !isEnd && [
                            "hover:rounded-md hover:border hover:border-gray-600 dark:hover:border-slate-400",
                          ]
                      )}
                      onMouseEnter={() =>
                        isAllowedDate && handleMouseEnter(day)
                      }
                      onClick={() => isAllowedDate && handleDateClick(day)}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ RIGHT: Time Inputs */}
            {showTimeInput && (
              <div className="flex flex-col space-y-2 mt-4 md:mt-0 md:w-44">
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div className="mt-1">
                    <Input
                      size="sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="MM/DD/YYYY"
                      error={startDateError}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div className="mt-1">
                    <Input
                      size="sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="MM/DD/YYYY"
                      error={endDateError}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={onApply}
                >
                  Apply
                </Button>
                <Select
                  options={timezones}
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
