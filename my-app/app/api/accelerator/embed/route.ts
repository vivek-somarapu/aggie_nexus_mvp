/**
 * POST /api/accelerator/embed
 *
 * Triggers a full re-embedding of all content sources. Idempotent —
 * rows whose content has not changed since the last run are skipped.
 *
 * Restricted to aggiex_team only. Intended for manual invocation after
 * bulk content changes (e.g., a new week of curriculum is uploaded).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAccelRole } from '@/lib/accel-auth';
import { embedAllSources } from '@/lib/ai/embedding-pipeline';

export async function POST(_request: NextRequest) {
  const { error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  if (!process.env.JINA_API_KEY) {
    return NextResponse.json(
      { error: 'JINA_API_KEY is not configured' },
      { status: 503 },
    );
  }

  let result;
  try {
    result = await embedAllSources();
  } catch (pipelineError) {
    console.error('[POST /api/accelerator/embed] Pipeline failed:', pipelineError);
    return NextResponse.json(
      { error: 'Embedding pipeline failed', details: String(pipelineError) },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
