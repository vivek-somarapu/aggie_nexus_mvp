"use client";

import { useState, useEffect } from "react";

export interface Tag {
  id: string;
  label: string;
  color?: string;
}

interface UseTagsProps {
  /** Initial set of tags */
  defaultTags?: Tag[];
  /** Callback fired on any change */
  onChange?: (tags: Tag[]) => void;
  /** Maximum allowed tags */
  maxTags?: number;
  /** Fallback color palette */
  defaultColors?: string[];
}

export function useTags({
  defaultTags = [],
  onChange,
  maxTags = 10,
  defaultColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ],
}: UseTagsProps = {}) {
  const [tags, setTags] = useState<Tag[]>(defaultTags);

  /* fire initial change once */
  useEffect(() => {
    onChange?.(defaultTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addTag(tag: Tag) {
    if (tags.length >= maxTags || tags.some((t) => t.id === tag.id)) return;

    const newTags = [
      ...tags,
      {
        ...tag,
        color: tag.color || defaultColors[tags.length % defaultColors.length],
      },
    ];
    setTags(newTags);
    onChange?.(newTags);
  }

  function removeTag(tagId: string) {
    const newTags = tags.filter((t) => t.id !== tagId);
    setTags(newTags);
    onChange?.(newTags);
  }

  function removeLastTag() {
    if (tags.length === 0) return;
    removeTag(tags[tags.length - 1].id);
  }

  return {
    tags,
    setTags,
    addTag,
    removeTag,
    removeLastTag,
    hasReachedMax: tags.length >= maxTags,
  };
}
