"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface IndustryBadgesProps {
  items: string[];
  className?: string;
  gapPx?: number; 
  badgeClassName?: string;
  defaultVariant?: "default" | "secondary" | "destructive" | "outline";
  variantMap?: Record<string, "default" | "secondary" | "destructive" | "outline">;
}

export function IndustryBadges({
  items,
  className,
  gapPx = 8,
  badgeClassName = "text-xs",
  defaultVariant = "secondary",
  variantMap,
}: IndustryBadgesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  // shorten stem bc overflow
  const formatLabel = (s: string) => {
    const normalized = s.replace(/\s+/g, " ").trim().toLowerCase();
    if (
      normalized === "science, technology, engineering & mathematics" ||
      normalized === "science, technology, engineering and mathematics" ||
      normalized === "science technology engineering & mathematics" ||
      normalized === "science technology engineering and mathematics"
    ) {
      return "STEM";
    }
    return s;
  };

  const getVariantFor = (item: string) => {
    // look up by original item first, then by formatted label, then fall back to defaultVariant
    if (variantMap) {
      if (variantMap[item]) return variantMap[item];
      const formatted = formatLabel(item);
      if (variantMap[formatted]) return variantMap[formatted];
    }
    return defaultVariant;
  };

  const measure = () => {
    const container = containerRef.current;
    const measureEl = measureRef.current;
    if (!container || !measureEl) return;

    const containerWidth = Math.max(0, container.clientWidth - 2);
    const spans = Array.from(measureEl.children) as HTMLElement[];
    const widths = spans.map((s) => s.offsetWidth);
    const plusWidth = widths.length ? widths[widths.length - 1] : 0;

    let sum = 0;
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      const w = widths[i];
      const nextSum = sum + w + (count > 0 ? gapPx : 0);
      const remaining = items.length - (i + 1);
      const needPlus = remaining > 0;
      const requiredSpace = needPlus ? plusWidth : 0;
      if (nextSum + requiredSpace <= containerWidth) {
        sum = nextSum;
        count++;
      } else {
        break;
      }
    }
    setVisibleCount(count);
  };

  useLayoutEffect(() => {
    measure();
  }, [items]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items]);

  const remaining = Math.max(0, items.length - visibleCount);
  // if only one and long do ... instead of +1
  const singleLongAndClipped = items.length === 1 && visibleCount === 0;

  return (
    <>
      <div ref={containerRef} className={className}>
        <div className="flex gap-2 flex-nowrap overflow-hidden">
          {items.slice(0, visibleCount).map((ind, i) => (
            <Badge
              key={ind + "-" + i}
              variant={getVariantFor(ind)}
              className={badgeClassName}
            >
              {formatLabel(ind)}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant={defaultVariant} className={badgeClassName}>
              +{remaining}
            </Badge>
          )}
          {singleLongAndClipped && (
            <Badge variant={getVariantFor(items[0])} className={badgeClassName}>
              {formatLabel(items[0])}
            </Badge>
          )}
        </div>
      </div>

      <div
        ref={measureRef}
        aria-hidden
        className="absolute invisible pointer-events-none h-0 overflow-hidden whitespace-nowrap"
      >
        {items.map((ind, i) => (
          <Badge key={`m-${ind}-${i}`} variant={getVariantFor(ind)} className={badgeClassName}>
            {formatLabel(ind)}
          </Badge>
        ))}
        <Badge variant={defaultVariant} className={badgeClassName}>
          +99 more
        </Badge>
      </div>
    </>
  );
}