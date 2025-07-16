"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Exact prefix search function - only matches items that start with the query
const exactPrefixSearch = (query: string, items: string[]): string[] => {
  if (!query.trim()) return items;
  
  const searchQuery = query.toLowerCase();
  
  return items
    .filter(item => item.toLowerCase().startsWith(searchQuery))
    .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
};

interface TagSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function TagSelector({
  label,
  options,
  selected,
  onChange,
  maxTags = 10,
  placeholder = "Type to search and press Enter",
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on exact prefix search and exclude already selected
  const filteredOptions = exactPrefixSearch(inputValue, options)
    .filter(option => !selected.includes(option))
    .slice(0, 15); // Limit to 15 results for better UX

  // Show dropdown when input is focused and there are filtered options or input has content
  useEffect(() => {
    if (inputValue.length > 0) {
      setShowDropdown(filteredOptions.length > 0 || inputValue.trim().length > 0);
    }
    setHighlightedIndex(0);
  }, [inputValue, filteredOptions.length]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (showDropdown && filteredOptions.length > 0 && highlightedIndex < filteredOptions.length) {
        // Select highlighted option from filtered results
        const selectedOption = filteredOptions[highlightedIndex];
        selectTag(selectedOption);
      } else if (inputValue.trim() && !options.includes(inputValue.trim()) && !selected.includes(inputValue.trim())) {
        // Add custom tag if it doesn't exist in options and isn't already selected
        selectTag(inputValue.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIndex = filteredOptions.length + (inputValue.trim() && !options.includes(inputValue.trim()) ? 1 : 0) - 1;
      setHighlightedIndex(prev => prev < maxIndex ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const maxIndex = filteredOptions.length + (inputValue.trim() && !options.includes(inputValue.trim()) ? 1 : 0) - 1;
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
      // Remove last selected tag when backspacing on empty input
      removeTag(selected[selected.length - 1]);
    }
  };

  const selectTag = (tag: string) => {
    if (selected.length >= maxTags) return;
    
    if (!selected.includes(tag)) {
      onChange([...selected, tag]);
    }
    setInputValue("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selected.filter(tag => tag !== tagToRemove));
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Selected tags display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={selected.length >= maxTags ? "Maximum tags reached" : placeholder}
          disabled={selected.length >= maxTags}
          className="w-full"
        />

        {/* Dropdown menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => selectTag(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selected.includes(option) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </button>
            ))}
            
            {/* Show option to add custom tag if input doesn't match any option */}
            {inputValue.trim() && 
             !options.includes(inputValue.trim()) && 
             !selected.includes(inputValue.trim()) && (
              <button
                type="button"
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-t ${
                  highlightedIndex === filteredOptions.length ? 'bg-gray-100' : ''
                }`}
                onClick={() => selectTag(inputValue.trim())}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
              >
                <span className="text-black-600">Add "{inputValue.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="text-sm text-muted-foreground">
        Type to search and select options
      </div>
    </div>
  );
}