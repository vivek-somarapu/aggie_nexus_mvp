/**
 * AggieX Easter Egg Hunt 2026
 * Epic egg landing page component — dark/indigo/violet/rose palette.
 * Ambitious, electric aesthetic with star field, aurora, and glowing egg.
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

const COLOR_DARK = '#110D2A';
const COLOR_INDIGO = '#3B2BDB';
const COLOR_VIOLET = '#7C5CFF';
const COLOR_ROSE = '#FF4E8B';
const COLOR_CREAM = '#FFF8F2';

const STAR_COUNT = 80;

const PAGE_KEYFRAMES = `
  @keyframes star-blink {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.3); }
  }
  @keyframes aurora-shift {
    0%, 100% { transform: scale(1) translateY(0); opacity: 0.55; }
    50% { transform: scale(1.08) translateY(-12px); opacity: 0.7; }
  }
  @keyframes egg-float-epic {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50% { transform: translateY(-16px) rotate(2deg); }
  }
  @keyframes egg-glow-pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.75; transform: scale(1.12); }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface EggEpicProps {
  token: string | null;
  tokenStatus: TokenStatus;
  eggNumber: number | null;
}

interface StarDot {
  top: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EggEpic({ token, tokenStatus }: EggEpicProps) {
  const stars = useMemo(() => generateStars(), []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_KEYFRAMES }} />

      <div
        style={{
          minHeight: '100vh',
          background: COLOR_DARK,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Aurora band */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-20%',
            width: '140%',
            height: '280px',
            background: `conic-gradient(from 180deg at 50% 0%, ${COLOR_ROSE}55, ${COLOR_VIOLET}88, ${COLOR_INDIGO}66, ${COLOR_VIOLET}44, ${COLOR_ROSE}33)`,
            filter: 'blur(60px)',
            animation: 'aurora-shift 9s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Star field */}
        {stars.map((star, index) => (
          <StarDot key={index} star={star} />
        ))}

        {/* Main content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '540px',
            margin: '0 auto',
            padding: '60px 24px 80px',
          }}
        >
          {/* Tier badge */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: COLOR_VIOLET,
                border: `1px solid ${COLOR_VIOLET}`,
                borderRadius: '999px',
                padding: '6px 18px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                boxShadow: `0 0 12px ${COLOR_VIOLET}44`,
              }}
            >
              ✦ Epic Egg Discovered
            </span>
          </div>

          {/* Egg with glow */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
            {/* Glow behind egg */}
            <div
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${COLOR_VIOLET}55 0%, transparent 70%)`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'egg-glow-pulse 3s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            <div style={{ animation: 'egg-float-epic 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
              <EggSvgEpic />
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              textAlign: 'center',
              fontSize: 'clamp(26px, 5.5vw, 38px)',
              fontWeight: 800,
              color: COLOR_CREAM,
              lineHeight: 1.25,
              marginBottom: '16px',
            }}
          >
            You didn&apos;t just find an egg.{' '}
            <br />
            You found your{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${COLOR_ROSE}, ${COLOR_VIOLET})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              edge.
            </span>
          </h1>

          <p
            style={{
              textAlign: 'center',
              color: 'rgba(255,248,242,0.7)',
              fontSize: '16px',
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            This isn&apos;t luck — it&apos;s momentum. You&apos;ve unlocked a free one-on-one
            business development consultation with the AggieX team. Let&apos;s build something real.
          </p>

          {/* Prize card — gradient border trick */}
          <div
            style={{
              background: `linear-gradient(135deg, ${COLOR_ROSE}, ${COLOR_VIOLET}, ${COLOR_INDIGO})`,
              padding: '2px',
              borderRadius: '18px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                background: '#1A1238',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <p style={{ color: COLOR_VIOLET, fontSize: '13px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.06em' }}>
                ✦ YOUR EPIC PRIZE
              </p>
              <div style={{ fontSize: '28px', margin: '0 0 4px' }}>🚀</div>
              <h2 style={{ color: COLOR_CREAM, fontSize: '22px', fontWeight: 800, margin: '0 0 14px', fontStyle: 'normal' }}>
                Free Business Development Consultation
              </h2>

              {/* Divider */}
              <div
                style={{
                  width: '48px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${COLOR_ROSE}, ${COLOR_VIOLET})`,
                  borderRadius: '2px',
                  marginBottom: '18px',
                }}
              />

              {/* Perks */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {EPIC_PERKS.map((perk, index) => (
                  <PerkItem key={index} text={perk} />
                ))}
              </ul>
            </div>
          </div>

          {/* Form area */}
          {tokenStatus === 'valid' && token ? (
            <ClaimForm
              token={token}
              tier="epic"
              styles={{
                cardBackground: '#1A1238',
                labelColor: 'rgba(255,248,242,0.85)',
                inputBackground: '#0D0B1F',
                inputBorder: `${COLOR_VIOLET}55`,
                inputColor: COLOR_CREAM,
                inputFocusBorder: COLOR_VIOLET,
                buttonBackground: `linear-gradient(90deg, ${COLOR_ROSE}, ${COLOR_VIOLET})`,
                buttonColor: '#fff',
                buttonStyle: { backgroundImage: `linear-gradient(90deg, ${COLOR_ROSE}, ${COLOR_VIOLET})` },
                successBackground: '#1A1238',
                successColor: COLOR_VIOLET,
              }}
            />
          ) : (
            <ErrorState
              status={tokenStatus === 'claimed' ? 'claimed' : 'invalid'}
              styles={{
                cardBackground: '#1A1238',
                cardBorder: `${COLOR_VIOLET}55`,
                titleColor: COLOR_CREAM,
                bodyColor: 'rgba(255,248,242,0.6)',
              }}
            />
          )}

          {/* Footer */}
          <p style={{ textAlign: 'center', color: 'rgba(255,248,242,0.3)', fontSize: '13px', marginTop: '40px' }}>
            Questions? hello@aggiex.com · AggieX.org
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarDot({ star }: { star: StarDot }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: star.top,
        left: star.left,
        width: star.size,
        height: star.size,
        borderRadius: '50%',
        background: '#ffffff',
        animation: `star-blink ${star.duration} ${star.delay} ease-in-out infinite`,
        pointerEvents: 'none',
      }}
    />
  );
}

