-- Keep private Sports Verification document deletion owner-scoped. Admin
-- deletion remains limited to the existing reviewer boundary.
DROP POLICY IF EXISTS "Owners can delete sports documents" ON storage.objects;
CREATE POLICY "Owners can delete sports documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "Admins can delete sports verification documents" ON storage.objects;
CREATE POLICY "Admins can delete sports verification documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_role(auth.uid(), 'admin')
    AND auth.jwt()->>'aal' = 'aal2'
  );