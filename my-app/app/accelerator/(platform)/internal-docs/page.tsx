import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import type { AccelRole } from '@/lib/accel-types';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import AddDocForm from './components/add-doc-form';
import DocCard from './components/doc-card';

// ─── Types ───────────────────────────────────────────────────

export interface InternalDoc {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: 'pdf' | 'docx' | 'link' | 'other';
  visibility: 'aggiex_only' | 'aggiex_mce';
  status: 'draft' | 'in_review' | 'approved';
  created_at: string;
  accel_profiles: { full_name: string } | null;
}

// ─── Constants ───────────────────────────────────────────────

const FILE_TYPE_LABELS = { pdf: 'PDF', docx: 'DOCX', link: 'Link', other: 'File' } as const;
const STATUS_LABELS = { draft: 'Draft', in_review: 'In Review', approved: 'Approved' } as const;
const VISIBILITY_LABELS = { aggiex_only: 'AggieX only', aggiex_mce: 'AggieX + MCE' } as const;

const STATUS_COLORS = {
  draft: 'text-neutral-500',
  in_review: 'text-amber-400',
  approved: 'text-emerald-400',
} as const;

// ─── Data fetcher ─────────────────────────────────────────────

const fetchDocsData = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data: docs } = await supabase
      .from('accel_internal_docs')
      .select(`
        id, title, description, file_url, file_type,
        visibility, status, created_at,
        accel_profiles!accel_internal_docs_uploader_id_fkey (full_name)
      `)
      .eq('program_id', AGGIEX_2026_PROGRAM_ID)
      .order('created_at', { ascending: false });
    return (docs ?? []) as InternalDoc[];
  },
  ['accel-internal-docs-data'],
  { revalidate: 30, tags: ['accel-internal-docs'] }
);

// ─── Page ─────────────────────────────────────────────────────

export default async function InternalDocsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['aggiex_team', 'mce_staff'].includes(profile.role)) {
    redirect('/accelerator/dashboard');
  }

  const docs = await fetchDocsData();
  const role = profile.role as AccelRole;

  const isAdmin = role === 'aggiex_team';

  const grouped = {
    in_review: docs.filter((d) => d.status === 'in_review'),
    draft: docs.filter((d) => d.status === 'draft'),
    approved: docs.filter((d) => d.status === 'approved'),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Internal</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Documents</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {docs.length === 0
              ? 'No documents yet.'
              : `${docs.length} document${docs.length !== 1 ? 's' : ''} — not visible to founders or mentors.`}
          </p>
        </div>
        {isAdmin && <AddDocForm />}
      </div>

      {/* Empty state */}
      {docs.length === 0 && (
        <div className="rounded-lg border border-neutral-800 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">
            {isAdmin
              ? 'No documents yet. Add the first one above.'
              : 'No documents have been shared with you yet.'}
          </p>
        </div>
      )}

      {/* Grouped by status */}
      <div className="flex flex-col gap-8">
        {(['in_review', 'draft', 'approved'] as const).map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;

          return (
            <section key={status}>
              <div className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <h2 className={`text-sm font-semibold ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </h2>
                <span className="ml-auto text-xs text-neutral-600">
                  {group.length} doc{group.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.map((doc) => (
                  <DocCard key={doc.id} doc={doc} isAdmin={isAdmin} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
