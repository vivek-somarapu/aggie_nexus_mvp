"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  placeholderText?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

export function DatePicker({
  selected,
  onSelect,
  placeholderText = "Pick a date",
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : placeholderText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          initialFocus
          disabled={(date) => {
            const isMinDateDisabled = minDate ? date < minDate : false
            const isMaxDateDisabled = maxDate ? date > maxDate : false
            return isMinDateDisabled || isMaxDateDisabled
          }}
        />
      </PopoverContent>
    </Popover>
  )
} 