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

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFileName(null);
      onChange(null);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      e.target.value = "";
      setFileName(null);
      onChange(null);
      alert("Please select an image file (JPG, PNG) or a single-page PDF.");
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      e.target.value = "";
      setFileName(null);
      onChange(null);
      alert("File size must be less than 5MB.");
      return;
    }

    // For PDFs, check if it's single-page
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = new Uint8Array(arrayBuffer);
        
        // Simple check for PDF page count by counting "endobj" occurrences
        // This is a basic check - for more accurate results, you'd need a PDF parsing library
        const pdfText = new TextDecoder().decode(pdf);
        const pageCount = (pdfText.match(/endobj/g) || []).length;
        
        if (pageCount > 1) {
          e.target.value = "";
          setFileName(null);
          onChange(null);
          alert("Please select a single-page PDF only.");
          return;
        }
      } catch (error) {
        console.error("Error checking PDF:", error);
        e.target.value = "";
        setFileName(null);
        onChange(null);
        alert("Error reading PDF file. Please try again.");
        return;
      }
    }

    setFileName(file.name);
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
        <label className="text-sm font-medium">Poster/File</label>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="poster-input"
          type="file"
          accept="image/*,.pdf,application/pdf,.jpg,.jpeg,.png"
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
      <p className="text-xs text-muted-foreground">
        Accepted: JPG, PNG images or single-page PDF (max 5MB)
      </p>
    </div>
  );
}
