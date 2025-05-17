"use client";

import type React from "react";
import { useRef, useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { useTags } from "@/components/hooks/use-tags";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TagSelectorProps {
  label?: string;
  options: string[]; // Available options
  selected: string[]; // Initial selected values
  onChange: (selected: string[]) => void;
  className?: string;
  maxTags?: number;
  placeholder?: string;
}

export function TagSelector({
  label = "Tags",
  options,
  selected,
  onChange,
  className,
  maxTags = 10,
  placeholder = "Type and press Enter",
}: TagSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  const initialTags = selected.map((item) => ({ id: item, label: item }));

  const { tags, addTag, removeTag } = useTags({
    defaultTags: initialTags,
    onChange: (newTags) => {
      const selectedLabels = newTags.map((tag) => tag.label);
      onChange(selectedLabels);
    },
  });

  useEffect(() => {
    setAvailableOptions(
      options.filter((item) => !tags.some((tag) => tag.label === item))
    );
  }, [options, tags]);

  const handleTagSelect = (tag: string) => {
    if (tags.length >= maxTags) return;
    addTag({ id: tag, label: tag });
    setCustomInput("");
  };

  const handleTagRemove = (id: string) => {
    removeTag(id);
  };

  const handleCustomAdd = () => {
    const trimmed = customInput.trim();
    if (
      trimmed &&
      !tags.some((tag) => tag.label.toLowerCase() === trimmed.toLowerCase())
    ) {
      handleTagSelect(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomAdd();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2 items-end mt-4">
        <div
          className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[48px] focus-within:ring-2 focus-within:ring-ring"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              className="flex items-center px-2 py-1 gap-1 cursor-pointer"
              variant="outline"
              onClick={() => handleTagRemove(tag.id)}
            >
              {tag.label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          <input
            ref={inputRef}
            className="flex-grow outline-none bg-transparent text-sm"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        </div>

        <Button
          type="button"
          onClick={handleCustomAdd}
          disabled={!customInput.trim() || tags.length >= maxTags}
        >
          <Plus />
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">
          {tags.length >= maxTags
            ? `Limit of ${maxTags} exceeded`
            : `Choose from ${label.toLowerCase()}`}
        </p>

        <div className="flex flex-wrap">
          {availableOptions.map((item) => (
            <Badge
              key={item}
              className="m-1 px-2 py-1 cursor-pointer hover:bg-muted"
              variant="outline"
              onClick={() => handleTagSelect(item)}
            >
              <span>{item}</span>
              <Plus className="w-3 h-3 ml-2" />
            </Badge>
          ))}
        </div>
      </div>

      {availableOptions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          All {label.toLowerCase()} selected
        </p>
      )}
    </div>
  );
}
