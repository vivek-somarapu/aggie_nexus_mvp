-- ============================================================
-- Curriculum Storage Bucket
-- Created: 2026-06-09
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculum', 'curriculum', true)
ON CONFLICT (id) DO NOTHING;

-- Allow aggiex_team and mce_staff to upload curriculum files
CREATE POLICY "curriculum_storage_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'curriculum'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role IN ('aggiex_team', 'mce_staff')
    )
  );

-- Allow public read so file URLs work without auth
CREATE POLICY "curriculum_storage_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'curriculum');

-- Allow aggiex_team to delete files
CREATE POLICY "curriculum_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'curriculum'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'aggiex_team'
    )
  );
