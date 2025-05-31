"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Upload, Eye, FileText, File } from "lucide-react";
import { useId } from "react";

interface ResumeInputProps {
  label?: string;
  value?: string | null;
  onChange?: (file: File | null) => void;
  onDelete?: () => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    uploadedAt?: Date;
  };
}

const ResumeInput = React.forwardRef<HTMLInputElement, ResumeInputProps>(
  (
    {
      label = "Resume",
      value,
      onChange,
      onDelete,
      accept = ".pdf,.doc,.docx",
      className,
      disabled = false,
      fileInfo,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      onChange?.(file);
    };

    const handleDelete = () => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onDelete?.();
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        onChange?.(file);
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (
        Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
      );
    };

    const getFileIcon = (type?: string) => {
      if (type?.includes("pdf"))
        return <FileText className="h-5 w-5 text-red-500" />;
      return <File className="h-5 w-5 text-blue-500" />;
    };

    const getFileName = (url: string) => {
      try {
        return fileInfo?.name || url.split("/").pop() || "Resume";
      } catch {
        return "Resume";
      }
    };

    const isPDF = (url: string) => {
      return (
        url.toLowerCase().includes(".pdf") || fileInfo?.type?.includes("pdf")
      );
    };

    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>

        {value ? (
          <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background to-muted/20 p-3 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(fileInfo?.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="font-medium text-foreground truncate">
                      {getFileName(value)}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {fileInfo?.size && (
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(fileInfo.size)}
                        </Badge>
                      )}
                      {fileInfo?.type && (
                        <Badge variant="outline" className="text-xs">
                          {fileInfo.type.split("/")[1]?.toUpperCase() || "FILE"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {fileInfo?.uploadedAt && (
                    <p className="text-xs text-muted-foreground">
                      Uploaded {fileInfo.uploadedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                {isPDF(value) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={disabled}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Resume Preview</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1">
                        <iframe
                          src={value}
                          className="w-full h-full border-0 rounded-lg"
                          title="Resume Preview"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={disabled}
                >
                  <a href={value} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={handleDelete}
                  disabled={disabled}
                  aria-label="Remove resume"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative group cursor-pointer transition-all duration-200",
              "border-2 border-dashed rounded-xl p-4",
              "bg-gradient-to-br from-background to-muted/10",
              "hover:from-muted/20 hover:to-muted/30",
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-muted-foreground/40",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Input
              ref={ref || inputRef}
              id={id}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              {...props}
            />

            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200",
                  "bg-gradient-to-br from-primary/10 to-primary/20",
                  "group-hover:from-primary/20 group-hover:to-primary/30",
                  isDragOver && "scale-110 from-primary/30 to-primary/40"
                )}
              >
                <Upload
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isDragOver
                      ? "text-primary scale-110"
                      : "text-primary/70 group-hover:text-primary"
                  )}
                />
              </div>

              <div className="space-y-1">
                <h3 className="font-medium text-foreground">
                  {isDragOver ? "Drop your resume here" : "Upload your resume"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ResumeInput.displayName = "ResumeInput";

export { ResumeInput };
