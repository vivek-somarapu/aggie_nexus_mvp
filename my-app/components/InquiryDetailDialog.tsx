"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InquiryDetail from "./InquiryDetail";
import { Button } from "@/components/ui/button";
import { inquiryService, ProjectInquiry } from "@/lib/services/inquiry-service";

interface InquiryDetailDialogProps {
  inquiry: ProjectInquiry | null;
  open: boolean;
  onCloseAction: () => void;
}

export default function InquiryDetailDialog({ inquiry, open, onCloseAction }: InquiryDetailDialogProps) {
  // Mark inquiry as read when popup opens
  useEffect(() => {
    if (!open || !inquiry || inquiry.read_inquiry) return;
    
    console.log('Marking inquiry as read:', inquiry.id, 'read_inquiry status:', inquiry.read_inquiry);
    
    // Mark as read
    fetch(`/api/inquiries/${inquiry.id}/mark-read`, { method: 'POST' })
      .then(res => {
        console.log('Mark-read API response:', res.status, res.ok);
        if (res.ok) {
          // Dispatch custom event to notify navbar to update badge count
          console.log('Dispatching inquiryMarkedAsRead event');
          window.dispatchEvent(new CustomEvent('inquiryMarkedAsRead'));
        }
      })
      .catch(err => console.error('Error marking inquiry as read:', err));
  }, [open, inquiry]);

  if (!inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inquiry Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <InquiryDetail
            inquirer={{
              id: inquiry.user_id || "",
              name: inquiry.applicant_name || "Unknown",
              email: inquiry.applicant_email || "",
              bio: inquiry.applicant_bio || "",
              avatarUrl: inquiry.applicant_avatar || undefined,
            }}
            preferredContact={inquiry.preferred_contact || "Not specified"}
            message={inquiry.note || ""}
          />
        </div>
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={onCloseAction}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
