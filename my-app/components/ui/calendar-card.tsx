"use client";

import type React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: number;
  title: string;
  time?: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Sample events for different months
  const events: { [key: string]: Event[] } = {
    "2025-6-28": [
      { id: 1, title: "(No title)" },
      { id: 2, title: "(No title)" },
      { id: 3, title: "(No title)" },
      { id: 4, title: "title" },
      { id: 5, title: "2pm Houston Robotics Group Meeting", time: "2pm" },
    ],
    "2025-7-15": [
      { id: 6, title: "Team Meeting" },
      { id: 7, title: "Project Review" },
      { id: 8, title: "Client Call" },
    ],
    "2025-5-10": [
      { id: 9, title: "Conference" },
      { id: 10, title: "Workshop" },
    ],
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add days from previous month to fill the first week
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0);
    const daysInPrevMonth = prevMonthLastDay.getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        month: monthNames[prevMonth].slice(0, 3),
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day),
        month: monthNames[currentMonth].slice(0, 3),
      });
    }

    // Add days from next month to fill the last week
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const remainingDays = 42 - days.length; // 6 weeks * 7 days

    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day),
        month: monthNames[nextMonth].slice(0, 3),
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getEventsForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    return events[dateKey] || [];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleMoreEventsClick = (date: Date, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement)
      .closest(".calendar-cell")
      ?.getBoundingClientRect();
    if (rect) {
      setModalPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const closeModal = () => {
    setShowEventModal(false);
    setSelectedDate(null);
    setModalPosition(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("prev")}
            className="hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("next")}
            className="hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-gray-300">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-300 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((dayInfo, index) => {
          const dayEvents = getEventsForDate(dayInfo.date);
          const isSelectedToday = isToday(dayInfo.date);

          return (
            <div
              key={index}
              className="calendar-cell min-h-[120px] border-r border-b border-gray-300 last:border-r-0 p-2 bg-white"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isSelectedToday
                        ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        : dayInfo.isCurrentMonth
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {!dayInfo.isCurrentMonth && dayInfo.day === 1
                      ? `${dayInfo.month} 1`
                      : dayInfo.day}
                  </span>
                </div>

                {/* Events */}
                <div className="flex-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-sm truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <button
                      onClick={(e) => handleMoreEventsClick(dayInfo.date, e)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {dayEvents.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Modal */}
      {showEventModal && selectedDate && modalPosition && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={closeModal}
          />
          <div
            className="absolute bg-white rounded-lg shadow-2xl max-w-sm w-80 z-50 border border-gray-200"
            style={{
              top: modalPosition.top,
              left: Math.min(modalPosition.left, window.innerWidth - 320 - 20),
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">
                    {selectedDate
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .toUpperCase()}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedDate.getDate()}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center hover:bg-gray-50"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="bg-blue-500 text-white px-4 py-3 rounded-lg"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
