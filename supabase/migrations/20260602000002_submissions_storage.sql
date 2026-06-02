-- ============================================================
-- Submissions Storage Bucket
-- Created: 2026-06-02
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Any authenticated user can upload (server enforces team ownership)
CREATE POLICY "submissions_storage_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submissions');

-- Public read so file URLs work without auth
CREATE POLICY "submissions_storage_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'submissions');

-- aggiex_team can delete files (e.g. cleanup)
CREATE POLICY "submissions_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'submissions'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'aggiex_team'
    )
  );
