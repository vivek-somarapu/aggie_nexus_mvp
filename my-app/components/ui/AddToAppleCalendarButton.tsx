import React from "react";

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}

function formatDate(date: Date) {
  // Format date as YYYYMMDDTHHmmssZ (UTC)
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function generateICS(event: CalendarEvent) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description || ""}\nLOCATION:${event.location || ""}\nDTSTART:${formatDate(event.start)}\nDTEND:${formatDate(event.end)}\nEND:VEVENT\nEND:VCALENDAR`;
}

export const AddToAppleCalendarButton: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const handleClick = () => {
    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Add to Apple Calendar
    </button>
  );
};
