/**
 * AggieX Easter Egg Hunt 2026
 * Common egg landing page component — mint/lime/sky color palette.
 * Playful, springy aesthetic with animated blobs, floating egg, and CSS confetti.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

'use client';

import { useMemo } from 'react';
import ClaimForm from './ClaimForm';
import ErrorState from './ErrorState';
import type { TokenStatus } from './ErrorState';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_MINT = '#00C98D';
const COLOR_LIME = '#B8F04A';
const COLOR_SKY = '#D4F5FF';
const COLOR_SOFT_WHITE = '#F0FDF6';
const COLOR_NAVY = '#0E1B2A';

const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = [COLOR_MINT, COLOR_LIME, COLOR_SKY, '#5EEFC0', '#E8FFAB'];

const PAGE_KEYFRAMES = `
  @keyframes blob-drift-a {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, -30px) scale(1.08); }
    66% { transform: translate(-25px, 25px) scale(0.96); }
  }
  @keyframes blob-drift-b {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40% { transform: translate(-50px, 30px) scale(1.05); }
    70% { transform: translate(30px, -40px) scale(0.98); }
  }
  @keyframes blob-drift-c {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(35px, 40px) scale(1.04); }
    75% { transform: translate(-30px, -20px) scale(1.02); }
  }
  @keyframes egg-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-14px); }
  }
  @keyframes confetti-fall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0.3; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface EggCommonProps {
  token: string | null;
  tokenStatus: TokenStatus;
  eggNumber: number | null;
}

interface ConfettiPiece {
  left: string;
  delay: string;
  duration: string;
  color: string;
  width: string;
  height: string;
  isCircle: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EggCommon({ token, tokenStatus, eggNumber }: EggCommonProps) {
  const confettiPieces = useMemo(() => generateConfetti(), []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_KEYFRAMES }} />

      <div
        style={{
          minHeight: '100vh',
          background: COLOR_SOFT_WHITE,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Animated background blobs */}
        <Blob color={COLOR_MINT} top="5%" left="-10%" size="480px" animation="blob-drift-a 12s ease-in-out infinite" />
        <Blob color={COLOR_LIME} top="40%" right="-8%" size="420px" animation="blob-drift-b 15s ease-in-out infinite" />
        <Blob color={COLOR_SKY} bottom="5%" left="20%" size="360px" animation="blob-drift-c 18s ease-in-out infinite" />

        {/* Confetti rain */}
        {confettiPieces.map((piece, index) => (
          <ConfettiParticle key={index} piece={piece} />
        ))}

        {/* Main content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '520px',
            margin: '0 auto',
            padding: '60px 24px 80px',
          }}
        >
          {/* Tier badge */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-block',
                background: COLOR_MINT,
                color: '#fff',
                borderRadius: '999px',
                padding: '6px 18px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              ● Common Egg Found
            </span>
          </div>

          {/* Egg SVG */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '36px',
              animation: 'egg-float 3.5s ease-in-out infinite',
            }}
          >
            <EggSvgCommon />
          </div>

          {/* Headline */}
          <h1
            style={{
              textAlign: 'center',
              fontSize: 'clamp(28px, 6vw, 40px)',
              fontWeight: 800,
              color: COLOR_NAVY,
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            You cracked it.{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              Your seat is{' '}
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                waiting.
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '8px',
                    background: COLOR_LIME,
                    zIndex: -1,
                    borderRadius: '2px',
                  }}
                />
              </span>
            </span>
          </h1>

          <p
            style={{
              textAlign: 'center',
              color: '#3a5240',
              fontSize: '16px',
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            Lucky you — this egg guarantees your admission to the next AggieX event.
            Scan, claim, and show up ready to connect.
          </p>

          {/* Prize card */}
          <div
            style={{
              background: '#fff',
              border: `2px solid ${COLOR_MINT}`,
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0,201,141,0.15)',
              marginBottom: '24px',
            }}
          >
            <p style={{ color: COLOR_MINT, fontSize: '13px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.06em' }}>
              🥚 YOUR PRIZE
            </p>
            <h2 style={{ color: COLOR_NAVY, fontSize: '24px', fontWeight: 800, margin: '0 0 12px' }}>
              Free Event Admission
            </h2>
            <p style={{ color: '#4a6157', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
              Guaranteed access to one upcoming AggieX event — networking, workshops, and the kind
              of connections that actually move the needle. No waitlist. No cost. Just show up.
            </p>
          </div>

          {/* Form area */}
          {tokenStatus === 'valid' && token ? (
            <ClaimForm
              token={token}
              tier="common"
              styles={{
                cardBackground: '#fff',
                labelColor: COLOR_NAVY,
                inputBackground: COLOR_SOFT_WHITE,
                inputBorder: '#c9e8d8',
                inputColor: COLOR_NAVY,
                inputFocusBorder: COLOR_MINT,
                buttonBackground: COLOR_NAVY,
                buttonColor: '#fff',
                successBackground: '#dcfce7',
                successColor: '#166534',
              }}
            />
          ) : (
            <ErrorState
              status={tokenStatus === 'claimed' ? 'claimed' : 'invalid'}
              styles={{
                cardBackground: '#fff',
                cardBorder: '#c9e8d8',
                titleColor: COLOR_NAVY,
                bodyColor: '#4a6157',
              }}
            />
          )}

          {/* Footer */}
          <p
            style={{
              textAlign: 'center',
              color: '#8aab98',
              fontSize: '13px',
              marginTop: '40px',
            }}
          >
            Questions? hello@aggiex.com · AggieX.org
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Blob({
  color,
  top,
  left,
  right,
  bottom,
  size,
  animation,
}: {
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: string;
  animation: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(80px)',
        opacity: 0.35,
        top,
        left,
        right,
        bottom,
        animation,
        pointerEvents: 'none',
      }}
    />
  );
}

function ConfettiParticle({ piece }: { piece: ConfettiPiece }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: piece.left,
        width: piece.width,
        height: piece.height,
        borderRadius: piece.isCircle ? '50%' : '2px',
        background: piece.color,
        animation: `confetti-fall ${piece.duration} ${piece.delay} linear infinite`,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.8,
      }}
    />
  );
}

function EggSvgCommon() {
  return (
    <svg width="160" height="200" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Egg base with radial gradient */}
      <defs>
        <radialGradient id="egg-common-base" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#6FFFD4" />
          <stop offset="55%" stopColor="#00C98D" />
          <stop offset="100%" stopColor="#00865E" />
        </radialGradient>
        <radialGradient id="egg-common-sheen" cx="28%" cy="22%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Body */}
      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-common-base)" />
      {/* Sheen */}
      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-common-sheen)" />

      {/* Horizontal stripe accents */}
      <path d="M26 88 Q80 82 134 88" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M20 108 Q80 102 140 108" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M26 128 Q80 122 134 128" stroke="rgba(255,255,255,0.14)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Crack */}
      <path
        d="M72 44 L76 58 L68 66 L74 76 L70 86"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const seedA = ((index * 7 + 13) % 97) / 97;
    const seedB = ((index * 11 + 5) % 89) / 89;
    const seedC = ((index * 3 + 41) % 83) / 83;
    const seedD = ((index * 17 + 7) % 79) / 79;

    return {
      left: `${Math.floor(seedA * 100)}%`,
      delay: `-${(seedB * 8).toFixed(1)}s`,
      duration: `${(3 + seedC * 5).toFixed(1)}s`,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      width: `${6 + Math.floor(seedD * 8)}px`,
      height: `${6 + Math.floor(seedA * 10)}px`,
      isCircle: index % 3 === 0,
    };
  });
}
