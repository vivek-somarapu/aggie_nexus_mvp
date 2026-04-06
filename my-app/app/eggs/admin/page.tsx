/**
 * AggieX Easter Egg Hunt 2026
 * Admin dashboard: live inventory cards + full claims table with CSV export.
 * Protected by EASTER_ADMIN_PASSWORD env var (password prompt on first load,
 * session stored in sessionStorage).
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_STORAGE_KEY = 'easter_admin_auth';
const ADMIN_AUTH_ENDPOINT = '/api/eggs/admin-auth';
const AUTO_REFRESH_INTERVAL_MS = 30_000;

const EGG_TOTALS = {
  common: 225,
  epic: 20,
  legendary: 4,
} as const;

const TIER_COLORS = {
  common: { bg: '#dcfce7', border: '#16a34a', text: '#166534', badge: '#16a34a' },
  epic: { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95', badge: '#7c3aed' },
  legendary: { bg: '#fef9c3', border: '#ca8a04', text: '#78350f', badge: '#ca8a04' },
} as const;

type EggType = keyof typeof EGG_TOTALS;

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenStats {
  egg_type: EggType;
  is_claimed: boolean;
}

interface ClaimRow {
  egg_type: EggType;
  egg_number: number;
  name: string;
  email: string;
  self_reported_found_at: string | null;
  submitted_at: string;
}

interface InventoryCard {
  eggType: EggType;
  total: number;
  claimed: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingSession(false);
  }, []);

  if (isCheckingSession) return <LoadingScreen />;
  if (!isAuthenticated) return <PasswordGate onSuccess={() => setIsAuthenticated(true)} />;
  return <AdminDashboard />;
}

// ─── Password gate ───────────────────────────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(ADMIN_AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setErrorMessage('Incorrect password. Try again.');
        return;
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      onSuccess();
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h1 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          🥚 AggieX Egg Hunt Admin
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px' }}>
          Enter the admin password to access the dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Admin password"
            required
            autoFocus
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#f1f5f9',
              fontSize: '15px',
              outline: 'none',
            }}
          />

          {errorMessage && (
            <p style={{ color: '#f87171', fontSize: '14px', margin: 0 }}>{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Verifying…' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Admin dashboard ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const [tokenStats, setTokenStats] = useState<TokenStats[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [tokenResult, claimsResult] = await Promise.all([
      supabase.from('easter_egg_tokens').select('egg_type, is_claimed'),
      supabase
        .from('easter_egg_hunt_2026')
        .select('egg_type, egg_number, name, email, self_reported_found_at, submitted_at')
        .order('submitted_at', { ascending: false }),
    ]);

    if (tokenResult.data) setTokenStats(tokenResult.data as TokenStats[]);
    if (claimsResult.data) setClaims(claimsResult.data as ClaimRow[]);

    setLastRefreshed(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const inventoryCards = buildInventoryCards(tokenStats);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f1f5f9',
        padding: '32px 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>🥚 Egg Hunt Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              AggieX Easter Egg Hunt 2026{lastRefreshed ? ` · Last refreshed ${lastRefreshed.toLocaleTimeString()}` : ''}
            </p>
          </div>
          <button
            onClick={() => exportCsv(claims)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Inventory cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {isLoading
            ? ['common', 'epic', 'legendary'].map(type => <SkeletonCard key={type} />)
            : inventoryCards.map(card => <InventoryCard key={card.eggType} card={card} />)
          }
        </div>

        {/* Claims table */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Claims Feed</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
              {claims.length} claim{claims.length !== 1 ? 's' : ''} · refreshes every 30s
            </p>
          </div>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading…</div>
          ) : claims.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No claims yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Egg Type', 'Egg #', 'Name', 'Email', 'Time Found', 'Claimed At'].map(header => (
                      <th
                        key={header}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#94a3b8',
                          fontWeight: 600,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, index) => (
                    <ClaimTableRow key={index} claim={claim} isEven={index % 2 === 0} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InventoryCard({ card }: { card: InventoryCard }) {
  const colors = TIER_COLORS[card.eggType];
  const remaining = card.total - card.claimed;
  const percentFound = card.total > 0 ? Math.round((card.claimed / card.total) * 100) : 0;

  return (
    <div
      style={{
        background: '#1e293b',
        border: `1px solid ${colors.border}44`,
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '16px', color: '#f1f5f9' }}>
          {card.eggType}
        </span>
        <span
          style={{
            background: `${colors.badge}22`,
            color: colors.badge,
            borderRadius: '999px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {percentFound}% found
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <StatCell label="Total" value={card.total} color="#94a3b8" />
        <StatCell label="Claimed" value={card.claimed} color={colors.badge} />
        <StatCell label="Left" value={remaining} color="#f1f5f9" />
      </div>

      {/* Progress bar */}
      <div style={{ background: '#334155', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percentFound}%`,
            background: colors.badge,
            borderRadius: '999px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>{label}</div>
      <div style={{ color, fontSize: '20px', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', height: '130px' }} />
  );
}

function ClaimTableRow({ claim, isEven }: { claim: ClaimRow; isEven: boolean }) {
  const colors = TIER_COLORS[claim.egg_type];

  return (
    <tr style={{ background: isEven ? 'transparent' : '#172033' }}>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <span
          style={{
            background: `${colors.badge}22`,
            color: colors.badge,
            borderRadius: '999px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}
        >
          {claim.egg_type}
        </span>
      </td>
      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>#{claim.egg_number}</td>
      <td style={{ padding: '12px 16px', color: '#f1f5f9' }}>{claim.name}</td>
      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{claim.email}</td>
      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
        {claim.self_reported_found_at ? formatDateTime(claim.self_reported_found_at) : '—'}
      </td>
      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
        {formatDateTime(claim.submitted_at)}
      </td>
    </tr>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      Loading…
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInventoryCards(stats: TokenStats[]): InventoryCard[] {
  const claimedCountByType: Record<string, number> = {};
  for (const stat of stats) {
    if (stat.is_claimed) {
      claimedCountByType[stat.egg_type] = (claimedCountByType[stat.egg_type] ?? 0) + 1;
    }
  }

  return (Object.keys(EGG_TOTALS) as EggType[]).map(eggType => ({
    eggType,
    total: EGG_TOTALS[eggType],
    claimed: claimedCountByType[eggType] ?? 0,
  }));
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function exportCsv(rows: ClaimRow[]): void {
  const header = 'egg_type,egg_number,name,email,self_reported_found_at,submitted_at';
  const dataRows = rows.map(
    row =>
      `${row.egg_type},${row.egg_number},"${row.name}","${row.email}",${row.self_reported_found_at ?? ''},${row.submitted_at}`
  );
  const csvContent = [header, ...dataRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `aggiex-egg-hunt-claims-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
