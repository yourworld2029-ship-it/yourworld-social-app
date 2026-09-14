-- Store the new Sports Verification fields outside the public profiles.bio field.
-- Evidence paths remain private object paths in the existing documents bucket.
CREATE TABLE IF NOT EXISTS public.sports_verification_details (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  village_town text NOT NULL DEFAULT '',
  district text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'India',
  mobile_number text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  sports_certificate_path text,
  passport_first_page_path text,
  passport_visa_stamp_page_path text,
  tournament_photo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_verification_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can read own sports verification details"
  ON public.sports_verification_details;
CREATE POLICY "Owners can read own sports verification details"
  ON public.sports_verification_details
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can insert own sports verification details"
  ON public.sports_verification_details;
CREATE POLICY "Owners can insert own sports verification details"
  ON public.sports_verification_details
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update own sports verification details"
  ON public.sports_verification_details;
CREATE POLICY "Owners can update own sports verification details"
  ON public.sports_verification_details
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);