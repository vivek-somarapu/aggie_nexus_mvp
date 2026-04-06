/**
 * AggieX Easter Egg Hunt 2026
 * Shared claim form used by all three egg landing pages.
 * Visual styling is injected via props so each tier keeps its own palette.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

'use client';

import { useState, type FormEvent } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CLAIM_API_ENDPOINT = '/api/claim-egg';

const SUCCESS_MESSAGES = {
  common: "You're in! 🎉 Check your email — we'll send your event confirmation shortly.",
  epic: 'Your consultation is booked! 🚀 Expect an email from the AggieX team within 24 hours.',
  legendary: "You're a legend. 👑 We'll reach out about your merch selection within 24 hours.",
} as const;

const SUBMIT_LABELS = {
  common: 'Claim My Spot →',
  epic: 'Book My Consultation →',
  legendary: '👑 Claim My Merch',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type EggTier = 'common' | 'epic' | 'legendary';

export interface ClaimFormStyles {
  cardBackground: string;
  labelColor: string;
  inputBackground: string;
  inputBorder: string;
  inputColor: string;
  inputFocusBorder: string;
  buttonBackground: string;
  buttonColor: string;
  buttonStyle?: React.CSSProperties;
  successBackground: string;
  successColor: string;
}

interface ClaimFormProps {
  token: string;
  tier: EggTier;
  styles: ClaimFormStyles;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClaimForm({ token, tier, styles }: ClaimFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [foundAt, setFoundAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(CLAIM_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: email.trim(),
          self_reported_found_at: foundAt || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(resolveErrorMessage(result.error));
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        style={{
          background: styles.successBackground,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: styles.successColor,
          fontSize: '17px',
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        {SUCCESS_MESSAGES[tier]}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: styles.cardBackground,
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <FormField
        id="claim-name"
        label="Full Name"
        type="text"
        value={name}
        onChange={setName}
        required
        styles={styles}
      />
      <FormField
        id="claim-email"
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        required
        styles={styles}
      />
      <FormField
        id="claim-found-at"
        label="When did you find this egg? (optional)"
        type="datetime-local"
        value={foundAt}
        onChange={setFoundAt}
        required={false}
        styles={styles}
      />

      {errorMessage && (
        <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: styles.buttonBackground,
          color: styles.buttonColor,
          border: 'none',
          borderRadius: '10px',
          padding: '14px 24px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          transition: 'opacity 0.2s',
          ...styles.buttonStyle,
        }}
      >
        {isSubmitting ? 'Submitting…' : SUBMIT_LABELS[tier]}
      </button>
    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveErrorMessage(errorCode: string | undefined): string {
  if (errorCode === 'claimed') {
    return 'This egg has already been claimed by someone else.';
  }
  if (errorCode === 'invalid') {
    return "This token doesn't appear to be valid.";
  }
  return 'Something went wrong. Please try again.';
}

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
  styles: ClaimFormStyles;
}

function FormField({ id, label, type, value, onChange, required, styles }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{ color: styles.labelColor, fontSize: '14px', fontWeight: 600 }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        style={{
          background: styles.inputBackground,
          border: `1px solid ${styles.inputBorder}`,
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '15px',
          color: styles.inputColor,
          outline: 'none',
          colorScheme: 'dark',
        }}
        onFocus={event => {
          event.currentTarget.style.borderColor = styles.inputFocusBorder;
        }}
        onBlur={event => {
          event.currentTarget.style.borderColor = styles.inputBorder;
        }}
      />
    </div>
  );
}
