// Pluggable email service for the AggieX Accelerator platform.
//
// To wire up a real provider:
//   1. Install the SDK: `npm install resend` (or `@sendgrid/mail`)
//   2. Add the API key to .env.local: RESEND_API_KEY=re_...
//   3. Replace StubEmailService below with a concrete implementation.
//
// All call sites import `emailService` and call `emailService.send()`.
// Swapping providers only requires changing this file.

import { Resend } from 'resend';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'AggieX <noreply@aggiex.org>';

class ResendEmailService implements EmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text && { text: message.text }),
      ...(message.replyTo && { replyTo: message.replyTo }),
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}

export const emailService: EmailService = new ResendEmailService();

// ============================================================
// EMAIL TEMPLATES
// Each template returns an EmailMessage ready to pass to
// emailService.send(). Subject lines match the program tone:
// direct, no filler.
// ============================================================

export function buildWeekUnlockedEmail(options: {
  recipientName: string;
  recipientEmail: string;
  weekNumber: number;
  weekTheme: string;
  platformUrl: string;
}): EmailMessage {
  const { recipientName, recipientEmail, weekNumber, weekTheme, platformUrl } = options;

  return {
    to: recipientEmail,
    subject: `Week ${weekNumber} is live — ${weekTheme}`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>Week ${weekNumber} of AggieX Summer 2026 is now open.</p>
      <p><strong>Theme:</strong> ${weekTheme}</p>
      <p>Your deliverables and curriculum files for this week are now accessible.</p>
      <p><a href="${platformUrl}/accelerator/dashboard">Open the platform</a></p>
    `.trim(),
    text: `Hi ${recipientName},\n\nWeek ${weekNumber} (${weekTheme}) is now live. Log in to see your deliverables.\n\n${platformUrl}/accelerator/dashboard`,
  };
}

export function buildSubmissionStatusEmail(options: {
  recipientName: string;
  recipientEmail: string;
  deliverableTitle: string;
  newStatus: string;
  comments?: string;
  platformUrl: string;
}): EmailMessage {
  const { recipientName, recipientEmail, deliverableTitle, newStatus, comments, platformUrl } = options;

  const statusLabel = newStatus === 'approved' ? 'approved' : 'flagged for revision';
  const subject = newStatus === 'approved'
    ? `Approved: ${deliverableTitle}`
    : `Needs revision: ${deliverableTitle}`;

  return {
    to: recipientEmail,
    subject,
    html: `
      <p>Hi ${recipientName},</p>
      <p>Your submission for <strong>${deliverableTitle}</strong> has been ${statusLabel}.</p>
      ${comments ? `<p><strong>Reviewer note:</strong> ${comments}</p>` : ''}
      <p><a href="${platformUrl}/accelerator/dashboard">View in the platform</a></p>
    `.trim(),
    text: `Hi ${recipientName},\n\n${deliverableTitle} has been ${statusLabel}.\n${comments ? `\nNote: ${comments}\n` : ''}\n${platformUrl}/accelerator/dashboard`,
  };
}

export function buildMentorAssignmentEmail(options: {
  mentorName: string;
  mentorEmail: string;
  teamName: string;
  tier: string;
  assignedWeeks: number[] | null;
  platformUrl: string;
}): EmailMessage {
  const { mentorName, mentorEmail, teamName, tier, assignedWeeks, platformUrl } = options;

  const weekNote = assignedWeeks
    ? `Weeks ${assignedWeeks.join(', ')}`
    : 'Full 10-week program';

  return {
    to: mentorEmail,
    subject: `Mentor assignment: ${teamName}`,
    html: `
      <p>Hi ${mentorName},</p>
      <p>You have been assigned as a <strong>${tier} mentor</strong> to <strong>${teamName}</strong>.</p>
      <p><strong>Commitment:</strong> ${weekNote}</p>
      <p>You can now view this team's profile, submissions, and traction data in the platform.</p>
      <p><a href="${platformUrl}/accelerator/dashboard">Open the platform</a></p>
    `.trim(),
    text: `Hi ${mentorName},\n\nYou are now a ${tier} mentor for ${teamName} (${weekNote}).\n\n${platformUrl}/accelerator/dashboard`,
  };
}

export function buildCrucibleOutcomeEmail(options: {
  recipientName: string;
  recipientEmail: string;
  teamName: string;
  outcome: 'accelerate' | 'refine' | 'restructure';
  platformUrl: string;
}): EmailMessage {
  const { recipientName, recipientEmail, teamName, outcome, platformUrl } = options;

  const outcomeMessages: Record<string, string> = {
    accelerate: 'Your team has been cleared to advance with full continued funding.',
    refine: 'Your team advances with a corrective mandate. Review the feedback and update your Week 5 plan.',
    restructure: 'Your team has been placed on a 72-hour resubmission window. Funding is paused pending review.',
  };

  return {
    to: recipientEmail,
    subject: `Crucible result for ${teamName}: ${outcome.toUpperCase()}`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>The Crucible panel has completed their review of <strong>${teamName}</strong>.</p>
      <p><strong>Outcome: ${outcome.toUpperCase()}</strong></p>
      <p>${outcomeMessages[outcome]}</p>
      <p><a href="${platformUrl}/accelerator/dashboard">View full feedback in the platform</a></p>
    `.trim(),
    text: `Hi ${recipientName},\n\nCrucible outcome for ${teamName}: ${outcome.toUpperCase()}\n\n${outcomeMessages[outcome]}\n\n${platformUrl}/accelerator/dashboard`,
  };
}