const EPIC_PERKS = [
  '1-on-1 session with an AggieX advisor',
  'Strategy, connections, and a growth roadmap',
  'Tailored to where your business is right now',
  'No pitch. No fluff. Just real talk.',
];

function PerkItem({ text }: { text: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,248,242,0.8)', fontSize: '15px' }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLOR_ROSE}, ${COLOR_VIOLET})`,
          flexShrink: 0,
          marginTop: '6px',
        }}
      />
      {text}
    </li>
  );
}

function EggSvgEpic() {
  return (
    <svg width="160" height="200" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="egg-epic-base" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#9B7FFF" />
          <stop offset="55%" stopColor="#5B3FD6" />
          <stop offset="100%" stopColor="#2A1BA0" />
        </radialGradient>
        <radialGradient id="egg-epic-sheen" cx="28%" cy="22%" r="38%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-epic-base)" />
      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-epic-sheen)" />

      {/* Star dots on egg surface */}
      <circle cx="60" cy="80" r="2.5" fill="rgba(255,255,255,0.7)" />
      <circle cx="95" cy="95" r="2" fill="rgba(255,255,255,0.6)" />
      <circle cx="75" cy="130" r="1.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="105" cy="115" r="1.8" fill="rgba(255,255,255,0.55)" />

      {/* Glowing crack */}
      <path
        d="M74 40 L78 56 L70 64 L76 75 L72 88"
        stroke="rgba(186,160,255,0.9)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#crack-glow)"
      />
      <defs>
        <filter id="crack-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateStars(): StarDot[] {
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const seedA = ((index * 7 + 13) % 97) / 97;
    const seedB = ((index * 11 + 5) % 89) / 89;
    const seedC = ((index * 3 + 41) % 83) / 83;
    const seedD = ((index * 17 + 7) % 79) / 79;
    const size = 1 + Math.floor(seedD * 3);

    return {
      top: `${Math.floor(seedA * 100)}%`,
      left: `${Math.floor(seedB * 100)}%`,
      delay: `-${(seedC * 6).toFixed(1)}s`,
      duration: `${(2 + seedD * 4).toFixed(1)}s`,
      size: `${size}px`,
    };
  });
}
