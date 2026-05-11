import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const CreateDeliverableSchema = z.object({
  week_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  is_required: z.boolean().default(true),
  expected_format: z.enum(['file', 'text', 'link', 'any']).default('any'),
  sort_order: z.number().int().min(0).default(0),
  // null = all teams; array of UUIDs = specific teams only
  assigned_team_ids: z.array(z.string().uuid()).nullable().default(null),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get('week_id');

  const supabase = await createClient();

  let query = supabase
    .from('accel_deliverables')
    .select(`
      id, week_id, title, description, is_required,
      expected_format, sort_order, assigned_team_ids, created_at,
      accel_weeks (week_number, theme)
    `)
    .order('week_id')
    .order('sort_order');

  if (weekId) query = query.eq('week_id', weekId);

  const { data, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  // If sort_order not provided, place after the last deliverable in that week
  let sortOrder = parsed.data.sort_order;
  if (sortOrder === 0) {
    const { data: lastRow } = await supabase
      .from('accel_deliverables')
      .select('sort_order')
      .eq('week_id', parsed.data.week_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    sortOrder = (lastRow?.sort_order ?? -1) + 1;
  }

  const { data, error: dbError } = await supabase
    .from('accel_deliverables')
    .insert({ ...parsed.data, sort_order: sortOrder })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