export function buildAccelInviteEmail(options: {
  recipientName: string;
  recipientEmail: string;
  inviterName: string;
  role: string;
  teamName?: string;
  inviteUrl: string;
  platformUrl: string;
}): EmailMessage {
  const { recipientName, recipientEmail, inviterName, role, teamName, inviteUrl, platformUrl } = options;

  const roleLabel =
    role === 'founder' ? 'Founder'
    : role === 'mentor' ? 'Mentor'
    : role === 'mce_staff' ? 'MCE Staff'
    : 'AggieX Team';

  const teamLine = teamName ? `<p><strong>Team:</strong> ${teamName}</p>` : '';
  const teamText = teamName ? `Team: ${teamName}\n` : '';

  return {
    to: recipientEmail,
    subject: `You're invited to AggieX Summer 2026`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>${inviterName} has invited you to the AggieX Summer 2026 platform as a <strong>${roleLabel}</strong>.</p>
      ${teamLine}
      <p>Click the link below to accept your invitation and set up your account. This link expires in 24 hours.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#f5f5f5;color:#111;border-radius:6px;text-decoration:none;font-weight:600;">Accept invitation</a></p>
      <p style="color:#999;font-size:12px;">After accepting, you'll complete a short intake form before gaining access to the platform.<br>${platformUrl}/accelerator</p>
    `.trim(),
    text: `Hi ${recipientName},\n\n${inviterName} invited you to AggieX Summer 2026 as ${roleLabel}.\n${teamText}\nAccept your invitation: ${inviteUrl}\n\nAfter accepting, you'll complete a short intake form.\n\n${platformUrl}/accelerator`,
  };
}

export function buildDailyReportReminderEmail(options: {
  recipientName: string;
  recipientEmail: string;
  teamName: string;
  platformUrl: string;
}): EmailMessage {
  const { recipientName, recipientEmail, teamName, platformUrl } = options;

  return {
    to: recipientEmail,
    subject: `Daily report due — ${teamName}`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>Your daily report for today has not been submitted yet.</p>
      <p>Log one win and one blocker before 6:00 PM CT.</p>
      <p><a href="${platformUrl}/accelerator/dashboard">Submit your report</a></p>
    `.trim(),
    text: `Hi ${recipientName},\n\nYour daily report for ${teamName} is due by 6:00 PM CT today.\n\n${platformUrl}/accelerator/dashboard`,
  };
}
