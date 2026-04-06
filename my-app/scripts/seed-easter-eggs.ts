// Run: npx tsx scripts/seed-easter-eggs.ts
// (from inside the my-app/ directory)
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

/**
 * AggieX Easter Egg Hunt 2026
 * Token seed script: generates 249 unique single-use tokens,
 * inserts them into easter_egg_tokens (idempotent), and exports a CSV
 * ready for QR-code printing.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local sits one level up from scripts/ (i.e. in my-app/).
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_RANDOM_SUFFIX_LENGTH = 16;

const EGG_COUNTS = {
  common: 225,
  epic: 20,
  legendary: 4,
} as const;

const TOKEN_PREFIXES = {
  common: 'cmn_',
  epic: 'epc_',
  legendary: 'lgd_',
} as const;

const AGGIEX_BASE_URL = 'https://aggiex.org';
const CSV_OUTPUT_PATH = join(__dirname, 'output', 'easter-egg-tokens.csv');

// ─── Types ───────────────────────────────────────────────────────────────────

type EggType = keyof typeof EGG_COUNTS;

interface TokenRow {
  token: string;
  egg_type: EggType;
  egg_number: number;
}

interface CsvRow extends TokenRow {
  qr_url: string;
}

// ─── Token generation ────────────────────────────────────────────────────────

function generateTokenSuffix(): string {
  const bytes = randomBytes(TOKEN_RANDOM_SUFFIX_LENGTH);
  return Array.from(bytes)
    .map(byte => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length])
    .join('');
}

function buildToken(eggType: EggType): string {
  return TOKEN_PREFIXES[eggType] + generateTokenSuffix();
}

function buildQrUrl(eggType: EggType, token: string): string {
  return `${AGGIEX_BASE_URL}/eggs/${eggType}?token=${token}`;
}

// ─── Database helpers ────────────────────────────────────────────────────────

async function fetchExistingEggKeys(
  supabase: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('easter_egg_tokens')
    .select('egg_type, egg_number');

  if (error) {
    throw new Error(`Failed to fetch existing eggs: ${error.message}`);
  }

  const existingKeys = new Set<string>();
  for (const row of data ?? []) {
    existingKeys.add(`${row.egg_type}:${row.egg_number}`);
  }
  return existingKeys;
}

async function insertTokenBatch(
  supabase: ReturnType<typeof createClient>,
  rows: TokenRow[]
): Promise<void> {
  const { error } = await supabase.from('easter_egg_tokens').insert(rows);
  if (error) {
    throw new Error(`Failed to insert tokens: ${error.message}`);
  }
}

async function fetchStoredTokens(
  supabase: ReturnType<typeof createClient>
): Promise<CsvRow[]> {
  const { data, error } = await supabase
    .from('easter_egg_tokens')
    .select('egg_type, egg_number, token')
    .order('egg_type')
    .order('egg_number');

  if (error) {
    throw new Error(`Failed to fetch stored tokens: ${error.message}`);
  }

  return (data ?? []).map(row => ({
    egg_type: row.egg_type as EggType,
    egg_number: row.egg_number,
    token: row.token,
    qr_url: buildQrUrl(row.egg_type as EggType, row.token),
  }));
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

function buildCsvContent(rows: CsvRow[]): string {
  const header = 'egg_type,egg_number,token,qr_url';
  const dataRows = rows.map(
    row => `${row.egg_type},${row.egg_number},${row.token},${row.qr_url}`
  );
  return [header, ...dataRows].join('\n');
}

function exportCsv(rows: CsvRow[]): void {
  mkdirSync(join(__dirname, 'output'), { recursive: true });
  writeFileSync(CSV_OUTPUT_PATH, buildCsvContent(rows), 'utf-8');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seedEasterEggs(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing environment variables.\n' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  // Service role key bypasses RLS so we can write all 249 rows.
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('Fetching existing egg records...');
  const existingKeys = await fetchExistingEggKeys(supabase);
  console.log(`Found ${existingKeys.size} existing record(s).`);

  const newRows: TokenRow[] = [];

  for (const eggType of Object.keys(EGG_COUNTS) as EggType[]) {
    const count = EGG_COUNTS[eggType];
    for (let eggNumber = 1; eggNumber <= count; eggNumber++) {
      const key = `${eggType}:${eggNumber}`;
      if (!existingKeys.has(key)) {
        newRows.push({ token: buildToken(eggType), egg_type: eggType, egg_number: eggNumber });
      }
    }
  }

  if (newRows.length > 0) {
    console.log(`Inserting ${newRows.length} new token(s)...`);
    await insertTokenBatch(supabase, newRows);
    console.log('Tokens inserted successfully.');
  } else {
    console.log('All eggs already seeded — skipping inserts.');
  }

  console.log('Fetching stored tokens for CSV export...');
  const storedRows = await fetchStoredTokens(supabase);

  exportCsv(storedRows);
  console.log(`CSV exported to: ${CSV_OUTPUT_PATH}`);
  console.log(`Total rows: ${storedRows.length}`);
}

seedEasterEggs().catch(error => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
