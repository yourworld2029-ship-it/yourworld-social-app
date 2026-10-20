ALTER TABLE public.sports_verification_details
  ADD COLUMN IF NOT EXISTS passport_last_page_path text,
  ADD COLUMN IF NOT EXISTS passport_visa_stamp_page_2_path text;

COMMENT ON COLUMN public.sports_verification_details.passport_last_page_path IS
  'Private owner-scoped storage path for the passport address/details page.';
COMMENT ON COLUMN public.sports_verification_details.passport_visa_stamp_page_2_path IS
  'Optional private owner-scoped storage path for a second visa/stamp page.';
