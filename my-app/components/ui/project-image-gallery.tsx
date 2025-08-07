"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SquarePoster } from "@/components/ui/SquarePoster";

export interface ProjectImage {
  id: string;
  url: string;
}

interface ProjectImageGalleryProps {
  images: ProjectImage[];
}

export const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({
  images,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const openPreview = (index: number) => setSelectedImageIndex(index);
  const closePreview = () => setSelectedImageIndex(null);
  const goToNext = () => {
    if (selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % images.length;
      setSelectedImageIndex(nextIndex);
    }
  };

  const goToPrev = () => {
    if (selectedImageIndex !== null) {
      const prevIndex =
        (selectedImageIndex - 1 + images.length) % images.length;
      setSelectedImageIndex(prevIndex);
    }
  };

  if (images.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-base">Gallery</h3>

      {images.length === 1 ? (
        // ─── 1 IMAGE ────────────────────────────────
        <SquarePoster
          src={images[0].url}
          alt="Gallery image"
          className="w-full max-w-md mx-auto"
        />
      ) : images.length === 2 ? (
        // ─── 2 IMAGES ───────────────────────────────
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="cursor-pointer"
              onClick={() => openPreview(i)}
            >
              <SquarePoster
                src={img.url}
                alt={`Gallery image ${i + 1}`}
                className="max-h-[400px]"
              />
            </div>
          ))}
        </div>
      ) : (
        // ─── 3+ IMAGES (LinkedIn style) ─────────────
        <div
          className="grid grid-cols-[3fr_1fr] grid-rows-3 gap-2 w-full"
          style={{ height: 400 }}
        >
          {/* left big image */}
          <div
            className="relative row-span-3 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => openPreview(0)}
          >
            <Image
              src={images[0].url}
              alt="Main"
              fill
              className="object-cover rounded-lg"
            />
          </div>

          {/* right column */}
          <div className="flex flex-col gap-2 row-span-3">
            {images.slice(1, 4).map((img, idx) => (
              <div
                key={img.id}
                className="relative flex-1 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => openPreview(idx + 1)}
              >
                <Image
                  src={img.url}
                  alt={`Gallery image ${idx + 2}`}
                  fill
                  className="object-cover rounded-lg"
                />

                {idx === 2 && images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg" />
                    <span className="relative z-10 text-white font-semibold text-lg">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          {/* Wrapper that centers the image and constrains its size */}
          <div
            className="relative h-[80vh] max-w-[90vw] aspect-[4/5]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Container with relative positioning for buttons */}
            <div className="relative w-full h-full">
              <Image
                src={images[selectedImageIndex].url}
                alt={`Preview ${selectedImageIndex + 1}`}
                fill
                className="object-contain w-full h-full rounded-lg shadow-lg"
              />

              {/* Close button */}
              <Button
                type="button"
                onClick={closePreview}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-10 w-10 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50"
                aria-label="Close preview"
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    type="button"
                    onClick={goToPrev}
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    type="button"
                    onClick={goToNext}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export interface PendingFile {
  id?: string;
  file: File | null;
  preview: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  errorMessage?: string;
}

interface Props {
  pendingFiles: PendingFile[];
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
  onRemoveImage: (file: PendingFile) => void;
}

export default function ProjectGalleryUploader({
  pendingFiles,
  setPendingFiles,
  onRemoveImage,
}: Props) {
  const [anyUploading, setAnyUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isDraggingNewFiles, setIsDraggingNewFiles] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: PendingFile[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "uploading",
      }));

      const availableSlots = 10 - pendingFiles.length;
      const filesToAdd = newFiles.slice(0, availableSlots);
      if (filesToAdd.length === 0) return;

      setPendingFiles((prev) => [...prev, ...filesToAdd]);
      setAnyUploading(true);

      filesToAdd.forEach((file) => {
        setTimeout(() => {
          setPendingFiles((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((f) => f === file);
            if (index !== -1) {
              updated[index] = { ...updated[index], status: "uploaded" };
            }
            if (!updated.some((f) => f.status === "uploading")) {
              setAnyUploading(false);
            }
            return updated;
          });
        }, 2000 + Math.random() * 1000);
      });
    },
    [pendingFiles.length]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
    processFiles(e.target.files);

  const handleDragOverNewFiles = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!anyUploading && pendingFiles.length < 10)
        setIsDraggingNewFiles(true);
    },
    [anyUploading, pendingFiles.length]
  );

  const handleDragLeaveNewFiles = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingNewFiles(false);
    },
    []
  );

  const handleDropNewFiles = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingNewFiles(false);
      if (!anyUploading && pendingFiles.length < 10)
        processFiles(e.dataTransfer.files);
    },
    [anyUploading, pendingFiles.length, processFiles]
  );

  const openImagePreview = useCallback(
    (index: number) => setSelectedImageIndex(index),
    []
  );
  const closeImagePreview = useCallback(() => setSelectedImageIndex(null), []);
  const goToNextImage = useCallback(() => {
    if (selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % pendingFiles.length;
      setSelectedImageIndex(nextIndex);
    }
  }, [selectedImageIndex, pendingFiles.length]);

  const goToPrevImage = useCallback(() => {
    if (selectedImageIndex !== null) {
      const prevIndex =
        (selectedImageIndex - 1 + pendingFiles.length) % pendingFiles.length;
      setSelectedImageIndex(prevIndex);
    }
  }, [selectedImageIndex, pendingFiles.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        if (e.key === "Escape") closeImagePreview();
        else if (e.key === "ArrowRight") goToNextImage();
        else if (e.key === "ArrowLeft") goToPrevImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, closeImagePreview, goToNextImage, goToPrevImage]);

  const currentPreviewImage =
    selectedImageIndex !== null ? pendingFiles[selectedImageIndex] : null;

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItem.current = index;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => e.currentTarget.classList.add("opacity-50"), 0);
    },
    []
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      dragOverItem.current = index;
      e.currentTarget.classList.add("border-primary");
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("opacity-50");
    if (dragOverItem.current !== null) {
      const elements = document.querySelectorAll('.group[draggable="true"]');
      elements[dragOverItem.current]?.classList.remove(
        "border-primary",
        "ring-2",
        "ring-primary",
        "ring-offset-2"
      );
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove(
        "border-primary",
        "ring-2",
        "ring-primary",
        "ring-offset-2"
      );
      if (dragItem.current === null || dragItem.current === dropIndex) return;

      setPendingFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        const [draggedFile] = newFiles.splice(dragItem.current!, 1);
        newFiles.splice(dropIndex, 0, draggedFile);

        if (selectedImageIndex !== null) {
          let newSelectedIndex = selectedImageIndex;
          if (selectedImageIndex === dragItem.current)
            newSelectedIndex = dropIndex;
          else if (
            selectedImageIndex > dragItem.current &&
            selectedImageIndex <= dropIndex
          )
            newSelectedIndex--;
          else if (
            selectedImageIndex < dragItem.current &&
            selectedImageIndex >= dropIndex
          )
            newSelectedIndex++;
          setSelectedImageIndex(newSelectedIndex);
        }

        return newFiles;
      });
      dragItem.current = null;
      dragOverItem.current = null;
    },
    [selectedImageIndex]
  );

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center">
        {pendingFiles.map((f, i) => (
          <div
            key={f.id}
            className={cn(
              "relative group h-24 w-24 rounded-lg border border-gray-200 shadow-sm",
              f.status === "uploaded" ? "cursor-grab" : "cursor-not-allowed",
              dragItem.current === i ? "opacity-50" : "",
              dragOverItem.current === i && dragItem.current !== i
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : ""
            )}
            draggable={f.status === "uploaded"}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragEnter={(e) => handleDragEnter(e, i)}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
          >
            <div
              className="relative h-full w-full rounded-lg overflow-hidden"
              onClick={() => openImagePreview(i)}
            >
              <Image
                src={f.preview || "/placeholder.svg"}
                alt={`Project image ${i + 1}`}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            {f.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {f.status !== "uploading" && (
              <Button
                onClick={() => onRemoveImage(pendingFiles[i])}
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {pendingFiles.length < 10 && (
          <label
            htmlFor="file-upload"
            className={cn(
              // fixed size + flex
              "h-24 w-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
              // light-mode defaults
              "bg-gray-50 text-gray-500 border-gray-300 hover:border-primary hover:text-primary",
              // dark-mode overrides
              "dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:border-primary dark:hover:text-primary",
              // disabled state
              (anyUploading || pendingFiles.length >= 10) &&
                "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600",
              // drag-over state
              isDraggingNewFiles &&
                "border-primary ring-2 ring-primary ring-offset-2"
            )}
            onDragOver={handleDragOverNewFiles}
            onDragLeave={handleDragLeaveNewFiles}
            onDrop={handleDropNewFiles}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1">Add Photo</span>
            <input
              id="file-upload"
              type="file"
              multiple
              disabled={anyUploading || pendingFiles.length >= 10}
              onChange={handleFileSelect}
              className="sr-only"
            />
          </label>
        )}
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        {pendingFiles.length} / 10 photos uploaded
      </div>
      {selectedImageIndex !== null && currentPreviewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={closeImagePreview}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          {/* Click-safe container */}
          <div
            className="relative max-w-[90vw] h-[80vh] aspect-[4/5]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner container with buttons positioned relative to image */}
            <div className="relative w-full h-full">
              <Image
                src={currentPreviewImage.preview || "/placeholder.svg"}
                alt={`Preview of project image ${selectedImageIndex + 1}`}
                fill
                className="object-contain w-full h-full rounded-lg shadow-lg"
              />

              {/* Close Button */}
              <Button
                type="button"
                onClick={closeImagePreview}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-10 w-10 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50 transition-colors"
                aria-label="Close image preview"
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation */}
              {pendingFiles.length > 1 && (
                <>
                  <Button
                    type="button"
                    onClick={goToPrevImage}
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    type="button"
                    onClick={goToNextImage}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:text-white hover:bg-black/50 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
