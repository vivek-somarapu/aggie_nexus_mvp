/**
 * AggieX Easter Egg Hunt 2026
 * Legendary egg landing page component — obsidian/gold palette.
 * Rare, luxurious, ceremonial aesthetic with gold particles, orbiting halos,
 * and animated shimmer headline.
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

const COLOR_OBSIDIAN = '#080808';
const COLOR_GOLD = '#D4A017';
const COLOR_GOLD_LIGHT = '#FFE57A';
const COLOR_WARM_WHITE = '#FFF9EC';

const PARTICLE_COUNT = 50;

const PAGE_KEYFRAMES = `
  @keyframes particle-rise {
    0% { transform: translateY(0) scale(1); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.4; }
    100% { transform: translateY(-105vh) scale(0.6); opacity: 0; }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.25; transform: scale(1); }
    50% { opacity: 0.45; transform: scale(1.15); }
  }
  @keyframes egg-levitate {
    0%, 100% { transform: translateY(0px) rotate(-1.5deg); filter: drop-shadow(0 0 18px rgba(212,160,23,0.6)); }
    50% { transform: translateY(-18px) rotate(1.5deg); filter: drop-shadow(0 0 32px rgba(212,160,23,0.9)); }
  }
  @keyframes halo-cw {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg); }
  }
  @keyframes halo-ccw {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(-360deg); }
  }
  @keyframes shimmer-sweep {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
  }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface EggLegendaryProps {
  token: string | null;
  tokenStatus: TokenStatus;
  eggNumber: number | null;
}

interface GoldParticle {
  left: string;
  delay: string;
  duration: string;
  size: string;
  startBottom: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EggLegendary({ token, tokenStatus }: EggLegendaryProps) {
  const particles = useMemo(() => generateParticles(), []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_KEYFRAMES }} />

      <div
        style={{
          minHeight: '100vh',
          background: COLOR_OBSIDIAN,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Noise texture overlay (SVG feTurbulence) */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        {/* Central gold glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLOR_GOLD}40 0%, transparent 70%)`,
            animation: 'glow-pulse 6s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Gold particle field */}
        {particles.map((particle, index) => (
          <GoldParticle key={index} particle={particle} />
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
          {/* Tier badge — line · text · line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '36px',
            }}
          >
            <GoldLine />
            <span
              style={{
                color: COLOR_GOLD,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'Inter, system-ui, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              Legendary Golden Egg
            </span>
            <GoldLine />
          </div>

          {/* Egg with orbiting halos */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '40px',
              height: '240px',
              alignItems: 'center',
            }}
          >
            {/* Halo 1 — clockwise, slow */}
            <OrbitalHalo size={260} duration="18s" direction="halo-cw" />
            {/* Halo 2 — counter-clockwise, slightly faster */}
            <OrbitalHalo size={310} duration="13s" direction="halo-ccw" />

            <div style={{ animation: 'egg-levitate 4.5s ease-in-out infinite', position: 'relative', zIndex: 2 }}>
              <EggSvgLegendary />
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              textAlign: 'center',
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 900,
              color: COLOR_WARM_WHITE,
              lineHeight: 1.2,
              marginBottom: '8px',
            }}
          >
            One in a thousand.{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${COLOR_GOLD_LIGHT}, ${COLOR_GOLD}, ${COLOR_GOLD_LIGHT})`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer-sweep 3s linear infinite',
              }}
            >
              That&apos;s you.
            </span>
          </h1>

          <p
            style={{
              textAlign: 'center',
              color: `rgba(255,249,236,0.45)`,
              fontSize: '15px',
              fontStyle: 'italic',
              letterSpacing: '0.12em',
              marginBottom: '32px',
            }}
          >
            — Rara avis —
          </p>

          {/* Prize card */}
          <div
            style={{
              background: '#111008',
              borderTop: `1px solid transparent`,
              borderBottom: `1px solid transparent`,
              borderLeft: `1px solid ${COLOR_GOLD}44`,
              borderRight: `1px solid ${COLOR_GOLD}44`,
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '24px',
              position: 'relative',
            }}
          >
            {/* Top gradient line */}
            <div style={{
              position: 'absolute', top: -1, left: '10%', right: '10%', height: '1px',
              background: `linear-gradient(90deg, transparent, ${COLOR_GOLD}, transparent)`,
            }} />
            {/* Bottom gradient line */}
            <div style={{
              position: 'absolute', bottom: -1, left: '10%', right: '10%', height: '1px',
              background: `linear-gradient(90deg, transparent, ${COLOR_GOLD}, transparent)`,
            }} />

            {/* Ultra rare label */}
            <div style={{ textAlign: 'right', marginBottom: '8px' }}>
              <span style={{ color: COLOR_GOLD, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
                ✦ Ultra Rare
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '42px',
                  marginBottom: '10px',
                  filter: `drop-shadow(0 0 12px ${COLOR_GOLD})`,
                }}
              >
                👑
              </div>
              <p style={{ color: COLOR_GOLD, fontSize: '13px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.08em', fontFamily: 'Inter, system-ui, sans-serif' }}>
                ✦ YOUR LEGENDARY PRIZE
              </p>
              <h2 style={{ color: COLOR_WARM_WHITE, fontSize: '24px', fontWeight: 800, margin: '0 0 14px' }}>
                Official AggieX Merch
              </h2>

              {/* Separator */}
              <div
                style={{
                  width: '60px',
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${COLOR_GOLD}, transparent)`,
                  margin: '0 auto 16px',
                }}
              />

              <p style={{ color: `rgba(255,249,236,0.65)`, fontSize: '15px', lineHeight: 1.7, marginBottom: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                You found the rarest egg at the hunt. Claim your exclusive AggieX merch package
                — curated for the people who show up and stand out.
              </p>

              {/* Merch pills */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                {MERCH_ITEMS.map(item => (
                  <MerchPill key={item} label={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Form area */}
          {tokenStatus === 'valid' && token ? (
            <ClaimForm
              token={token}
              tier="legendary"
              styles={{
                cardBackground: '#111008',
                labelColor: `rgba(255,249,236,0.85)`,
                inputBackground: '#0A0904',
                inputBorder: `${COLOR_GOLD}44`,
                inputColor: COLOR_WARM_WHITE,
                inputFocusBorder: COLOR_GOLD,
                buttonBackground: COLOR_GOLD,
                buttonColor: COLOR_OBSIDIAN,
                buttonStyle: {
                  background: `linear-gradient(90deg, ${COLOR_GOLD_LIGHT}, ${COLOR_GOLD}, ${COLOR_GOLD_LIGHT})`,
                  backgroundSize: '200% auto',
                  color: COLOR_OBSIDIAN,
                  fontWeight: 800,
                },
                successBackground: '#111008',
                successColor: COLOR_GOLD_LIGHT,
              }}
            />
          ) : (
            <ErrorState
              status={tokenStatus === 'claimed' ? 'claimed' : 'invalid'}
              styles={{
                cardBackground: '#111008',
                cardBorder: `${COLOR_GOLD}44`,
                titleColor: COLOR_WARM_WHITE,
                bodyColor: `rgba(255,249,236,0.55)`,
              }}
            />
          )}

          {/* Footer */}
          <p style={{ textAlign: 'center', color: `rgba(255,249,236,0.2)`, fontSize: '13px', marginTop: '40px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Questions? hello@aggiex.com · AggieX.org
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MERCH_ITEMS = ['Premium Hoodie', 'AggieX Hat', 'Founder Tee', 'Sticker Pack', '& More'];

function MerchPill({ label }: { label: string }) {
  return (
    <span
      style={{
        border: `1px solid ${COLOR_GOLD}88`,
        color: COLOR_GOLD,
        background: 'transparent',
        borderRadius: '999px',
        padding: '4px 14px',
        fontSize: '13px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {label}
    </span>
  );
}

function GoldLine() {
  return (
    <div
      style={{
        flex: '0 0 40px',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${COLOR_GOLD})`,
      }}
    />
  );
}

function GoldParticle({ particle }: { particle: GoldParticle }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: particle.startBottom,
        left: particle.left,
        width: particle.size,
        height: particle.size,
        borderRadius: '50%',
        background: COLOR_GOLD_LIGHT,
        animation: `particle-rise ${particle.duration} ${particle.delay} ease-in-out infinite`,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function OrbitalHalo({ size, duration, direction }: { size: number; duration: string; direction: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: `1px solid ${COLOR_GOLD}55`,
        animation: `${direction} ${duration} linear infinite`,
        pointerEvents: 'none',
      }}
    >
      {/* Glowing dot on circumference */}
      <div
        style={{
          position: 'absolute',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: COLOR_GOLD_LIGHT,
          boxShadow: `0 0 10px 3px ${COLOR_GOLD}`,
        }}
      />
    </div>
  );
}

function EggSvgLegendary() {
  return (
    <svg width="160" height="200" viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Base gold gradient */}
        <radialGradient id="egg-legendary-base" cx="38%" cy="28%" r="68%">
          <stop offset="0%" stopColor={COLOR_GOLD_LIGHT} />
          <stop offset="45%" stopColor={COLOR_GOLD} />
          <stop offset="100%" stopColor="#8B6010" />
        </radialGradient>
        {/* Specular sheen */}
        <radialGradient id="egg-legendary-sheen" cx="28%" cy="22%" r="36%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Shadow vignette */}
        <radialGradient id="egg-legendary-shadow" cx="70%" cy="75%" r="50%">
          <stop offset="0%" stopColor="rgba(30,15,0,0.45)" />
          <stop offset="100%" stopColor="rgba(30,15,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-legendary-base)" />
      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-legendary-sheen)" />
      <ellipse cx="80" cy="108" rx="62" ry="80" fill="url(#egg-legendary-shadow)" />

      {/* Five-point star near center */}
      <polygon
        points="80,82 83,91 93,91 85,97 88,106 80,100 72,106 75,97 67,91 77,91"
        fill="rgba(255,255,255,0.28)"
      />

      {/* Glowing crack */}
      <path
        d="M76 36 L80 52 L72 60 L78 72 L74 84"
        stroke={`rgba(255,229,122,0.85)`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateParticles(): GoldParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const seedA = ((index * 7 + 13) % 97) / 97;
    const seedB = ((index * 11 + 5) % 89) / 89;
    const seedC = ((index * 3 + 41) % 83) / 83;
    const seedD = ((index * 17 + 7) % 79) / 79;
    const size = 2 + Math.floor(seedD * 3);

    return {
      left: `${Math.floor(seedA * 100)}%`,
      delay: `-${(seedB * 13).toFixed(1)}s`,
      duration: `${(5 + seedC * 8).toFixed(1)}s`,
      size: `${size}px`,
      startBottom: `-${Math.floor(seedD * 20)}px`,
    };
  });
}
