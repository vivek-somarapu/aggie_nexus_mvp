// FileUpload.tsx
"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

export function FileUpload({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      e.target.value = "";
      setFileName(null);
      onChange(null);
      return;
    }
    setFileName(file?.name ?? null);
    onChange(file);
  };

  const clearFile = () => {
    setFileName(null);
    onChange(null);
    const input = document.getElementById("poster-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Poster</label>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="poster-input"
          type="file"
          accept="image/*"
          onChange={handleInput}
          className="h-10"
        />
        <Button type="button" variant="outline" size="sm" onClick={clearFile}>
          Clear
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {fileName ? `Selected: ${fileName}` : "No file selected"}
      </p>
    </div>
  );
}
