-- ============================================================
-- Internal Docs Storage Bucket
-- Created: 2026-06-02
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('internal-docs', 'internal-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users with aggiex_team or mce_staff role to upload
CREATE POLICY "internal_docs_storage_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'internal-docs'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role IN ('aggiex_team', 'mce_staff')
    )
  );

-- Allow public read access so URLs work without auth
CREATE POLICY "internal_docs_storage_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'internal-docs');

-- Allow aggiex_team to delete files
CREATE POLICY "internal_docs_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'internal-docs'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'aggiex_team'
    )
  );
