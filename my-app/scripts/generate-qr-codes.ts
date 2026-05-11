// Run: npx tsx scripts/generate-qr-codes.ts
// (from inside the my-app/ directory)
// Input:  scripts/output/easter-egg-tokens.csv   (produced by seed-easter-eggs.ts)
// Output: scripts/output/qr-codes.html           (open in browser → File → Print)

/**
 * AggieX Easter Egg Hunt 2026
 * QR code generator: reads the token CSV and produces a print-ready HTML page
 * with one card per egg — QR code, tier, egg number, and tagline.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

import QRCode from 'qrcode';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Constants ───────────────────────────────────────────────────────────────

const CSV_PATH = join(__dirname, 'output', 'easter-egg-tokens.csv');
const OUTPUT_PATH = join(__dirname, 'output', 'qr-codes.html');

// 4 columns × 3 rows = 12 cards per page on US Letter / A4 at default scale.
// Increase if cards feel too large when printed; decrease if they feel cramped.
const CARDS_PER_ROW = 4;
const ROWS_PER_PAGE = 3;
const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE;

const TAGLINES: Record<string, string> = {
  common:
    'You cracked it. Your seat at the next AggieX event is waiting — scan to claim it.',
  epic:
    'Big finds come with big opportunities. You just unlocked a free business development consultation. Scan to book yours.',
  legendary:
    'One in a thousand. That\'s you. Scan to claim your exclusive AggieX merch — you\'ve earned it.',
};

const CARD_COLORS: Record<string, { bg: string; border: string; label: string; text: string }> = {
  common:    { bg: '#F0FDF6', border: '#00C98D', label: '#00865E', text: '#0E1B2A' },
  epic:      { bg: '#F5F3FF', border: '#7C5CFF', label: '#5B3FD6', text: '#110D2A' },
  legendary: { bg: '#FFFBEB', border: '#D4A017', label: '#92700A', text: '#1A0F00' },
};

const TIER_LABELS: Record<string, string> = {
  common:    '● Common',
  epic:      '✦ Epic',
  legendary: '👑 Legendary',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface EggToken {
  egg_type: string;
  egg_number: string;
  token: string;
  qr_url: string;
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCsv(csvContent: string): EggToken[] {
  const [_header, ...rows] = csvContent.trim().split('\n');
  return rows.map(row => {
    const [egg_type, egg_number, token, qr_url] = row.split(',');
    return { egg_type, egg_number, token, qr_url };
  });
}

// ─── QR generation ───────────────────────────────────────────────────────────

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 220,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

// ─── HTML generation ─────────────────────────────────────────────────────────

function buildCardHtml(token: EggToken, qrDataUrl: string): string {
  const colors = CARD_COLORS[token.egg_type] ?? CARD_COLORS.common;
  const tierLabel = TIER_LABELS[token.egg_type] ?? token.egg_type;
  const tagline = TAGLINES[token.egg_type] ?? '';

  return `
    <div class="card" style="background:${colors.bg};border:2px solid ${colors.border};">
      <div class="tier-label" style="color:${colors.label};">${tierLabel} · #${token.egg_number}</div>
      <img src="${qrDataUrl}" alt="QR code for ${token.egg_type} egg #${token.egg_number}" class="qr" />
      <p class="tagline" style="color:${colors.text};">${tagline}</p>
      <p class="token-hint" style="color:${colors.label};">aggiex.org/eggs/${token.egg_type}</p>
    </div>`;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}

function buildPageHtml(cards: string[], isLastPage: boolean): string {
  const cardWidth = `calc(${100 / CARDS_PER_ROW}% - 8px)`;
  const cardItems = cards
    .map(card => `<div class="card-slot" style="width:${cardWidth};">${card}</div>`)
    .join('\n      ');

  return `
  <div class="page${isLastPage ? '' : ' page-break'}">
    <div class="row-grid">
      ${cardItems}
    </div>
  </div>`;
}

function buildFullHtml(cardHtmlFragments: string[]): string {
  const totalCards = cardHtmlFragments.length;
  const pages = chunkArray(cardHtmlFragments, CARDS_PER_PAGE);

  const pageHtml = pages
    .map((pageCards, index) => buildPageHtml(pageCards, index === pages.length - 1))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AggieX Easter Egg Hunt 2026 — QR Codes (${totalCards} eggs)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f8f8f8;
      padding: 24px;
    }

    /* Each .page maps to exactly one printed page. */
    .page {
      width: 100%;
      background: #fff;
      padding: 12px;
      margin-bottom: 24px;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* Flexbox row — reliable page-break behaviour across browsers. */
    .row-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
    }

    .card-slot {
      /* width is set inline per card */
      flex-shrink: 0;
    }

    .card {
      border-radius: 10px;
      padding: 10px 8px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      /* Cards must never split across pages. */
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .tier-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      align-self: flex-start;
    }

    .qr {
      width: 100%;
      height: auto;
      display: block;
    }

    .tagline {
      font-size: 9px;
      line-height: 1.45;
      text-align: center;
      font-style: italic;
    }

    .token-hint {
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    @media screen {
      .page { border: 1px solid #e5e7eb; border-radius: 4px; }
    }

    @media print {
      body { background: #fff; padding: 0; }
      .page { padding: 6px; margin-bottom: 0; }
      .card { border-width: 1px !important; }
    }
  </style>
</head>
<body>
  ${pageHtml}
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function generateQrCodes(): Promise<void> {
  console.log(`Reading CSV: ${CSV_PATH}`);
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const tokens = parseCsv(csvContent);
  console.log(`Loaded ${tokens.length} tokens.`);

  const cardFragments: string[] = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    process.stdout.write(`\rGenerating QR ${index + 1}/${tokens.length}…`);

    const qrDataUrl = await generateQrDataUrl(token.qr_url);
    cardFragments.push(buildCardHtml(token, qrDataUrl));
  }

  process.stdout.write('\n');

  const html = buildFullHtml(cardFragments);
  writeFileSync(OUTPUT_PATH, html, 'utf-8');

  console.log(`\nDone! Open this file in your browser and print:`);
  console.log(OUTPUT_PATH);
  console.log(`\nPrint tips:`);
  console.log('  • Use "Fit to page" or scale 80–90% to get more cards per sheet');
  console.log('  • Disable headers/footers in the print dialog');
  console.log('  • Cardstock or label paper works best for the physical eggs');
}

generateQrCodes().catch(error => {
  console.error('QR generation failed:', error);
  process.exit(1);
});
