/**
 * AggieX Easter Egg Hunt 2026
 * Shared error state card shown when a token is invalid or already claimed.
 * Styled via props so each tier can apply its own color palette.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

'use client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TokenStatus = 'valid' | 'claimed' | 'invalid';

interface ErrorStateStyles {
  cardBackground: string;
  cardBorder: string;
  titleColor: string;
  bodyColor: string;
}

interface ErrorStateProps {
  status: 'claimed' | 'invalid';
  styles: ErrorStateStyles;
}

// ─── Copy ────────────────────────────────────────────────────────────────────

const CLAIMED_ICON = '🔒';
const INVALID_ICON = '🥚';

const CLAIMED_TITLE = 'This egg has already been claimed.';
const CLAIMED_BODY =
  'Each egg can only be claimed once. If you found this egg and believe this is an error, reach out at hello@aggiex.com';

const INVALID_TITLE = "Hmm, something's not right.";
const INVALID_BODY =
  "This doesn't look like a valid AggieX egg. Make sure you're scanning the QR code directly from a physical egg.";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ErrorState({ status, styles }: ErrorStateProps) {
  const icon = status === 'claimed' ? CLAIMED_ICON : INVALID_ICON;
  const title = status === 'claimed' ? CLAIMED_TITLE : INVALID_TITLE;
  const body = status === 'claimed' ? CLAIMED_BODY : INVALID_BODY;

  return (
    <div
      style={{
        background: styles.cardBackground,
        border: `1px solid ${styles.cardBorder}`,
        borderRadius: '16px',
        padding: '32px 28px',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3
        style={{
          color: styles.titleColor,
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '12px',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: styles.bodyColor,
          fontSize: '15px',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}
